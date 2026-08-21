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
        // 'media' → eager load imágenes de Spatie (evita N+1 al acceder a thumbnails)
        $query = Producto::with(['categoria', 'media'])
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
    /*
    |----------------------------------------------------------------------
    | verificarNombre() — Busca productos con nombre similar (AJAX)
    |----------------------------------------------------------------------
    */
    public function verificarNombre(Request $request): \Illuminate\Http\JsonResponse
    {
        $nombre    = trim($request->nombre ?? '');
        $excluirId = $request->excluir_id; // al editar, excluimos el producto actual

        if (mb_strlen($nombre) < 3) {
            return response()->json(['existe' => false, 'productos' => []]);
        }

        $productos = Producto::where('nombre', 'ilike', '%' . $nombre . '%')
            ->when($excluirId, fn($q) => $q->where('id', '!=', $excluirId))
            ->select('id', 'nombre', 'sku', 'estado', 'precio_venta')
            ->limit(3)
            ->get()
            ->map(fn($p) => [
                'id'           => $p->id,
                'nombre'       => $p->nombre,
                'sku'          => $p->sku,
                'estado'       => $p->estado,
                'precio_venta' => $p->precio_venta,
                'url_editar'   => route('productos.edit', $p->id),
            ]);

        return response()->json([
            'existe'    => $productos->isNotEmpty(),
            'productos' => $productos,
        ]);
    }

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
            // Spatie acepta múltiples imágenes. mimes: jpg, png y webp
            'imagenes_nuevas'   => 'nullable|array',
            'imagenes_nuevas.*' => 'image|max:5120|mimes:jpeg,jpg,png,webp',
        ]);

        // ─── VALIDACIÓN: nombre duplicado (si no se forzó) ───────────────
        $nombreNormalizado = Str::title(trim($datos['nombre']));
        if (!$request->boolean('forzar_creacion')) {
            $duplicado = Producto::where('nombre', 'ilike', $nombreNormalizado)
                ->when($request->excluir_id, fn($q) => $q->where('id', '!=', $request->excluir_id))
                ->first();
            if ($duplicado) {
                return back()
                    ->withErrors(['nombre' => "Ya existe: SKU {$duplicado->sku} — \"{$duplicado->nombre}\" ({$duplicado->estado})."])
                    ->withInput();
            }
        }

        // ─── PASO 1: Crear el producto en BD (transacción) ────────────────
        $producto = null;

        DB::transaction(function () use ($datos, &$producto) {
            $datos['nombre'] = Str::title($datos['nombre']);
            $datos['slug']   = $this->generarSlugUnico($datos['nombre']);

            // Quitamos imagenes_nuevas — no es columna de la tabla 'productos'
            unset($datos['imagenes_nuevas']);

            $producto = Producto::create($datos);
        });

        // ─── PASO 2: Subir imágenes a R2 via Spatie ───────────────────────
        // Esto va FUERA de la transacción porque es I/O de red (Cloudflare R2).
        // Si falla la subida, el producto ya está creado (sin imágenes),
        // que es preferible a revertir toda la transacción por un error de red.
        //
        // addMedia($archivo) → toma el archivo del request
        // toMediaCollection('imagenes') → lo sube al disco 'r2' y genera
        //   las conversiones WebP (thumbnail 400×400 y medium 800×800)
        //   según defineRegisterMediaConversions() en el modelo.
        if ($request->hasFile('imagenes_nuevas')) {
            foreach ($request->file('imagenes_nuevas') as $archivo) {
                $producto->addMedia($archivo)
                         ->toMediaCollection('imagenes');
            }
        }

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
        // 'media' → imágenes de Spatie para mostrar en la página de detalle
        $producto->load(['categoria', 'proveedores', 'media']);

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
        // Cargamos 'media' para mostrar las imágenes actuales con botón de borrar
        $producto->load('media');

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

        // ─── PASO 1: Actualizar datos del producto en BD ──────────────────
        DB::transaction(function () use ($datos, $producto) {
            $datos['nombre'] = Str::title($datos['nombre']);

            if ($datos['nombre'] !== $producto->nombre) {
                $datos['slug'] = $this->generarSlugUnico($datos['nombre'], $producto->id);
            }

            unset($datos['imagenes_nuevas']);
            $producto->update($datos);
        });

        // ─── PASO 2: Agregar nuevas imágenes a R2 ─────────────────────────
        // Las imágenes anteriores NO se borran — se agregan nuevas.
        // Para borrar una imagen específica usa eliminarImagen().
        if ($request->hasFile('imagenes_nuevas')) {
            foreach ($request->file('imagenes_nuevas') as $archivo) {
                $producto->addMedia($archivo)
                         ->toMediaCollection('imagenes');
            }
        }

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
    | eliminarImagen() — Elimina una imagen específica de un producto
    |----------------------------------------------------------------------
    |
    | Spatie Media Library administra el archivo en R2:
    |   - Borra el original
    |   - Borra las conversiones (thumbnail, medium)
    |   - Borra el registro de la tabla 'media'
    |
    | Ruta: DELETE /productos/{producto}/imagenes/{media}
    |
    | Uso desde React:
    |   router.delete(`/productos/${producto.id}/imagenes/${media.id}`)
    |
    */
    public function eliminarImagen(Producto $producto, int $mediaId)
    {
        // Buscamos la imagen dentro de la colección 'imagenes' de ESTE producto
        // (evita borrar media de otro producto si alguien manipula el ID)
        $media = $producto->getMedia('imagenes')->find($mediaId);

        if ($media) {
            // delete() → Spatie borra el archivo en R2 + las conversiones WebP
            //            + el registro en la tabla 'media'
            $media->delete();
        }

        return back()->with('exito', 'Imagen eliminada correctamente.');
    }

    /*
    |----------------------------------------------------------------------
    | IMPORTAR MASIVO — POST /productos/importar
    |----------------------------------------------------------------------
    |
    | Recibe un archivo CSV con columnas:
    |   sku, nombre, precio_costo, precio_venta, stock, descripcion_corta
    |
    | Por cada fila válida crea un producto en estado 'borrador'.
    | Retorna resumen: cuántos se crearon y cuáles fallaron.
    |
    */
    public function importar(Request $request)
    {
        $request->validate([
            'archivo' => 'required|file|mimes:csv,txt|max:2048',
        ]);

        $archivo = $request->file('archivo');
        $handle  = fopen($archivo->getRealPath(), 'r');

        // Leer encabezados (primera fila)
        $encabezados = array_map('trim', fgetcsv($handle, 1000, ','));

        $creados = 0;
        $errores = [];
        $fila    = 2; // empieza en 2 porque la 1 es el encabezado

        while (($columnas = fgetcsv($handle, 1000, ',')) !== false) {
            // Saltar filas completamente vacías
            if (empty(array_filter($columnas))) {
                $fila++;
                continue;
            }

            // Mapear columnas por nombre de encabezado
            $datos = array_combine($encabezados, array_map('trim', $columnas));

            $nombre = $datos['nombre'] ?? '';
            if (empty($nombre)) {
                $errores[] = "Fila {$fila}: nombre vacío, se omitió.";
                $fila++;
                continue;
            }

            try {
                $sku = !empty($datos['sku']) ? $datos['sku'] : null;

                // Si el SKU ya existe, saltar
                if ($sku && Producto::where('sku', $sku)->exists()) {
                    $errores[] = "Fila {$fila}: SKU '{$sku}' ya existe, se omitió.";
                    $fila++;
                    continue;
                }

                Producto::create([
                    'nombre'           => $nombre,
                    'slug'             => $this->generarSlugUnico($nombre),
                    'sku'              => $sku,
                    'descripcion_corta'=> $datos['descripcion_corta'] ?? null,
                    'precio_costo'     => (float) str_replace(['$', '.', ','], ['', '', '.'], $datos['precio_costo'] ?? 0),
                    'precio_venta'     => (float) str_replace(['$', '.', ','], ['', '', '.'], $datos['precio_venta'] ?? 0),
                    'stock'            => isset($datos['stock']) && $datos['stock'] !== '' ? (int) $datos['stock'] : null,
                    'estado'           => 'borrador',
                ]);

                $creados++;
            } catch (\Exception $e) {
                $errores[] = "Fila {$fila}: error — {$e->getMessage()}";
            }

            $fila++;
        }

        fclose($handle);

        $mensaje = "{$creados} productos importados correctamente.";
        if (!empty($errores)) {
            $mensaje .= ' ' . count($errores) . ' filas con error.';
        }

        return back()->with('exito', $mensaje)->with('errores_importacion', $errores);
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
