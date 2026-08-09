<?php

/*
|--------------------------------------------------------------------------
| CONTROLLER: TiendaController
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué hace este controller?
|
|   Maneja las rutas PÚBLICAS de la tienda (sin login).
|   Cualquier visitante puede ver el catálogo y el detalle de productos.
|
|   index()  → GET /tienda
|              Catálogo filtrable por categoría, precio y búsqueda.
|
|   categoria() → GET /tienda/categoria/{slug}
|                 Catálogo filtrado por una categoría específica.
|
|   show()   → GET /tienda/{slug}
|              Detalle de un producto individual (con SEO).
|
| PENSAR — ¿Qué datos necesita cada vista?
|
|   index():
|     - Lista paginada de productos activos con stock
|     - Categorías activas para el sidebar de filtros
|     - Filtros aplicados (búsqueda, rango de precio, categoría)
|
|   show():
|     - El producto completo (con categoría e imágenes)
|     - Productos relacionados (misma categoría, distintos)
|     - Meta tags para SEO (título, descripción, og:image)
|
*/

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Categoria;
use App\Models\Producto;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TiendaController extends Controller
{
    /*
    |----------------------------------------------------------------------
    | index() — GET /tienda
    |----------------------------------------------------------------------
    | Catálogo público con filtros y paginación.
    */
    public function index(Request $request)
    {
        // Construimos la query base: solo productos activos y con stock
        // 'media' → imágenes de Spatie para las tarjetas del catálogo
        $query = Producto::with(['categoria', 'media'])
            ->activos()
            ->conStock()
            ->orderBy('creado_en', 'desc');

        // Filtro: búsqueda por texto en nombre o descripción corta
        if ($request->filled('q')) {
            $termino = $request->q;
            $query->where(function ($q) use ($termino) {
                $q->where('nombre', 'ilike', "%{$termino}%")
                  ->orWhere('descripcion_corta', 'ilike', "%{$termino}%");
            });
        }

        // Filtro: por categoría (slug)
        if ($request->filled('categoria')) {
            $cat = Categoria::where('slug', $request->categoria)->first();
            if ($cat) {
                $query->where('categoria_id', $cat->id);
            }
        }

        // Filtro: precio mínimo
        if ($request->filled('precio_min')) {
            $query->where('precio_venta', '>=', (float) $request->precio_min);
        }

        // Filtro: precio máximo
        if ($request->filled('precio_max')) {
            $query->where('precio_venta', '<=', (float) $request->precio_max);
        }

        // Paginación: 16 productos por página (cuadrícula 4x4)
        $productos = $query->paginate(16)->withQueryString();

        // Categorías activas para el sidebar de filtros
        $categorias = Categoria::activas()
            ->ordenadas()
            ->select('id', 'nombre', 'slug')
            ->get();

        return Inertia::render('Tienda/Index', [
            'productos'  => $productos,
            'categorias' => $categorias,
            'filtros'    => $request->only(['q', 'categoria', 'precio_min', 'precio_max']),
        ]);
    }

    /*
    |----------------------------------------------------------------------
    | show() — GET /tienda/{slug}
    |----------------------------------------------------------------------
    | Detalle de un producto por su slug.
    | Si no existe o no está activo → 404.
    */
    public function show(string $slug)
    {
        // Buscar el producto por su slug
        // firstOrFail() → devuelve 404 automáticamente si no existe
        // Cargamos 'media' para la galería de imágenes y el SEO og:image
        $producto = Producto::with(['categoria', 'media'])
            ->where('slug', $slug)
            ->activos()
            ->firstOrFail();

        // Productos relacionados: misma categoría, distinto id, activos, con stock
        $relacionados = collect();
        if ($producto->categoria_id) {
            $relacionados = Producto::with(['categoria', 'media'])
                ->activos()
                ->conStock()
                ->where('categoria_id', $producto->categoria_id)
                ->where('id', '!=', $producto->id)
                ->limit(4)
                ->get();
        }

        return Inertia::render('Tienda/Producto', [
            'producto'     => $producto,
            'relacionados' => $relacionados,
            // Número de WhatsApp del negocio (sin +, sin espacios)
            // Configurar en Railway: WHATSAPP_NUMERO=573001234567
            'whatsapp'     => env('WHATSAPP_NUMERO', ''),
            // Meta tags SEO para og: y twitter cards
            'seo' => [
                'titulo'      => $producto->meta_titulo ?: $producto->nombre,
                'descripcion' => $producto->meta_descripcion ?: $producto->descripcion_corta,
                'imagen'      => $producto->imagenPrincipal(),
                'url'         => url("/tienda/{$producto->slug}"),
            ],
        ]);
    }

    /*
    |----------------------------------------------------------------------
    | categoria() — GET /tienda/categoria/{slug}
    |----------------------------------------------------------------------
    | Catálogo filtrado por categoría específica (vía slug).
    | Reutiliza la misma vista Tienda/Index pero con filtro pre-aplicado.
    */
    public function categoria(string $slug)
    {
        // Buscar la categoría o 404
        $categoria = Categoria::where('slug', $slug)
            ->activas()
            ->firstOrFail();

        // Productos de esta categoría (activos + con stock)
        $productos = Producto::with(['categoria', 'media'])
            ->activos()
            ->conStock()
            ->where('categoria_id', $categoria->id)
            ->orderBy('creado_en', 'desc')
            ->paginate(16)
            ->withQueryString();

        // Todas las categorías para el sidebar
        $categorias = Categoria::activas()
            ->ordenadas()
            ->select('id', 'nombre', 'slug')
            ->get();

        return Inertia::render('Tienda/Index', [
            'productos'         => $productos,
            'categorias'        => $categorias,
            'categoriaActual'   => $categoria,
            'filtros'           => ['categoria' => $slug],
        ]);
    }
}
