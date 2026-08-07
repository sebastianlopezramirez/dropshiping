/*
|--------------------------------------------------------------------------
| PÁGINA: Portal/Pedidos.jsx
|--------------------------------------------------------------------------
|
| Lista de pedidos que contienen al menos un producto del proveedor.
| Solo se muestran los ítems que son del proveedor, no los de otros.
|
*/

import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import PortalLayout from '@/Layouts/PortalLayout';

export default function Pedidos({ proveedor, pedidos, filtros, estadisticas }) {

    const [buscar, setBuscar] = useState(filtros.buscar || '');
    const [estado, setEstado] = useState(filtros.estado || '');

    const fmt = (v) => new Intl.NumberFormat('es-CO', {
        style: 'currency', currency: 'COP', minimumFractionDigits: 0,
    }).format(v ?? 0);

    const colorEstado = {
        pendiente:  'bg-yellow-100 text-yellow-800',
        procesando: 'bg-blue-100 text-blue-800',
        preparando: 'bg-purple-100 text-purple-800',
        enviado:    'bg-indigo-100 text-indigo-800',
        entregado:  'bg-green-100 text-green-800',
        cancelado:  'bg-red-100 text-red-800',
    };

    const aplicarFiltros = (e) => {
        e.preventDefault();
        router.get(route('portal.pedidos'), { buscar, estado }, { preserveState: true, replace: true });
    };

    const limpiar = () => {
        setBuscar(''); setEstado('');
        router.get(route('portal.pedidos'));
    };

    return (
        <PortalLayout header={<h2 className="text-xl font-semibold text-gray-800">Pedidos con mis productos</h2>}>
            <Head title="Mis Pedidos" />

            <div className="py-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: 'Total pedidos', valor: estadisticas.total_pedidos, color: 'text-gray-900' },
                        { label: 'Items vendidos', valor: estadisticas.total_items,  color: 'text-emerald-600' },
                        { label: 'Entregados',     valor: estadisticas.entregados,   color: 'text-blue-600' },
                    ].map((s, i) => (
                        <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                            <p className={`text-xl font-bold ${s.color}`}>{s.valor}</p>
                        </div>
                    ))}
                </div>

                {/* Filtros */}
                <form onSubmit={aplicarFiltros} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <input type="text" placeholder="Buscar por # pedido o cliente..."
                            value={buscar} onChange={e => setBuscar(e.target.value)}
                            className="sm:col-span-2 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        <select value={estado} onChange={e => setEstado(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                            <option value="">Todos los estados</option>
                            {['pendiente','procesando','preparando','enviado','entregado','cancelado'].map(e => (
                                <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>
                            ))}
                        </select>
                        <div className="flex gap-2">
                            <button type="submit" className="flex-1 px-3 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition">
                                Filtrar
                            </button>
                            <button type="button" onClick={limpiar} className="px-3 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition">
                                ✕
                            </button>
                        </div>
                    </div>
                </form>

                {/* Tabla */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {['Pedido', 'Cliente', 'Mis productos', 'Estado', 'Fecha', ''].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {pedidos.data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                                        No hay pedidos que coincidan con los filtros.
                                    </td>
                                </tr>
                            ) : (
                                pedidos.data.map(pedido => (
                                    <tr key={pedido.id} className="hover:bg-gray-50 transition">
                                        <td className="px-4 py-3">
                                            <span className="text-sm font-medium text-emerald-600">{pedido.numero_pedido}</span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{pedido.cliente_nombre}</td>
                                        <td className="px-4 py-3">
                                            {pedido.items?.map(item => (
                                                <p key={item.id} className="text-xs text-gray-600">
                                                    {item.nombre_producto} × {item.cantidad}
                                                    <span className="ml-1 text-gray-400">
                                                        ({fmt(item.precio_costo * item.cantidad)})
                                                    </span>
                                                </p>
                                            ))}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${colorEstado[pedido.estado] ?? 'bg-gray-100'}`}>
                                                {pedido.estado}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-500">
                                            {new Date(pedido.creado_en).toLocaleDateString('es-CO')}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Link href={route('portal.pedidos.ver', pedido.id)}
                                                className="text-xs text-emerald-600 hover:underline">Ver →</Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Paginación */}
                {pedidos.last_page > 1 && (
                    <div className="flex items-center justify-center gap-1">
                        {pedidos.links.map((link, i) => (
                            <Link key={i} href={link.url || '#'}
                                className={`px-3 py-1 text-sm rounded-lg border transition ${link.active ? 'bg-emerald-600 text-white border-emerald-600' : link.url ? 'border-gray-300 text-gray-600 hover:bg-gray-50' : 'border-gray-200 text-gray-300 cursor-default'}`}
                                dangerouslySetInnerHTML={{ __html: link.label }} />
                        ))}
                    </div>
                )}
            </div>
        </PortalLayout>
    );
}
