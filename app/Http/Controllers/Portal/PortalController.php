<?php

/*
|--------------------------------------------------------------------------
| CONTROLLER: Portal\PortalController
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué es este controller?
|
|   Es el controlador del portal privado para proveedores.
|   Un proveedor logueado solo puede ver y gestionar lo que le corresponde.
|
| ENTENDER — ¿Cómo obtenemos al proveedor?
|
|   auth()->user()          → el usuario logueado (modelo User)
|   auth()->user()->proveedor → su perfil de proveedor (modelo Proveedor)
|
|   Relación: User hasOne Proveedor (por usuario_id)
|
| PENSAR — Seguridad en cada método:
|
|   Antes de mostrar o modificar cualquier recurso, verificamos que
|   pertenece al proveedor logueado. Si no, devolvemos 403 o 404.
|   Esto evita que un proveedor acceda a datos de otro proveedor.
|
*/

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\Categoria;
use App\Models\ItemPedido;
use App\Models\PagoProveedor;
use App\Models\Pedido;
use App\Models\Producto;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class PortalController extends Controller
{
    /*
    |----------------------------------------------------------------------
    | HELPER PRIVADO: obtenerProveedor()
    |----------------------------------------------------------------------
    |
    | PENSAR — ¿Por qué un helper?
    |
    |   Todos los métodos necesitan el perfil del proveedor.
    |   En lugar de repetir auth()->user()->proveedor en cada uno,
    |   centralizamos la lógica aquí.
    |
    |   Si el usuario no tiene perfil de proveedor (por ejemplo, un
    |   super_admin probando el portal), lanzamos un abort(403).
    |
    */
    private function obtenerProveedor()
    {
        $proveedor = auth()->user()->proveedor;

        // Si es super_admin probando el portal, toma el primer proveedor activo
        // (para no bloquear al admin durante desarrollo/testing)
        if (!$proveedor && auth()->user()->hasRole('super_administrador')) {
            $proveedor = \App\Models\Proveedor::activos()->first();
        }

        abort_if(!$proveedor, 403, 'No tienes un perfil de proveedor asociado.');

        return $proveedor;
    }

    /*
    |----------------------------------------------------------------------
    | dashboard() — Resumen ejecutivo del proveedor
    |----------------------------------------------------------------------
    |
    | PENSAR — ¿Qué información es útil para el proveedor al entrar?
    |
    |   1. Cuántos de sus productos están activos
    |   2. Cuántos pedidos pendientes tienen sus productos
    |   3. Sus ventas del mes actual (lo que el negocio le debe)
    |   4. Sus últimos 5 pedidos con sus productos
    |
    | PENSAR — ¿Cómo calculamos "ventas del proveedor"?
    |
    |   En dropshipping el proveedor provee los productos a precio de costo.
    |   Lo que le deben = SUM(precio_costo × cantidad) de ítems en pedidos entregados.
    |
    */
    public function dashboard(): Response
    {
        $proveedor    = $this->obtenerProveedor();
        $idsProductos = $proveedor->productos()->pluck('productos.id');

        // Estados que generan deuda al proveedor
        $estadosVenta = [Pedido::ESTADO_CONFIRMADO, Pedido::ESTADO_ENTREGADO];

        // ── Estadísticas de productos ──────────────────────────────────────
        $totalProductos        = $idsProductos->count();
        $totalProductosActivos = $proveedor->productos()->where('productos.estado', 'activo')->count();

        // ── Pedidos pendientes (aún no confirmados) ────────────────────────
        $pedidosPendientes = Pedido::where('estado', Pedido::ESTADO_PENDIENTE)
            ->whereHas('items', fn($q) => $q->whereIn('producto_id', $idsProductos))
            ->count();

        // ── Financiero: deuda acumulada vs pagado ──────────────────────────
        // Deuda total = todo lo que el negocio le debe al proveedor
        $deudaTotal = ItemPedido::whereIn('producto_id', $idsProductos)
            ->whereHas('pedido', fn($q) => $q->whereIn('estado', $estadosVenta))
            ->selectRaw('COALESCE(SUM(precio_costo * cantidad), 0) as total')
            ->value('total') ?? 0;

        // Total pagado por el admin al proveedor
        $totalPagado = PagoProveedor::where('proveedor_id', $proveedor->id)->sum('monto');

        // Ventas del mes (lo que generó este mes a precio costo)
        $ventasMes = ItemPedido::whereIn('producto_id', $idsProductos)
            ->whereHas('pedido', fn($q) => $q
                ->whereIn('estado', $estadosVenta)
                ->whereMonth('creado_en', now()->month)
                ->whereYear('creado_en', now()->year)
            )
            ->selectRaw('COALESCE(SUM(precio_costo * cantidad), 0) as total')
            ->value('total') ?? 0;

        // ── Últimas ventas (pedidos confirmados/entregados) ────────────────
        $ultimasVentas = Pedido::whereIn('estado', $estadosVenta)
            ->whereHas('items', fn($q) => $q->whereIn('producto_id', $idsProductos))
            ->with(['items' => fn($q) => $q->whereIn('producto_id', $idsProductos)])
            ->orderByDesc('creado_en')
            ->limit(10)
            ->get()
            ->map(fn($p) => [
                'id'              => $p->id,
                'numero_pedido'   => $p->numero_pedido,
                'fecha'           => $p->creado_en?->format('d/m/Y'),
                'hora'            => $p->creado_en?->format('H:i'),
                'estado'          => $p->estado,
                'costo_proveedor' => $p->items->sum(fn($i) => $i->precio_costo * $i->cantidad),
                'items'           => $p->items->map(fn($i) => [
                    'nombre'       => $i->nombre_producto,
                    'cantidad'     => $i->cantidad,
                    'precio_costo' => (float) $i->precio_costo,
                    'subtotal'     => (float) ($i->precio_costo * $i->cantidad),
                ]),
            ]);

        // ── Historial de pagos recibidos (últimos 10) ──────────────────────
        $pagosRecibidos = PagoProveedor::where('proveedor_id', $proveedor->id)
            ->orderByDesc('fecha_pago')
            ->limit(10)
            ->get()
            ->map(fn($p) => [
                'id'         => $p->id,
                'monto'      => (float) $p->monto,
                'fecha_pago' => $p->fecha_pago?->format('d/m/Y'),
                'metodo_pago'=> $p->metodo_pago,
                'concepto'   => $p->concepto,
            ]);

        return Inertia::render('Portal/Dashboard', [
            'proveedor'       => $proveedor,
            'estadisticas'    => [
                'total_productos'   => $totalProductos,
                'productos_activos' => $totalProductosActivos,
                'pedidos_pendientes'=> $pedidosPendientes,
                'ventas_mes'        => (float) $ventasMes,
                'deuda_total'       => (float) $deudaTotal,
                'total_pagado'      => (float) $totalPagado,
                'saldo_pendiente'   => (float) ($deudaTotal - $totalPagado),
            ],
            'ultimasVentas'   => $ultimasVentas,
            'pagosRecibidos'  => $pagosRecibidos,
        ]);
    }

    /*
    |----------------------------------------------------------------------
    | productos() — Lista de productos asignados al proveedor
    |----------------------------------------------------------------------
    |
    | PENSAR — ¿Qué ve el proveedor?
    |
    |   Solo los productos que tiene en la tabla pivot 'producto_proveedor'.
    |   La relación ya está definida en Proveedor::productos().
    |   Con withPivot() obtenemos precio y stock de la pivot.
    |
    */
    public function productos(Request $request): Response
    {
        $proveedor = $this->obtenerProveedor();

        $productos = $proveedor->productos()
            ->with('categoria')
            ->when($request->buscar, fn($q) =>
                $q->where(function($q2) use ($request) {
                    $q2->where('productos.nombre', 'ilike', "%{$request->buscar}%")
                       ->orWhere('productos.sku', 'ilike', "%{$request->buscar}%");
                })
            )
            ->when($request->estado, fn($q) => $q->where('productos.estado', $request->estado))
            ->orderBy('productos.nombre')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Portal/Productos', [
            'proveedor' => $proveedor,
            'productos' => $productos,
            'filtros'   => $request->only(['buscar', 'estado']),
        ]);
    }

    /*
    |----------------------------------------------------------------------
    | editarProducto() — Formulario para editar un producto propio
    |----------------------------------------------------------------------
    |
    | PENSAR — ¿Qué puede editar el proveedor?
    |
    |   a) Datos del PRODUCTO en sí: nombre, descripcion, peso
    |   b) Datos de la PIVOT (su relación con el producto): precio, stock
    |
    |   SEGURIDAD: Verificamos que el producto pertenece a este proveedor
    |   antes de mostrarlo. Si intenta editar un producto de otro, 403.
    |
    */
    public function editarProducto(Producto $producto): Response
    {
        $proveedor = $this->obtenerProveedor();

        // Seguridad: ¿este producto pertenece al proveedor logueado?
        $pivot = DB::table('producto_proveedor')
            ->where('producto_id', $producto->id)
            ->where('proveedor_id', $proveedor->id)
            ->first();

        abort_if(!$pivot, 403, 'No tienes acceso a este producto.');

        return Inertia::render('Portal/EditarProducto', [
            'proveedor' => $proveedor,
            'producto'  => $producto->load(['categoria', 'media']),
            'pivot'     => $pivot,
        ]);
    }

    /*
    |----------------------------------------------------------------------
    | actualizarProducto() — Guardar cambios del proveedor en su producto
    |----------------------------------------------------------------------
    |
    | PENSAR — ¿Qué campos puede cambiar?
    |
    |   - descripcion  → en tabla 'productos'
    |   - precio       → en tabla pivot 'producto_proveedor'
    |   - stock        → en tabla pivot 'producto_proveedor'
    |
    |   REGLA: No puede cambiar nombre, slug, categoría ni estado del producto.
    |   Esos campos son del administrador.
    |
    */
    public function actualizarProducto(Request $request, Producto $producto): RedirectResponse
    {
        $proveedor = $this->obtenerProveedor();

        // Seguridad: verifica que el producto pertenece a este proveedor
        // PENSAR — Usamos first() en vez de exists() para obtener los valores actuales
        //   del pivot (precio, stock) y poder comparar con los nuevos en notas_revision.
        $pivot = DB::table('producto_proveedor')
            ->where('producto_id', $producto->id)
            ->where('proveedor_id', $proveedor->id)
            ->first();

        abort_if(!$pivot, 403, 'No tienes acceso a este producto.');

        $datos = $request->validate([
            'nombre'                 => ['required', 'string', 'max:200'],
            'descripcion'            => ['nullable', 'string', 'max:2000'],
            'precio'                 => ['required', 'numeric', 'min:0'],
            'stock'                  => ['required', 'integer', 'min:0'],
            'permite_contraentrega'  => ['nullable', 'boolean'],
            'imagen_0'               => ['nullable', 'image', 'max:10240', 'mimes:jpeg,jpg,png,webp'],
            'imagen_1'               => ['nullable', 'image', 'max:10240', 'mimes:jpeg,jpg,png,webp'],
            'imagen_2'               => ['nullable', 'image', 'max:10240', 'mimes:jpeg,jpg,png,webp'],
            'eliminar_imagenes'      => ['nullable', 'array'],
            'eliminar_imagenes.*'    => ['integer'],
        ], [
            'nombre.required' => 'El nombre del producto es obligatorio.',
            'imagen_0.max'    => 'La imagen principal no puede pesar más de 10MB.',
            'imagen_1.max'    => 'La foto 2 no puede pesar más de 10MB.',
            'imagen_2.max'    => 'La foto 3 no puede pesar más de 10MB.',
            'imagen_0.image'  => 'El archivo debe ser una imagen (JPG, PNG o WEBP).',
            'imagen_1.image'  => 'El archivo debe ser una imagen (JPG, PNG o WEBP).',
            'imagen_2.image'  => 'El archivo debe ser una imagen (JPG, PNG o WEBP).',
        ]);

        // ─── Construir resumen de cambios (notas_revision) ───────────────────
        // PENSAR — ¿Para qué sirve?
        //   El admin verá este texto en el panel antes de aprobar el producto.
        //   Le dice exactamente qué cambió, sin tener que comparar manualmente.
        //   Se limpia cuando el admin guarda el producto (ProductoController@update).
        // ─── Construir resumen COMPLETO de cambios ────────────────────────────
        // Comparamos cada campo editable contra su valor actual en BD.
        // El resultado se guarda en notas_revision para que el admin vea
        // exactamente qué cambió antes de re-activar el producto.
        $cambios = [];
        $fmt     = fn($v) => '$' . number_format((int) round((float) $v), 0, ',', '.');

        // 1. Nombre
        $nombreNuevo = \Illuminate\Support\Str::title(trim($datos['nombre']));
        if (mb_strtolower($nombreNuevo) !== mb_strtolower((string) $producto->nombre)) {
            $cambios[] = "Nombre: \"{$producto->nombre}\" → \"{$nombreNuevo}\"";
        }

        // 2. Precio de costo (comparar como entero — pesos sin centavos)
        $precioNuevo = (int) round((float) $datos['precio']);
        $precioViejo = (int) round((float) $pivot->precio); // del pivot, no del producto
        if ($precioNuevo !== $precioViejo) {
            $cambios[] = "Precio de costo: {$fmt($precioViejo)} → {$fmt($precioNuevo)}";
        }

        // 3. Stock (del pivot — es el stock que gestiona el proveedor)
        $stockNuevo = (int) $datos['stock'];
        $stockViejo = (int) $pivot->stock;
        if ($stockNuevo !== $stockViejo) {
            $cambios[] = "Stock: {$stockViejo} → {$stockNuevo} unidades";
        }

        // 4. Descripción (normalizar null/"" para evitar falso positivo)
        $descripcionNueva = trim((string) ($datos['descripcion'] ?? ''));
        $descripcionVieja = trim((string) ($producto->descripcion ?? ''));
        if ($descripcionNueva !== $descripcionVieja) {
            $cambios[] = 'Descripción: actualizada.';
        }

        // 5. Permite contraentrega
        $contraentregaNueva = $request->boolean('permite_contraentrega', false);
        $contraentregaVieja = (bool) $producto->permite_contraentrega;
        if ($contraentregaNueva !== $contraentregaVieja) {
            $cambios[] = 'Contraentrega: ' . ($contraentregaVieja ? 'Sí' : 'No') . ' → ' . ($contraentregaNueva ? 'Sí' : 'No');
        }

        // 6. Imágenes eliminadas
        if (!empty($datos['eliminar_imagenes'])) {
            $cambios[] = 'Eliminó ' . count($datos['eliminar_imagenes']) . ' imagen(es).';
        }

        // 7. Imágenes nuevas
        $imagenesAgregadas = 0;
        foreach (['imagen_0', 'imagen_1', 'imagen_2'] as $campo) {
            if ($request->hasFile($campo)) $imagenesAgregadas++;
        }
        if ($imagenesAgregadas > 0) {
            $cambios[] = "Agregó {$imagenesAgregadas} imagen(es) nueva(s).";
        }

        $notasRevision = empty($cambios)
            ? 'El proveedor guardó el producto sin cambios detectados.'
            : implode("\n", array_map(fn($c) => "• {$c}", $cambios));

        // Actualizar campos en la tabla productos
        // PENSAR — ¿Por qué volvemos a 'inactivo'?
        //   El proveedor cambió algo (nombre, precio, fotos).
        //   El admin debe revisar y re-aprobar antes de que vuelva a la tienda.
        //   Esto evita que lleguen productos modificados sin control de calidad.
        $producto->update([
            'nombre'                => $nombreNuevo,
            'descripcion'           => $descripcionNueva ?? $producto->descripcion,
            'permite_contraentrega' => $request->boolean('permite_contraentrega', false),
            'precio_costo'          => $datos['precio'], // Actualizar precio_costo para que admin vea el nuevo precio
            'estado'                => 'inactivo',       // Baja automática — requiere re-aprobación del admin
            'notas_revision'        => $notasRevision,   // Resumen para el admin
        ]);

        // Eliminar imágenes marcadas por el proveedor
        if (!empty($datos['eliminar_imagenes'])) {
            foreach ($datos['eliminar_imagenes'] as $mediaId) {
                $media = $producto->getMedia('imagenes')->firstWhere('id', $mediaId);
                if ($media) $media->delete();
            }
        }

        // Subir imágenes nuevas (slots individuales, respetando límite de 3)
        $totalExistentes = $producto->fresh()->getMedia('imagenes')->count();
        foreach (['imagen_0', 'imagen_1', 'imagen_2'] as $campo) {
            if ($request->hasFile($campo) && $totalExistentes < 3) {
                $producto->addMedia($request->file($campo))->toMediaCollection('imagenes');
                $totalExistentes++;
            }
        }

        // Actualizar precio y stock en la pivot producto_proveedor
        DB::table('producto_proveedor')
            ->where('id', $pivot->id)
            ->update([
                'precio'           => $datos['precio'],
                'stock'            => $datos['stock'],
                'actualizado_en'   => now(),
            ]);

        return redirect()->route('portal.productos')
            ->with('exito', 'Producto actualizado. Quedó pendiente de activación — el administrador lo revisará y lo volverá a activar en la tienda.');
    }

    /*
    |----------------------------------------------------------------------
    | eliminarProducto() — El proveedor retira su producto del catálogo
    |----------------------------------------------------------------------
    |
    | ENTENDER — ¿Qué pasa cuando el proveedor "elimina" un producto?
    |
    |   1. El producto pasa a 'inactivo' → deja de aparecer en la tienda
    |   2. Se desvincula de este proveedor (se borra el registro en producto_proveedor)
    |   3. El producto NO se borra de la BD — los pedidos históricos quedan intactos
    |   4. El admin puede reasignarlo o eliminarlo definitivamente si lo decide
    |
    | PENSAR — ¿Por qué no borramos el producto?
    |
    |   Puede tener pedidos confirmados o entregados en el historial.
    |   Borrar el producto rompería esos registros.
    |   Lo seguro es desvincularlo y dejarlo inactivo.
    |
    */
    public function eliminarProducto(Producto $producto): RedirectResponse
    {
        $proveedor = $this->obtenerProveedor();

        // Seguridad: verifica que el producto pertenece a este proveedor
        $tienePivot = DB::table('producto_proveedor')
            ->where('producto_id', $producto->id)
            ->where('proveedor_id', $proveedor->id)
            ->exists();

        abort_if(!$tienePivot, 403, 'No tienes acceso a este producto.');

        DB::transaction(function () use ($producto, $proveedor) {
            // 1. Bajar el producto de la tienda
            $producto->update(['estado' => 'inactivo']);

            // 2. Desvincular al proveedor del producto
            DB::table('producto_proveedor')
                ->where('producto_id', $producto->id)
                ->where('proveedor_id', $proveedor->id)
                ->delete();
        });

        return redirect()->route('portal.productos')
            ->with('exito', "Producto \"{$producto->nombre}\" retirado. Ya no aparece en la tienda ni en tu lista.");
    }

    /*
    |----------------------------------------------------------------------
    | pedidos() — Pedidos que incluyen productos del proveedor
    |----------------------------------------------------------------------
    |
    | PENSAR — ¿Cómo filtramos los pedidos?
    |
    |   Pedido → tiene items → cada item tiene producto_id
    |   Queremos: pedidos donde al menos un item.producto_id está en
    |   los productos de este proveedor.
    |
    |   Con whereHas podemos hacer esta consulta anidada de forma elegante.
    |
    */
    public function pedidos(Request $request): Response
    {
        $proveedor  = $this->obtenerProveedor();
        $idsProductos = $proveedor->productos()->pluck('productos.id');

        $pedidos = Pedido::whereHas('items', fn($q) => $q->whereIn('producto_id', $idsProductos))
            ->with([
                // Solo los ítems que son de este proveedor
                'items' => fn($q) => $q->whereIn('producto_id', $idsProductos),
            ])
            ->when($request->estado, fn($q) => $q->where('estado', $request->estado))
            ->when($request->buscar, fn($q) =>
                $q->where(function($q2) use ($request) {
                    $q2->where('numero_pedido', 'ilike', "%{$request->buscar}%")
                       ->orWhere('cliente_nombre', 'ilike', "%{$request->buscar}%");
                })
            )
            ->orderByDesc('creado_en')
            ->paginate(15)
            ->withQueryString();

        // Estadísticas rápidas
        $totalItems = ItemPedido::whereIn('producto_id', $idsProductos)->count();
        $entregados = Pedido::where('estado', 'entregado')
            ->whereHas('items', fn($q) => $q->whereIn('producto_id', $idsProductos))
            ->count();

        return Inertia::render('Portal/Pedidos', [
            'proveedor'   => $proveedor,
            'pedidos'     => $pedidos,
            'filtros'     => $request->only(['buscar', 'estado']),
            'estadisticas' => [
                'total_pedidos'   => $pedidos->total(),
                'total_items'     => $totalItems,
                'entregados'      => $entregados,
            ],
        ]);
    }

    /*
    |----------------------------------------------------------------------
    | verPedido() — Detalle de un pedido específico
    |----------------------------------------------------------------------
    |
    | PENSAR — Seguridad:
    |
    |   El proveedor solo puede ver el pedido si tiene al menos un ítem
    |   que corresponde a sus productos. Si no, devolvemos 403.
    |
    |   Además, mostramos SOLO los ítems que son suyos, no los ítems
    |   de otros proveedores en el mismo pedido.
    |
    */
    public function verPedido(Pedido $pedido): Response
    {
        $proveedor    = $this->obtenerProveedor();
        $idsProductos = $proveedor->productos()->pluck('productos.id');

        // Seguridad: el pedido debe tener al menos un ítem del proveedor
        $tieneAcceso = $pedido->items()
            ->whereIn('producto_id', $idsProductos)
            ->exists();

        abort_if(!$tieneAcceso, 403, 'No tienes acceso a este pedido.');

        // Cargar solo los ítems del proveedor
        $pedido->load([
            'items' => fn($q) => $q->whereIn('producto_id', $idsProductos),
        ]);

        return Inertia::render('Portal/VerPedido', [
            'proveedor' => $proveedor,
            'pedido'    => $pedido,
        ]);
    }

    /*
    |----------------------------------------------------------------------
    | crearProducto() — Formulario para crear un producto nuevo
    |----------------------------------------------------------------------
    |
    | ENTENDER — ¿Qué pasa cuando el proveedor crea un producto?
    |
    |   1. El proveedor llena el formulario: nombre, descripción, precio, stock, categoría
    |   2. El producto se guarda con estado = 'inactivo'
    |      → No aparece en la tienda hasta que el admin lo revise y active
    |   3. Se crea el vínculo en 'producto_proveedor' (pivot) con su precio/stock
    |   4. El admin ve el producto en /productos y puede activarlo
    |
    | PENSAR — ¿Por qué inactivo?
    |
    |   El admin controla qué productos están disponibles en la tienda.
    |   Un proveedor no puede poner productos activos por sí solo.
    |   Esto evita productos sin revisar, mal escritos o con precios incorrectos.
    |
    */
    /*
    |----------------------------------------------------------------------
    | verificarNombre() — Busca productos con nombre similar (AJAX)
    |----------------------------------------------------------------------
    |
    | ENTENDER — ¿Para qué sirve?
    |
    |   El frontend llama a este endpoint mientras el proveedor escribe el
    |   nombre del producto. Si ya existe uno parecido, el frontend muestra
    |   una advertencia ANTES de intentar guardar.
    |
    | PENSAR — Usamos ilike (case-insensitive) para detectar variaciones:
    |   "reloj current", "Reloj Current", "RELOJ CURRENT" → mismo resultado.
    |
    */
    public function verificarNombre(Request $request): \Illuminate\Http\JsonResponse
    {
        $nombre = trim($request->nombre ?? '');

        if (mb_strlen($nombre) < 3) {
            return response()->json(['existe' => false, 'productos' => []]);
        }

        $productos = Producto::where('nombre', 'ilike', '%' . $nombre . '%')
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

    public function crearProducto(): Response
    {
        $this->obtenerProveedor(); // Verificar que tiene perfil de proveedor

        // Categorías activas para el selector del formulario
        $categorias = Categoria::activas()
                               ->ordenadas()
                               ->get(['id', 'nombre', 'padre_id']);

        return Inertia::render('Portal/CrearProducto', [
            'categorias' => $categorias,
        ]);
    }

    /*
    |----------------------------------------------------------------------
    | guardarProducto() — Procesar y guardar el producto nuevo
    |----------------------------------------------------------------------
    |
    | PENSAR — ¿Qué escribimos en qué tabla?
    |
    |   tabla 'productos':
    |     - nombre, slug (auto-generado), descripcion_corta, descripcion
    |     - precio_costo, precio_venta (sugerido, el admin lo ajusta)
    |     - stock (inicial), categoria_id
    |     - estado = 'inactivo' (SIEMPRE — el admin activa)
    |     - sku = auto-generado como placeholder
    |
    |   tabla pivot 'producto_proveedor':
    |     - proveedor_id, producto_id
    |     - precio = precio_costo (lo que el negocio le paga al proveedor)
    |     - stock = cantidad disponible
    |
    | PENSAR — slug único:
    |
    |   Str::slug('Camiseta Premium') → 'camiseta-premium'
    |   Si ya existe → 'camiseta-premium-2', etc.
    |   Mismo patrón que ProductoController@generarSlugUnico.
    |
    */
    public function guardarProducto(Request $request): RedirectResponse
    {
        $proveedor = $this->obtenerProveedor();

        $datos = $request->validate([
            'nombre'              => ['required', 'string', 'max:200'],
            'descripcion_corta'   => ['nullable', 'string', 'max:300'],
            'descripcion'         => ['nullable', 'string'],
            'precio_costo'        => ['required', 'numeric', 'min:0'],
            'precio_venta'        => ['nullable', 'numeric', 'min:0'],
            'stock'               => ['required', 'integer', 'min:0'],
            'categoria_id'        => ['nullable', 'string', 'exists:categorias,id'],
            'peso_kg'             => ['nullable', 'numeric', 'min:0'],
            'imagen_0'               => ['nullable', 'image', 'max:10240', 'mimes:jpeg,jpg,png,webp'],
            'imagen_1'               => ['nullable', 'image', 'max:10240', 'mimes:jpeg,jpg,png,webp'],
            'imagen_2'               => ['nullable', 'image', 'max:10240', 'mimes:jpeg,jpg,png,webp'],
            'permite_contraentrega'  => ['nullable', 'boolean'],
        ], [
            'imagen_0.max'   => 'La imagen principal no puede pesar más de 10MB.',
            'imagen_1.max'   => 'La foto 2 no puede pesar más de 10MB.',
            'imagen_2.max'   => 'La foto 3 no puede pesar más de 10MB.',
            'imagen_0.image' => 'El archivo debe ser una imagen (JPG, PNG o WEBP).',
            'imagen_1.image' => 'El archivo debe ser una imagen (JPG, PNG o WEBP).',
            'imagen_2.image' => 'El archivo debe ser una imagen (JPG, PNG o WEBP).',
            'imagen_0.mimes' => 'Solo se aceptan imágenes JPG, PNG o WEBP.',
            'imagen_1.mimes' => 'Solo se aceptan imágenes JPG, PNG o WEBP.',
            'imagen_2.mimes' => 'Solo se aceptan imágenes JPG, PNG o WEBP.',
        ]);

        $datos['permite_contraentrega'] = $request->boolean('permite_contraentrega', false);

        // ─── VALIDACIÓN: ¿Ya existe un producto con ese nombre? ─────────────
        //
        // ENTENDER — ¿Por qué aquí y no en validate()?
        //   Porque necesitamos mostrar el producto existente en el mensaje
        //   para que el proveedor sepa exactamente cuál es el duplicado.
        //
        $nombreNormalizado  = Str::title(trim($datos['nombre']));
        $forzarCreacion     = (bool) $request->input('forzar_creacion', false);

        // ─── VALIDACIÓN: duplicado por nombre (solo si el proveedor no forzó) ──
        if (!$forzarCreacion) {
            $duplicado = Producto::where('nombre', 'ilike', $nombreNormalizado)->first();

            if ($duplicado) {
                return back()
                    ->withErrors([
                        'nombre' => "Ya existe: SKU {$duplicado->sku} — \"{$duplicado->nombre}\" ({$duplicado->estado}). "
                                  . "Edítalo o confirma que deseas crear uno diferente.",
                    ])
                    ->withInput();
            }
        }

        // ─── PASO 1: Crear producto en BD (transacción) ──────────────────────
        // Las imágenes van FUERA de la transacción — son I/O de red (Cloudflare R2).
        // Si falla la subida, el producto queda creado sin imágenes (aceptable),
        // en vez de revertir todo por un error de red.
        $producto = null;

        DB::transaction(function () use ($datos, $proveedor, &$producto, $nombreNormalizado) {
            // Generar slug único a partir del nombre
            $slug     = Str::slug($nombreNormalizado);
            $slugBase = $slug;
            $contador = 2;
            while (Producto::where('slug', $slug)->exists()) {
                $slug = $slugBase . '-' . $contador++;
            }

            // ─── GENERAR SKU AUTOMÁTICO ──────────────────────────────────────
            //
            // ENTENDER — Formato: GS-{AAMM}-{4 chars aleatorios en mayúsculas}
            //   GS   = GadGet Store
            //   AAMM = año y mes (ej: 2608 = agosto 2026)
            //   XXXX = 4 caracteres aleatorios para garantizar unicidad
            //
            // PENSAR — ¿Por qué aleatorio y no secuencial?
            //   Secuencial requiere un lock en BD para no duplicar.
            //   Aleatorio con 4 chars = 36^4 = 1.6 millones de combinaciones.
            //   Con el bucle while garantizamos que no colisione.
            //
            $sku = $this->generarSkuUnico();


            // Crear el producto → nace INACTIVO
            $producto = Producto::create([
                'nombre'            => $nombreNormalizado,
                'slug'              => $slug,
                'descripcion_corta' => $datos['descripcion_corta'] ?? null,
                'descripcion'       => $datos['descripcion'] ?? null,
                'precio_costo'      => $datos['precio_costo'],
                'precio_venta'      => $datos['precio_venta'] ?? $datos['precio_costo'],
                'stock'             => $datos['stock'],
                'stock_minimo'      => 1,
                'categoria_id'      => $datos['categoria_id'],
                'estado'                => 'inactivo', // SIEMPRE — el admin activa
                'permite_contraentrega' => $datos['permite_contraentrega'] ?? false,
                'sku'                   => $sku,
                'peso_kg'               => $datos['peso_kg'] ?? null,
            ]);

            // Vincular al proveedor en la tabla pivot
            DB::table('producto_proveedor')->insert([
                'id'             => (string) Str::uuid(),
                'producto_id'    => $producto->id,
                'proveedor_id'   => $proveedor->id,
                'precio'         => $datos['precio_costo'],
                'stock'          => $datos['stock'],
                'activo'         => true,
                'creado_en'      => now(),
                'actualizado_en' => now(),
            ]);
        });

        // ─── PASO 2: Subir imágenes a Cloudflare R2 via Spatie ───────────────
        //
        // PENSAR — ¿Por qué imagen_0, imagen_1, imagen_2 en vez de array?
        //
        //   Los navegadores móviles NO son confiables con <input multiple>.
        //   Al usar inputs individuales (sin multiple), cada slot funciona
        //   en todos los móviles. El backend recibe 3 campos separados.
        //
        foreach (['imagen_0', 'imagen_1', 'imagen_2'] as $campo) {
            if ($request->hasFile($campo)) {
                $producto->addMedia($request->file($campo))
                         ->toMediaCollection('imagenes');
            }
        }

        return redirect()->route('portal.productos')
            ->with('exito', 'Producto enviado. El administrador lo revisará y activará pronto.');
    }

    /*
    |----------------------------------------------------------------------
    | pagos() — Comisiones y pagos pendientes del proveedor
    |----------------------------------------------------------------------
    |
    | PENSAR — ¿Cómo calculamos lo que le debemos al proveedor?
    |
    |   En dropshipping:
    |   - El PROVEEDOR nos vende a precio_costo
    |   - NOSOTROS vendemos al cliente a precio_unitario
    |   - La diferencia (precio_unitario - precio_costo) es nuestra ganancia
    |
    |   "Deuda con el proveedor" = SUM(precio_costo × cantidad)
    |   en pedidos con estado 'entregado' o 'enviado'
    |
    |   Agrupamos por mes para mostrar el historial.
    |
    */
    /*
    |----------------------------------------------------------------------
    | generarSkuUnico() — Genera un SKU legible y único para cada producto
    |----------------------------------------------------------------------
    |
    | ENTENDER — Formato: GS-{AAMM}-{XXXX}
    |
    |   GS   = GadGet Store
    |   AAMM = año y mes en 4 dígitos (ej: 2608 = agosto 2026)
    |   XXXX = 4 caracteres aleatorios en mayúsculas (letras + números)
    |
    | Ejemplo: GS-2608-K4X2, GS-2608-AB3Y
    |
    | PENSAR — El bucle while garantiza que no se repita.
    |   Con 36^4 = 1.6M combinaciones, la colisión es prácticamente imposible,
    |   pero el bucle es la red de seguridad.
    |
    */
    private function generarSkuUnico(): string
    {
        $prefijo = 'GS-' . now()->format('ym') . '-';

        do {
            // 4 caracteres aleatorios: letras mayúsculas A-Z y números 0-9
            $aleatorio = strtoupper(Str::random(4));
            $sku = $prefijo . $aleatorio;
        } while (Producto::where('sku', $sku)->exists());

        return $sku;
    }

    public function pagos(): Response
    {
        $proveedor    = $this->obtenerProveedor();
        $idsProductos = $proveedor->productos()->pluck('productos.id');

        // Total pendiente de pago (pedidos entregados sin transacción de pago al proveedor)
        $totalDeuda = ItemPedido::whereIn('producto_id', $idsProductos)
            ->whereHas('pedido', fn($q) => $q->where('estado', 'entregado'))
            ->selectRaw('COALESCE(SUM(precio_costo * cantidad), 0) as total')
            ->value('total') ?? 0;

        // Ventas totales (precio al que el cliente compró sus productos)
        $totalVentas = ItemPedido::whereIn('producto_id', $idsProductos)
            ->whereHas('pedido', fn($q) => $q->where('estado', 'entregado'))
            ->selectRaw('COALESCE(SUM(precio_unitario * cantidad), 0) as total')
            ->value('total') ?? 0;

        // Historial mensual (últimos 6 meses)
        $historialMensual = ItemPedido::whereIn('producto_id', $idsProductos)
            ->whereHas('pedido', fn($q) => $q
                ->where('estado', 'entregado')
                ->where('creado_en', '>=', now()->subMonths(6))
            )
            ->join('pedidos', 'pedidos.id', '=', 'items_pedido.pedido_id')
            ->selectRaw("
                TO_CHAR(pedidos.creado_en, 'YYYY-MM') as mes,
                TO_CHAR(pedidos.creado_en, 'Mon YYYY') as mes_label,
                COALESCE(SUM(items_pedido.precio_costo * items_pedido.cantidad), 0) as deuda,
                COUNT(DISTINCT items_pedido.pedido_id) as pedidos
            ")
            ->groupByRaw("TO_CHAR(pedidos.creado_en, 'YYYY-MM'), TO_CHAR(pedidos.creado_en, 'Mon YYYY')")
            ->orderByRaw("TO_CHAR(pedidos.creado_en, 'YYYY-MM') DESC")
            ->get();

        // Top 5 productos más vendidos del proveedor
        $topProductos = ItemPedido::whereIn('producto_id', $idsProductos)
            ->whereHas('pedido', fn($q) => $q->where('estado', 'entregado'))
            ->selectRaw('nombre_producto, SUM(cantidad) as unidades, SUM(precio_costo * cantidad) as total_costo')
            ->groupBy('nombre_producto')
            ->orderByDesc('unidades')
            ->limit(5)
            ->get();

        return Inertia::render('Portal/Pagos', [
            'proveedor'       => $proveedor,
            'totalDeuda'      => (float) $totalDeuda,
            'totalVentas'     => (float) $totalVentas,
            'historialMensual' => $historialMensual,
            'topProductos'    => $topProductos,
        ]);
    }
}
