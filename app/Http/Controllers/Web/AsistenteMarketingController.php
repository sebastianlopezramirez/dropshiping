<?php

/*
|--------------------------------------------------------------------------
| CONTROLLER: AsistenteMarketingController
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué hace?
|
|   Potencia el "Asistente de Marketing Pro" — una herramienta interna
|   SOLO para super_administrador que combina:
|
|   1. LANZAMIENTO: Genera estrategia inicial usando datos del producto
|      (precio, margen, categoría) + reglas de negocio fijas → Groq (Llama 3.3)
|
|   2. OPTIMIZACIÓN: El admin ingresa métricas reales de Meta Ads/Instagram
|      (CTR, ROAS, CPA, ventas, gasto) → la IA analiza y dice qué hacer.
|
|   Las respuestas de la IA son EFÍMERAS (no se guardan en BD).
|   Solo se guardan las métricas de entrada en 'metricas_asistente'.
|
| RUTAS:
|   GET  /marketing/asistente                → index()
|   GET  /marketing/asistente/{producto}     → show()
|   POST /marketing/asistente/{producto}/analizar  → analizar()
|   POST /marketing/asistente/{producto}/metricas  → guardarMetrica()
|   DELETE /marketing/asistente/{producto}/metricas → eliminarMetricas()
|
| ACCESO: solo role:super_administrador (middleware en web.php)
|
*/

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Categoria;
use App\Models\MetricaAsistente;
use App\Models\Producto;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class AsistenteMarketingController extends Controller
{
    /*
    |----------------------------------------------------------------------
    | PASO 1 — ENTENDER: index()
    |   Muestra árbol de categorías + productos activos/borrador.
    |   El admin navega: categoría → subcategoría → producto → análisis.
    |----------------------------------------------------------------------
    */
    public function index(): Response
    {
        // Cargar árbol de categorías (padre → hijos → productos con sus métricas)
        $categorias = Categoria::whereNull('padre_id')
            ->where('activo', true)
            ->orderBy('orden')
            ->with([
                // Subcategorías
                'hijos' => function ($q) {
                    $q->where('activo', true)->orderBy('orden');
                },
                // Productos de categorías raíz
                'productos' => function ($q) {
                    $q->whereIn('estado', ['activo', 'borrador'])
                      ->select('id', 'nombre', 'sku', 'estado', 'categoria_id', 'precio_venta', 'precio_costo', 'ia_iniciado_en')
                      ->orderBy('nombre');
                },
                // Productos de subcategorías
                'hijos.productos' => function ($q) {
                    $q->whereIn('estado', ['activo', 'borrador'])
                      ->select('id', 'nombre', 'sku', 'estado', 'categoria_id', 'precio_venta', 'precio_costo', 'ia_iniciado_en')
                      ->orderBy('nombre');
                },
            ])
            ->get(['id', 'nombre', 'slug', 'padre_id', 'orden']);

        // Estadísticas rápidas para el header del asistente
        $productosActivos = Producto::whereIn('estado', ['activo', 'borrador'])->pluck('id');

        // IDs de productos que YA entraron al proceso IA (tienen ia_iniciado_en)
        $idsEnAnalisis = Producto::whereIn('id', $productosActivos)
            ->whereNotNull('ia_iniciado_en')
            ->pluck('id');

        // Productos que necesitan revisión: llevan más de 7 días en análisis
        // sin métricas nuevas (posiblemente estancados o sin seguimiento)
        $idsRevisar = Producto::whereIn('id', $idsEnAnalisis)
            ->where('ia_iniciado_en', '<=', now()->subDays(7))
            ->whereNotIn('id',
                MetricaAsistente::where('creado_en', '>=', now()->subDays(7))
                    ->distinct('producto_id')
                    ->pluck('producto_id')
            )
            ->pluck('id');

        $estadisticas = [
            'total_productos'   => $productosActivos->count(),
            'con_metricas'      => MetricaAsistente::distinct('producto_id')->count('producto_id'),
            'escalando'         => MetricaAsistente::where('roas', '>=', 3.5)
                                        ->whereIn('producto_id', $productosActivos)
                                        ->distinct('producto_id')->count('producto_id'),
            // Nuevos filtros
            'en_analisis'       => $idsEnAnalisis->count(),
            'sin_analisis'      => $productosActivos->diff($idsEnAnalisis)->count(),
            'revisar'           => $idsRevisar->count(),
        ];

        return Inertia::render('Marketing/Asistente', [
            'categorias'    => $categorias,
            'estadisticas'  => $estadisticas,
        ]);
    }

    /*
    |----------------------------------------------------------------------
    | PASO 2 — ENTENDER: show()
    |   Carga el detalle de un producto con su historial de métricas.
    |   También calcula la fase actual basada en el ROAS más reciente.
    |----------------------------------------------------------------------
    */
    public function show(Producto $producto): Response
    {
        $producto->load(['categoria']);

        // Historial de métricas ordenado por fecha (más reciente primero)
        $metricas = MetricaAsistente::where('producto_id', $producto->id)
            ->orderBy('creado_en', 'desc')
            ->get();

        // Calcular margen de ganancia
        $margen = 0;
        if ($producto->precio_venta && $producto->precio_costo) {
            $margen = (($producto->precio_venta - $producto->precio_costo) / $producto->precio_venta) * 100;
        }

        // CPA máximo recomendado (50% del margen de ganancia en COP)
        $cpaMaximo = ($producto->precio_venta - $producto->precio_costo) * 0.5;

        // Determinar fase actual basada en ROAS promedio reciente (últimas 3 métricas)
        $roasReciente = $metricas->take(3)->avg('roas') ?? 0;
        $faseActual   = $this->determinarFase($roasReciente, $metricas->count());

        // Días desde que inició el proceso IA
        $diasDesdeInicio = null;
        if ($producto->ia_iniciado_en) {
            $diasDesdeInicio = now()->diffInDays($producto->ia_iniciado_en);
        }

        return Inertia::render('Marketing/AsistenteProducto', [
            'producto'    => array_merge($producto->toArray(), [
                'margen_porcentaje'  => round($margen, 2),
                'cpa_maximo'         => round($cpaMaximo, 2),
                'fase_actual'        => $faseActual,
                'roas_reciente'      => round($roasReciente, 2),
                'dias_desde_inicio'  => $diasDesdeInicio,
            ]),
            'metricas'    => $metricas,
            'puede_eliminar' => $producto->estado !== 'activo',
        ]);
    }

    /*
    |----------------------------------------------------------------------
    | PASO 3 — ENTENDER: analizar()
    |   Construye el prompt con reglas de negocio + datos del producto
    |   + métricas ingresadas → llama a Groq (Llama 3.3 70B)
    |   → devuelve la decisión de la IA como JSON.
    |
    |   Las respuestas NO se guardan en BD.
    |----------------------------------------------------------------------
    */
    public function analizar(Request $request, Producto $producto): JsonResponse
    {
        $request->validate([
            'modo'     => 'required|in:lanzamiento,optimizacion',
            'metricas' => 'required_if:modo,optimizacion|array',
            'metricas.ctr'             => 'nullable|numeric|min:0|max:100',
            'metricas.roas'            => 'nullable|numeric|min:0',
            'metricas.cpa'             => 'nullable|numeric|min:0',
            'metricas.ventas'          => 'nullable|integer|min:0',
            'metricas.gasto'           => 'nullable|numeric|min:0',
            'metricas.ingresos'        => 'nullable|numeric|min:0',
            // Campos Meta Ads extendidos
            'metricas.alcance'         => 'nullable|integer|min:0',
            'metricas.impresiones'     => 'nullable|integer|min:0',
            'metricas.frecuencia'      => 'nullable|numeric|min:0',
            'metricas.cpm'             => 'nullable|numeric|min:0',
            'metricas.clics_enlace'    => 'nullable|integer|min:0',
            'metricas.cpc_enlace'      => 'nullable|numeric|min:0',
            'metricas.agregar_carrito' => 'nullable|integer|min:0',
            'metricas.inicios_pago'    => 'nullable|integer|min:0',
        ]);

        $modo     = $request->input('modo');
        $metricas = $request->input('metricas', []);
        $costos   = $request->input('costos', []);

        // Validar costos opcionales (solo lanzamiento)
        if (!empty($costos)) {
            $request->validate([
                'costos.costo_envio'       => 'nullable|numeric|min:0',
                'costos.costo_empaque'     => 'nullable|numeric|min:0',
                'costos.comision_pasarela' => 'nullable|numeric|min:0',
            ]);
        }

        // Calcular datos del producto
        $margen    = 0;
        $cpaMaximo = 0;
        if ($producto->precio_venta && $producto->precio_costo) {
            $margen    = round((($producto->precio_venta - $producto->precio_costo) / $producto->precio_venta) * 100, 2);
            $cpaMaximo = round(($producto->precio_venta - $producto->precio_costo) * 0.5, 2);
        }

        // Construir el prompt según el modo
        $prompt = $modo === 'lanzamiento'
            ? $this->construirPromptLanzamiento($producto, $margen, $cpaMaximo, $costos)
            : $this->construirPromptOptimizacion($producto, $metricas, $margen, $cpaMaximo);

        // Llamar a Groq API
        $respuesta = $this->llamarGroq($prompt);

        if (!$respuesta['exito']) {
            return response()->json([
                'error' => 'No se pudo conectar con el asistente IA. Verifica GROQ_API_KEY.',
                'detalle' => $respuesta['error'] ?? '',
            ], 503);
        }

        // Guardar fecha del primer análisis si aún no existe
        if (is_null($producto->ia_iniciado_en)) {
            $producto->update(['ia_iniciado_en' => now()]);
        }

        // Intentar parsear el JSON antes de enviarlo — así el frontend recibe un objeto nativo
        // y no necesita hacer JSON.parse (que puede fallar con caracteres especiales)
        $analisisParsado = json_decode($respuesta['contenido']);

        // Fallback nivel 1: estado-máquina caracter a caracter
        // — maneja comillas escapadas \" correctamente, a diferencia del explode
        if ($analisisParsado === null) {
            $raw = $respuesta['contenido'];

            // Extraer solo el bloque JSON principal (ignora texto extra del modelo)
            if (preg_match('/\{[\s\S]*\}/su', $raw, $m)) {
                $jsonBruto = $m[0];
                $resultado = '';
                $enString  = false;
                $escapeSig = false;
                $longitud  = strlen($jsonBruto);

                for ($i = 0; $i < $longitud; $i++) {
                    $c = $jsonBruto[$i];

                    if ($escapeSig) {
                        // Caracter anterior era \ — pasar sin modificar
                        $resultado .= $c;
                        $escapeSig  = false;
                    } elseif ($c === '\\') {
                        // Inicio de secuencia de escape
                        $resultado .= $c;
                        $escapeSig  = true;
                    } elseif ($c === '"') {
                        // Apertura o cierre de string
                        $resultado .= $c;
                        $enString   = !$enString;
                    } elseif ($enString && $c === "\n") {
                        // Newline cruda dentro de string → escapar
                        $resultado .= '\\n';
                    } elseif ($enString && $c === "\r") {
                        $resultado .= '\\r';
                    } elseif ($enString && $c === "\t") {
                        $resultado .= '\\t';
                    } else {
                        $resultado .= $c;
                    }
                }

                $analisisParsado = json_decode($resultado);
            }
        }

        // Fallback nivel 2: eliminar TODOS los caracteres de control (incluyendo \n y \r)
        // — menos agresivo que el nivel 1 pero útil si la estructura JSON es simple
        if ($analisisParsado === null) {
            $limpio = preg_replace('/[\x00-\x1F\x7F]/u', ' ', $respuesta['contenido']);
            if ($limpio !== null) {
                $analisisParsado = json_decode($limpio);
            }
        }

        // Fallback nivel 3: reparar JSON truncado por límite de tokens
        // Si el modelo fue cortado antes de cerrar llaves/corchetes, los cerramos
        if ($analisisParsado === null) {
            $raw = $respuesta['contenido'] ?? '';
            // Extraer el bloque JSON
            if (preg_match('/\{[\s\S]*/su', $raw, $m)) {
                $fragmento = $m[0];
                // Contar aperturas y cierres para detectar truncación
                $pilaEstructuras = [];
                $enStr   = false;
                $escSig  = false;
                $lon     = strlen($fragmento);
                for ($i = 0; $i < $lon; $i++) {
                    $c = $fragmento[$i];
                    if ($escSig)               { $escSig = false; continue; }
                    if ($c === '\\')          { $escSig = true;  continue; }
                    if ($c === '"')            { $enStr = !$enStr; continue; }
                    if ($enStr)                { continue; }
                    if ($c === '{' || $c === '[') { $pilaEstructuras[] = $c; }
                    if ($c === '}' || $c === ']') { array_pop($pilaEstructuras); }
                }
                // Cerrar lo que falta en orden inverso
                $cierre = '';
                foreach (array_reverse($pilaEstructuras) as $ab) {
                    $cierre .= ($ab === '{') ? '"_truncado":true}' : ']';
                    // Solo agregar el marcador una vez
                    if ($ab === '{') break;
                }
                // Reconstruir: quitar texto incompleto del último campo
                $reparado = rtrim($fragmento);
                // Si termina en coma o texto incompleto sin valor, limpiar
                $reparado = preg_replace('/,\s*$/', '', $reparado);
                $reparado = preg_replace('/"[^"]*$/', '', $reparado); // string sin cerrar
                // Cerrar estructuras faltantes
                foreach (array_reverse($pilaEstructuras) as $ab) {
                    $reparado .= ($ab === '{') ? '}' : ']';
                }
                $analisisParsado = json_decode($reparado);
            }
        }

        // ── DEBUG TEMPORAL — remover después de diagnosticar ──
        $contenidoRaw = $respuesta['contenido'] ?? '';
        $primerosChars = mb_substr($contenidoRaw, 0, 120);
        $ultimosChars  = mb_substr($contenidoRaw, -60);

        return response()->json([
            'analisis'       => $analisisParsado ?? $contenidoRaw,
            'modelo'         => 'groq/compound-mini',
            'modo'           => $modo,
            'ia_iniciado_en' => $producto->ia_iniciado_en,
            '_debug' => [
                'tipo'             => gettype($analisisParsado),
                'parse_ok'         => $analisisParsado !== null,
                'json_error'       => json_last_error_msg(),
                'longitud'         => strlen($contenidoRaw),
                'inicio'           => $primerosChars,
                'fin'              => $ultimosChars,
            ],
        ]);
    }

    /*
    |----------------------------------------------------------------------
    | PASO 4 — ENTENDER: guardarMetrica()
    |   Persiste las métricas reales del período en BD.
    |   Esto es lo ÚNICO que se guarda — la respuesta de IA no.
    |----------------------------------------------------------------------
    */
    public function guardarMetrica(Request $request, Producto $producto): JsonResponse
    {
        $datos = $request->validate([
            'fase'     => 'required|integer|min:1|max:10',
            'ctr'      => 'nullable|numeric|min:0|max:100',
            'roas'     => 'nullable|numeric|min:0',
            'cpa'      => 'nullable|numeric|min:0',
            'ventas'   => 'nullable|integer|min:0',
            'gasto'    => 'nullable|numeric|min:0',
            'ingresos' => 'nullable|numeric|min:0',
            'notas'    => 'nullable|string|max:1000',
        ]);

        $metrica = MetricaAsistente::create([
            ...$datos,
            'producto_id' => $producto->id,
            'creado_por'  => Auth::id(),
        ]);

        return response()->json([
            'exito'   => true,
            'metrica' => $metrica,
            'mensaje' => "Métricas de Fase {$datos['fase']} guardadas correctamente.",
        ]);
    }

    /*
    |----------------------------------------------------------------------
    | PASO 5 — ENTENDER: eliminarMetricas()
    |   Elimina TODAS las métricas de un producto.
    |   SOLO permitido si el producto NO está activo (seguridad).
    |----------------------------------------------------------------------
    */
    public function eliminarMetricas(Producto $producto): JsonResponse
    {
        // Regla de seguridad: no eliminar métricas de productos activos
        if ($producto->estado === 'activo') {
            return response()->json([
                'error' => 'No se pueden eliminar métricas de un producto activo.',
            ], 403);
        }

        $eliminadas = MetricaAsistente::where('producto_id', $producto->id)->delete();

        Log::info("Métricas eliminadas", [
            'producto_id' => $producto->id,
            'sku'         => $producto->sku,
            'cantidad'    => $eliminadas,
            'eliminado_por' => Auth::id(),
        ]);

        return response()->json([
            'exito'   => true,
            'mensaje' => "Se eliminaron {$eliminadas} registros de métricas de «{$producto->nombre}».",
        ]);
    }

    /*
    |----------------------------------------------------------------------
    | PASO 5b — ENTENDER: limpiarAnalisis()
    |   Elimina todas las métricas del asistente Y resetea ia_iniciado_en.
    |   Sin restricción de estado — aplica a cualquier producto.
    |   Útil para productos que ya no se venden y se quiere liberar espacio.
    |----------------------------------------------------------------------
    */
    public function limpiarAnalisis(Producto $producto): JsonResponse
    {
        $eliminadas = MetricaAsistente::where('producto_id', $producto->id)->delete();

        $producto->update(['ia_iniciado_en' => null]);

        Log::info("Análisis IA limpiado", [
            'producto_id'   => $producto->id,
            'sku'           => $producto->sku,
            'metricas_del'  => $eliminadas,
            'limpiado_por'  => Auth::id(),
        ]);

        return response()->json([
            'exito'   => true,
            'mensaje' => "Análisis limpiado: {$eliminadas} métricas eliminadas de «{$producto->nombre}».",
        ]);
    }

    // ══════════════════════════════════════════════════════════════════
    // MÉTODOS PRIVADOS — Construcción de prompts y llamada a Groq
    // ══════════════════════════════════════════════════════════════════

    /**
     * PENSAR — Prompt para el modo LANZAMIENTO (Prompt Maestro v2 — Phase 1)
     * Usa PRODUCTO_TIENDA + CATALOGO_RELACIONADO disponibles en BD.
     * DATOS_MERCADO, DATOS_COSTOS, DATOS_META y DATOS_PAGINA se marcan
     * con indicadores honestos para que Groq no invente información.
     */
    private function construirPromptLanzamiento(Producto $producto, float $margen, float $cpaMaximo, array $costos = []): string
    {
        // Si el usuario corrigió precio/costo desde el modal, usar esos valores
        $precioVenta  = (isset($costos['precio_venta'])  && (float) $costos['precio_venta']  > 0)
            ? (float) $costos['precio_venta']
            : (float) ($producto->precio_venta  ?? 0);

        $precioCosto  = (isset($costos['precio_costo'])  && (float) $costos['precio_costo']  > 0)
            ? (float) $costos['precio_costo']
            : (float) ($producto->precio_costo  ?? 0);
        $urlProducto  = url("/tienda/{$producto->slug}");
        $categoria    = $producto->categoria->nombre ?? 'Sin categoría';
        $catalogo     = $this->obtenerCatalogoRelacionado($producto);
        $catalogoJson = json_encode($catalogo, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

        $precioFmt = number_format($precioVenta, 0, ',', '.');
        $costoFmt  = number_format($precioCosto, 0, ',', '.');
        $cpaMaxFmt = number_format($cpaMaximo,   0, ',', '.');
        $margenFmt = number_format($margen, 1);

        // ── Construir bloque DATOS_COSTOS ──────────────────────────────────
        $envio     = isset($costos['costo_envio'])       ? (float) $costos['costo_envio']       : null;
        $empaque   = isset($costos['costo_empaque'])     ? (float) $costos['costo_empaque']      : null;
        $pasarela  = isset($costos['comision_pasarela']) ? (float) $costos['comision_pasarela']  : null;

        if ($envio !== null || $empaque !== null || $pasarela !== null) {
            $totalCostos  = ($envio ?? 0) + ($empaque ?? 0) + ($pasarela ?? 0);
            $gananciaNeta = $precioVenta - $precioCosto - $totalCostos;
            $margenNeto   = $precioVenta > 0 ? round(($gananciaNeta / $precioVenta) * 100, 1) : 0;
            $cpaMaxNeto   = round($gananciaNeta * 0.5, 0);

            $bloqueDataCostos = "[DATOS_COSTOS]  → COMPLETO
- costo_envio:          " . number_format($envio    ?? 0, 0, ',', '.') . " COP
- costo_empaque:        " . number_format($empaque  ?? 0, 0, ',', '.') . " COP
- comision_pasarela:    " . number_format($pasarela ?? 0, 0, ',', '.') . " COP
- costo_total_operacion:" . number_format($totalCostos, 0, ',', '.') . " COP
- ganancia_neta_real:   " . number_format($gananciaNeta, 0, ',', '.') . " COP
- margen_neto_real:     {$margenNeto}%
- cpa_maximo_real:      " . number_format($cpaMaxNeto, 0, ',', '.') . " COP  (50% ganancia neta)";

            $statusCostos = '"COMPLETO"';
        } else {
            $bloqueDataCostos = "[DATOS_COSTOS]   → ECONOMICS_INCOMPLETOS  (falta costo_envio, empaque, comision_pasarela)";
            $statusCostos     = '"ECONOMICS_INCOMPLETOS"';
        }

        // ── PUNTO 20: Calcular presupuesto diario basado en CPA real ─────────
        // Meta necesita ~50 conversiones para salir del aprendizaje.
        // Base mínima: CPA_max × 3 conversiones/día para tener señal útil en 7 días.
        $cpaParaCalculo = ($statusCostos === '"COMPLETO"' && isset($cpaMaxNeto) && $cpaMaxNeto > 0)
            ? (float) $cpaMaxNeto
            : (float) $cpaMaximo;

        if ($cpaParaCalculo <= 0) {
            $presupuesto1        = 0;
            $presupuesto2        = 0;
            $presupuesto3        = 0;
            $alertaPresupuesto   = '"PRESUPUESTO_LIMITADO"';
            $justificacionBudget = 'Margen neto insuficiente: CPA maximo es 0. Primero ajusta precio o reduce costos.';
        } else {
            // Redondear al múltiplo de 5.000 más cercano
            $base              = (int) (round($cpaParaCalculo * 3 / 5000) * 5000);
            $base              = max(15000, $base);
            $presupuesto1      = $base;
            $presupuesto2      = (int) (round($base * 1.7 / 5000) * 5000);
            $presupuesto3      = (int) (round($base * 3.5 / 5000) * 5000);
            $alertaPresupuesto = '"VIABLE"';
            $justificacionBudget = 'CPA max ' . number_format($cpaParaCalculo, 0, '.', ',')
                . ' COP x3 conv/dia = base ' . number_format($presupuesto1, 0, '.', ',')
                . ' COP/dia. Fase 2 x1.7, Fase 3 x3.5.';
        }

        return <<<PROMPT
Eres un Senior Media Buyer con 10+ años en e-commerce colombiano. Analizas con datos reales; jamás inventas cifras.

════════════════════════════════════════════════════════
DATOS DISPONIBLES — FASE 1 (solo tienda propia)
════════════════════════════════════════════════════════

[PRODUCTO_TIENDA]
- nombre: {$producto->nombre}
- sku: {$producto->sku}
- categoria: {$categoria}
- precio_venta: {$precioFmt} COP
- precio_costo: {$costoFmt} COP
- margen_pct: {$margenFmt}%
- cpa_maximo: {$cpaMaxFmt} COP  (50% del margen bruto)
- stock_actual: {$producto->stock}
- url: {$urlProducto}
- descripcion: {$producto->descripcion_corta}

[CATALOGO_RELACIONADO] — productos de la misma categoría en la tienda
{$catalogoJson}

[DATOS_MERCADO]  → NECESITA_INVESTIGACION_WEB
{$bloqueDataCostos}
[DATOS_META]     → NO_META_DATA           (pixel instalado, sin historial todavía)
[DATOS_PAGINA]   → NO_DISPONIBLE          (velocidad, conversión y reseñas no medidas aún)

════════════════════════════════════════════════════════
REGLAS DE NEGOCIO (no negociables)
════════════════════════════════════════════════════════
- ROAS mínimo aceptable : 2.5x
- ROAS objetivo         : 3.5x
- ROAS de escala        : ≥4.5x → subir presupuesto máx 50%
- CPA máximo            : {$cpaMaxFmt} COP
- CTR mínimo saludable  : 1.5%
- Frecuencia máxima     : 2.5 (rotar creativos al superarla)
- Moneda                : COP — Colombia

════════════════════════════════════════════════════════
INSTRUCCIONES DE RAZONAMIENTO
════════════════════════════════════════════════════════
1. Trabaja SOLO con los datos que te proporcioné. No inventes precios de competencia ni métricas de mercado.
2. Donde falten datos, señálalo en "missing_data" y en "data_quality".
3. El catálogo relacionado te sirve para detectar canibalización y análisis de oferta.
4. Basa la estrategia en el margen real y el CPA máximo calculado.
5. PRESUPUESTO (PUNTO 20 — obligatorio): Los campos presupuesto_diario ya están calculados matemáticamente en el JSON. Úsalos EXACTAMENTE. Si alerta_presupuesto es PRESUPUESTO_LIMITADO, explica en executive_summary que el margen no soporta inversión publicitaria rentable y qué debe corregirse primero.
6. AUDIENCIA (PUNTO 19 — obligatorio): Hay NO_META_DATA (cuenta sin historial de pixel). REGLA: NO uses intereses como primera audiencia sin pixel entrenado. Evalúa y elige UNA estructura: (A) Broad Targeting puro, (B) Advantage+ Shopping Campaign, (C) Intereses solo si puedes justificar con datos del producto que son precisos. Para una cuenta nueva en Colombia sin datos, Broad o Advantage+ casi siempre gana. Documenta tu elección y razón en "tipo_recomendado".

RESPONDE ÚNICAMENTE con el siguiente JSON. Sin texto antes ni después.

{
  "decision": "LANZAR | PAUSAR | INVESTIGAR",
  "confidence": "ALTA | MEDIA | BAJA",
  "executive_summary": "2-3 oraciones: qué hacer hoy y por qué",

  "product_identity": {
    "categoria_real": "categoría según lo que ves",
    "problema_resuelve": "dolor o deseo concreto que soluciona",
    "cliente_ideal": "perfil del comprador en Colombia",
    "posicionamiento": "cómo diferenciarlo en el mercado colombiano"
  },

  "data_quality": {
    "producto_tienda": "COMPLETO",
    "catalogo_relacionado": "COMPLETO",
    "datos_mercado": "NECESITA_INVESTIGACION_WEB",
    "datos_costos": {$statusCostos},
    "datos_meta": "NO_META_DATA",
    "datos_pagina": "NO_DISPONIBLE"
  },

  "internal_catalog_analysis": {
    "productos_relacionados_count": 0,
    "riesgo_canibalizacion": "ALTO | MEDIO | BAJO | NINGUNO",
    "diferenciacion_vs_catalogo": "cómo se diferencia de los otros productos",
    "oportunidad_upsell": "qué producto del catálogo complementa este"
  },

  "unit_economics": {
    "precio_venta_cop": {$precioVenta},
    "precio_costo_declarado_cop": {$precioCosto},
    "costos_adicionales": "DESCONOCIDO — falta envío, empaque y comisión pasarela",
    "margen_bruto_pct": {$margen},
    "cpa_maximo_cop": {$cpaMaximo},
    "alerta": "ECONOMICS_INCOMPLETOS — los costos reales pueden reducir el margen"
  },

  "market_research": {
    "status": "NECESITA_INVESTIGACION_WEB",
    "precio_mercado_estimado": null,
    "competidores_detectados": [],
    "nota": "Se necesita investigación web para completar este módulo"
  },

  "product_analysis": {
    "fortalezas": ["fortaleza 1 basada en datos reales", "fortaleza 2"],
    "debilidades": ["debilidad 1", "debilidad 2"],
    "oportunidades": ["oportunidad 1 para Colombia"],
    "amenazas": ["amenaza 1"]
  },

  "offer_analysis": {
    "precio_competitivo": "DESCONOCIDO — sin datos de mercado",
    "propuesta_valor": "propuesta basada en características del producto",
    "garantia_recomendada": "garantía que aumentaría conversión",
    "urgencia_escasez": "mecanismo de urgencia recomendado"
  },

  "customer_analysis": {
    "perfil_primario": "descripción detallada del comprador ideal colombiano",
    "pain_points": ["dolor 1", "dolor 2", "dolor 3"],
    "motivadores_compra": ["motivador 1", "motivador 2"],
    "objeciones_frecuentes": ["objeción 1", "objeción 2"],
    "donde_pasa_tiempo": ["Instagram", "TikTok", "YouTube"]
  },

  "stock_warning": {
    "stock_actual": {$producto->stock},
    "alerta": "NORMAL | STOCK_BAJO | SIN_STOCK",
    "dias_estimados": "calcular según ventas proyectadas"
  },

  "meta_ads_strategy": {
    "objetivo_campana": "CONVERSIONES",
    "alerta_presupuesto": {$alertaPresupuesto},
    "justificacion_presupuesto": "{$justificacionBudget}",
    "presupuesto_diario_inicial_cop": {$presupuesto1},
    "duracion_prueba_dias": 7,
    "fases": [
      { "fase": 1, "nombre": "Aprendizaje", "duracion": "7 días", "presupuesto_diario": {$presupuesto1},
        "objetivo": "Salir del período de aprendizaje con datos",
        "metricas_objetivo": { "ctr": 1.5, "roas": 2.5, "cpa": {$cpaMaximo} } },
      { "fase": 2, "nombre": "Optimización", "duracion": "14 días", "presupuesto_diario": {$presupuesto2},
        "objetivo": "Reducir CPA y mejorar ROAS",
        "metricas_objetivo": { "ctr": 2.0, "roas": 3.5 } },
      { "fase": 3, "nombre": "Escala", "duracion": "30 días", "presupuesto_diario": {$presupuesto3},
        "objetivo": "Escalar manteniendo ROAS objetivo",
        "metricas_objetivo": { "ctr": 2.5, "roas": 4.5 } }
    ],
    "estrategia_audiencia": {
      "tipo_recomendado": "Broad | Advantage+ | Intereses — elige según instrucción 6 y justifica aquí por qué",
      "ciudades": ["Bogotá", "Medellín", "Cali", "Barranquilla"],
      "fase_1_audiencia": "describe la audiencia exacta para fase 1 según tu elección",
      "fase_2_audiencia": "describe la audiencia exacta para fase 2 según tu elección",
      "lookalike": "LAL 1-2% Compradores — activar con 100+ compradores",
      "retargeting": ["ViewContent 30d", "AddToCart 14d", "InitiateCheckout 7d"]
    }
  },

  "creative_strategy": {
    "formato_prioritario": "Reel 9:16 (15-30s)",
    "gancho_apertura": "texto exacto para los primeros 3 segundos",
    "angulos_creativos": [
      { "angulo": "Demostración", "descripcion": "qué mostrar y cómo", "duracion": "15s" },
      { "angulo": "Problema-Solución", "descripcion": "qué mostrar y cómo", "duracion": "20s" },
      { "angulo": "Testimonial UGC", "descripcion": "formato y guión", "duracion": "30s" }
    ],
    "tips_produccion": ["tip 1 específico", "tip 2", "tip 3"],
    "señales_rotar": ["CTR < 1% por 3 días", "Frecuencia > 2.5", "ROAS < 2x sostenido"]
  },

  "copy": {
    "primary_texts": [
      { "variante": "A", "framework": "PAS", "target": "Audiencia fría",
        "texto": "Copy PAS completo para {$producto->nombre} con 3+ párrafos, emojis y CTA." },
      { "variante": "B", "framework": "AIDA", "target": "Retargeting",
        "texto": "Copy AIDA con prueba social y garantía para {$producto->nombre}." },
      { "variante": "C", "framework": "Urgencia", "target": "Carrito abandonado",
        "texto": "Copy corto urgente máx 5 líneas para recuperar carritos de {$producto->nombre}." }
    ],
    "headlines": [
      { "texto": "Titular 1 específico — máx 40 chars", "uso": "Meta + Google" },
      { "texto": "Titular 2 con beneficio — máx 40 chars", "uso": "Meta" },
      { "texto": "Titular 3 con precio/oferta — máx 40 chars", "uso": "Meta" },
      { "texto": "Titular 4 retargeting — máx 40 chars", "uso": "Retargeting" }
    ],
    "hooks": [
      { "tipo": "Pregunta-Dolor", "texto": "hook específico para {$producto->nombre}" },
      { "tipo": "Precio-Shock", "texto": "hook de precio para {$producto->nombre}" },
      { "tipo": "Aspiracional", "texto": "hook aspiracional para {$producto->nombre}" },
      { "tipo": "Estadística", "texto": "hook con dato para {$producto->nombre}" }
    ],
    "reel_scripts": [
      { "duracion": "15s", "gancho": "texto exacto primeros 3s",
        "desarrollo": "qué mostrar segundos 4-12", "cta": "texto exacto CTA final" }
    ],
    "cta_principal": "Comprar ahora",
    "hashtags": {
      "masivos": ["#hashtag_masivo_1", "#hashtag_masivo_2", "#hashtag_masivo_3"],
      "medianos": ["#hashtag_medio_1", "#hashtag_medio_2", "#hashtag_medio_3"],
      "nicho": ["#hashtag_nicho_1", "#hashtag_nicho_2", "#hashtag_nicho_3"]
    }
  },

  "kpis": {
    "ctr_minimo": 1.5, "ctr_objetivo": 2.5,
    "roas_minimo": 2.5, "roas_objetivo": 3.5, "roas_escala": 4.5,
    "cpa_maximo_cop": {$cpaMaximo}, "frecuencia_maxima": 2.5
  },

  "pause_rules": [
    { "semaforo": "ROJO", "senal": "ROAS < 2.0x por 3 días seguidos", "accion": "PAUSA HOY" },
    { "semaforo": "ROJO", "senal": "CTR < 1% tras rotar creativos", "accion": "Reformula oferta" },
    { "semaforo": "ROJO", "senal": "CPA > máximo por 5 días", "accion": "Reduce presupuesto 40%" },
    { "semaforo": "AMARILLO", "senal": "Frecuencia > 2.5", "accion": "Rota creativos" },
    { "semaforo": "VERDE", "senal": "ROAS ≥ 4.5x por 3 días", "accion": "Sube presupuesto 50%" }
  ],

  "action_plan": {
    "today": ["acción concreta 1 para hoy", "acción 2", "acción 3"],
    "tomorrow": ["acción para mañana 1", "acción 2"],
    "days_3_to_7": ["revisión CTR", "optimizar según primeros datos"],
    "week_2": ["optimizar conjunto ganador", "pausar perdedores"],
    "scaling": "cuándo y cómo escalar según ROAS sostenido"
  },

  "risks": [
    { "riesgo": "riesgo 1 específico del producto", "probabilidad": "ALTA", "mitigacion": "cómo mitigarlo" },
    { "riesgo": "riesgo 2", "probabilidad": "MEDIA", "mitigacion": "acción concreta" }
  ],

  "missing_data": [
    "Costo de envío — necesario para economics completos",
    "Costo de empaque — afecta margen real",
    "Comisión pasarela Wompi — afecta margen neto",
    "Precios de competencia en Colombia",
    "Historial Meta Ads — sin datos de pixel",
    "Métricas de página (velocidad, tasa de conversión)"
  ],

  "next_action": "acción más importante que debe hacer el usuario HOY mismo"
}

Responde SOLO con el JSON puro. Sin texto antes ni después. Sin explicaciones.
PROMPT;
    }

    /**
     * PENSAR — Obtiene productos de la misma categoría para análisis
     * de canibalización y oportunidades de upsell/cross-sell.
     */
    private function obtenerCatalogoRelacionado(Producto $producto): array
    {
        return Producto::where('categoria_id', $producto->categoria_id)
            ->where('id', '!=', $producto->id)
            ->whereIn('estado', ['activo', 'borrador'])
            ->select('nombre', 'sku', 'precio_venta', 'precio_costo', 'stock', 'slug')
            ->orderBy('nombre')
            ->limit(6)
            ->get()
            ->map(fn ($p) => [
                'nombre'       => $p->nombre,
                'sku'          => $p->sku,
                'precio'       => $p->precio_venta,
                'precio_costo' => $p->precio_costo,
                'stock'        => $p->stock,
                'url'          => url("/tienda/{$p->slug}"),
            ])
            ->toArray();
    }

    /**
     * PENSAR — Prompt para el modo OPTIMIZACIÓN
     * Analiza métricas reales y da una decisión concreta.
     */
    private function construirPromptOptimizacion(
        Producto $producto,
        array    $metricas,
        float    $margen,
        float    $cpaMaximo
    ): string {
        $precio  = number_format($producto->precio_venta ?? 0, 0, ',', '.');
        $cpaMax  = number_format($cpaMaximo, 0, ',', '.');

        $ctr     = $metricas['ctr']     ?? 'N/A';
        $roas    = $metricas['roas']    ?? 'N/A';
        $cpa     = isset($metricas['cpa'])     ? number_format($metricas['cpa'], 0, ',', '.') : 'N/A';
        $ventas  = $metricas['ventas']  ?? 'N/A';
        $gasto   = isset($metricas['gasto'])   ? number_format($metricas['gasto'], 0, ',', '.') : 'N/A';
        $ingresos = isset($metricas['ingresos']) ? number_format($metricas['ingresos'], 0, ',', '.') : 'N/A';

        // Métricas Meta Ads extendidas
        $alcance        = isset($metricas['alcance'])         ? number_format($metricas['alcance'], 0, ',', '.')         : 'N/A';
        $impresiones    = isset($metricas['impresiones'])     ? number_format($metricas['impresiones'], 0, ',', '.')     : 'N/A';
        $frecuencia     = $metricas['frecuencia']             ?? 'N/A';
        $cpm            = isset($metricas['cpm'])             ? number_format($metricas['cpm'], 0, ',', '.')             : 'N/A';
        $clicsEnlace    = isset($metricas['clics_enlace'])    ? number_format($metricas['clics_enlace'], 0, ',', '.')    : 'N/A';
        $cpcEnlace      = isset($metricas['cpc_enlace'])      ? number_format($metricas['cpc_enlace'], 0, ',', '.')      : 'N/A';
        $agregarCarrito = $metricas['agregar_carrito']        ?? 'N/A';
        $iniciosPago    = $metricas['inicios_pago']           ?? 'N/A';

        return <<<PROMPT
Eres un experto en marketing digital para e-commerce colombiano, especializado en Meta Ads e Instagram.
Das decisiones directas y acciones concretas basadas en datos. Usas pesos colombianos (COP).

PRODUCTO:
- Nombre: {$producto->nombre}
- SKU: {$producto->sku}
- Precio de venta: \${$precio} COP
- Margen: {$margen}%
- CPA máximo permitido: \${$cpaMax} COP

MÉTRICAS REALES META ADS (ingresadas desde Meta Ads Manager):

👁 ALCANCE Y VISIBILIDAD:
- Alcance: {$alcance} personas únicas
- Impresiones: {$impresiones} veces mostrado
- Frecuencia: {$frecuencia}x (veces que cada persona vio el anuncio — máximo saludable: 2.5)
- CPM: \${$cpm} COP (costo por cada 1.000 impresiones)

🖱 CLICS Y TRÁFICO:
- CTR (tasa de clics): {$ctr}%
- Clics en el enlace: {$clicsEnlace} clics
- CPC (costo por clic): \${$cpcEnlace} COP

🛒 CONVERSIONES (embudo completo):
- Agregar al carrito: {$agregarCarrito} eventos
- Inicios de pago: {$iniciosPago} eventos
- Compras completadas: {$ventas} ventas
- Valor total de compras: \${$ingresos} COP
- Gasto publicitario total: \${$gasto} COP
- ROAS de compras: {$roas}x
- CPA (costo por compra): \${$cpa} COP

REGLAS DE DECISIÓN (aplícalas estrictamente):
ROAS:
- ROAS ≥ 4.5x → ESCALAR (doblar presupuesto, expandir audiencias)
- ROAS 3.5x-4.4x → ESCALAR MODERADO (+30-50% presupuesto)
- ROAS 2.5x-3.4x → OPTIMIZAR (ajustar creativos, audiencias, copys)
- ROAS < 2.5x → PAUSAR o reducir presupuesto urgente

CTR:
- CTR < 1%   → Rotar creativos inmediatamente
- CTR 1%-1.5% → Mejorar creativos y titular
- CTR > 2%   → Creativos funcionan, probar más audiencias

CPA:
- CPA > CPA_MAX → Reducir presupuesto o cambiar segmentación
- CPA < 70% del CPA_MAX → Aumentar presupuesto

FRECUENCIA (señal de saturación de audiencia):
- Frecuencia > 2.5 → Audiencia saturada: ampliar segmentación o rotar creativos
- Frecuencia > 3.5 → Fatiga crítica: cambiar audiencia completamente

EMBUDO DE CONVERSIÓN (detecta dónde se pierden usuarios):
- Si agregar_carrito es alto pero inicios_pago son bajos → problema en página de producto o precio
- Si inicios_pago son altos pero ventas son bajas → problema en checkout o método de pago
- Tasa carrito-a-compra saludable: > 25% (ventas/agregar_carrito)
- Tasa inicio_pago-a-compra saludable: > 50% (ventas/inicios_pago)

GENERA UN ANÁLISIS DE OPTIMIZACIÓN EN FORMATO JSON con esta estructura exacta:
{
  "decision": "ESCALAR | OPTIMIZAR | PAUSAR | MANTENER",
  "nivel_urgencia": "ALTA | MEDIA | BAJA",
  "resumen": "Una oración directa de la situación",
  "diagnostico": {
    "roas":      { "valor": 2.8,   "estado": "ADVERTENCIA", "interpretacion": "Por qué es bueno/malo" },
    "ctr":       { "valor": 1.2,   "estado": "OK",          "interpretacion": "Qué significa este CTR" },
    "cpa":       { "valor": 45000, "estado": "CRITICO",     "interpretacion": "Situación vs CPA máximo permitido" },
    "frecuencia":{ "valor": 1.8,   "estado": "OK",          "interpretacion": "Si la audiencia está saturada o no" },
    "embudo":    { "tasa_carrito_a_compra": "25.5%", "tasa_pago_a_compra": "66.7%", "cuello_botella": "Dónde se pierde la mayoría de usuarios y por qué" }
  },
  "acciones_inmediatas": [
    { "prioridad": 1, "accion": "Qué hacer ahora mismo", "plazo": "Hoy" },
    { "prioridad": 2, "accion": "Segunda acción", "plazo": "En 48 horas" }
  ],
  "ajuste_presupuesto": {
    "recomendacion": "AUMENTAR | MANTENER | REDUCIR",
    "porcentaje_cambio": 30,
    "nuevo_presupuesto_diario_cop": 60000,
    "justificacion": "Por qué este cambio"
  },
  "creativos": {
    "accion": "ROTAR | MANTENER | PROBAR_VARIACIONES",
    "razon": "Por qué",
    "ideas_nuevos_creativos": ["idea 1", "idea 2"]
  },
  "audiencia": {
    "accion": "EXPANDIR | MANTENER | CAMBIAR",
    "sugerencias": ["sugerencia 1", "sugerencia 2"]
  },
  "metricas_objetivo_siguiente_fase": {
    "ctr_objetivo": 1.8,
    "roas_objetivo": 3.5,
    "cpa_objetivo": 40000
  },
  "proxima_revision": "En X días",

  "aprende": {
    "roas": {
      "concepto": "Explica en 1 oración qué es ROAS y por qué es la métrica más importante del e-commerce",
      "tu_caso": "Explica en lenguaje simple qué significa su ROAS específico: si es bueno, malo, qué implica para su negocio y en cuánto dinero se traduce por cada peso invertido"
    },
    "cpa_vs_margen": {
      "concepto": "Explica en 1 oración por qué el CPA debe ser siempre menor al margen de ganancia por venta",
      "tu_caso": "Compara su CPA real vs su CPA máximo permitido: si está perdiendo o ganando dinero por cada venta, y cuánto exactamente en pesos colombianos"
    },
    "frecuencia": {
      "concepto": "Explica en 1 oración qué es la frecuencia de Meta Ads y qué pasa cuando supera 2.5",
      "tu_caso": "Interpreta su frecuencia actual: si la audiencia está saturada, cuánto tiempo tiene antes de que baje el rendimiento, y qué debe hacer"
    },
    "embudo": {
      "concepto": "Explica en 1 oración cómo leer el embudo carrito → inicio de pago → compra y qué significa cada tasa",
      "tu_caso": "Analiza sus tasas reales: dónde se pierden los usuarios, si hay un problema técnico (checkout) o de precio, y qué porcentaje está convirtiendo en cada paso"
    },
    "leccion_principal": "La lección más importante que debe aprender de ESTOS datos específicos. Escríbela como si le hablaras a alguien que está aprendiendo marketing digital. Máximo 3 oraciones. Directa, sin tecnicismos innecesarios."
  }
}

Responde SOLO con el JSON, sin texto adicional.
PROMPT;
    }

    /**
     * ESCRIBIR — Llamada HTTP a Groq API
     * Retorna ['exito' => bool, 'contenido' => string, 'error' => string]
     */
    private function llamarGroq(string $prompt): array
    {
        $apiKey = config('services.groq.api_key');

        if (empty($apiKey)) {
            return ['exito' => false, 'error' => 'GROQ_API_KEY no configurada en .env'];
        }

        try {
            $respuesta = Http::withHeaders([
                'Authorization' => "Bearer {$apiKey}",
                'Content-Type'  => 'application/json',
            ])
            ->timeout(30)
            ->post('https://api.groq.com/openai/v1/chat/completions', [
                'model'           => 'groq/compound-mini',
                'messages'        => [
                    [
                        'role'    => 'user',
                        'content' => $prompt,
                    ],
                ],
                // Forzar salida JSON válida — elimina texto extra, newlines crudos y caracteres inválidos
                'response_format' => ['type' => 'json_object'],
                'temperature'     => 0.3,   // Más determinístico para decisiones de negocio
                'max_tokens'      => 16000,
            ]);

            if ($respuesta->successful()) {
                $cuerpo    = $respuesta->json();
                $contenido = $cuerpo['choices'][0]['message']['content'] ?? '';
                // Sanitizar JSON: limpiar newlines literales dentro de strings
                if (preg_match('/\{[\s\S]*\}/u', $contenido, $matchJson)) {
                    $sanitizado = preg_replace_callback(
                        '/"((?:[^"\\\\]|\\\\.)*)"/us',
                        fn($m) => '"' . str_replace(["\n", "\r"], ['\\n', '\\r'], $m[1]) . '"',
                        $matchJson[0]
                    );
                    if ($sanitizado !== null) {
                        $contenido = $sanitizado;
                    }
                }
                return ['exito' => true, 'contenido' => $contenido];
            }

            Log::error('Groq API error', ['status' => $respuesta->status(), 'body' => $respuesta->body()]);
            return ['exito' => false, 'error' => "Error HTTP {$respuesta->status()}"];

        } catch (\Exception $e) {
            Log::error('Groq excepción', ['mensaje' => $e->getMessage()]);
            return ['exito' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * VERIFICAR — Determina la fase actual del producto
     * basada en ROAS reciente y cantidad de métricas históricas.
     */
    private function determinarFase(float $roasReciente, int $totalMetricas): array
    {
        if ($totalMetricas === 0) {
            return ['numero' => 1, 'nombre' => 'Sin iniciar', 'color' => 'gris'];
        }

        if ($roasReciente >= 3.5) {
            return ['numero' => 3, 'nombre' => 'Escalando', 'color' => 'verde'];
        }

        if ($roasReciente >= 2.5) {
            return ['numero' => 2, 'nombre' => 'Optimizando', 'color' => 'amarillo'];
        }

        return ['numero' => 1, 'nombre' => 'Atención', 'color' => 'rojo'];
    }
    // TEMPORAL: lista modelos disponibles para esta clave Groq
    public function debugGroq(): \Illuminate\Http\JsonResponse
    {
        $apiKey = config('services.groq.api_key');
        if (empty($apiKey)) {
            return response()->json(['estado' => 'SIN_CLAVE']);
        }
        $r = \Illuminate\Support\Facades\Http::withHeaders([
            'Authorization' => "Bearer {$apiKey}",
        ])->timeout(15)->get('https://api.groq.com/openai/v1/models');
        $modelos = collect($r->json('data', []))->pluck('id')->sort()->values();
        return response()->json(['clave_prefix' => substr($apiKey, 0, 8) . '...', 'modelos_disponibles' => $modelos]);
    }
}
