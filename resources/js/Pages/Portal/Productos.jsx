/*
|--------------------------------------------------------------------------
| PÁGINA: Portal/Productos.jsx
|--------------------------------------------------------------------------
|
| Lista de productos que el proveedor tiene asignados.
| Los datos del pivot (precio, stock) vienen en producto.pivot.
|
*/

import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import PortalLayout from '@/Layouts/PortalLayout';

export default function Productos({ proveedor, productos, filtros }) {

    const { flash } = usePage().props;
    const [buscar, setBuscar] = useState(filtros.buscar || '');
    const [estado, setEstado] = useState(filtros.estado || '');

    const fmt = (v) => new Intl.NumberFormat('es-CO', {
        style: 'currency', currency: 'COP', minimumFractionDigits: 0,
    }).format(v ?? 0);

    const aplicarFiltros = (e) => {
        e.preventDefault();
        router.get(route('portal.productos'), { buscar, estado }, { preserveState: true, replace: true });
    };

    const limpiar = () => {
        setBuscar(''); setEstado('');
        router.get(route('portal.productos'));
    };

    const colorEstado = {
        activo:   'bg-green-100 text-green-800',
        inactivo: 'bg-gray-100 text-gray-600',
        agotado:  'bg-red-100 text-red-800',
    };

    return (
        <PortalLayout header={<h2 className="text-xl font-semibold text-gray-800">Mis Productos</h2>}>
            <Head title="Mis Productos" />

            <div className="py-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

                {flash?.exito && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                        {flash.exito}
                    </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-500">{productos.total} productos asignados</p>
                    <Link
                        href={route('portal.productos.crear')}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition"
                    >
                        <span className="text-base leading-none">+</span>
                        Agregar Producto
                    </Link>
                </div>

                {/* Filtros */}
                <form onSubmit={aplicarFiltros} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <input type="text" placeholder="Buscar por nombre o SKU..."
                            value={buscar} onChange={e => setBuscar(e.target.value)}
                            className="sm:col-span-2 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        <select value={estado} onChange={e => setEstado(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                            <option value="">Todos los estados</option>
                            <option value="activo">Activo</option>
                            <option value="inactivo">Inactivo</option>
                            <option value="agotado">Agotado</option>
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
                                {['Producto', 'Categoría', 'Mi Precio', 'Stock', 'Estado', 'Acciones'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {productos.data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                                        No tienes productos asignados todavía.
                                    </td>
                                </tr>
                            ) : (
                                productos.data.map(producto => (
                                    <tr key={producto.id} className="hover:bg-gray-50 transition">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                {producto.imagen_principal_url ? (
                                                    <img src={producto.imagen_principal_url}
                                                        className="w-10 h-10 rounded-lg object-cover border border-gray-200" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                                                        📦
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{producto.nombre}</p>
                                                    <p className="text-xs text-gray-400">{producto.sku}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {producto.categoria?.nombre ?? '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-sm font-semibold text-emerald-700">
                                                {fmt(producto.pivot?.precio)}
                                            </p>
                                            <p className="text-xs text-gray-400">SKU prov: {producto.pivot?.sku_proveedor ?? '—'}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className={`text-sm font-medium ${(producto.pivot?.stock ?? 0) > 0 ? 'text-gray-900' : 'text-red-600'}`}>
                                                {producto.pivot?.stock ?? 0} uds.
                                            </p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${colorEstado[producto.estado] ?? 'bg-gray-100 text-gray-600'}`}>
                                                {producto.estado}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Link href={route('portal.productos.editar', producto.id)}
                                                className="text-xs text-emerald-600 hover:underline font-medium">
                                                Editar
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Paginación */}
                {productos.last_page > 1 && (
                    <div className="mt-4 flex items-center justify-center gap-1">
                        {productos.links.map((link, i) => (
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
