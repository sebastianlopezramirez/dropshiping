/*
|--------------------------------------------------------------------------
| PÁGINA: Portal/Pagos.jsx
|--------------------------------------------------------------------------
|
| Resumen de comisiones y pagos pendientes del proveedor.
|
| PENSAR — ¿Qué significa "deuda" aquí?
|
|   En dropshipping, el proveedor nos vende a precio_costo.
|   Cuando un pedido se entrega, le debemos: precio_costo × cantidad.
|   La diferencia (precio_unitario - precio_costo) es nuestra ganancia.
|
|   "totalDeuda" = lo que el negocio le debe al proveedor
|                = SUM(precio_costo × cantidad) en pedidos entregados
|
*/

import { Head } from '@inertiajs/react';
import PortalLayout from '@/Layouts/PortalLayout';

export default function Pagos({ proveedor, totalDeuda, totalVentas, historialMensual, topProductos }) {

    const fmt = (v) => new Intl.NumberFormat('es-CO', {
        style: 'currency', currency: 'COP', minimumFractionDigits: 0,
    }).format(v ?? 0);

    // Margen del negocio = totalVentas - totalDeuda
    const margenNegocio = totalVentas - totalDeuda;
    const porcentajeMargen = totalVentas > 0
        ? ((margenNegocio / totalVentas) * 100).toFixed(1)
        : 0;

    return (
        <PortalLayout header={<h2 className="text-xl font-semibold text-gray-800">Mis Pagos y Comisiones</h2>}>
            <Head title="Mis Pagos" />

            <div className="py-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

                {/* KPIs principales */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5">
                        <p className="text-xs text-emerald-600 font-medium mb-1">Lo que te deben</p>
                        <p className="text-2xl font-bold text-emerald-700">{fmt(totalDeuda)}</p>
                        <p className="text-xs text-emerald-500 mt-1">Pedidos entregados sin pagar</p>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
                        <p className="text-xs text-gray-500 font-medium mb-1">Ventas totales (precio cliente)</p>
                        <p className="text-2xl font-bold text-gray-900">{fmt(totalVentas)}</p>
                        <p className="text-xs text-gray-400 mt-1">Suma de lo que pagaron los clientes</p>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
                        <p className="text-xs text-gray-500 font-medium mb-1">Margen del negocio</p>
                        <p className="text-2xl font-bold text-indigo-600">{fmt(margenNegocio)}</p>
                        <p className="text-xs text-gray-400 mt-1">{porcentajeMargen}% sobre ventas</p>
                    </div>
                </div>

                {/* Alerta de deuda pendiente */}
                {totalDeuda > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
                        <span className="text-2xl">⏳</span>
                        <div>
                            <p className="font-medium text-yellow-800">Pago pendiente</p>
                            <p className="text-sm text-yellow-700 mt-0.5">
                                El negocio te debe <strong>{fmt(totalDeuda)}</strong> por pedidos ya entregados.
                                Contacta al administrador para coordinar el pago.
                            </p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Historial mensual */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <h3 className="font-semibold text-gray-800">Historial (últimos 6 meses)</h3>
                        </div>
                        {historialMensual.length === 0 ? (
                            <div className="px-6 py-12 text-center text-gray-400">
                                Sin historial de ventas todavía.
                            </div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {['Mes', 'Pedidos', 'Lo que te deben'].map(h => (
                                            <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {historialMensual.map(fila => (
                                        <tr key={fila.mes} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{fila.mes_label}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{fila.pedidos}</td>
                                            <td className="px-4 py-3 text-sm font-semibold text-emerald-700">{fmt(fila.deuda)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Top productos */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <h3 className="font-semibold text-gray-800">Top 5 productos más vendidos</h3>
                        </div>
                        {topProductos.length === 0 ? (
                            <div className="px-6 py-12 text-center text-gray-400">
                                Sin ventas registradas todavía.
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {topProductos.map((prod, i) => (
                                    <div key={i} className="px-6 py-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center">
                                                {i + 1}
                                            </span>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{prod.nombre_producto}</p>
                                                <p className="text-xs text-gray-400">{prod.unidades} unidades vendidas</p>
                                            </div>
                                        </div>
                                        <span className="text-sm font-semibold text-emerald-700">{fmt(prod.total_costo)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PortalLayout>
    );
}
