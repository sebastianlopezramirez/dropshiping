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

        // Guardar fecha del primer análisis si aún no existe
        if (is_null($producto->ia_iniciado_en)) {
            $producto->update(['ia_iniciado_en' => now()]);
        }

        return response()->json([
            'analisis'       => $respuesta['contenido'],
            'modelo'         => 'groq/compound-mini',
            'modo'           => $modo,
            'ia_iniciado_en' => $producto->ia_iniciado_en,
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
     * PENSAR — Prompt para el modo LANZAMIENTO
     * Genera la estrategia inicial del producto desde cero.
     */
    private function construirPromptLanzamiento(Producto $producto, float $margen, float $cpaMaximo): string
    {
        $precio   = number_format($producto->precio_venta ?? 0, 0, ',', '.');
        $costo    = number_format($producto->precio_costo ?? 0, 0, ',', '.');
        $cpaMax   = number_format($cpaMaximo, 0, ',', '.');
        $categoria   = $producto->categoria->nombre ?? 'Sin categoría';
        $urlProducto = url("/tienda/{$producto->slug}");

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
- URL pública del producto en la tienda: {$urlProducto}

RESTRICCIÓN OBLIGATORIA DE NOMBRE: En todos los textos que generes (captions, hashtags, descripcion_lista), el nombre del producto debe ser EXACTAMENTE "{$producto->nombre}" — no lo reformules, no agregues palabras extra.

REGLAS DE NEGOCIO (no negociables):
- ROAS mínimo aceptable: 2.5x
- ROAS objetivo: 3.5x o superior
- ROAS de escala: ≥4.5x → doblar presupuesto
- CPA máximo: \${$cpaMax} COP
- CTR mínimo saludable: 1.5%
- Frecuencia máxima antes de rotar creativos: 2.5

GENERA UNA ESTRATEGIA DE LANZAMIENTO COMPLETA EN FORMATO JSON con esta estructura exacta.
IMPORTANTE: Responde SOLO con el JSON, sin texto adicional antes ni después.

{
  "decision": "LANZAR",
  "resumen": "Una oración directa de qué hacer y por qué",
  "presupuesto_diario_cop": 30000,
  "duracion_dias": 7,
  "objetivo_campana": "CONVERSIONES",

  "fases": [
    {
      "fase": 1,
      "nombre": "Prueba inicial y aprendizaje",
      "duracion": "7 días",
      "presupuesto_diario": 30000,
      "objetivo": "Qué lograr en esta fase",
      "acciones": ["Configurar pixel", "Crear 3 creativos", "Segmentar audiencia fría"],
      "metricas_objetivo": { "ctr": 1.5, "roas": 2.5, "cpa": 50000 }
    },
    {
      "fase": 2,
      "nombre": "Optimización",
      "duracion": "14 días",
      "presupuesto_diario": 50000,
      "objetivo": "Qué lograr",
      "acciones": ["acción 1", "acción 2"],
      "metricas_objetivo": { "ctr": 2.0, "roas": 3.5, "cpa": 40000 }
    },
    {
      "fase": 3,
      "nombre": "Escala",
      "duracion": "30 días",
      "presupuesto_diario": 100000,
      "objetivo": "Qué lograr",
      "acciones": ["acción 1", "acción 2"],
      "metricas_objetivo": { "ctr": 2.5, "roas": 4.5, "cpa": 35000 }
    }
  ],

  "copy_organico": {
    "hooks": [
      { "tipo": "Hook Pregunta-Dolor", "texto": "Texto del hook específico para este producto", "nota": "Para quién funciona mejor" },
      { "tipo": "Hook Precio-Shock", "texto": "Texto del hook de precio específico para este producto", "nota": "Dónde usar este hook" },
      { "tipo": "Hook Identidad-Aspiracional", "texto": "Texto del hook aspiracional específico", "nota": "Audiencia objetivo" },
      { "tipo": "Hook Estadística", "texto": "Texto con dato estadístico específico del producto", "nota": "Por qué genera engagement" }
    ],
    "captions": [
      { "variante": "A", "framework": "PAS", "texto": "Caption completo usando Pain-Agitate-Solution para este producto. Mínimo 3 párrafos con emojis, beneficios y CTA." },
      { "variante": "B", "framework": "AIDA", "texto": "Caption completo usando Attention-Interest-Desire-Action para este producto. Mínimo 3 párrafos con emojis, beneficios y CTA." },
      { "variante": "C", "framework": "Corto-Stories", "texto": "Caption corto (máximo 5 líneas) para Reels e Historias con emojis y CTA." }
    ]
  },

  "copy_meta_ads": {
    "textos": [
      { "variante": "A", "tipo": "PAS", "mejor_para": "Audiencia fría (intereses)", "texto": "Texto del anuncio en PAS para este producto. 3-5 líneas con beneficios concretos y CTA." },
      { "variante": "B", "tipo": "AIDA", "mejor_para": "Retargeting (visitaron la página)", "texto": "Texto del anuncio en AIDA para retargeting. Incluir prueba social y garantía." },
      { "variante": "C", "tipo": "Urgencia", "mejor_para": "Carritos abandonados", "texto": "Texto corto con urgencia y escasez para recuperar carritos abandonados." }
    ],
    "titulares": [
      { "texto": "Titular 1 específico del producto (máx 40 caracteres)", "usa_en": "Meta + Google" },
      { "texto": "Titular 2 con beneficio clave (máx 40 caracteres)", "usa_en": "Meta" },
      { "texto": "Titular 3 con precio o oferta (máx 40 caracteres)", "usa_en": "Meta" },
      { "texto": "Titular 4 para retargeting (máx 40 caracteres)", "usa_en": "Retargeting" }
    ],
    "cta": "Comprar ahora"
  },

  "brief_creativo": {
    "creatividades": [
      {
        "prioridad": 1,
        "tipo": "Reel demostrativo (15-30s)",
        "acciones": ["Descripción de qué mostrar en el video", "Qué texto poner en pantalla", "Qué formato y audio usar"]
      },
      {
        "prioridad": 2,
        "tipo": "Imagen comparativa",
        "acciones": ["Qué comparar visualmente", "Qué texto incluir", "Qué formato usar"]
      },
      {
        "prioridad": 3,
        "tipo": "Carrusel de beneficios",
        "acciones": ["Qué poner en cada tarjeta", "Cuántas tarjetas", "Última tarjeta con CTA"]
      }
    ]
  },

  "segmentacion": {
    "pais": "Colombia",
    "edad_min": 22,
    "edad_max": 45,
    "ciudades": ["Bogotá", "Medellín", "Cali", "Barranquilla"],
    "intereses_fria": ["interés 1 específico del producto", "interés 2", "interés 3", "interés 4", "interés 5"],
    "tamano_audiencia": "X.XM - Y.YM personas",
    "retargeting_pixeles": ["ViewContent 30 días", "AddToCart 14 días", "InitiateCheckout 7 días"],
    "lookalike": ["LAL 1% Compradores", "LAL 2% Compradores"],
    "broad_advantage": "Sin intereses — Meta Advantage+ Shopping — activar cuando tengas +50 conversiones/semana"
  },

  "creativos": {
    "formato_recomendado": "Reels o Imagen",
    "gancho_apertura": "Texto exacto del gancho para los primeros 3 segundos del video",
    "tips_creativos": ["tip 1 específico", "tip 2 específico", "tip 3 específico"],
    "alertas_rotar": ["CTR < 1% por 3 días consecutivos", "Frecuencia > 2.5", "señal 3 específica"]
  },

  "horarios": {
    "mejores_dias": ["Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
    "mejor_horario": "18:00 - 22:00 hora Colombia",
    "justificacion": "Por qué estos días y horarios para este producto y audiencia específica"
  },

  "kpis": {
    "ctr_objetivo": 1.5,
    "roas_objetivo": 2.5,
    "cpa_maximo": 50000,
    "senales_escalar": ["ROAS ≥ 4.5x durante 3 días consecutivos", "CTR > 2% sostenido", "señal 3"],
    "senales_pausar": ["ROAS < 2x por 3 días", "CTR < 1% tras rotar creativos", "CPA > CPA máximo por 5 días"]
  },

  "hashtags_instagram": {
    "masivos": ["#hashtag_masivo_1 (>1M usos)", "#hashtag_masivo_2", "#hashtag_masivo_3", "#hashtag_masivo_4", "#hashtag_masivo_5"],
    "medianos": ["#hashtag_medio_1 (100K-1M)", "#hashtag_medio_2", "#hashtag_medio_3", "#hashtag_medio_4", "#hashtag_medio_5"],
    "nicho": ["#hashtag_nicho_1 (<100K)", "#hashtag_nicho_2", "#hashtag_nicho_3", "#hashtag_nicho_4", "#hashtag_nicho_5"]
  },

  "descripcion_lista": "Texto completo listo para copiar y pegar en Instagram o WhatsApp. Debe incluir: nombre EXACTO del producto ({$producto->nombre}), los 3-5 beneficios principales del producto, el precio \${$precio} COP, el link de compra {$urlProducto}, y un CTA claro. Usa emojis. Máximo 8 líneas.",

  "google_shopping": {
    "titulo_optimizado": "Título exacto máximo 70 caracteres con keyword principal al inicio, beneficio clave y marca si aplica — optimizado para Google Shopping",
    "descripcion_optimizada": "Descripción de 150 caracteres con keyword principal, beneficio diferenciador, precio y CTA implícito",
    "categoria_google": "Categoría exacta de Google Product Taxonomy en español (ej: Hogar y jardín > Decoración > Marcos de fotos)",
    "tips_feed": [
      "Imagen fondo blanco puro #FFFFFF mínimo 800x800px — fundamental para ser aprobado en Google Shopping",
      "GTIN o código de barras mejora el ranking y la visibilidad en Shopping — agrega si tienes",
      "Disponibilidad: en_stock actualizada en tiempo real — un producto sin stock pierde impresiones",
      "Precio competitivo visible — Google compara precios entre vendedores del mismo producto",
      "Título con keyword al inicio — los primeros 25 caracteres son los más relevantes para el algoritmo"
    ],
    "como_hacerlo": "PASO 1: Ve a merchants.google.com → Productos → Añadir producto manualmente o via feed. PASO 2: Pega el título optimizado EXACTAMENTE como se indica arriba. PASO 3: Sube imagen con fondo blanco puro (#FFFFFF) mínimo 800x800px — rechaza imágenes con fondos de color o texto sobre la imagen. PASO 4: Completa precio, disponibilidad y categoría exacta de Google Product Taxonomy. PASO 5: Enlaza Merchant Center con Google Ads (Herramientas → Cuentas enlazadas). PASO 6: Crea campaña de Shopping ESTÁNDAR (NO Performance Max todavía — necesitas datos primero). PASO 7: Presupuesto inicial $40.000 COP/día, CPC manual hasta tener 30+ conversiones/mes. PASO 8: Cuando tengas 30+ conversiones/mes activa Performance Max con señales de audiencia."
  },

  "google_search": {
    "palabras_clave": [
      { "keyword": "comprar [PRODUCTO] colombia", "concordancia": "EXACTA", "intencion": "Compra directa — máxima prioridad", "cpc_max_cop": 800 },
      { "keyword": "precio [PRODUCTO] colombia", "concordancia": "FRASE", "intencion": "Comparación de precio", "cpc_max_cop": 600 },
      { "keyword": "[PRODUCTO] barato colombia", "concordancia": "FRASE", "intencion": "Búsqueda de precio bajo", "cpc_max_cop": 400 },
      { "keyword": "[PRODUCTO] envio rapido colombia", "concordancia": "FRASE", "intencion": "Beneficio logístico", "cpc_max_cop": 500 },
      { "keyword": "[PRODUCTO] original colombia", "concordancia": "FRASE", "intencion": "Calidad y confianza", "cpc_max_cop": 550 }
    ],
    "titulares_responsivos": [
      "Titular 1 con keyword principal y beneficio (máx 30 chars)",
      "Titular 2 con precio o descuento (máx 30 chars)",
      "Titular 3 con envío o garantía (máx 30 chars)",
      "Titular 4 con urgencia o escasez (máx 30 chars)",
      "Titular 5 con prueba social (máx 30 chars)"
    ],
    "descripciones": [
      "Descripción 1: beneficios principales del producto con CTA claro (máx 90 chars)",
      "Descripción 2: diferenciador + garantía o envío gratis + urgencia (máx 90 chars)"
    ],
    "presupuesto_inicial_cop": 40000,
    "como_hacerlo": "PASO 1: Google Ads → Nueva campaña → Búsqueda → Objetivo: Ventas → URL del producto. PASO 2: Usa CPC manual (NO Smart Bidding ni tROAS hasta tener 30+ conversiones/mes). PASO 3: Crea 2 grupos de anuncios — Grupo A: intención de compra directa (concordancia EXACTA), Grupo B: comparación y precio (concordancia FRASE). PASO 4: Agrega las palabras clave con los CPC máximos indicados arriba — no pagues más. PASO 5: Crea anuncio responsivo de búsqueda con los 5 titulares y 2 descripciones. PASO 6: Activa extensiones: Sitelinks (beneficios), Precio (muestra el precio), Promoción (descuento si tienes). PASO 7: Excluye keywords negativas: gratis, tutorial, cómo hacer, segunda mano, usado. PASO 8: Revisa Search Terms Report cada 3 días y agrega términos irrelevantes como negativas. PASO 9: Cuando tengas 30+ conversiones/mes activa tROAS con objetivo 300% (3x)."
  },

  "alertas_accion": [
    { "semaforo": "ROJO", "senal": "ROAS baja de 2.0x por 3 días seguidos", "accion": "PAUSA HOY. Cambia creativos antes de reactivar. Revisa si el precio es competitivo vs competencia." },
    { "semaforo": "ROJO", "senal": "CTR cae por debajo del 1% en Meta Ads", "accion": "Rota creativos esta semana. Prueba 3 titulares nuevos durante 5 días seguidos." },
    { "semaforo": "ROJO", "senal": "CPA supera el máximo permitido por 5 días consecutivos", "accion": "Reduce presupuesto 40% o pausa. Revisa segmentación — posiblemente audiencia saturada." },
    { "semaforo": "AMARILLO", "senal": "Frecuencia en Meta supera 2.5", "accion": "Amplía segmentación o lanza creativos nuevos esta semana. Activa Advantage+ si no lo tienes." },
    { "semaforo": "AMARILLO", "senal": "CPA supera el máximo por 3 días", "accion": "Reduce presupuesto 30%, revisa segmentación y landing page. Verifica velocidad del sitio." },
    { "semaforo": "AMARILLO", "senal": "CTR entre 1% y 1.5% por más de 7 días", "accion": "Mejora el gancho visual y el titular. Prueba formato video vs imagen estática." },
    { "semaforo": "VERDE", "senal": "ROAS supera 4.5x durante 3 días consecutivos", "accion": "Sube presupuesto exactamente 50%. No más de 50% o Meta sale del período de aprendizaje (reinicia)." },
    { "semaforo": "VERDE", "senal": "CTR supera 2.5% sostenido por 5 días", "accion": "Creativos funcionan muy bien — escala horizontal: copia este creativo a otras audiencias." }
  ],

  "proxima_revision": "En X días"
}

Responde SOLO con el JSON puro. Sin texto antes ni después. Sin explicaciones.
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
                'model'       => 'groq/compound-mini',
                'messages'    => [
                    [
                        'role'    => 'user',
                        'content' => $prompt,
                    ],
                ],
                'temperature' => 0.3,   // Más determinístico para decisiones de negocio
                'max_tokens'  => 8000,
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
