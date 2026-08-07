/*
|--------------------------------------------------------------------------
| PÁGINA: Portal/VerPedido.jsx
|--------------------------------------------------------------------------
|
| Detalle de un pedido específico.
| Solo muestra los ítems del proveedor, no los de otros proveedores.
|
*/

import { Head, Link } from '@inertiajs/react';
import PortalLayout from '@/Layouts/PortalLayout';

export default function VerPedido({ proveedor, pedido }) {

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

    // Total del proveedor = suma de precio_costo × cantidad de sus ítems
    const totalProveedor = pedido.items?.reduce(
        (sum, item) => sum + (parseFloat(item.precio_costo) * item.cantidad), 0
    ) ?? 0;

    return (
        <PortalLayout header={
            <div className="flex items-center gap-2 text-sm text-gray-500">
                <Link href={route('portal.pedidos')} className="hover:text-emerald-600">Pedidos</Link>
                <span>/</span>
                <span className="text-gray-900">{pedido.numero_pedido}</span>
            </div>
        }>
            <Head title={pedido.numero_pedido} />

            <div className="py-8 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

                {/* Encabezado del pedido */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{pedido.numero_pedido}</h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Creado el {new Date(pedido.creado_en).toLocaleDateString('es-CO', {
                                    year: 'numeric', month: 'long', day: 'numeric'
                                })}
                            </p>
                        </div>
                        <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${colorEstado[pedido.estado] ?? 'bg-gray-100'}`}>
                            {pedido.estado}
                        </span>
                    </div>

                    {/* Dirección de envío */}
                    {pedido.direccion_envio && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Envío a</p>
                            <p className="text-sm text-gray-700">{pedido.cliente_nombre}</p>
                            <p className="text-sm text-gray-500">
                                {pedido.direccion_envio?.calle}, {pedido.direccion_envio?.ciudad}, {pedido.direccion_envio?.departamento}
                            </p>
                            {pedido.cliente_telefono && (
                                <p className="text-sm text-gray-500">{pedido.cliente_telefono}</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Mis ítems en este pedido */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h3 className="font-semibold text-gray-800">Mis productos en este pedido</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Solo se muestran los productos que tú provees</p>
                    </div>
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50">
                            <tr>
                                {['Producto', 'Cantidad', 'Precio unitario', 'Mi precio (costo)', 'Subtotal (costo)'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {pedido.items?.map(item => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <p className="text-sm font-medium text-gray-900">{item.nombre_producto}</p>
                                        {item.sku && <p className="text-xs text-gray-400">SKU: {item.sku}</p>}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-700">{item.cantidad}</td>
                                    <td className="px-4 py-3 text-sm text-gray-700">{fmt(item.precio_unitario)}</td>
                                    <td className="px-4 py-3">
                                        <span className="text-sm font-medium text-emerald-700">{fmt(item.precio_costo)}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-sm font-semibold text-gray-900">
                                            {fmt(parseFloat(item.precio_costo) * item.cantidad)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-emerald-50">
                            <tr>
                                <td colSpan={4} className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                                    Total a cobrar por este pedido:
                                </td>
                                <td className="px-4 py-3">
                                    <span className="text-base font-bold text-emerald-700">{fmt(totalProveedor)}</span>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Notas del pedido */}
                {pedido.notas && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                        <p className="text-xs font-medium text-yellow-700 uppercase tracking-wider mb-1">Nota del pedido</p>
                        <p className="text-sm text-yellow-800">{pedido.notas}</p>
                    </div>
                )}

                <div className="flex justify-start">
                    <Link href={route('portal.pedidos')}
                        className="px-4 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition">
                        ← Volver a pedidos
                    </Link>
                </div>
            </div>
        </PortalLayout>
    );
}
