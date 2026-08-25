<?php

/*
|--------------------------------------------------------------------------
| CONTROLADOR: PedidoController
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué métodos tiene este controller?
|
|   GET    /pedidos              → index()        — lista con filtros
|   GET    /pedidos/crear        → create()       — formulario nuevo pedido
|   POST   /pedidos              → store()        — guardar pedido
|   GET    /pedidos/{id}         → show()         — detalle del pedido
|   GET    /pedidos/{id}/editar  → edit()         — formulario editar
|   PUT    /pedidos/{id}         → update()       — guardar cambios
|   DELETE /pedidos/{id}         → destroy()      — soft delete
|   PATCH  /pedidos/{id}/estado  → cambiarEstado() — cambiar estado del pedido
|
| PENSAR — ¿Qué hace cambiarEstado()?
|
|   Es un método EXTRA (fuera del resource estándar).
|   Permite cambiar el estado con un solo clic desde la lista:
|   pendiente → confirmado → en_preparacion → enviado → entregado
|
|   También actualiza automáticamente 'cancelado_en' si se cancela.
|
*/

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Campana;
use App\Models\Cupon;
use App\Models\ItemPedido;
use App\Models\Pedido;
use App\Models\Producto;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PedidoController extends Controller
{
    /*
    |----------------------------------------------------------------------
    | index() — Lista de pedidos con filtros y paginación
    |----------------------------------------------------------------------
    */
    public function index(Request $request): Response
    {
        $query = Pedido::with(['items', 'envio', 'usuario'])
                       ->orderBy('creado_en', 'desc');

        // ─── FILTROS ──────────────────────────────────────────────────────

        // Buscar por número de pedido o nombre del cliente
        if ($request->filled('buscar')) {
            $termino = $request->buscar;
            $query->where(function ($q) use ($termino) {
                $q->where('numero_pedido', 'ilike', '%' . $termino . '%')
                  ->orWhere('cliente_nombre', 'ilike', '%' . $termino . '%')
                  ->orWhere('cliente_email', 'ilike', '%' . $termino . '%');
            });
        }

        // Filtro por estado
        if ($request->filled('estado')) {
            $query->where('estado', $request->estado);
        }

        // Filtro por fecha (pedidos del día, semana, mes)
        if ($request->filled('periodo')) {
            match ($request->periodo) {
                'hoy'    => $query->whereDate('creado_en', today()),
                'semana' => $query->whereBetween('creado_en', [now()->startOfWeek(), now()->endOfWeek()]),
                'mes'    => $query->whereMonth('creado_en', now()->month)->whereYear('creado_en', now()->year),
                default  => null,
            };
        }

        $pedidos = $query->paginate(20)->withQueryString();

        // Estadísticas rápidas para el encabezado
        $estadisticas = [
            'total_hoy'      => Pedido::whereDate('creado_en', today())->count(),
            'pendientes'     => Pedido::where('estado', Pedido::ESTADO_PENDIENTE)->count(),
            'enviados'       => Pedido::where('estado', Pedido::ESTADO_ENVIADO)->count(),
            'total_mes'      => Pedido::delMes()->sum('total'),
        ];

        return Inertia::render('Pedidos/Index', [
            'pedidos'       => $pedidos,
            'estadisticas'  => $estadisticas,
            'estados'       => Pedido::todosLosEstados(),
            'filtros'       => $request->only(['buscar', 'estado', 'periodo']),
            'flash'         => [
                'exito' => session('exito'),
                'error' => session('error'),
            ],
        ]);
    }

    /*
    |----------------------------------------------------------------------
    | create() — Formulario para registrar un nuevo pedido
    |----------------------------------------------------------------------
    */
    public function create(): Response
    {
        // Productos activos para el selector de ítems
        $productos = Producto::activos()
                             ->orderBy('nombre')
                             ->get(['id', 'nombre', 'sku', 'precio_venta', 'precio_oferta', 'precio_costo', 'stock', 'imagenes']);

        // Campañas activas para asociar el origen del cliente (opcional)
        $campanas = Campana::activas()
                           ->orderByDesc('fecha_inicio')
                           ->get(['id', 'nombre', 'canal', 'codigo_utm']);

        return Inertia::render('Pedidos/Crear', [
            'productos' => $productos,
            'campanas'  => $campanas,
            'estados'   => Pedido::todosLosEstados(),
        ]);
    }

    /*
    |----------------------------------------------------------------------
    | store() — Guarda un nuevo pedido
    |----------------------------------------------------------------------
    |
    | PENSAR — Flujo completo con marketing (FASE 7):
    |
    |   1. Validar todos los campos (incluyendo cupon_codigo y campana_id)
    |   2. Calcular subtotal de ítems
    |   3. Si viene cupon_codigo:
    |      a. Buscar el cupón en BD
    |      b. Llamar esValido($subtotal) — si no es válido, lanzar error
    |      c. Calcular descuento_aplicado = calcularDescuento($subtotal)
    |   4. Calcular total = subtotal + envío - descuento_manual - descuento_cupón
    |   5. DENTRO de transacción:
    |      a. Crear Pedido con snapshot del cupón + campana_id
    |      b. Crear ItemPedido por cada ítem
    |      c. Si había cupón → incrementarUso() (dentro de TX para que revierta si falla)
    |
    | PENSAR — ¿Por qué validar el cupón FUERA de la transacción?
    |
    |   Si el cupón es inválido, lanzamos un ValidationException que
    |   vuelve al formulario con el error. Hacerlo dentro de la TX
    |   funcionaría igual, pero es más limpio separar la validación
    |   del negocio de la persistencia.
    |
    */
    public function store(Request $request)
    {
        $datos = $request->validate([
            // Datos del cliente
            'cliente_nombre'    => 'required|string|max:150',
            'cliente_email'     => 'required|email|max:150',
            'cliente_telefono'  => 'nullable|string|max:20',
            'cliente_documento' => 'nullable|string|max:20',
            // Dirección
            'direccion_entrega' => 'required|string|max:250',
            'ciudad'            => 'required|string|max:100',
            'departamento'      => 'required|string|max:100',
            'codigo_postal'     => 'nullable|string|max:10',
            'barrio'            => 'nullable|string|max:100',
            // Pedido
            'estado'            => ['required', Rule::in(Pedido::todosLosEstados())],
            'costo_envio'       => 'nullable|numeric|min:0',
            'descuento'         => 'nullable|numeric|min:0',
            'notas'             => 'nullable|string',
            'notas_internas'    => 'nullable|string',
            // FASE 7 — Marketing
            'cupon_codigo'      => 'nullable|string|max:50',
            'campana_id'        => 'nullable|uuid|exists:campanas,id',
            // Ítems del pedido (array de productos)
            'items'             => 'required|array|min:1',
            'items.*.producto_id'     => 'required|uuid|exists:productos,id',
            'items.*.cantidad'        => 'required|integer|min:1',
            'items.*.precio_unitario' => 'required|numeric|min:0',
            'items.*.descuento'       => 'nullable|numeric|min:0',
        ]);

        // ── PASO 1: CALCULAR SUBTOTAL ──────────────────────────────────────
        // Lo calculamos ANTES de abrir la transacción porque lo necesitamos
        // para validar el cupón (el cupón puede tener un mínimo de compra).
        $subtotal = collect($datos['items'])->sum(function ($item) {
            return ($item['precio_unitario'] * $item['cantidad']) - ($item['descuento'] ?? 0);
        });

        // ── PASO 2: VALIDAR CUPÓN (si se envió uno) ───────────────────────
        $cupon             = null;
        $descuentoAplicado = 0;

        if (!empty($datos['cupon_codigo'])) {
            $cupon = Cupon::where('codigo', strtoupper($datos['cupon_codigo']))->first();

            // ¿Existe el cupón?
            if (!$cupon) {
                throw ValidationException::withMessages([
                    'cupon_codigo' => 'Código de cupón no encontrado.',
                ]);
            }

            // ¿Es válido para este monto?
            // esValido() verifica: activo, fechas, límite de usos, mínimo de compra
            $resultado = $cupon->esValido($subtotal);

            if (!$resultado['valido']) {
                throw ValidationException::withMessages([
                    'cupon_codigo' => $resultado['mensaje'],
                ]);
            }

            // Calcular cuánto descuenta sobre el subtotal
            $descuentoAplicado = $cupon->calcularDescuento($subtotal);
        }

        // ── PASO 3: CALCULAR TOTAL FINAL ──────────────────────────────────
        $costoEnvio      = (float) ($datos['costo_envio'] ?? 0);
        $descuentoManual = (float) ($datos['descuento'] ?? 0);

        // total = subtotal + envío - descuento manual - descuento cupón
        $total = $subtotal + $costoEnvio - $descuentoManual - $descuentoAplicado;

        // Evitar totales negativos (por si el cupón descuenta más de lo que queda)
        $total = max(0, $total);

        // ── PASO 4: TRANSACCIÓN — crear pedido + ítems + uso de cupón ─────
        DB::transaction(function () use ($datos, $subtotal, $costoEnvio, $descuentoManual, $descuentoAplicado, $total, $cupon) {

            // Crear el pedido con todos los campos de marketing
            $pedido = Pedido::create([
                'cliente_nombre'     => $datos['cliente_nombre'],
                'cliente_email'      => $datos['cliente_email'],
                'cliente_telefono'   => $datos['cliente_telefono'] ?? null,
                'cliente_documento'  => $datos['cliente_documento'] ?? null,
                'direccion_entrega'  => $datos['direccion_entrega'],
                'ciudad'             => $datos['ciudad'],
                'departamento'       => $datos['departamento'],
                'codigo_postal'      => $datos['codigo_postal'] ?? null,
                'barrio'             => $datos['barrio'] ?? null,
                'estado'             => $datos['estado'],
                'subtotal'           => $subtotal,
                'costo_envio'        => $costoEnvio,
                'descuento'          => $descuentoManual,
                'total'              => $total,
                'notas'              => $datos['notas'] ?? null,
                'notas_internas'     => $datos['notas_internas'] ?? null,
                'usuario_id'         => auth()->id(),
                // ── FASE 7: Marketing ──────────────────────────────────
                // Snapshot del cupón: guardamos id + código por separado
                // para que si el cupón se borra en el futuro, el pedido
                // siga recordando qué código se usó.
                'cupon_id'           => $cupon?->id,
                'cupon_codigo'       => $cupon ? strtoupper($cupon->codigo) : null,
                'descuento_aplicado' => $descuentoAplicado,
                // Campaña que originó este pedido (null si no viene de campaña)
                'campana_id'         => $datos['campana_id'] ?? null,
            ]);

            // Crear los ítems (snapshot de cada producto)
            foreach ($datos['items'] as $itemDatos) {
                $producto = Producto::find($itemDatos['producto_id']);

                ItemPedido::create([
                    'pedido_id'       => $pedido->id,
                    'producto_id'     => $producto->id,
                    'nombre_producto' => $producto->nombre,
                    'sku'             => $producto->sku,
                    'imagen_url'      => $producto->imagenPrincipal(),
                    'cantidad'        => $itemDatos['cantidad'],
                    'precio_unitario' => $itemDatos['precio_unitario'],
                    'precio_costo'    => $producto->precio_costo,
                    'descuento'       => $itemDatos['descuento'] ?? 0,
                ]);
            }

            // Registrar el uso del cupón (DENTRO de la TX para que revierta
            // automáticamente si algo falla al crear el pedido o los ítems)
            if ($cupon) {
                $cupon->incrementarUso();
            }
        });

        return redirect()
            ->route('pedidos.index')
            ->with('exito', 'Pedido registrado exitosamente.');
    }

    /*
    |----------------------------------------------------------------------
    | show() — Detalle completo de un pedido
    |----------------------------------------------------------------------
    */
    public function show(Pedido $pedido): Response
    {
        // Cargamos todas las relaciones que necesita la vista de detalle
        $pedido->load(['items.producto', 'envio', 'usuario']);

        return Inertia::render('Pedidos/Ver', [
            'pedido'  => $pedido,
            'estados' => Pedido::todosLosEstados(),
            'flash'   => [
                'exito' => session('exito'),
                'error' => session('error'),
            ],
        ]);
    }

    /*
    |----------------------------------------------------------------------
    | edit() — Formulario de edición del pedido
    |----------------------------------------------------------------------
    */
    public function edit(Pedido $pedido): Response
    {
        $pedido->load(['items', 'envio']);

        $productos = Producto::activos()
                             ->orderBy('nombre')
                             ->get(['id', 'nombre', 'sku', 'precio_venta', 'precio_oferta', 'precio_costo', 'stock', 'imagenes']);

        return Inertia::render('Pedidos/Editar', [
            'pedido'    => $pedido,
            'productos' => $productos,
            'estados'   => Pedido::todosLosEstados(),
        ]);
    }

    /*
    |----------------------------------------------------------------------
    | update() — Actualiza datos del pedido
    |----------------------------------------------------------------------
    |
    | Solo permite editar datos del cliente, dirección y notas.
    | Los ítems NO se editan aquí (son snapshot histórico).
    | El estado se cambia con cambiarEstado().
    |
    */
    public function update(Request $request, Pedido $pedido)
    {
        $datos = $request->validate([
            'cliente_nombre'    => 'required|string|max:150',
            'cliente_email'     => 'required|email|max:150',
            'cliente_telefono'  => 'nullable|string|max:20',
            'cliente_documento' => 'nullable|string|max:20',
            'direccion_entrega' => 'required|string|max:250',
            'ciudad'            => 'required|string|max:100',
            'departamento'      => 'required|string|max:100',
            'codigo_postal'     => 'nullable|string|max:10',
            'barrio'            => 'nullable|string|max:100',
            'costo_envio'       => 'nullable|numeric|min:0',
            'descuento'         => 'nullable|numeric|min:0',
            'notas'             => 'nullable|string',
            'notas_internas'    => 'nullable|string',
        ]);

        // Recalculamos el total si cambian envío o descuento
        $datos['total'] = $pedido->subtotal
                        + ($datos['costo_envio'] ?? $pedido->costo_envio)
                        - ($datos['descuento']   ?? $pedido->descuento);

        $pedido->update($datos);

        return redirect()
            ->route('pedidos.show', $pedido->id)
            ->with('exito', 'Pedido actualizado correctamente.');
    }

    /*
    |----------------------------------------------------------------------
    | destroy() — Elimina un pedido (soft delete)
    |----------------------------------------------------------------------
    */
    public function destroy(Pedido $pedido)
    {
        $pedido->delete();

        return redirect()
            ->route('pedidos.index')
            ->with('exito', 'Pedido eliminado correctamente.');
    }

    /*
    |----------------------------------------------------------------------
    | cambiarEstado() — Cambia el estado del pedido (ruta PATCH extra)
    |----------------------------------------------------------------------
    |
    | PENSAR — ¿Por qué una ruta separada?
    |
    |   Cambiar estado es una acción simple y frecuente.
    |   Con una ruta PATCH dedicada, desde React hacemos:
    |     router.patch(route('pedidos.estado', pedido.id), { estado: 'confirmado' })
    |   Sin tener que enviar todos los datos del pedido.
    |
    */
    public function cambiarEstado(Request $request, Pedido $pedido)
    {
        $request->validate([
            'estado' => ['required', Rule::in(Pedido::todosLosEstados())],
        ]);

        $estadoAnterior = $pedido->estado;
        $nuevoEstado    = $request->estado;

        // Si se cancela, registramos la fecha de cancelación
        $cancelado_en = $nuevoEstado === Pedido::ESTADO_CANCELADO ? now() : null;

        $pedido->update([
            'estado'       => $nuevoEstado,
            'cancelado_en' => $cancelado_en,
        ]);

        // ── RESTAURAR STOCK al cancelar ────────────────────────────────────
        // El stock se descuenta cuando el cliente hace el pedido.
        // Si el admin cancela, se devuelven las unidades al inventario.
        if ($nuevoEstado === Pedido::ESTADO_CANCELADO
            && $estadoAnterior !== Pedido::ESTADO_CANCELADO) {

            $pedido->load('items');
            foreach ($pedido->items as $item) {
                if ($item->producto_id) {
                    Producto::where('id', $item->producto_id)
                        ->whereNotNull('stock')
                        ->increment('stock', $item->cantidad);
                }
            }
        }

        return back()->with('exito', 'Estado actualizado a: ' . $nuevoEstado);
    }
}
