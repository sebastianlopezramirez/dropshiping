<?php

/*
|--------------------------------------------------------------------------
| CONTROLADOR: ReporteFinancieroController
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué calcula este controller?
|
|   INGRESOS  = Suma de pedido.total (confirmados + entregados del período)
|               → Directo desde pedidos, sin depender de tabla transacciones
|
|   COSTO     = Suma de (precio_costo × cantidad) de items_pedido
|               → Lo que nos costó comprar los productos vendidos
|
|   GASTOS    = Suma de gastos_operativos del período
|               → Domicilios, empaques, publicidad, etc.
|
|   UTILIDAD  = INGRESOS - COSTO - GASTOS
|   MARGEN %  = (UTILIDAD / INGRESOS) × 100
|
|   TABLA VENTAS = Por cada pedido confirmado/entregado:
|     - Fecha
|     - Número de pedido (con detalle completo al hacer clic)
|     - Costo total (precio_costo items + gastos vinculados al pedido)
|     - Precio de venta (pedido.total)
|     - Utilidad (venta - costo_total)
|     - Proveedor (del primer ítem del pedido)
|
*/

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\GastoOperativo;
use App\Models\ItemPedido;
use App\Models\Pedido;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ReporteFinancieroController extends Controller
{
    public function dashboard(Request $request): Response
    {
        // ── PERÍODO SELECCIONADO ──────────────────────────────────────────
        $año = (int) ($request->año ?? now()->year);
        $mes = (int) ($request->mes ?? now()->month);
        $dia = $request->filled('dia') ? (int) $request->dia : null;

        // ── ESTADOS QUE CUENTAN COMO VENTA ───────────────────────────────
        $estadosVenta = [Pedido::ESTADO_CONFIRMADO, Pedido::ESTADO_ENTREGADO];

        // ── HELPER: aplica filtro de tiempo a un query ────────────────────
        // Si hay día: filtra solo ese día. Si no: todo el mes.
        $filtrarPeriodo = function ($query, string $campo) use ($año, $mes, $dia) {
            $query->whereYear($campo, $año)->whereMonth($campo, $mes);
            if ($dia) $query->whereDay($campo, $dia);
        };

        // ── 1. INGRESOS ───────────────────────────────────────────────────
        // PENSAR: Usamos pedido.total directamente (no transacciones).
        // Así funciona aunque no exista la fila en transacciones.
        // Un pedido confirmado = plata recibida.
        $ingresos = Pedido::whereIn('estado', $estadosVenta)
            ->when(true, fn($q) => $filtrarPeriodo($q, 'creado_en'))
            ->sum('total');

        // ── 2. COSTO DE PRODUCTOS ─────────────────────────────────────────
        $costoProductos = ItemPedido::whereHas('pedido', function ($q) use ($año, $mes, $dia, $estadosVenta) {
            $q->whereIn('estado', $estadosVenta)
              ->whereYear('creado_en', $año)
              ->whereMonth('creado_en', $mes);
            if ($dia) $q->whereDay('creado_en', $dia);
        })->sum(DB::raw('precio_costo * cantidad'));

        // ── 3. GASTOS OPERATIVOS ──────────────────────────────────────────
        $gastosOp = GastoOperativo::whereYear('fecha_gasto', $año)
            ->whereMonth('fecha_gasto', $mes)
            ->when($dia, fn($q) => $q->whereDay('fecha_gasto', $dia))
            ->sum('monto');

        // ── 4. CÁLCULOS FINALES ───────────────────────────────────────────
        $utilidad  = (float) $ingresos - (float) $costoProductos - (float) $gastosOp;
        $margen    = (float) $ingresos > 0
            ? round(($utilidad / (float) $ingresos) * 100, 1)
            : 0;

        // ── 5. TABLA DE VENTAS ────────────────────────────────────────────
        // PENSAR: Cargamos pedidos con sus ítems, producto y proveedor,
        // y también los gastos vinculados directamente al pedido.
        $pedidosVenta = Pedido::with([
            'items.producto.proveedores',
            'gastosAsociados',
        ])
        ->whereIn('estado', $estadosVenta)
        ->whereYear('creado_en', $año)
        ->whereMonth('creado_en', $mes)
        ->when($dia, fn($q) => $q->whereDay('creado_en', $dia))
        ->orderBy('creado_en', 'desc')
        ->get();

        $ventas = $pedidosVenta->map(function ($pedido) {
            // Costo de los productos del pedido
            $costoItems = $pedido->items->sum(
                fn($i) => (float) $i->precio_costo * (int) $i->cantidad
            );

            // Gastos directamente vinculados a este pedido (ej: domicilio)
            $gastosDelPedido = $pedido->gastosAsociados->sum('monto');

            // Costo total = costo productos + gastos del pedido
            $costoTotal  = $costoItems + (float) $gastosDelPedido;
            $precioVenta = (float) $pedido->total;
            $utilidad    = $precioVenta - $costoTotal;

            // Proveedor del primer ítem
            $primerItem = $pedido->items->first();
            $proveedor  = $primerItem?->producto?->proveedores?->first()?->nombre_empresa ?? '—';

            return [
                'id'             => $pedido->id,
                'numero_pedido'  => $pedido->numero_pedido,
                'fecha'          => $pedido->creado_en?->format('d/m/Y'),
                'hora'           => $pedido->creado_en?->format('H:i'),
                'estado'         => $pedido->estado,
                'cliente_nombre' => $pedido->cliente_nombre,
                'cliente_telefono'=> $pedido->cliente_telefono,
                'ciudad'         => $pedido->ciudad,
                'direccion_entrega'=> $pedido->direccion_entrega,
                'metodo_pago'    => $pedido->metodo_pago,
                'costo_items'    => $costoItems,
                'gastos_pedido'  => (float) $gastosDelPedido,
                'costo_total'    => $costoTotal,
                'precio_venta'   => $precioVenta,
                'costo_envio'    => (float) $pedido->costo_envio,
                'utilidad'       => $utilidad,
                'proveedor'      => $proveedor,
                'items'          => $pedido->items->map(fn($i) => [
                    'nombre_producto' => $i->nombre_producto,
                    'cantidad'        => $i->cantidad,
                    'precio_unitario' => (float) $i->precio_unitario,
                    'precio_costo'    => (float) $i->precio_costo,
                    'subtotal'        => (float) $i->subtotal,
                ]),
                'gastos_detalle' => $pedido->gastosAsociados->map(fn($g) => [
                    'descripcion' => $g->descripcion,
                    'categoria'   => $g->categoria,
                    'monto'       => (float) $g->monto,
                ]),
            ];
        });

        // ── 6. GASTOS POR CATEGORÍA ───────────────────────────────────────
        $gastosPorCategoria = GastoOperativo::resumenPorCategoria($año, $mes);

        // ── 7. HISTORIAL MENSUAL (últimos 6 meses) ────────────────────────
        $historial = collect(range(5, 0))->map(function ($mesesAtras) use ($estadosVenta) {
            $fecha    = now()->subMonths($mesesAtras);
            $a        = $fecha->year;
            $m        = $fecha->month;
            $ing      = Pedido::whereIn('estado', $estadosVenta)
                ->whereYear('creado_en', $a)->whereMonth('creado_en', $m)
                ->sum('total');
            $gastos   = GastoOperativo::delPeriodo($a, $m)->sum('monto');
            return [
                'mes'      => $fecha->format('M Y'),
                'ingresos' => (float) $ing,
                'gastos'   => (float) $gastos,
                'ganancia' => (float) ($ing - $gastos),
            ];
        });

        return Inertia::render('Finanzas/Dashboard', [
            'periodo' => compact('año', 'mes', 'dia'),
            'kpis'    => [
                'ingresos'        => (float) $ingresos,
                'costo_productos' => (float) $costoProductos,
                'gastos_op'       => (float) $gastosOp,
                'utilidad'        => $utilidad,
                'margen'          => $margen,
            ],
            'ventas'              => $ventas,
            'gastos_por_categoria'=> $gastosPorCategoria,
            'historial'           => $historial,
        ]);
    }
}
