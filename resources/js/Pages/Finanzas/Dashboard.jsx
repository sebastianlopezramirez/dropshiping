/*
|--------------------------------------------------------------------------
| PÁGINA: Finanzas/Dashboard.jsx
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué muestra este dashboard?
|
|   Los KPIs financieros del negocio para el período seleccionado:
|   - Ingresos: suma de transacciones aprobadas
|   - Costo productos: lo que costaron los productos vendidos
|   - Gastos operativos: publicidad, hosting, empaque, etc.
|   - Ganancia bruta: ingresos - costo productos
|   - Ganancia neta: ganancia bruta - gastos operativos
|   - Margen %: (ganancia neta / ingresos) × 100
|
|   + Gráfico de ingresos por día
|   + Historial de 6 meses
|   + Top 5 productos más vendidos
|   + Gastos por categoría
|
*/

import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    LineChart, Line, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend,
} from 'recharts';

export default function Dashboard({
    periodo, kpis, pedidos_mes,
    ingresos_por_dia, gastos_por_categoria,
    top_productos, historial,
}) {
    const [año, setAño]  = useState(periodo.año);
    const [mes, setMes]  = useState(periodo.mes);
    // dia = 0 significa "todo el mes" (sin filtro de día)
    const [dia, setDia]  = useState(periodo.dia ?? 0);

    const meses = [
        'Enero','Febrero','Marzo','Abril','Mayo','Junio',
        'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
    ];

    const fmt = (v) => new Intl.NumberFormat('es-CO', {
        style: 'currency', currency: 'COP', minimumFractionDigits: 0,
    }).format(v ?? 0);

    const fmtK = (v) => {
        if (v >= 1_000_000) return `$${(v/1_000_000).toFixed(1)}M`;
        if (v >= 1_000)     return `$${(v/1_000).toFixed(0)}K`;
        return fmt(v);
    };

    const aplicarPeriodo = () => {
        const params = { año, mes };
        if (dia > 0) params.dia = dia;
        router.get(route('reportes.financiero'), params, { preserveState: true });
    };

    // Colores por categoría de gasto
    const colorCategoria = {
        publicidad: '#6366f1', empaque: '#f59e0b', hosting: '#10b981',
        dominio: '#3b82f6', herramientas: '#8b5cf6', logistica: '#f97316',
        devolucion: '#ef4444', otro: '#6b7280',
    };

    const etiquetaCategoria = {
        publicidad: 'Publicidad', empaque: 'Empaque', hosting: 'Hosting',
        dominio: 'Dominio', herramientas: 'Herramientas', logistica: 'Logística',
        devolucion: 'Devolución', otro: 'Otro',
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold text-gray-800">Dashboard Financiero</h2>}
        >
            <Head title="Dashboard Financiero" />

            <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

                {/* ── SELECTOR DE PERÍODO ──────────────────────────────── */}
                <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                    <span className="text-sm font-medium text-gray-700">Período:</span>
                    {/* Mes */}
                    <select value={mes} onChange={e => setMes(Number(e.target.value))}
                        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        {meses.map((m, i) => (
                            <option key={i+1} value={i+1}>{m}</option>
                        ))}
                    </select>
                    {/* Año */}
                    <input type="number" value={año} onChange={e => setAño(Number(e.target.value))}
                        min="2024" max="2030"
                        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    {/* Día (opcional) — 0 = todo el mes */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-400">Día:</span>
                        <input type="number" value={dia === 0 ? '' : dia}
                            placeholder="Todos"
                            onChange={e => setDia(e.target.value === '' ? 0 : Math.min(31, Math.max(1, Number(e.target.value))))}
                            min="1" max="31"
                            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-20 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        {dia > 0 && (
                            <button onClick={() => setDia(0)} className="text-xs text-gray-400 hover:text-red-500">✕</button>
                        )}
                    </div>
                    <button onClick={aplicarPeriodo}
                        className="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition">
                        Ver
                    </button>
                    <span className="ml-auto text-sm text-gray-500">
                        {dia > 0 ? `${dia} de ` : ''}{meses[mes-1]} {año}
                    </span>
                </div>

                {/* ── KPIs PRINCIPALES ─────────────────────────────────── */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                        { label: 'Ingresos',        valor: kpis.ingresos,        color: 'text-indigo-600',  bg: 'bg-indigo-50'  },
                        { label: 'Costo productos',  valor: kpis.costo_productos, color: 'text-orange-600', bg: 'bg-orange-50'  },
                        { label: 'Gastos operativos',valor: kpis.gastos_op,       color: 'text-red-600',    bg: 'bg-red-50'     },
                        { label: 'Ganancia bruta',   valor: kpis.ganancia_bruta,  color: 'text-blue-600',   bg: 'bg-blue-50'    },
                        { label: 'Ganancia neta',    valor: kpis.ganancia_neta,   color: 'text-green-700',  bg: 'bg-green-50'   },
                        { label: 'Margen neto',      valor: `${kpis.margen_neto}%`, color: kpis.margen_neto >= 20 ? 'text-green-700' : 'text-yellow-700', bg: 'bg-white', noFmt: true },
                    ].map((kpi, i) => (
                        <div key={i} className={`${kpi.bg} rounded-xl border border-gray-100 shadow-sm p-5`}>
                            <p className="text-xs text-gray-500 mb-1">{kpi.label}</p>
                            <p className={`text-2xl font-bold ${kpi.color}`}>
                                {kpi.noFmt ? kpi.valor : fmtK(kpi.valor)}
                            </p>
                        </div>
                    ))}
                </div>

                {/* ── GRÁFICO: INGRESOS POR DÍA ────────────────────────── */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">
                        Ingresos por día — {meses[mes-1]} {año}
                    </h3>
                    {ingresos_por_dia.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-8">Sin ingresos registrados en este período</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={ingresos_por_dia}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="fecha" tick={{ fontSize: 11 }}
                                    tickFormatter={f => f?.slice(8)} />
                                <YAxis tick={{ fontSize: 11 }}
                                    tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
                                <Tooltip formatter={(v) => [fmt(v), 'Ingresos']}
                                    labelFormatter={l => `Día ${l?.slice(8)}`} />
                                <Line type="monotone" dataKey="total"
                                    stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* ── HISTORIAL 6 MESES ────────────────────────────── */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <h3 className="text-base font-semibold text-gray-900 mb-4">Últimos 6 meses</h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={historial}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
                                <Tooltip formatter={(v, n) => [fmt(v), n === 'ingresos' ? 'Ingresos' : n === 'gastos' ? 'Gastos' : 'Ganancia']} />
                                <Legend />
                                <Bar dataKey="ingresos" fill="#6366f1" radius={[3,3,0,0]} />
                                <Bar dataKey="ganancia" fill="#10b981" radius={[3,3,0,0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* ── GASTOS POR CATEGORÍA ─────────────────────────── */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <h3 className="text-base font-semibold text-gray-900 mb-4">Gastos por categoría</h3>
                        {Object.keys(gastos_por_categoria).length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-8">Sin gastos en este período</p>
                        ) : (
                            <div className="space-y-3">
                                {Object.entries(gastos_por_categoria)
                                    .sort(([,a],[,b]) => b - a)
                                    .map(([cat, monto]) => {
                                        const total = Object.values(gastos_por_categoria).reduce((s,v) => s+v, 0);
                                        const pct   = total > 0 ? Math.round((monto/total)*100) : 0;
                                        return (
                                            <div key={cat}>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="text-gray-700">{etiquetaCategoria[cat] ?? cat}</span>
                                                    <span className="font-medium">{fmt(monto)} <span className="text-gray-400 text-xs">({pct}%)</span></span>
                                                </div>
                                                <div className="w-full bg-gray-100 rounded-full h-1.5">
                                                    <div className="h-1.5 rounded-full transition-all"
                                                        style={{ width: `${pct}%`, backgroundColor: colorCategoria[cat] ?? '#6b7280' }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        )}
                        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between text-sm">
                            <span className="text-gray-500">Total gastos</span>
                            <span className="font-bold text-red-600">{fmt(kpis.gastos_op)}</span>
                        </div>
                    </div>
                </div>

                {/* ── TOP PRODUCTOS ─────────────────────────────────────── */}
                {top_productos.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <h3 className="text-base font-semibold text-gray-900 mb-4">
                            Top 5 productos más vendidos
                        </h3>
                        <div className="divide-y divide-gray-100">
                            {top_productos.map((p, i) => (
                                <div key={i} className="flex items-center gap-3 py-3">
                                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
                                        {i+1}
                                    </span>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">{p.nombre_producto}</p>
                                        <p className="text-xs text-gray-400">{p.unidades} unidades vendidas</p>
                                    </div>
                                    <p className="text-sm font-semibold text-indigo-600">{fmt(p.ventas)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── ACCESOS RÁPIDOS ───────────────────────────────────── */}
                <div className="grid grid-cols-2 gap-4">
                    <Link href={route('transacciones.index')}
                        className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:border-indigo-200 transition text-center">
                        <p className="text-2xl mb-1">💳</p>
                        <p className="text-sm font-medium text-gray-900">Ver transacciones</p>
                        <p className="text-xs text-gray-400 mt-1">Pagos recibidos</p>
                    </Link>
                    <Link href={route('gastos.index')}
                        className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:border-red-200 transition text-center">
                        <p className="text-2xl mb-1">📋</p>
                        <p className="text-sm font-medium text-gray-900">Ver gastos</p>
                        <p className="text-xs text-gray-400 mt-1">Costos operativos</p>
                    </Link>
                </div>

            </div>
        </AuthenticatedLayout>
    );
}
