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
                      ->select('id', 'nombre', 'sku', 'estado', 'categoria_id', 'precio_venta', 'precio_costo')
                      ->orderBy('nombre');
                },
                // Productos de subcategorías
                'hijos.productos' => function ($q) {
                    $q->whereIn('estado', ['activo', 'borrador'])
                      ->select('id', 'nombre', 'sku', 'estado', 'categoria_id', 'precio_venta', 'precio_costo')
                      ->orderBy('nombre');
                },
            ])
            ->get(['id', 'nombre', 'slug', 'padre_id', 'orden']);

        // Estadísticas rápidas para el header del asistente
        $estadisticas = [
            'total_productos'   => Producto::whereIn('estado', ['activo', 'borrador'])->count(),
            'con_metricas'      => MetricaAsistente::distinct('producto_id')->count('producto_id'),
            'escalando'         => MetricaAsistente::where('roas', '>=', 3.5)
                                        ->whereIn('producto_id',
                                            Producto::where('estado', 'activo')->pluck('id'))
                                        ->distinct('producto_id')->count('producto_id'),
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

        return Inertia::render('Marketing/AsistenteProducto', [
            'producto'    => array_merge($producto->toArray(), [
                'margen_porcentaje' => round($margen, 2),
                'cpa_maximo'        => round($cpaMaximo, 2),
                'fase_actual'       => $faseActual,
                'roas_reciente'     => round($roasReciente, 2),
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
            'metricas.ctr'     => 'nullable|numeric|min:0|max:100',
            'metricas.roas'    => 'nullable|numeric|min:0',
            'metricas.cpa'     => 'nullable|numeric|min:0',
            'metricas.ventas'  => 'nullable|integer|min:0',
            'metricas.gasto'   => 'nullable|numeric|min:0',
            'metricas.ingresos'=> 'nullable|numeric|min:0',
        ]);

        $modo     = $request->input('modo');
        $metricas = $request->input('metricas', []);

        // Calcular datos del producto
        $margen    = 0;
        $cpaMaximo = 0;
        if ($producto->precio_venta && $producto->precio_costo) {
            $margen    = round((($producto->precio_venta - $producto->precio_costo) / $producto->precio_venta) * 100, 2);
            $cpaMaximo = round(($producto->precio_venta - $producto->precio_costo) * 0.5, 2);
        }

        // Construir el prompt según el modo
        $prompt = $modo === 'lanzamiento'
            ? $this->construirPromptLanzamiento($producto, $margen, $cpaMaximo)
            : $this->construirPromptOptimizacion($producto, $metricas, $margen, $cpaMaximo);

        // Llamar a Groq API
        $respuesta = $this->llamarGroq($prompt);

        if (!$respuesta['exito']) {
            return response()->json([
                'error' => 'No se pudo conectar con el asistente IA. Verifica GROQ_API_KEY.',
                'detalle' => $respuesta['error'] ?? '',
            ], 503);
        }

        return response()->json([
            'analisis' => $respuesta['contenido'],
            'modelo'   => 'llama-3.3-70b-versatile',
            'modo'     => $modo,
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

    // ══════════════════════════════════════════════════════════════════
    // MÉTODOS PRIVADOS — Construcción de prompts y llamada a Groq
    // ══════════════════════════════════════════════════════════════════

    /**
     * PENSAR — Prompt para el modo LANZAMIENTO
     * Genera la estrategia inicial del producto desde cero.
     */
    private function construirPromptLanzamiento(Producto $producto, float $margen, float $cpaMaximo): string
    {
        $precio   = number_format($producto->precio_venta ?? 0, 0, ',', '.');
        $costo    = number_format($producto->precio_costo ?? 0, 0, ',', '.');
        $cpaMax   = number_format($cpaMaximo, 0, ',', '.');
        $categoria = $producto->categoria->nombre ?? 'Sin categoría';

        return <<<PROMPT
Eres un experto en marketing digital para e-commerce colombiano, especializado en Meta Ads e Instagram.
Hablas directo, das pasos concretos, usas pesos colombianos (COP).

PRODUCTO A LANZAR:
- Nombre: {$producto->nombre}
- SKU: {$producto->sku}
- Categoría: {$categoria}
- Precio de venta: \${$precio} COP
- Costo del producto: \${$costo} COP
- Margen de ganancia: {$margen}%
- CPA máximo permitido (50% del margen): \${$cpaMax} COP

REGLAS DE NEGOCIO (no negociables):
- ROAS mínimo aceptable: 2.5x
- ROAS objetivo: 3.5x o superior
- ROAS de escala: ≥4.5x → doblar presupuesto
- CPA máximo: \${$cpaMax} COP
- CTR mínimo saludable: 1.5%
- Frecuencia máxima antes de rotar creativos: 2.5

GENERA UNA ESTRATEGIA DE LANZAMIENTO COMPLETA EN FORMATO JSON con esta estructura exacta:
{
  "decision": "LANZAR",
  "resumen": "Una oración de qué hacer",
  "presupuesto_diario_cop": 30000,
  "duracion_dias": 7,
  "objetivo_campana": "CONVERSIONES o TRAFICO",
  "fases": [
    {
      "fase": 1,
      "nombre": "Nombre de la fase",
      "duracion": "X días",
      "presupuesto_diario": 30000,
      "objetivo": "Qué lograr",
      "acciones": ["acción 1", "acción 2"],
      "metricas_objetivo": { "ctr": 1.5, "roas": 2.5, "cpa": 50000 }
    }
  ],
  "segmentacion": {
    "pais": "Colombia",
    "ciudades": ["Bogotá", "Medellín", "Cali", "Barranquilla"],
    "edad_min": 18,
    "edad_max": 45,
    "intereses": ["interés 1", "interés 2"],
    "comportamientos": ["comportamiento 1"]
  },
  "creativos": {
    "formato_recomendado": "Reels o Imagen",
    "duracion_video_segundos": 15,
    "gancho_apertura": "Texto del gancho en los primeros 3 segundos",
    "llamado_accion": "COMPRAR_AHORA",
    "tips_creativos": ["tip 1", "tip 2", "tip 3"]
  },
  "horarios": {
    "mejores_dias": ["Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
    "mejor_horario": "18:00 - 22:00 hora Colombia",
    "justificacion": "Por qué estos horarios"
  },
  "alertas_rotar_creativo": ["señal 1", "señal 2"],
  "proxima_revision": "En cuántos días revisar métricas"
}

Responde SOLO con el JSON, sin texto adicional.
PROMPT;
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

        return <<<PROMPT
Eres un experto en marketing digital para e-commerce colombiano, especializado en Meta Ads e Instagram.
Das decisiones directas y acciones concretas basadas en datos. Usas pesos colombianos (COP).

PRODUCTO:
- Nombre: {$producto->nombre}
- SKU: {$producto->sku}
- Precio de venta: \${$precio} COP
- Margen: {$margen}%
- CPA máximo permitido: \${$cpaMax} COP

MÉTRICAS REALES DEL PERÍODO (ingresadas por el administrador):
- CTR: {$ctr}%
- ROAS: {$roas}x
- CPA: \${$cpa} COP
- Ventas: {$ventas} unidades
- Gasto publicitario: \${$gasto} COP
- Ingresos generados: \${$ingresos} COP

REGLAS DE DECISIÓN (aplícalas estrictamente):
- ROAS ≥ 4.5x → ESCALAR (doblar presupuesto, expandir audiencias)
- ROAS 3.5x-4.4x → ESCALAR MODERADO (+30-50% presupuesto)
- ROAS 2.5x-3.4x → OPTIMIZAR (ajustar creativos, audiencias, copys)
- ROAS < 2.5x → PAUSAR o reducir presupuesto urgente
- CTR < 1%   → Rotar creativos inmediatamente
- CTR 1%-1.5% → Mejorar creativos y titular
- CTR > 2%   → Creativos funcionan, probar más audiencias
- CPA > CPA_MAX → Reducir presupuesto o cambiar segmentación
- CPA < 70% del CPA_MAX → Aumentar presupuesto

GENERA UN ANÁLISIS DE OPTIMIZACIÓN EN FORMATO JSON con esta estructura exacta:
{
  "decision": "ESCALAR | OPTIMIZAR | PAUSAR | MANTENER",
  "nivel_urgencia": "ALTA | MEDIA | BAJA",
  "resumen": "Una oración directa de la situación",
  "diagnostico": {
    "roas": { "valor": 2.8, "estado": "ADVERTENCIA", "interpretacion": "Por qué es bueno/malo" },
    "ctr": { "valor": 1.2, "estado": "OK", "interpretacion": "Significado" },
    "cpa": { "valor": 45000, "estado": "CRITICO", "interpretacion": "Situación vs máximo permitido" }
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
  "proxima_revision": "En X días"
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
        $apiKey = env('GROQ_API_KEY');

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
                'model'       => 'llama-3.3-70b-versatile',
                'messages'    => [
                    [
                        'role'    => 'user',
                        'content' => $prompt,
                    ],
                ],
                'temperature' => 0.3,   // Más determinístico para decisiones de negocio
                'max_tokens'  => 2048,
            ]);

            if ($respuesta->successful()) {
                $cuerpo    = $respuesta->json();
                $contenido = $cuerpo['choices'][0]['message']['content'] ?? '';
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
}
