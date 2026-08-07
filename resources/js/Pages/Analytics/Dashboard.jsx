/*
|--------------------------------------------------------------------------
| PÁGINA: Analytics/Dashboard.jsx
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué hace esta página?
|
|   Panel ejecutivo con métricas clave del negocio.
|   Sin librerías de gráficas externas — todo con CSS y Tailwind.
|
| PENSAR — Props que recibe del controller:
|
|   periodo              → { mes, ano }
|   kpis                 → { ingresos, gastos, ganancia, total_pedidos_mes }
|   pedidos_por_estado   → { pendiente: N, completado: N, ... }
|   productos_mas_vendidos → array top 5
|   ultimos_6_meses      → array de 6 meses con ingresos/gastos/ganancia
|   stock_bajo           → array de productos con stock < stock_minimo
|   gastos_por_categoria → array { categoria, total }
|   globales             → { total_productos, pedidos_hoy, transac_pendientes }
|
*/

import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

// Formateador de moneda COP — reutilizado en toda la página
const cop = (n) => Number(n).toLocaleString('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0
});

// Colores por estado de pedido
const colorEstado = {
    pendiente:  'bg-yellow-100 text-yellow-700',
    procesando: 'bg-blue-100 text-blue-700',
    enviado:    'bg-indigo-100 text-indigo-700',
    entregado:  'bg-green-100 text-green-700',
    completado: 'bg-green-100 text-green-700',
    cancelado:  'bg-red-100 text-red-700',
};

