/*
|--------------------------------------------------------------------------
| PÁGINA: Finanzas/Dashboard.jsx
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué muestra este dashboard?
|
|   KPIs: Ingresos, Costo, Gastos, Utilidad, Margen %
|
|   TABLA DE VENTAS — por cada pedido confirmado/entregado:
|   C1  Fecha
|   C2  # Pedido (clic → modal con detalle completo)
|   C3  Costo total (precio_costo productos + gastos vinculados)
|   C4  Precio de venta (lo que pagó el cliente)
|   C5  Utilidad (venta - costo_total)
|   C6  Proveedor
|
| PENSAR — ¿Por qué ingresos desde pedidos y no transacciones?
|   Un pedido confirmado = pago recibido. Usar pedido.total
|   evita depender de que exista una fila en la tabla transacciones.
|   Es más simple y siempre correcto.
|
*/

import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Dashboard({ periodo, kpis, ventas = [], gastos_por_categoria, historial }) {

    const [año, setAño] = useState(periodo.año);
    const [mes, setMes] = useState(periodo.mes);
    const [dia, setDia] = useState(periodo.dia ?? 0);

    // Modal de detalle de pedido
    const [pedidoModal, setPedidoModal] = useState(null);

    const meses = [
        'Enero','Febrero','Marzo','Abril','Mayo','Junio',
        'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
    ];

    const fmt = (v) => new Intl.NumberFormat('es-CO', {
        style: 'currency', currency: 'COP', minimumFractionDigits: 0,
    }).format(v ?? 0);

    const fmtK = (v) => {
        const n = v ?? 0;
        if (Math.abs(n) >= 1_000_000) return `$${(n/1_000_000).toFixed(1)}M`;
        if (Math.abs(n) >= 1_000)     return `$${(n/1_000).toFixed(0)}K`;
        return fmt(n);
    };

    const aplicarPeriodo = () => {
        const params = { año, mes };
        if (dia > 0) params.dia = dia;
        router.get(route('reportes.financiero'), params, { preserveState: true });
    };

    const etiquetaMetodo = {
        contra_entrega: 'Contraentrega', transferencia: 'Transferencia',
        efectivo: 'Efectivo', nequi: 'Nequi',
    };

    const etiquetaEstado = {
        pendiente: 'Pendiente', confirmado: 'Confirmado',
        entregado: 'Entregado', cancelado: 'Cancelado',
    };

    const colorEstado = {
        pendiente: 'bg-yellow-100 text-yellow-800',
        confirmado: 'bg-blue-100 text-blue-800',
        entregado: 'bg-green-100 text-green-800',
        cancelado: 'bg-red-100 text-red-800',
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
                    <select value={mes} onChange={e => setMes(Number(e.target.value))}
                        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        {meses.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                    </select>
                    <input type="number" value={año} onChange={e => setAño(Number(e.target.value))}
                        min="2024" max="2030"
                        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-400">Día:</span>
                        <input type="number" value={dia === 0 ? '' : dia} placeholder="Todos"
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
                    <span className="ml-auto text-sm font-medium text-gray-700">
                        {dia > 0 ? `${dia} de ` : ''}{meses[mes-1]} {año}
                    </span>
                </div>

                {/* ── KPIs ─────────────────────────────────────────────── */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    {[
                        { label: 'Ingresos',   valor: kpis.ingresos,        color: 'text-indigo-600', bg: 'bg-indigo-50',  desc: 'Ventas confirmadas' },
                        { label: 'Costo',      valor: kpis.costo_productos,  color: 'text-orange-600', bg: 'bg-orange-50',  desc: 'Costo de productos' },
                        { label: 'Gastos',     valor: kpis.gastos_op,        color: 'text-red-600',    bg: 'bg-red-50',     desc: 'Operativos del período' },
                        { label: 'Utilidad',   valor: kpis.utilidad,         color: kpis.utilidad >= 0 ? 'text-green-700' : 'text-red-600', bg: kpis.utilidad >= 0 ? 'bg-green-50' : 'bg-red-50', desc: 'Ingresos − Costo − Gastos' },
                        { label: 'Margen',     valor: `${kpis.margen}%`,     color: kpis.margen >= 20 ? 'text-green-700' : 'text-yellow-700', bg: 'bg-white', noFmt: true, desc: 'Rentabilidad' },
                    ].map((kpi, i) => (
                        <div key={i} className={`${kpi.bg} rounded-xl border border-gray-100 shadow-sm p-4`}>
                            <p className="text-xs text-gray-500 mb-0.5">{kpi.label}</p>
                            <p className={`text-xl font-bold ${kpi.color}`}>
                                {kpi.noFmt ? kpi.valor : fmtK(kpi.valor)}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">{kpi.desc}</p>
                        </div>
                    ))}
                </div>

                {/* ── TABLA DE VENTAS ───────────────────────────────────── */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-semibold text-gray-900">Ventas del período</h3>
                            <p className="text-xs text-gray-400 mt-0.5">{ventas.length} pedido{ventas.length !== 1 ? 's' : ''} confirmado{ventas.length !== 1 ? 's' : ''}</p>
                        </div>
                        <div className="flex gap-2">
                            <Link href={route('gastos.index')}
                                className="text-xs text-gray-500 hover:text-red-600 px-3 py-1.5 border border-gray-200 rounded-lg hover:border-red-200 transition">
                                📋 Ver gastos
                            </Link>
                            <Link href={route('pedidos.index')}
                                className="text-xs text-gray-500 hover:text-indigo-600 px-3 py-1.5 border border-gray-200 rounded-lg hover:border-indigo-200 transition">
                                📦 Ver pedidos
                            </Link>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50">
                                <tr>
                                    {[
                                        { label: 'Fecha',          w: 'w-28' },
                                        { label: '# Pedido',       w: 'w-40' },
                                        { label: 'Costo total',    w: 'w-36', right: true },
                                        { label: 'Precio venta',   w: 'w-36', right: true },
                                        { label: 'Utilidad',       w: 'w-36', right: true },
                                        { label: 'Proveedor',      w: '' },
                                    ].map((h) => (
                                        <th key={h.label}
                                            className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${h.right ? 'text-right' : 'text-left'} ${h.w}`}>
                                            {h.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {ventas.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-sm">
                                            Sin ventas confirmadas en este período
                                        </td>
                                    </tr>
                                ) : (
                                    ventas.map((v) => {
                                        const utilPositiva = v.utilidad >= 0;
                                        return (
                                            <tr key={v.id} className="hover:bg-gray-50 transition">

                                                {/* C1 — Fecha */}
                                                <td className="px-4 py-3">
                                                    <p className="text-sm text-gray-900">{v.fecha}</p>
                                                    <p className="text-xs text-gray-400">{v.hora}</p>
                                                </td>

                                                {/* C2 — Número de pedido (abre modal) */}
                                                <td className="px-4 py-3">
                                                    <button
                                                        onClick={() => setPedidoModal(v)}
                                                        className="text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline text-left"
                                                    >
                                                        {v.numero_pedido}
                                                    </button>
                                                    <p className="text-xs text-gray-400">{v.cliente_nombre}</p>
                                                </td>

                                                {/* C3 — Costo total */}
                                                <td className="px-4 py-3 text-right">
                                                    <p className="text-sm font-medium text-orange-700">{fmt(v.costo_total)}</p>
                                                    {v.gastos_pedido > 0 && (
                                                        <p className="text-xs text-gray-400">+{fmt(v.gastos_pedido)} gastos</p>
                                                    )}
                                                </td>

                                                {/* C4 — Precio de venta */}
                                                <td className="px-4 py-3 text-right">
                                                    <p className="text-sm font-semibold text-gray-900">{fmt(v.precio_venta)}</p>
                                                </td>

                                                {/* C5 — Utilidad */}
                                                <td className="px-4 py-3 text-right">
                                                    <p className={`text-sm font-bold ${utilPositiva ? 'text-green-700' : 'text-red-600'}`}>
                                                        {utilPositiva ? '' : '-'}{fmt(Math.abs(v.utilidad))}
                                                    </p>
                                                </td>

                                                {/* C6 — Proveedor */}
                                                <td className="px-4 py-3">
                                                    <p className="text-sm text-gray-700">{v.proveedor}</p>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                            {/* Totales */}
                            {ventas.length > 0 && (
                                <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                                    <tr>
                                        <td colSpan={2} className="px-4 py-3 text-sm font-semibold text-gray-700">
                                            Totales ({ventas.length} ventas)
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm font-bold text-orange-700">
                                            {fmt(ventas.reduce((s, v) => s + v.costo_total, 0))}
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                                            {fmt(ventas.reduce((s, v) => s + v.precio_venta, 0))}
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm font-bold text-green-700">
                                            {fmt(ventas.reduce((s, v) => s + v.utilidad, 0))}
                                        </td>
                                        <td className="px-4 py-3"></td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>

                {/* ── GASTOS POR CATEGORÍA ──────────────────────────────── */}
                {Object.keys(gastos_por_categoria).length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <h3 className="text-base font-semibold text-gray-900 mb-4">Gastos por categoría</h3>
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
                                                <div className="h-1.5 rounded-full bg-red-400 transition-all"
                                                    style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between text-sm">
                            <span className="text-gray-500">Total gastos</span>
                            <span className="font-bold text-red-600">{fmt(kpis.gastos_op)}</span>
                        </div>
                    </div>
                )}

            </div>

            {/* ── MODAL — DETALLE DEL PEDIDO ────────────────────────────── */}
            {pedidoModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
                    onClick={(e) => e.target === e.currentTarget && setPedidoModal(null)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">{pedidoModal.numero_pedido}</h3>
                                <p className="text-sm text-gray-500">{pedidoModal.fecha} · {pedidoModal.hora}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${colorEstado[pedidoModal.estado] ?? 'bg-gray-100 text-gray-600'}`}>
                                    {etiquetaEstado[pedidoModal.estado] ?? pedidoModal.estado}
                                </span>
                                <button onClick={() => setPedidoModal(null)}
                                    className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
                            </div>
                        </div>

                        <div className="p-6 space-y-5">

                            {/* Cliente */}
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Cliente</p>
                                <p className="text-sm font-medium text-gray-900">{pedidoModal.cliente_nombre}</p>
                                <p className="text-sm text-gray-500">{pedidoModal.cliente_telefono}</p>
                                <p className="text-sm text-gray-500">{pedidoModal.ciudad} — {pedidoModal.direccion_entrega}</p>
                                <p className="text-sm text-gray-500">Pago: {etiquetaMetodo[pedidoModal.metodo_pago] ?? pedidoModal.metodo_pago}</p>
                            </div>

                            {/* Productos */}
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Productos</p>
                                <div className="space-y-2">
                                    {pedidoModal.items.map((item, i) => (
                                        <div key={i} className="flex justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                                            <div>
                                                <p className="font-medium text-gray-900">{item.nombre_producto}</p>
                                                <p className="text-xs text-gray-400">Cant: {item.cantidad} · Costo: {fmt(item.precio_costo)}</p>
                                            </div>
                                            <p className="font-semibold text-gray-900">{fmt(item.subtotal)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Gastos del pedido */}
                            {pedidoModal.gastos_detalle?.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Gastos vinculados</p>
                                    <div className="space-y-1">
                                        {pedidoModal.gastos_detalle.map((g, i) => (
                                            <div key={i} className="flex justify-between text-sm">
                                                <span className="text-gray-600">{g.descripcion}</span>
                                                <span className="font-medium text-red-600">{fmt(g.monto)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Resumen financiero */}
                            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                                <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Resumen financiero</p>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Precio de venta</span>
                                    <span className="font-medium">{fmt(pedidoModal.precio_venta)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Costo productos</span>
                                    <span className="font-medium text-orange-600">- {fmt(pedidoModal.costo_items)}</span>
                                </div>
                                {pedidoModal.gastos_pedido > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Gastos del pedido</span>
                                        <span className="font-medium text-red-600">- {fmt(pedidoModal.gastos_pedido)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm border-t border-gray-200 pt-2 mt-2">
                                    <span className="font-semibold text-gray-900">Utilidad</span>
                                    <span className={`font-bold text-base ${pedidoModal.utilidad >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                                        {fmt(pedidoModal.utilidad)}
                                    </span>
                                </div>
                            </div>

                            {/* Botón ir al pedido */}
                            <div className="flex gap-2 pt-1">
                                <Link href={route('pedidos.show', pedidoModal.id)}
                                    className="flex-1 text-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition">
                                    Ver pedido completo →
                                </Link>
                                <button onClick={() => setPedidoModal(null)}
                                    className="px-4 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition">
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </AuthenticatedLayout>
    );
}
