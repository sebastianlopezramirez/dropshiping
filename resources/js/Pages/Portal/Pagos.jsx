/*
|--------------------------------------------------------------------------
| PÁGINA: Portal/Pagos.jsx — Mis Cobros
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué ve el proveedor aquí?
|
|   1. KPIs: ventas totales + lo que me deben
|   2. Tabla por pedido: número, cliente, fecha, costo, estado pago
|      (al día ✅ / debe ❌), días en mora
|   3. Filtros: ordenar por más vencido / más reciente, filtrar por estado
|   4. Top 5 productos más vendidos
|
*/

import { useState, useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';
import PortalLayout from '@/Layouts/PortalLayout';

export default function Pagos({ proveedor, totalDeuda, totalVentas, totalPagado, saldoPendiente, pedidosList = [], topProductos = [] }) {

    const [filtroEstado, setFiltroEstado] = useState('todos'); // todos | al_dia | debe
    const [ordenar, setOrdenar]           = useState('mora_desc'); // mora_desc | fecha_asc | fecha_desc

    const fmt = (v) => new Intl.NumberFormat('es-CO', {
        style: 'currency', currency: 'COP', minimumFractionDigits: 0,
    }).format(v ?? 0);

    // Aplica filtros y ordenamiento
    const pedidosFiltrados = useMemo(() => {
        let lista = [...pedidosList];

        if (filtroEstado === 'al_dia') lista = lista.filter(p => p.al_dia);
        if (filtroEstado === 'debe')   lista = lista.filter(p => !p.al_dia);

        if (ordenar === 'mora_desc')  lista.sort((a, b) => b.dias_mora - a.dias_mora);
        if (ordenar === 'fecha_asc')  lista.sort((a, b) => a.fecha.localeCompare(b.fecha));
        if (ordenar === 'fecha_desc') lista.sort((a, b) => b.fecha.localeCompare(a.fecha));
        if (ordenar === 'monto_desc') lista.sort((a, b) => b.costo_proveedor - a.costo_proveedor);

        return lista;
    }, [pedidosList, filtroEstado, ordenar]);

    const totalDeben   = pedidosList.filter(p => !p.al_dia).reduce((s, p) => s + p.costo_proveedor, 0);
    const countDeben   = pedidosList.filter(p => !p.al_dia).length;
    const countAlDia   = pedidosList.filter(p =>  p.al_dia).length;
    const maxDiaMora   = pedidosList.reduce((m, p) => Math.max(m, p.dias_mora), 0);

    return (
        <PortalLayout header={<h2 className="text-xl font-semibold text-gray-800">Mis Cobros</h2>}>
            <Head title="Mis Cobros" />

            <div className="py-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

                {/* ── KPIs principales ─────────────────────────────────── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                        <p className="text-xs text-indigo-600 font-medium mb-1">Ventas totales</p>
                        <p className="text-xl font-bold text-indigo-700">{fmt(totalVentas)}</p>
                        <p className="text-xs text-indigo-400 mt-1">Precio pagado por clientes</p>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                        <p className="text-xs text-emerald-600 font-medium mb-1">Total cobrado</p>
                        <p className="text-xl font-bold text-emerald-700">{fmt(totalPagado)}</p>
                        <p className="text-xs text-emerald-400 mt-1">Pagos recibidos del admin</p>
                    </div>
                    <div className={`rounded-xl p-4 border ${saldoPendiente > 0 ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-100'}`}>
                        <p className={`text-xs font-medium mb-1 ${saldoPendiente > 0 ? 'text-orange-600' : 'text-green-600'}`}>Lo que te deben</p>
                        <p className={`text-xl font-bold ${saldoPendiente > 0 ? 'text-orange-700' : 'text-green-700'}`}>{fmt(saldoPendiente)}</p>
                        <p className="text-xs text-gray-400 mt-1">{saldoPendiente > 0 ? `${countDeben} pedido(s) sin pagar` : 'Al día ✓'}</p>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                        <p className="text-xs text-gray-500 font-medium mb-1">Mayor mora</p>
                        <p className={`text-xl font-bold ${maxDiaMora > 30 ? 'text-red-600' : maxDiaMora > 0 ? 'text-yellow-600' : 'text-green-700'}`}>
                            {maxDiaMora} días
                        </p>
                        <p className="text-xs text-gray-400 mt-1">{countAlDia} pagados / {countDeben} deben</p>
                    </div>
                </div>

                {/* Alerta mora > 30 días */}
                {maxDiaMora > 30 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3">
                        <span className="text-red-500 text-xl">⚠️</span>
                        <p className="text-sm text-red-800">
                            Tienes pedidos con más de <strong>{maxDiaMora} días</strong> sin pago.
                            Contacta al administrador para gestionar el cobro.
                        </p>
                    </div>
                )}

                {/* ── Tabla de pedidos ─────────────────────────────────── */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <h3 className="font-semibold text-gray-800">Historial de pedidos</h3>
                            <p className="text-xs text-gray-400 mt-0.5">{pedidosList.length} pedido(s) en total</p>
                        </div>
                        {/* Filtros inline */}
                        <div className="flex gap-2 flex-wrap">
                            <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
                                className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500">
                                <option value="todos">Todos</option>
                                <option value="al_dia">✅ Al día</option>
                                <option value="debe">❌ Deben</option>
                            </select>
                            <select value={ordenar} onChange={e => setOrdenar(e.target.value)}
                                className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500">
                                <option value="mora_desc">Más vencidos primero</option>
                                <option value="fecha_asc">Más antiguos primero</option>
                                <option value="fecha_desc">Más recientes primero</option>
                                <option value="monto_desc">Mayor monto primero</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50">
                                <tr>
                                    {['Pedido', 'Cliente', 'Productos', 'Fecha', 'A cobrar', 'Mora', 'Estado pago'].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {pedidosFiltrados.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-sm">
                                            No hay pedidos con este filtro.
                                        </td>
                                    </tr>
                                ) : pedidosFiltrados.map(pedido => (
                                    <tr key={pedido.id} className={`hover:bg-gray-50 transition ${!pedido.al_dia && pedido.dias_mora > 30 ? 'bg-red-50/30' : ''}`}>
                                        <td className="px-4 py-3">
                                            <p className="text-sm font-medium text-emerald-700">{pedido.numero_pedido}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-sm text-gray-800">{pedido.cliente_nombre}</p>
                                            <p className="text-xs text-gray-400">{pedido.ciudad}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            {pedido.items?.map((item, i) => (
                                                <p key={i} className="text-xs text-gray-600">
                                                    {item.nombre} <span className="text-gray-400">× {item.cantidad}</span>
                                                </p>
                                            ))}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{pedido.fecha}</td>
                                        <td className="px-4 py-3">
                                            <p className="text-sm font-semibold text-gray-900">{fmt(pedido.costo_proveedor)}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            {pedido.al_dia ? (
                                                <span className="text-xs text-gray-400">—</span>
                                            ) : (
                                                <span className={`text-xs font-semibold ${pedido.dias_mora > 30 ? 'text-red-600' : 'text-yellow-600'}`}>
                                                    {pedido.dias_mora} días
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {pedido.al_dia ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                                                    ✅ Al día
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                                                    ❌ Debe
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            {pedidosFiltrados.length > 0 && (
                                <tfoot className="bg-gray-50 border-t border-gray-200">
                                    <tr>
                                        <td colSpan={4} className="px-4 py-3 text-sm font-medium text-gray-700">
                                            Total ({pedidosFiltrados.length} pedidos)
                                        </td>
                                        <td className="px-4 py-3 text-sm font-bold text-gray-900">
                                            {fmt(pedidosFiltrados.reduce((s, p) => s + p.costo_proveedor, 0))}
                                        </td>
                                        <td colSpan={2}/>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>

                {/* ── Top productos ─────────────────────────────────────── */}
                {topProductos.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100">
                            <h3 className="font-semibold text-gray-800">Top 5 productos más vendidos</h3>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {topProductos.map((prod, i) => (
                                <div key={i} className="px-5 py-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center">
                                            {i + 1}
                                        </span>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{prod.nombre_producto}</p>
                                            <p className="text-xs text-gray-400">{prod.unidades} unidades</p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-semibold text-emerald-700">{fmt(prod.total_costo)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </PortalLayout>
    );
}
