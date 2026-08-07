/*
|--------------------------------------------------------------------------
| PÁGINA: Portal/Dashboard.jsx
|--------------------------------------------------------------------------
|
| Pantalla principal del proveedor al entrar al portal.
| Muestra: resumen de estadísticas + últimos pedidos con sus productos.
|
*/

import { Head, Link } from '@inertiajs/react';
import PortalLayout from '@/Layouts/PortalLayout';

export default function Dashboard({ proveedor, estadisticas, ultimosPedidos }) {

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

    return (
        <PortalLayout header={
            <div>
                <h2 className="text-xl font-semibold text-gray-800">
                    Bienvenido, {proveedor.nombre_empresa}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                    {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
            </div>
        }>
            <Head title="Portal Proveedor" />

            <div className="py-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

                {/* ── Estadísticas ──────────────────────────────────── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { label: 'Mis productos',     valor: estadisticas.total_productos,    color: 'text-gray-900',     bg: 'bg-white' },
                        { label: 'Productos activos', valor: estadisticas.productos_activos,  color: 'text-emerald-600',  bg: 'bg-emerald-50' },
                        { label: 'Pedidos pendientes',valor: estadisticas.pedidos_pendientes, color: 'text-orange-600',   bg: 'bg-orange-50' },
                        { label: 'Ventas del mes',    valor: fmt(estadisticas.ventas_mes),    color: 'text-emerald-700',  bg: 'bg-emerald-50' },
                    ].map((s, i) => (
                        <div key={i} className={`rounded-xl border border-gray-100 shadow-sm p-4 ${s.bg}`}>
                            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                            <p className={`text-xl font-bold ${s.color}`}>{s.valor}</p>
                        </div>
                    ))}
                </div>

                {/* ── Accesos rápidos ───────────────────────────────── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { href: route('portal.productos'), label: 'Ver mis productos', icono: '📦', color: 'border-emerald-200 hover:bg-emerald-50' },
                        { href: route('portal.pedidos'),   label: 'Ver pedidos',       icono: '🛒', color: 'border-blue-200 hover:bg-blue-50' },
                        { href: route('portal.pagos'),     label: 'Mis pagos',         icono: '💰', color: 'border-yellow-200 hover:bg-yellow-50' },
                        { href: route('portal.pedidos'),   label: 'Pendientes',        icono: '⏳', color: 'border-orange-200 hover:bg-orange-50' },
                    ].map((a, i) => (
                        <Link key={i} href={a.href}
                            className={`flex flex-col items-center justify-center p-4 bg-white rounded-xl border ${a.color} transition text-center`}>
                            <span className="text-2xl mb-1">{a.icono}</span>
                            <span className="text-xs font-medium text-gray-700">{a.label}</span>
                        </Link>
                    ))}
                </div>

                {/* ── Últimos pedidos ───────────────────────────────── */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-800">Últimos pedidos con mis productos</h3>
                        <Link href={route('portal.pedidos')}
                            className="text-sm text-emerald-600 hover:underline">Ver todos →</Link>
                    </div>

                    {ultimosPedidos.length === 0 ? (
                        <div className="px-6 py-12 text-center text-gray-400">
                            <p className="text-4xl mb-2">📋</p>
                            <p>Aún no hay pedidos con tus productos.</p>
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50">
                                <tr>
                                    {['Pedido', 'Cliente', 'Mis productos', 'Estado', 'Fecha', ''].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {ultimosPedidos.map(pedido => (
                                    <tr key={pedido.id} className="hover:bg-gray-50 transition">
                                        <td className="px-4 py-3">
                                            <span className="text-sm font-medium text-emerald-600">{pedido.numero_pedido}</span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{pedido.cliente_nombre}</td>
                                        <td className="px-4 py-3">
                                            {pedido.items?.map(item => (
                                                <p key={item.id} className="text-xs text-gray-600">
                                                    {item.nombre_producto} × {item.cantidad}
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
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </PortalLayout>
    );
}
