/*
|--------------------------------------------------------------------------
| PÁGINA: Marketing/Campanas/Index.jsx
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué muestra esta página?
|
|   Lista de campañas de marketing con métricas de rendimiento:
|   - Canal (Instagram, TikTok, Google…)
|   - Fechas + estado (activa, pausada, finalizada)
|   - Pedidos generados y ventas totales
|   - ROI: ((ventas - presupuesto) / presupuesto) × 100
|
*/

import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index({ campanas, estadisticas, canales, estados, filtros }) {

    const { flash } = usePage().props;
    const [buscar, setBuscar] = useState(filtros.buscar || '');
    const [canal,  setCanal]  = useState(filtros.canal  || '');
    const [estado, setEstado] = useState(filtros.estado || '');

    const fmt = (v) => new Intl.NumberFormat('es-CO', {
        style: 'currency', currency: 'COP', minimumFractionDigits: 0,
    }).format(v ?? 0);

    const aplicarFiltros = (e) => {
        e.preventDefault();
        router.get(route('campanas.index'), { buscar, canal, estado }, {
            preserveState: true, replace: true,
        });
    };

    const limpiar = () => {
        setBuscar(''); setCanal(''); setEstado('');
        router.get(route('campanas.index'));
    };

    const eliminar = (campana) => {
        if (!confirm(`¿Eliminar la campaña "${campana.nombre}"? Esta acción no se puede deshacer.`)) return;
        router.delete(route('campanas.destroy', campana.id), { preserveScroll: true });
    };

    // ── Helpers de presentación ────────────────────────────────────────────

    const estadoColor = (estado) => ({
        activa:     'bg-green-100 text-green-700',
        pausada:    'bg-yellow-100 text-yellow-700',
        finalizada: 'bg-gray-100 text-gray-500',
    }[estado] || 'bg-gray-100 text-gray-500');

    const roiColor = (roi) => {
        if (roi === null || roi === undefined) return 'text-gray-400';
        if (roi >= 100) return 'text-green-600 font-bold';
        if (roi >= 0)   return 'text-blue-600';
        return 'text-red-600';
    };

    return (
        <AuthenticatedLayout header={
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">Campañas de Marketing</h2>
                <Link href={route('campanas.create')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition">
                    <span className="text-base leading-none">+</span> Nueva Campaña
                </Link>
            </div>
        }>
            <Head title="Campañas" />

            <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Flash */}
                {flash?.exito && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                        {flash.exito}
                    </div>
                )}
                {flash?.error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {flash.error}
                    </div>
                )}

                {/* Estadísticas */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    {[
                        { label: 'Total campañas',  valor: estadisticas.total,       color: 'text-gray-700' },
                        { label: 'Activas',          valor: estadisticas.activas,     color: 'text-green-600' },
                        { label: 'Finalizadas',      valor: estadisticas.finalizadas, color: 'text-gray-500' },
                    ].map(s => (
                        <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                            <div className={`text-2xl font-bold ${s.color}`}>{s.valor}</div>
                            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Filtros */}
                <form onSubmit={aplicarFiltros} className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap gap-3 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Buscar campaña</label>
                        <input value={buscar} onChange={e => setBuscar(e.target.value)}
                            placeholder="Nombre o UTM..."
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
                    </div>
                    <div className="min-w-[150px]">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Canal</label>
                        <select value={canal} onChange={e => setCanal(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                            <option value="">Todos</option>
                            {canales.map(c => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="min-w-[130px]">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Estado</label>
                        <select value={estado} onChange={e => setEstado(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                            <option value="">Todos</option>
                            {estados.map(e => (
                                <option key={e.value} value={e.value}>{e.label}</option>
                            ))}
                        </select>
                    </div>
                    <button type="submit" className="px-4 py-2 bg-gray-800 text-white text-sm rounded-lg hover:bg-gray-700 transition">
                        Filtrar
                    </button>
                    <button type="button" onClick={limpiar} className="px-4 py-2 text-gray-600 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                        Limpiar
                    </button>
                </form>

                {/* Tabla */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Campaña</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Canal</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Fechas</th>
                                <th className="text-right px-4 py-3 font-medium text-gray-600">Presupuesto</th>
                                <th className="text-right px-4 py-3 font-medium text-gray-600">Ventas</th>
                                <th className="text-right px-4 py-3 font-medium text-gray-600">ROI</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
                                <th className="text-right px-4 py-3 font-medium text-gray-600">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {campanas.data.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-12 text-gray-400">
                                        No hay campañas. <Link href={route('campanas.create')} className="text-purple-600 hover:underline">Crear la primera →</Link>
                                    </td>
                                </tr>
                            ) : campanas.data.map(c => (
                                <tr key={c.id} className="hover:bg-gray-50 transition">
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-gray-800">{c.nombre}</div>
                                        {c.codigo_utm && (
                                            <div className="text-xs font-mono text-gray-400 mt-0.5">utm: {c.codigo_utm}</div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">{c.label_canal || c.canal}</td>
                                    <td className="px-4 py-3 text-xs text-gray-600">
                                        <div>{c.fecha_inicio}</div>
                                        <div className="text-gray-400">→ {c.fecha_fin}</div>
                                    </td>
                                    <td className="px-4 py-3 text-right text-gray-700">
                                        {c.presupuesto ? fmt(c.presupuesto) : <span className="text-gray-400">—</span>}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="font-medium text-gray-800">{fmt(c.total_ventas)}</div>
                                        <div className="text-xs text-gray-400">{c.pedidos_count} pedido{c.pedidos_count !== 1 ? 's' : ''}</div>
                                    </td>
                                    <td className={`px-4 py-3 text-right text-sm ${roiColor(c.roi)}`}>
                                        {c.roi !== null && c.roi !== undefined
                                            ? `${c.roi > 0 ? '+' : ''}${c.roi}%`
                                            : <span className="text-gray-400">—</span>
                                        }
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${estadoColor(c.estado)}`}>
                                            {c.estado}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link href={route('campanas.show', c.id)}
                                                className="text-xs px-3 py-1 border border-purple-200 rounded-lg text-purple-600 hover:bg-purple-50 transition">
                                                Ver
                                            </Link>
                                            <Link href={route('campanas.edit', c.id)}
                                                className="text-xs px-3 py-1 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition">
                                                Editar
                                            </Link>
                                            {c.pedidos_count === 0 && (
                                                <button onClick={() => eliminar(c)}
                                                    className="text-xs px-3 py-1 border border-red-200 rounded-lg text-red-600 hover:bg-red-50 transition">
                                                    Eliminar
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {campanas.last_page > 1 && (
                        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600">
                            <span>Página {campanas.current_page} de {campanas.last_page}</span>
                            <div className="flex gap-2">
                                {campanas.prev_page_url && (
                                    <Link href={campanas.prev_page_url} className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50">← Anterior</Link>
                                )}
                                {campanas.next_page_url && (
                                    <Link href={campanas.next_page_url} className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50">Siguiente →</Link>
                                )}
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </AuthenticatedLayout>
    );
}
