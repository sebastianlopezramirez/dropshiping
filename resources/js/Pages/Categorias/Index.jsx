/*
|--------------------------------------------------------------------------
| PÁGINA: Categorias/Index.jsx
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué muestra esta página?
|
|   Lista de todas las categorías con:
|   - Stats: total, activas, raíces
|   - Filtros: buscar, activo, tipo (raíz / subcategoría)
|   - Tabla: nombre, slug, padre, productos, hijos, orden, estado, acciones
|
*/

import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index({ categorias, filtros, stats }) {

    const { flash } = usePage().props;

    const [buscar, setBuscar] = useState(filtros.buscar || '');
    const [activo, setActivo] = useState(filtros.activo || '');
    const [tipo,   setTipo]   = useState(filtros.tipo   || '');

    const aplicarFiltros = (e) => {
        e.preventDefault();
        router.get(route('categorias.index'), { buscar, activo, tipo }, {
            preserveState: true, replace: true,
        });
    };

    const eliminar = (categoria) => {
        if (!confirm(`¿Eliminar la categoría «${categoria.nombre}»?`)) return;
        router.delete(route('categorias.destroy', categoria.id));
    };

    const toggleActivo = (categoria) => {
        const accion = categoria.activo ? 'desactivar' : 'activar';
        const advertencia = categoria.activo && !categoria.padre_id && categoria.hijos_count > 0
            ? `\n⚠️ Esto también desactivará sus ${categoria.hijos_count} subcategoría(s).`
            : '';
        if (!confirm(`¿${accion.charAt(0).toUpperCase() + accion.slice(1)} la categoría «${categoria.nombre}»?${advertencia}`)) return;
        router.patch(route('categorias.toggle', categoria.id), {}, { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout header={
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">Categorías</h2>
                <Link href={route('categorias.create')}
                    className="bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-900 transition">
                    + Nueva Categoría
                </Link>
            </div>
        }>
            <Head title="Categorías" />

            <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

                {/* Flash */}
                {flash?.exito && (
                    <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg px-4 py-3">
                        {flash.exito}
                    </div>
                )}
                {flash?.error && (
                    <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg px-4 py-3">
                        {flash.error}
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: 'Total',   valor: stats.total,   color: 'text-gray-700' },
                        { label: 'Activas', valor: stats.activas, color: 'text-green-700' },
                        { label: 'Raíces',  valor: stats.raices,  color: 'text-blue-700' },
                    ].map(s => (
                        <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                            <div className={`text-2xl font-bold ${s.color}`}>{s.valor}</div>
                            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Filtros */}
                <form onSubmit={aplicarFiltros} className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex flex-wrap gap-3 items-end">
                        <div className="flex-1 min-w-48">
                            <input type="text" value={buscar} onChange={e => setBuscar(e.target.value)}
                                placeholder="Buscar por nombre o slug..."
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-700 focus:border-transparent" />
                        </div>
                        <select value={activo} onChange={e => setActivo(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                            <option value="">Todas</option>
                            <option value="true">Activas</option>
                            <option value="false">Inactivas</option>
                        </select>
                        <select value={tipo} onChange={e => setTipo(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                            <option value="">Todas</option>
                            <option value="raiz">Solo raíces</option>
                            <option value="sub">Solo subcategorías</option>
                        </select>
                        <button type="submit"
                            className="bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-900 transition">
                            Filtrar
                        </button>
                        {(buscar || activo || tipo) && (
                            <button type="button"
                                onClick={() => { setBuscar(''); setActivo(''); setTipo(''); router.get(route('categorias.index')); }}
                                className="text-sm text-gray-500 hover:text-gray-700 underline">
                                Limpiar
                            </button>
                        )}
                    </div>
                </form>

                {/* Tabla */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto"><table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Nombre</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Slug</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Padre</th>
                                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Productos</th>
                                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Hijos</th>
                                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Orden</th>
                                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Estado</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {categorias.data.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-12 text-gray-400 text-sm">
                                        No se encontraron categorías.
                                    </td>
                                </tr>
                            ) : categorias.data.map(cat => (
                                <tr key={cat.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-gray-800">
                                        {cat.padre_id && (
                                            <span className="text-gray-400 mr-1">└</span>
                                        )}
                                        {cat.nombre}
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{cat.slug}</td>
                                    <td className="px-4 py-3 text-gray-600 text-xs">
                                        {cat.padre ? cat.padre.nombre : <span className="text-gray-400">—</span>}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`font-semibold ${cat.productos_count > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                                            {cat.productos_count}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center text-gray-600">{cat.hijos_count}</td>
                                    <td className="px-4 py-3 text-center text-gray-500">{cat.orden}</td>
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            onClick={() => toggleActivo(cat)}
                                            title={cat.activo ? 'Clic para desactivar' : 'Clic para activar'}
                                            className="inline-flex items-center gap-1.5 group"
                                        >
                                            {/* Toggle pill */}
                                            <span className={`relative inline-block w-9 h-5 rounded-full transition-colors duration-200
                                                ${cat.activo ? 'bg-green-500' : 'bg-gray-300'}`}>
                                                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200
                                                    ${cat.activo ? 'translate-x-4' : 'translate-x-0'}`} />
                                            </span>
                                            <span className={`text-xs font-medium transition-colors
                                                ${cat.activo ? 'text-green-700' : 'text-gray-400'}`}>
                                                {cat.activo ? 'Activa' : 'Inactiva'}
                                            </span>
                                        </button>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link href={route('categorias.edit', cat.id)}
                                                className="text-xs text-blue-800 hover:text-blue-900 font-medium">
                                                Editar
                                            </Link>
                                            <button onClick={() => eliminar(cat)}
                                                className="text-xs text-red-500 hover:text-red-700 font-medium">
                                                Eliminar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table></div>

                    {/* Paginación */}
                    {categorias.last_page > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
                            <span className="text-xs text-gray-500">
                                Mostrando {categorias.from}–{categorias.to} de {categorias.total}
                            </span>
                            <div className="flex gap-2">
                                {categorias.links.map((link, i) => (
                                    <button key={i} disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url)}
                                        className={`px-3 py-1 text-xs rounded border transition
                                            ${link.active
                                                ? 'bg-blue-800 text-white border-blue-800'
                                                : link.url
                                                    ? 'border-gray-300 text-gray-600 hover:bg-gray-100'
                                                    : 'border-gray-200 text-gray-300 cursor-not-allowed'}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </AuthenticatedLayout>
    );
}
