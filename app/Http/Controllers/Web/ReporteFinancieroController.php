<?php

/*
|--------------------------------------------------------------------------
| CONTROLADOR: ReporteFinancieroController
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué calcula este controller?
|
|   El dashboard financiero muestra los KPIs clave del negocio:
|
|   INGRESOS  = Suma de transacciones aprobadas del período
|   COSTOS    = Suma de (precio_costo × cantidad) de items_pedido entregados
|   GASTOS    = Suma de gastos_operativos del período
|   GANANCIA  = INGRESOS - COSTOS - GASTOS
|   MARGEN %  = (GANANCIA / INGRESOS) × 100
|
| PENSAR — ¿Por qué separar COSTOS y GASTOS?
|
|   COSTOS    = costo variable (cambia con cada pedido)
|               Ej: compramos el producto a $30.000 y lo vendemos a $70.000
|   GASTOS    = costo fijo/recurrente (no depende de cuántos pedidos haya)
|               Ej: publicidad $200.000/mes, hosting $50.000/mes
|
|   Separar estos dos conceptos permite analizar:
|   - ¿El margen bruto por producto es suficiente?
|   - ¿Los gastos fijos están comiendo la ganancia?
|
*/

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\GastoOperativo;
use App\Models\ItemPedido;
use App\Models\Pedido;
use App\Models\Transaccion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ReporteFinancieroController extends Controller
{
    /*
    |----------------------------------------------------------------------
    | dashboard() — Dashboard financiero principal
    |----------------------------------------------------------------------
    */
    public function dashboard(Request $request): Response
    {
        // ── PERÍODO SELECCIONADO ──────────────────────────────────────────
        $año = (int) ($request->año ?? now()->year);
        $mes = (int) ($request->mes ?? now()->month);

        // ── 1. INGRESOS ───────────────────────────────────────────────────
        // Suma de todas las transacciones APROBADAS del período
        $ingresos = Transaccion::aprobadas()
            ->whereYear('pagado_en', $año)
            ->whereMonth('pagado_en', $mes)
            ->sum('monto');

        // ── 2. COSTO DE PRODUCTOS ─────────────────────────────────────────
        // Suma de (precio_costo × cantidad) de pedidos ENTREGADOS del período
        // Solo contamos pedidos entregados porque representan ventas reales
        $costoProductos = ItemPedido::whereHas('pedido', function ($q) use ($año, $mes) {
            $q->where('estado', Pedido::ESTADO_ENTREGADO)
              ->whereYear('creado_en', $año)
              ->whereMonth('creado_en', $mes);
        })->sum(DB::raw('precio_costo * cantidad'));

        // ── 3. GASTOS OPERATIVOS ──────────────────────────────────────────
        $gastosOp = GastoOperativo::delPeriodo($año, $mes)->sum('monto');

        // ── 4. CÁLCULOS FINALES ───────────────────────────────────────────
        $gananciaBruta = $ingresos - $costoProductos;
        $gananciaNeta  = $gananciaBruta - $gastosOp;
        $margenBruto   = $ingresos > 0 ? round(($gananciaBruta / $ingresos) * 100, 1) : 0;
        $margenNeto    = $ingresos > 0 ? round(($gananciaNeta  / $ingresos) * 100, 1) : 0;

        // ── 5. PEDIDOS DEL MES ────────────────────────────────────────────
        $pedidosMes = Pedido::whereYear('creado_en', $año)
                            ->whereMonth('creado_en', $mes)
                            ->selectRaw('estado, COUNT(*) as total')
                            ->groupBy('estado')
                            ->pluck('total', 'estado')
                            ->toArray();

        // ── 6. INGRESOS POR DÍA (para gráfico de líneas) ─────────────────
        $ingresosPorDia = Transaccion::aprobadas()
            ->whereYear('pagado_en', $año)
            ->whereMonth('pagado_en', $mes)
            ->selectRaw("DATE(pagado_en) as fecha, SUM(monto) as total")
            ->groupBy('fecha')
            ->orderBy('fecha')
            ->get()
            ->map(fn ($r) => [
                'fecha' => $r->fecha,
                'total' => (float) $r->total,
            ]);

        // ── 7. GASTOS POR CATEGORÍA (para gráfico de torta) ──────────────
        $gastosPorCategoria = GastoOperativo::resumenPorCategoria($año, $mes);

        // ── 8. TOP 5 PRODUCTOS MÁS VENDIDOS DEL MES ──────────────────────
        $topProductos = ItemPedido::whereHas('pedido', fn ($q) =>
            $q->whereYear('creado_en', $año)->whereMonth('creado_en', $mes)
        )
        ->selectRaw('nombre_producto, SUM(cantidad) as unidades, SUM(subtotal) as ventas')
        ->groupBy('nombre_producto')
        ->orderByDesc('unidades')
        ->limit(5)
        ->get();

        // ── 9. HISTORIAL MENSUAL (últimos 6 meses) ────────────────────────
        $historial = collect(range(5, 0))->map(function ($mesesAtras) {
            $fecha   = now()->subMonths($mesesAtras);
            $a       = $fecha->year;
            $m       = $fecha->month;
            $ingresos = Transaccion::aprobadas()
                ->whereYear('pagado_en', $a)->whereMonth('pagado_en', $m)
                ->sum('monto');
            $gastos   = GastoOperativo::delPeriodo($a, $m)->sum('monto');
            return [
                'mes'      => $fecha->format('M Y'),
                'ingresos' => (float) $ingresos,
                'gastos'   => (float) $gastos,
                'ganancia' => (float) ($ingresos - $gastos),
            ];
        });

        return Inertia::render('Finanzas/Dashboard', [
            'periodo' => compact('año', 'mes'),
            'kpis'    => [
                'ingresos'        => (float) $ingresos,
                'costo_productos' => (float) $costoProductos,
                'gastos_op'       => (float) $gastosOp,
                'ganancia_bruta'  => (float) $gananciaBruta,
                'ganancia_neta'   => (float) $gananciaNeta,
                'margen_bruto'    => $margenBruto,
                'margen_neto'     => $margenNeto,
            ],
            'pedidos_mes'         => $pedidosMes,
            'ingresos_por_dia'    => $ingresosPorDia,
            'gastos_por_categoria' => $gastosPorCategoria,
            'top_productos'       => $topProductos,
            'historial'           => $historial,
            'flash'               => ['exito' => session('exito')],
        ]);
    }
}
