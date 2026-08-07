<?php

/*
|--------------------------------------------------------------------------
| CONTROLADOR: ProductoController
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué hace un Controller?
|
|   El Controller es el intermediario entre la ruta y la vista.
|
|   Flujo de una petición web:
|     1. Usuario hace click en "Ver productos"
|     2. Browser envía GET /productos → Laravel busca la ruta
|     3. La ruta llama a ProductoController@index
|     4. index() consulta la BD, prepara los datos
|     5. index() retorna Inertia::render('Productos/Index', $datos)
|     6. Inertia envía los datos a React como props
|     7. React renderiza la página con los datos
|
| PENSAR — ¿Qué métodos necesitamos?
|
|   Route::resource() genera 7 rutas automáticamente:
|
|   GET    /productos           → index()   — lista de productos
|   GET    /productos/crear     → create()  — formulario de creación
|   POST   /productos           → store()   — guardar nuevo producto
|   GET    /productos/{id}      → show()    — detalle de un producto
|   GET    /productos/{id}/editar → edit()  — formulario de edición
|   PUT    /productos/{id}      → update()  — guardar cambios
|   DELETE /productos/{id}      → destroy() — borrar (soft delete)
|
*/

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Categoria;
use App\Models\Producto;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ProductoController extends Controller
{
    /*
    |----------------------------------------------------------------------
    | index() — Lista todos los productos con filtros y paginación
    |----------------------------------------------------------------------
    |
    | PENSAR — ¿Qué necesita la vista de listado?
    |
    |   - Lista paginada de productos (no traer todos — pueden ser miles)
    |   - Filtros: por nombre, categoría, estado, rango de precio
    |   - Eager loading de 'categoria' para no hacer N+1 queries
    |
    | ¿Qué es N+1?
    |   Si tienes 20 productos y haces $producto->categoria en cada uno,
    |   Laravel hace 1 query para los productos + 20 queries para categorías.
    |   Con with('categoria') hace 1 + 1 = 2 queries. Mucho más eficiente.
    |
    */
    public function index(Request $request): Response
    {
        // Construimos el query base — aún no ejecuta nada en la BD
        $query = Producto::with('categoria')  // eager loading (evita N+1)
                         ->orderBy('creado_en', 'desc');

        // ─── FILTROS ──────────────────────────────────────────────────────

        // Filtro por nombre (búsqueda parcial, insensible a mayúsculas)
        // ilike es el equivalente de PostgreSQL a LIKE insensible a mayúsculas
        if ($request->filled('buscar')) {
            $query->where('nombre', 'ilike', '%' . $request->buscar . '%');
        }

        // Filtro por categoría
        if ($request->filled('categoria_id')) {
            $query->where('categoria_id', $request->categoria_id);
        }

        // Filtro por estado
        if ($request->filled('estado')) {
            $query->where('estado', $request->estado);
        }

        // Filtro por rango de precio
        if ($request->filled('precio_min')) {
            $query->where('precio_venta', '>=', $request->precio_min);
        }
        if ($request->filled('precio_max')) {
            $query->where('precio_venta', '<=', $request->precio_max);
        }

        // Ejecuta el query con paginación (15 por página)
        // withQueryString() mantiene los filtros activos al cambiar de página
        $productos = $query->paginate(15)->withQueryString();

        // Categorías para el selector de filtro
        $categorias = Categoria::activas()
                               ->ordenadas()
                               ->get(['id', 'nombre']);

        return Inertia::render('Productos/Index', [
            'productos'  => $productos,
            'categorias' => $categorias,
            // Regresamos los filtros activos para que la vista los muestre
            'filtros'    => $request->only(['buscar', 'categoria_id', 'estado', 'precio_min', 'precio_max']),
            // Mensajes flash (éxito, error) para mostrar notificaciones
            'flash'      => [
                'exito' => session('exito'),
                'error' => session('error'),
            ],
        ]);
    }

    /*
    |----------------------------------------------------------------------
    | create() — Muestra el formulario de creación
    |----------------------------------------------------------------------
    |
    | No recibe datos del usuario (GET), solo envía lo que el formulario
    | necesita: la lista de categorías para el selector.
    |
    */
    public function create(): Response
    {
        $categorias = Categoria::activas()
                               ->ordenadas()
                               ->get(['id', 'nombre', 'padre_id']);

        return Inertia::render('Productos/Crear', [
            'categorias' => $categorias,
        ]);
    }

    /*
    |----------------------------------------------------------------------
    | store() — Guarda un nuevo producto en la BD
    |----------------------------------------------------------------------
    |
    | PENSAR — ¿Qué debemos validar?
    |
    |   'nombre'       → requerido, string, máximo 200 caracteres
    |   'precio_venta' → requerido, número positivo
    |   'estado'       → debe ser uno de los valores permitidos
    |   'slug'         → único en la tabla (dos productos no pueden tener la misma URL)
    |
    | DB::transaction() → si cualquier operación falla, revierte TODO.
    |   ¿Por qué? Porque si guardamos el producto pero falla algo más
    |   después, la BD queda en un estado inconsistente.
    |
    */
    public function store(Request $request)
    {
        // ─── VALIDACIÓN ───────────────────────────────────────────────────
        $datos = $request->validate([
            'nombre'            => 'required|string|max:200',
            'descripcion_corta' => 'nullable|string|max:300',
            'descripcion'       => 'nullable|string',
            'precio_costo'      => 'required|numeric|min:0',
            'precio_venta'      => 'required|numeric|min:0',
            'precio_oferta'     => 'nullable|numeric|min:0',
            'stock'             => 'nullable|integer|min:0',
            'stock_minimo'      => 'nullable|integer|min:0',
            'categoria_id'      => 'nullable|string',
            'estado'            => 'required|in:activo,borrador,agotado,inactivo',
            'peso_kg'           => 'nullable|numeric|min:0',
            'largo_cm'          => 'nullable|numeric|min:0',
            'ancho_cm'          => 'nullable|numeric|min:0',
            'alto_cm'           => 'nullable|numeric|min:0',
            'meta_titulo'       => 'nullable|string|max:60',
            'meta_descripcion'  => 'nullable|string|max:160',
            'sku'               => 'nullable|string|max:50|unique:productos,sku',
            'imagenes_nuevas'   => 'nullable|array',
            'imagenes_nuevas.*' => 'image|max:2048',
        ]);

        DB::transaction(function () use ($datos, $request) {
            // ── CAPITALIZAR NOMBRE ────────────────────────────────────
            // Str::title('arbol navidad 2026') → 'Arbol Navidad 2026'
            $datos['nombre'] = Str::title($datos['nombre']);

            // ── SLUG único desde el nombre ────────────────────────────
            $datos['slug'] = $this->generarSlugUnico($datos['nombre']);

            // ── IMÁGENES ──────────────────────────────────────────────
            // Usamos move() directamente en lugar del Storage facade
            // para mayor compatibilidad en Windows con Flysystem
            if ($request->hasFile('imagenes_nuevas')) {
                // Nos aseguramos de que el directorio de destino existe
                $directorio = storage_path('app/public/productos');
                if (!is_dir($directorio)) {
                    mkdir($directorio, 0755, true);
                }

                $urls = [];
                foreach ($request->file('imagenes_nuevas') as $archivo) {
                    // Obtenemos la extensión del archivo original
                    $extension    = $archivo->getClientOriginalExtension() ?: 'jpg';
                    // Generamos un nombre único con Str::random
                    $nombreArchivo = Str::random(40) . '.' . strtolower($extension);
                    // Movemos el archivo al directorio de storage público
                    $archivo->move($directorio, $nombreArchivo);
                    // Construimos la URL pública: /storage/productos/nombre.jpg
                    $urls[] = '/storage/productos/' . $nombreArchivo;
                }
                $datos['imagenes'] = $urls;
            }

            // Quitamos el campo 'imagenes_nuevas' del array (no es columna de la tabla)
            unset($datos['imagenes_nuevas']);

            Producto::create($datos);
        });

        return redirect()
            ->route('productos.index')
            ->with('exito', 'Producto creado exitosamente.');
    }

    /*
    |----------------------------------------------------------------------
    | show() — Detalle de un producto
    |----------------------------------------------------------------------
    |
    | Route Model Binding:
    |   Laravel automáticamente busca el Producto por el UUID en la URL.
    |   Si no existe → devuelve 404 automáticamente.
    |   No necesitamos escribir Producto::findOrFail($id).
    |
    */
    public function show(Producto $producto): Response
    {
        // Cargamos las relaciones que necesita la vista de detalle
        $producto->load(['categoria', 'proveedores']);

        return Inertia::render('Productos/Ver', [
            'producto' => $producto,
        ]);
    }

    /*
    |----------------------------------------------------------------------
    | edit() — Formulario de edición pre-llenado
    |----------------------------------------------------------------------
    */
    public function edit(Producto $producto): Response
    {
        $categorias = Categoria::activas()
                               ->ordenadas()
                               ->get(['id', 'nombre', 'padre_id']);

        return Inertia::render('Productos/Editar', [
            'producto'   => $producto,
            'categorias' => $categorias,
        ]);
    }

    /*
    |----------------------------------------------------------------------
    | update() — Actualiza un producto existente
    |----------------------------------------------------------------------
    |
    | La validación del slug usa 'unique:productos,slug,{id}'
    | para ignorar el slug del propio producto al validar unicidad.
    | Sin esto, si no cambias el slug, la validación falla porque
    | ya existe ese slug (el del mismo producto).
    |
    */
    public function update(Request $request, Producto $producto)
    {
        $datos = $request->validate([
            'nombre'            => 'required|string|max:200',
            'descripcion_corta' => 'nullable|string|max:300',
            'descripcion'       => 'nullable|string',
            'precio_costo'      => 'required|numeric|min:0',
            'precio_venta'      => 'required|numeric|min:0',
            'precio_oferta'     => 'nullable|numeric|min:0',
            'stock'             => 'nullable|integer|min:0',
            'stock_minimo'      => 'nullable|integer|min:0',
            'categoria_id'      => 'nullable|string',
            'estado'            => 'required|in:activo,borrador,agotado,inactivo',
            'peso_kg'           => 'nullable|numeric|min:0',
            'largo_cm'          => 'nullable|numeric|min:0',
            'ancho_cm'          => 'nullable|numeric|min:0',
            'alto_cm'           => 'nullable|numeric|min:0',
            'meta_titulo'       => 'nullable|string|max:60',
            'meta_descripcion'  => 'nullable|string|max:160',
            'sku'               => 'nullable|string|max:50|unique:productos,sku,' . $producto->id,
            'imagenes_nuevas'   => 'nullable|array',
            'imagenes_nuevas.*' => 'image|max:2048',
        ]);

        DB::transaction(function () use ($datos, $request, $producto) {
            // ── CAPITALIZAR ───────────────────────────────────────────
            $datos['nombre'] = Str::title($datos['nombre']);

            // ── SLUG ──────────────────────────────────────────────────
            if ($datos['nombre'] !== $producto->nombre) {
                $datos['slug'] = $this->generarSlugUnico($datos['nombre'], $producto->id);
            }

            // ── IMÁGENES NUEVAS ───────────────────────────────────────
            if ($request->hasFile('imagenes_nuevas')) {
                $directorio = storage_path('app/public/productos');
                if (!is_dir($directorio)) {
                    mkdir($directorio, 0755, true);
                }

                $urlsExistentes = $producto->imagenes ?? [];
                $urlsNuevas = [];

                foreach ($request->file('imagenes_nuevas') as $archivo) {
                    $extension     = $archivo->getClientOriginalExtension() ?: 'jpg';
                    $nombreArchivo = Str::random(40) . '.' . strtolower($extension);
                    $archivo->move($directorio, $nombreArchivo);
                    $urlsNuevas[] = '/storage/productos/' . $nombreArchivo;
                }

                $datos['imagenes'] = array_merge($urlsExistentes, $urlsNuevas);
            }

            unset($datos['imagenes_nuevas']);

            $producto->update($datos);
        });

        return redirect()
            ->route('productos.index')
            ->with('exito', 'Producto actualizado correctamente.');
    }

    /*
    |----------------------------------------------------------------------
    | destroy() — Elimina un producto (soft delete)
    |----------------------------------------------------------------------
    |
    | SoftDelete: no borra el registro de la BD.
    | Solo pone la fecha en 'eliminado_en'.
    | Los queries normales lo excluyen automáticamente.
    |
    | ¿Por qué soft delete y no borrado real?
    |   Los pedidos existentes siguen referenciando el producto.
    |   Si lo borramos de verdad, los pedidos quedan sin producto.
    |
    */
    public function destroy(Producto $producto)
    {
        $producto->delete(); // SoftDelete — llena eliminado_en

        return redirect()
            ->route('productos.index')
            ->with('exito', 'Producto eliminado correctamente.');
    }

    /*
    |----------------------------------------------------------------------
    | HELPER PRIVADO: generarSlugUnico()
    |----------------------------------------------------------------------
    |
    | Convierte un nombre en slug URL-amigable y garantiza unicidad.
    |
    | Ejemplo:
    |   "iPhone 15 Pro"  →  "iphone-15-pro"
    |   Si ya existe     →  "iphone-15-pro-2"
    |   Si también existe→  "iphone-15-pro-3"
    |
    */
    private function generarSlugUnico(string $nombre, ?string $ignorarId = null): string
    {
        $slug = Str::slug($nombre);
        $slugBase = $slug;
        $contador = 2;

        // Verificamos si el slug ya existe (ignorando el producto actual en edición)
        while (
            Producto::where('slug', $slug)
                    ->when($ignorarId, fn($q) => $q->where('id', '!=', $ignorarId))
                    ->exists()
        ) {
            $slug = $slugBase . '-' . $contador;
            $contador++;
        }

        return $slug;
    }
}