export default function Dashboard({
    periodo,
    kpis,
    pedidos_por_estado,
    productos_mas_vendidos,
    ultimos_6_meses,
    stock_bajo,
    gastos_por_categoria,
    globales,
}) {
    // Cambiar período → navega con query string
    const cambiarPeriodo = (campo, valor) => {
        router.get(route('analytics.dashboard'), {
            ...periodo,
            [campo]: valor,
        }, { preserveScroll: true });
    };

    // Meses en español para el selector
    const meses = [
        'Enero','Febrero','Marzo','Abril','Mayo','Junio',
        'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
    ];

    // Valor máximo de ingresos en los últimos 6 meses (para escalar las barras)
    const maxIngreso = Math.max(...ultimos_6_meses.map(m => m.ingresos), 1);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-800">Analytics</h2>

                    {/* Selector de período */}
                    <div className="flex items-center gap-2">
                        <select
                            value={periodo.mes}
                            onChange={e => cambiarPeriodo('mes', e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        >
                            {meses.map((nombre, i) => (
                                <option key={i} value={i + 1}>{nombre}</option>
                            ))}
                        </select>
                        <select
                            value={periodo.ano}
                            onChange={e => cambiarPeriodo('ano', e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        >
                            {[2024, 2025, 2026, 2027].map(a => (
                                <option key={a} value={a}>{a}</option>
                            ))}
                        </select>
                    </div>
                </div>
            }
        >
            <Head title="Analytics" />

            <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

                {/* ── FILA 1: KPIs del mes ───────────────────────── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard
                        titulo="Ingresos del mes"
                        valor={cop(kpis.ingresos)}
                        color="indigo"
                        icono="💰"
                    />
                    <KpiCard
                        titulo="Gastos del mes"
                        valor={cop(kpis.gastos)}
                        color="red"
                        icono="📤"
                    />
                    <KpiCard
                        titulo={kpis.ganancia >= 0 ? 'Ganancia neta' : 'Pérdida neta'}
                        valor={cop(Math.abs(kpis.ganancia))}
                        color={kpis.ganancia >= 0 ? 'green' : 'red'}
                        icono={kpis.ganancia >= 0 ? '📈' : '📉'}
                        nota={kpis.ganancia >= 0 ? 'Positivo' : 'Negativo'}
                    />
                    <KpiCard
                        titulo="Pedidos del mes"
                        valor={kpis.total_pedidos_mes}
                        color="purple"
                        icono="📦"
                    />
                </div>

                {/* ── FILA 2: Globales rápidos ───────────────────── */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                        <p className="text-2xl font-bold text-gray-900">{globales.total_productos}</p>
                        <p className="text-xs text-gray-500 mt-1">Productos activos</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                        <p className="text-2xl font-bold text-gray-900">{globales.pedidos_hoy}</p>
                        <p className="text-xs text-gray-500 mt-1">Pedidos hoy</p>
                    </div>
                    <div className={`rounded-xl border p-4 text-center ${globales.transac_pendientes > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-200'}`}>
                        <p className={`text-2xl font-bold ${globales.transac_pendientes > 0 ? 'text-yellow-700' : 'text-gray-900'}`}>
                            {globales.transac_pendientes}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Transacciones pendientes</p>
                    </div>
                </div>

                {/* ── FILA 3: Gráfica de 6 meses + Pedidos por estado ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                    {/* Gráfica de barras — últimos 6 meses */}
                    <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
                        <h3 className="text-sm font-semibold text-gray-700 mb-4">
                            Ingresos vs Gastos — Últimos 6 meses
                        </h3>
                        <div className="flex items-end gap-3 h-40">
                            {ultimos_6_meses.map((m, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                    <div className="w-full flex gap-0.5 items-end" style={{ height: '120px' }}>
                                        {/* Barra ingresos */}
                                        <div
                                            className="flex-1 bg-indigo-400 rounded-t transition-all"
                                            style={{ height: `${Math.round((m.ingresos / maxIngreso) * 100)}%`, minHeight: m.ingresos > 0 ? '4px' : '0' }}
                                            title={`Ingresos: ${cop(m.ingresos)}`}
                                        />
                                        {/* Barra gastos */}
                                        <div
                                            className="flex-1 bg-red-300 rounded-t transition-all"
                                            style={{ height: `${Math.round((m.gastos / maxIngreso) * 100)}%`, minHeight: m.gastos > 0 ? '4px' : '0' }}
                                            title={`Gastos: ${cop(m.gastos)}`}
                                        />
                                    </div>
                                    <span className="text-xs text-gray-400 text-center leading-tight">{m.mes}</span>
                                </div>
                            ))}
                        </div>
                        {/* Leyenda */}
                        <div className="flex gap-4 mt-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                                <span className="w-3 h-3 bg-indigo-400 rounded-sm inline-block"></span> Ingresos
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-3 h-3 bg-red-300 rounded-sm inline-block"></span> Gastos
                            </span>
                        </div>
                    </div>

                    {/* Pedidos por estado */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <h3 className="text-sm font-semibold text-gray-700 mb-4">
                            Pedidos por estado ({meses[periodo.mes - 1]})
                        </h3>
                        {Object.keys(pedidos_por_estado).length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-8">Sin pedidos este mes</p>
                        ) : (
                            <div className="space-y-3">
                                {Object.entries(pedidos_por_estado)
                                    .sort((a, b) => b[1] - a[1])
                                    .map(([estado, total]) => (
                                    <div key={estado}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colorEstado[estado] || 'bg-gray-100 text-gray-600'}`}>
                                                {estado}
                                            </span>
                                            <span className="text-sm font-bold text-gray-700">{total}</span>
                                        </div>
                                        {/* Barra de progreso proporcional */}
                                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-indigo-400 rounded-full"
                                                style={{ width: `${Math.round((total / kpis.total_pedidos_mes) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── FILA 4: Top productos + Gastos por categoría ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                    {/* Top 5 productos más vendidos */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <h3 className="text-sm font-semibold text-gray-700 mb-4">
                            Top 5 productos más vendidos
                        </h3>
                        {productos_mas_vendidos.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-8">Sin ventas este mes</p>
                        ) : (
                            <div className="space-y-3">
                                {productos_mas_vendidos.map((p, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center shrink-0">
                                            {i + 1}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-800 truncate">
                                                {p.nombre_producto}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {p.unidades} unidades · {cop(p.ingresos_total)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Gastos por categoría */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <h3 className="text-sm font-semibold text-gray-700 mb-4">
                            Gastos por categoría
                        </h3>
                        {gastos_por_categoria.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-8">Sin gastos este mes</p>
                        ) : (
                            <div className="space-y-3">
                                {gastos_por_categoria.map((g, i) => {
                                    const pct = kpis.gastos > 0
                                        ? Math.round((g.total / kpis.gastos) * 100)
                                        : 0;
                                    return (
                                        <div key={i}>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm text-gray-700 capitalize">{g.categoria}</span>
                                                <span className="text-sm font-medium text-gray-900">{cop(g.total)}</span>
                                            </div>
                                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-red-300 rounded-full"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── FILA 5: Alertas de stock bajo ──────────────── */}
                {stock_bajo.length > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
                        <h3 className="text-sm font-semibold text-orange-700 mb-3 flex items-center gap-2">
                            ⚠️ Stock bajo — {stock_bajo.length} producto{stock_bajo.length > 1 ? 's' : ''} por debajo del mínimo
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {stock_bajo.map(p => (
                                <Link
                                    key={p.id}
                                    href={route('productos.edit', p.id)}
                                    className="flex items-center justify-between bg-white border border-orange-100 rounded-lg px-3 py-2 hover:border-orange-300 transition-colors"
                                >
                                    <span className="text-sm text-gray-700 truncate">{p.nombre}</span>
                                    <span className="text-xs font-bold text-orange-600 ml-2 shrink-0">
                                        {p.stock} / {p.stock_minimo}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </AuthenticatedLayout>
    );
}

/*
|--------------------------------------------------------------------------
| COMPONENTE: KpiCard
|--------------------------------------------------------------------------
| Tarjeta de métrica individual. Fuera del componente principal.
*/
function KpiCard({ titulo, valor, color, icono, nota }) {
    const colores = {
        indigo: 'bg-indigo-50 border-indigo-100',
        green:  'bg-green-50 border-green-100',
        red:    'bg-red-50 border-red-100',
        purple: 'bg-purple-50 border-purple-100',
    };
    const textColores = {
        indigo: 'text-indigo-700',
        green:  'text-green-700',
        red:    'text-red-700',
        purple: 'text-purple-700',
    };

    return (
        <div className={`rounded-xl border p-4 ${colores[color] || 'bg-white border-gray-200'}`}>
            <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{icono}</span>
                <p className="text-xs text-gray-500 font-medium">{titulo}</p>
            </div>
            <p className={`text-xl font-bold ${textColores[color] || 'text-gray-900'}`}>
                {valor}
            </p>
            {nota && <p className="text-xs text-gray-400 mt-0.5">{nota}</p>}
        </div>
    );
}
