<?php

/*
|--------------------------------------------------------------------------
| CONTROLADOR: PagoProveedorController
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué hace este controller?
|
|   index()  → Muestra todos los proveedores con su deuda acumulada y
|              el total ya pagado. El admin ve quién tiene saldo pendiente.
|
|   store()  → Registra un pago al proveedor. El admin elige cuánto pagar,
|              cómo y con qué concepto. El proveedor lo ve inmediatamente
|              en su portal.
|
| PENSAR — ¿Cómo calculamos la deuda?
|
|   deuda_total   = SUM(precio_costo × cantidad) de items_pedido
|                   cuyos pedidos están en (confirmado, entregado)
|                   y cuyos productos pertenecen al proveedor
|
|   total_pagado  = SUM(pagos_proveedor.monto) donde proveedor_id = ?
|
|   saldo         = deuda_total − total_pagado
|
*/

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\ItemPedido;
use App\Models\PagoProveedor;
use App\Models\Pedido;
use App\Models\Proveedor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PagoProveedorController extends Controller
{
    /*
    |----------------------------------------------------------------------
    | index() — Vista de deuda por proveedor (para admin/super_admin)
    |----------------------------------------------------------------------
    */
    public function index(): Response
    {
        // Estados que generan deuda al proveedor
        $estadosVenta = [Pedido::ESTADO_CONFIRMADO, Pedido::ESTADO_ENTREGADO];

        // Cargamos todos los proveedores activos con su deuda y pagos
        $proveedores = Proveedor::activos()
            ->with(['pagosRecibidos' => fn($q) => $q->orderByDesc('fecha_pago')])
            ->get()
            ->map(function ($proveedor) use ($estadosVenta) {

                // IDs de los productos de este proveedor
                $idsProductos = $proveedor->productos()->pluck('productos.id');

                // Deuda acumulada = costo total de ventas confirmadas/entregadas
                $deudaTotal = ItemPedido::whereIn('producto_id', $idsProductos)
                    ->whereHas('pedido', fn($q) => $q->whereIn('estado', $estadosVenta))
                    ->selectRaw('COALESCE(SUM(precio_costo * cantidad), 0) as total')
                    ->value('total') ?? 0;

                // Total ya pagado por el admin
                $totalPagado = $proveedor->pagosRecibidos->sum('monto');

                // Ventas del mes actual (para referencia)
                $ventasMes = ItemPedido::whereIn('producto_id', $idsProductos)
                    ->whereHas('pedido', fn($q) => $q
                        ->whereIn('estado', $estadosVenta)
                        ->whereYear('creado_en', now()->year)
                        ->whereMonth('creado_en', now()->month)
                    )
                    ->selectRaw('COALESCE(SUM(precio_costo * cantidad), 0) as total')
                    ->value('total') ?? 0;

                // Pedidos del mes del proveedor (para el detalle)
                $pedidosMes = Pedido::whereIn('estado', $estadosVenta)
                    ->whereYear('creado_en', now()->year)
                    ->whereMonth('creado_en', now()->month)
                    ->whereHas('items', fn($q) => $q->whereIn('producto_id', $idsProductos))
                    ->with(['items' => fn($q) => $q->whereIn('producto_id', $idsProductos)])
                    ->orderByDesc('creado_en')
                    ->get()
                    ->map(fn($p) => [
                        'id'             => $p->id,
                        'numero_pedido'  => $p->numero_pedido,
                        'fecha'          => $p->creado_en?->format('d/m/Y'),
                        'estado'         => $p->estado,
                        'costo_proveedor'=> $p->items->sum(fn($i) => $i->precio_costo * $i->cantidad),
                        'items'          => $p->items->map(fn($i) => [
                            'nombre'      => $i->nombre_producto,
                            'cantidad'    => $i->cantidad,
                            'precio_costo'=> (float) $i->precio_costo,
                            'subtotal'    => (float) ($i->precio_costo * $i->cantidad),
                        ]),
                    ]);

                return [
                    'id'            => $proveedor->id,
                    'nombre_empresa'=> $proveedor->nombre_empresa,
                    'persona_contacto'=> $proveedor->persona_contacto,
                    'telefono'      => $proveedor->telefono,
                    'email'         => $proveedor->email,
                    'deuda_total'   => (float) $deudaTotal,
                    'total_pagado'  => (float) $totalPagado,
                    'saldo_pendiente'=> (float) ($deudaTotal - $totalPagado),
                    'ventas_mes'    => (float) $ventasMes,
                    'pedidos_mes'   => $pedidosMes,
                    'ultimos_pagos' => $proveedor->pagosRecibidos->take(5)->map(fn($p) => [
                        'id'         => $p->id,
                        'monto'      => (float) $p->monto,
                        'fecha_pago' => $p->fecha_pago?->format('d/m/Y'),
                        'metodo_pago'=> $p->metodo_pago,
                        'concepto'   => $p->concepto,
                    ]),
                ];
            });

        return Inertia::render('Finanzas/Proveedores/Index', [
            'proveedores'  => $proveedores,
            'metodos_pago' => PagoProveedor::METODOS,
        ]);
    }

    /*
    |----------------------------------------------------------------------
    | store() — Registra un pago al proveedor
    |----------------------------------------------------------------------
    |
    | PENSAR — ¿Qué pasa al guardar?
    |
    |   1. Se valida que el proveedor exista y esté activo
    |   2. Se crea el registro de PagoProveedor
    |   3. El proveedor inmediatamente ve el pago en su portal
    |   4. El saldo pendiente se reduce automáticamente (es calculado)
    |
    */
    public function store(Request $request)
    {
        $datos = $request->validate([
            'proveedor_id' => 'required|uuid|exists:proveedores,id',
            'monto'        => 'required|numeric|min:1',
            'fecha_pago'   => 'required|date',
            'metodo_pago'  => 'required|in:' . implode(',', array_keys(PagoProveedor::METODOS)),
            'concepto'     => 'nullable|string|max:300',
            'notas'        => 'nullable|string',
        ]);

        PagoProveedor::create([
            ...$datos,
            'registrado_por' => auth()->id(),
        ]);

        return redirect()
            ->route('reportes.financiero')
            ->with('exito', 'Pago registrado. El proveedor ya puede verlo en su portal.');
    }
}
