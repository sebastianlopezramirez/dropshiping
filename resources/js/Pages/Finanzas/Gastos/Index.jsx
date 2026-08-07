/*
|--------------------------------------------------------------------------
| PÁGINA: Finanzas/Gastos/Index.jsx
|--------------------------------------------------------------------------
|
| Lista de gastos operativos con resumen por categoría.
|
*/

import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index({ gastos, estadisticas, categorias, filtros }) {

    const { flash } = usePage().props;
    const [categoria, setCategoria] = useState(filtros.categoria || '');
    const [periodo, setPeriodo]     = useState(filtros.periodo || '');

    const fmt = (v) => new Intl.NumberFormat('es-CO', {
        style: 'currency', currency: 'COP', minimumFractionDigits: 0,
    }).format(v ?? 0);

    const aplicarFiltros = (e) => {
        e.preventDefault();
        router.get(route('gastos.index'), { categoria, periodo }, { preserveState: true, replace: true });
    };

    const limpiar = () => {
        setCategoria(''); setPeriodo('');
        router.get(route('gastos.index'));
    };

    const eliminar = (gasto) => {
        if (!confirm(`¿Eliminar gasto "${gasto.descripcion}"?`)) return;
        router.delete(route('gastos.destroy', gasto.id), { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800">Gastos Operativos</h2>}>
            <Head title="Gastos Operativos" />

            <div className="py-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

                {flash?.exito && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                        {flash.exito}
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                        <p className="text-xs text-gray-500 mb-1">Total este mes</p>
                        <p className="text-xl font-bold text-red-600">{fmt(estadisticas.total_mes)}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                        <p className="text-xs text-gray-500 mb-1">Gastos hoy</p>
                        <p className="text-xl font-bold text-orange-600">{fmt(estadisticas.total_hoy)}</p>
                    </div>
                    {/* Top 2 categorías del mes */}
                    {Object.entries(estadisticas.por_categoria || {})
                        .sort(([,a],[,b]) => b - a)
                        .slice(0, 2)
                        .map(([cat, monto]) => {
                            const catInfo = categorias.find(c => c.value === cat);
                            return (
                                <div key={cat} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                                    <p className="text-xs text-gray-500 mb-1">{catInfo?.icono} {catInfo?.label ?? cat}</p>
                                    <p className="text-xl font-bold text-gray-700">{fmt(monto)}</p>
                                </div>
                            );
                        })}
                </div>

                {/* Encabezado */}
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Todos los Gastos</h1>
                        <p className="text-sm text-gray-500 mt-1">{gastos.total} registros</p>
                    </div>
                    <Link href={route('gastos.create')}
                        className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition">
                        + Registrar Gasto
                    </Link>
                </div>

                {/* Filtros */}
                <form onSubmit={aplicarFiltros} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <select value={categoria} onChange={e => setCategoria(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <option value="">Todas las categorías</option>
                            {categorias.map(c => (
                                <option key={c.value} value={c.value}>{c.icono} {c.label}</option>
                            ))}
                        </select>
                        <select value={periodo} onChange={e => setPeriodo(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <option value="">Todo el tiempo</option>
                            <option value="mes_actual">Este mes</option>
                            <option value="mes_pasado">Mes pasado</option>
                        </select>
                        <div className="sm:col-span-2 flex gap-2">
                            <button type="submit" className="flex-1 px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition">
                                Filtrar
                            </button>
                            <button type="button" onClick={limpiar} className="px-3 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition">
                                Limpiar
                            </button>
                        </div>
                    </div>
                </form>

                {/* Tabla */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {['Fecha', 'Categoría', 'Descripción', 'Monto', 'Acciones'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {gastos.data.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                                        Sin gastos registrados.{' '}
                                        <Link href={route('gastos.create')} className="text-indigo-600 hover:underline">
                                            Registrar el primero
                                        </Link>
                                    </td>
                                </tr>
                            ) : (
                                gastos.data.map(gasto => {
                                    const catInfo = categorias.find(c => c.value === gasto.categoria);
                                    return (
                                        <tr key={gasto.id} className="hover:bg-gray-50 transition">
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {new Date(gasto.fecha_gasto).toLocaleDateString('es-CO')}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center gap-1 text-sm text-gray-700">
                                                    {catInfo?.icono} {catInfo?.label ?? gasto.categoria}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-sm text-gray-900">{gasto.descripcion}</p>
                                                {gasto.notas && <p className="text-xs text-gray-400 mt-0.5">{gasto.notas}</p>}
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-sm font-semibold text-red-600">{fmt(gasto.monto)}</p>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link href={route('gastos.edit', gasto.id)}
                                                        className="text-xs text-indigo-600 hover:underline">Editar</Link>
                                                    <button onClick={() => eliminar(gasto)}
                                                        className="text-xs text-red-500 hover:underline">Eliminar</button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Paginación */}
                {gastos.last_page > 1 && (
                    <div className="mt-4 flex items-center justify-center gap-1">
                        {gastos.links.map((link, i) => (
                            <Link key={i} href={link.url || '#'}
                                className={`px-3 py-1 text-sm rounded-lg border transition ${link.active ? 'bg-indigo-600 text-white border-indigo-600' : link.url ? 'border-gray-300 text-gray-600 hover:bg-gray-50' : 'border-gray-200 text-gray-300 cursor-default'}`}
                                dangerouslySetInnerHTML={{ __html: link.label }} />
                        ))}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
