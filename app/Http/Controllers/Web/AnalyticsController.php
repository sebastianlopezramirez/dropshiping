<?php

/*
|--------------------------------------------------------------------------
| CONTROLLER: AnalyticsController
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué hace este controller?
|
|   Agrega datos de las tablas existentes para producir métricas
|   del negocio. Todo en un solo método dashboard() que retorna
|   los datos al componente React Analytics/Dashboard.jsx.
|
| PENSAR — ¿Por qué un controller separado?
|
|   El ReporteFinancieroController ya existe para el módulo de finanzas.
|   Analytics es más amplio: cruza pedidos, transacciones, productos
|   y gastos en un solo panel ejecutivo.
|
| PENSAR — Período por defecto: mes actual.
|   El admin puede cambiar el período desde la vista (mes/año via query string).
|
*/

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\GastoOperativo;
use App\Models\ItemPedido;
use App\Models\Pedido;
use App\Models\Producto;
use App\Models\Transaccion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AnalyticsController extends Controller
{
    public function dashboard(Request $request)
    {
        // Período seleccionado (default: mes y año actuales)
        $mes = (int) $request->get('mes', now()->month);
        $ano = (int) $request->get('ano', now()->year);

        /*
        |----------------------------------------------------------------------
        | 1. KPIs FINANCIEROS DEL MES
        |----------------------------------------------------------------------
        | ingresos  = suma de transacciones aprobadas del período
        | gastos    = suma de gastos_operativos del período
        | ganancia  = ingresos - gastos
        */
        $ingresos = Transaccion::where('estado', 'aprobada')
            ->whereMonth('creado_en', $mes)
            ->whereYear('creado_en', $ano)
            ->sum('monto');

        $gastos = GastoOperativo::whereMonth('fecha_gasto', $mes)
            ->whereYear('fecha_gasto', $ano)
            ->sum('monto');

        $ganancia = $ingresos - $gastos;

        /*
        |----------------------------------------------------------------------
        | 2. PEDIDOS DEL MES — conteo por estado
        |----------------------------------------------------------------------
        */
        $pedidosPorEstado = Pedido::whereMonth('creado_en', $mes)
            ->whereYear('creado_en', $ano)
            ->select('estado', DB::raw('count(*) as total'))
            ->groupBy('estado')
            ->pluck('total', 'estado')
            ->toArray();

        $totalPedidosMes = array_sum($pedidosPorEstado);

        /*
        |----------------------------------------------------------------------
        | 3. PRODUCTOS MÁS VENDIDOS (top 5 del mes)
        |----------------------------------------------------------------------
        | Agrupamos items_pedido por nombre_producto (snapshot guardado)
        | para que funcione aunque el producto original se elimine.
        */
        $productosMasVendidos = ItemPedido::select(
                'nombre_producto',
                'producto_id',
                DB::raw('SUM(cantidad) as unidades'),
                DB::raw('SUM(subtotal) as ingresos_total')
            )
            ->whereHas('pedido', function ($q) use ($mes, $ano) {
                $q->whereMonth('creado_en', $mes)
                  ->whereYear('creado_en', $ano)
                  ->whereNotIn('estado', ['cancelado']);
            })
            ->groupBy('nombre_producto', 'producto_id')
            ->orderByDesc('unidades')
            ->limit(5)
            ->get();

        /*
        |----------------------------------------------------------------------
        | 4. ÚLTIMOS 6 MESES — ingresos vs gastos (para gráfica de barras)
        |----------------------------------------------------------------------
        */
        $ultimos6Meses = [];
        for ($i = 5; $i >= 0; $i--) {
            $fecha = now()->subMonths($i);
            $m = (int) $fecha->month;
            $a = (int) $fecha->year;

            $ing = Transaccion::where('estado', 'aprobada')
                ->whereMonth('creado_en', $m)
                ->whereYear('creado_en', $a)
                ->sum('monto');

            $gas = GastoOperativo::whereMonth('fecha_gasto', $m)
                ->whereYear('fecha_gasto', $a)
                ->sum('monto');

            $ultimos6Meses[] = [
                'mes'      => $fecha->translatedFormat('M Y'),  // "Ago 2026"
                'ingresos' => (float) $ing,
                'gastos'   => (float) $gas,
                'ganancia' => (float) ($ing - $gas),
            ];
        }

        /*
        |----------------------------------------------------------------------
        | 5. ALERTAS DE STOCK BAJO
        |----------------------------------------------------------------------
        | Productos activos cuyo stock actual está por debajo del stock_minimo.
        */
        $stockBajo = Producto::activos()
            ->whereNotNull('stock')
            ->whereNotNull('stock_minimo')
            ->whereColumn('stock', '<', 'stock_minimo')
            ->select('id', 'nombre', 'stock', 'stock_minimo', 'slug')
            ->orderBy('stock')
            ->limit(10)
            ->get();

        /*
        |----------------------------------------------------------------------
        | 6. GASTOS POR CATEGORÍA del mes
        |----------------------------------------------------------------------
        */
        $gastosPorCategoria = GastoOperativo::whereMonth('fecha_gasto', $mes)
            ->whereYear('fecha_gasto', $ano)
            ->select('categoria', DB::raw('SUM(monto) as total'))
            ->groupBy('categoria')
            ->orderByDesc('total')
            ->get();

        /*
        |----------------------------------------------------------------------
        | 7. TOTALES GLOBALES (resumen histórico)
        |----------------------------------------------------------------------
        */
        $totalProductos   = Producto::activos()->count();
        $totalPedidosHoy  = Pedido::whereDate('creado_en', today())->count();
        $transacPendientes = Transaccion::where('estado', 'pendiente')->count();

        return Inertia::render('Analytics/Dashboard', [
            // Período activo
            'periodo' => ['mes' => $mes, 'ano' => $ano],

            // KPIs del mes
            'kpis' => [
                'ingresos'          => (float) $ingresos,
                'gastos'            => (float) $gastos,
                'ganancia'          => (float) $ganancia,
                'total_pedidos_mes' => $totalPedidosMes,
            ],

            // Pedidos por estado
            'pedidos_por_estado' => $pedidosPorEstado,

            // Top productos
            'productos_mas_vendidos' => $productosMasVendidos,

            // Evolución 6 meses
            'ultimos_6_meses' => $ultimos6Meses,

            // Alertas
            'stock_bajo' => $stockBajo,

            // Gastos desglosados
            'gastos_por_categoria' => $gastosPorCategoria,

            // Globales
            'globales' => [
                'total_productos'       => $totalProductos,
                'pedidos_hoy'           => $totalPedidosHoy,
                'transac_pendientes'    => $transacPendientes,
            ],
        ]);
    }
}
