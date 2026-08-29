/*
|--------------------------------------------------------------------------
| PÁGINA: Marketing/Campanas/Ver.jsx
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué muestra esta página?
|
|   Vista de análisis de una campaña específica:
|   - Métricas clave: presupuesto, ventas, ROI
|   - Tabla de pedidos que vinieron de esta campaña
|   - Información de la campaña (canal, fechas, UTM)
|
*/

import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Ver({ campana, total_ventas, roi, label_canal }) {

    const fmt = (v) => new Intl.NumberFormat('es-CO', {
        style: 'currency', currency: 'COP', minimumFractionDigits: 0,
    }).format(v ?? 0);

    const estadoColor = (estado) => ({
        pendiente:      'bg-yellow-100 text-yellow-700',
        confirmado:     'bg-blue-100 text-blue-700',
        en_preparacion: 'bg-blue-100 text-blue-900',
        enviado:        'bg-gray-100 text-blue-900',
        entregado:      'bg-green-100 text-green-700',
        devuelto:       'bg-orange-100 text-orange-700',
        cancelado:      'bg-red-100 text-red-700',
    }[estado] || 'bg-gray-100 text-gray-600');

    const campanaEstadoColor = (estado) => ({
        activa:     'bg-green-100 text-green-700',
        pausada:    'bg-yellow-100 text-yellow-700',
        finalizada: 'bg-gray-100 text-gray-500',
    }[estado] || '');

    const roiColor = roi === null ? 'text-gray-400'
        : roi >= 100 ? 'text-green-600'
        : roi >= 0   ? 'text-blue-600'
        : 'text-red-600';

    return (
        <AuthenticatedLayout header={
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href={route('campanas.index')} className="text-gray-400 hover:text-gray-600 transition">←</Link>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">{campana.nombre}</h2>
                        <p className="text-sm text-gray-500">{label_canal}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-3 py-1 rounded-full ${campanaEstadoColor(campana.estado)}`}>
                        {campana.estado}
                    </span>
                    <Link href={route('campanas.edit', campana.id)}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition">
                        Editar
                    </Link>
                </div>
            </div>
        }>
            <Head title={campana.nombre} />

            <div className="py-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

                {/* KPIs */}
                <div className="grid grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
                        <div className="text-2xl font-bold text-gray-800">
                            {campana.presupuesto ? fmt(campana.presupuesto) : '—'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Presupuesto invertido</div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
                        <div className="text-2xl font-bold text-emerald-600">{fmt(total_ventas)}</div>
                        <div className="text-xs text-gray-500 mt-1">Ventas generadas</div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
                        <div className={`text-2xl font-bold ${roiColor}`}>
                            {roi !== null ? `${roi > 0 ? '+' : ''}${roi}%` : '—'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">ROI</div>
                        {roi !== null && (
                            <div className="text-xs text-gray-400 mt-0.5">
                                {roi >= 100 ? '🔥 Excelente' : roi >= 0 ? '✅ Positivo' : '⚠️ Negativo'}
                            </div>
                        )}
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
                        <div className="text-2xl font-bold text-gray-800">{campana.pedidos?.length ?? 0}</div>
                        <div className="text-xs text-gray-500 mt-1">Pedidos atribuidos</div>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-6">

                    {/* Info de la campaña */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                        <h3 className="font-semibold text-gray-700 text-sm">Detalles</h3>

                        <div className="space-y-3 text-sm">
                            <div>
                                <div className="text-xs text-gray-500 uppercase">Canal</div>
                                <div className="font-medium text-gray-800">{label_canal}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 uppercase">Fechas</div>
                                <div className="text-gray-800">{campana.fecha_inicio} → {campana.fecha_fin}</div>
                            </div>
                            {campana.codigo_utm && (
                                <div>
                                    <div className="text-xs text-gray-500 uppercase">Código UTM</div>
                                    <code className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                        {campana.codigo_utm}
                                    </code>
                                </div>
                            )}
                            {campana.url_destino && (
                                <div>
                                    <div className="text-xs text-gray-500 uppercase">URL destino</div>
                                    <a href={campana.url_destino} target="_blank" rel="noopener noreferrer"
                                        className="text-xs text-blue-800 hover:underline break-all">
                                        {campana.url_destino}
                                    </a>
                                </div>
                            )}
                            {campana.descripcion && (
                                <div>
                                    <div className="text-xs text-gray-500 uppercase">Descripción</div>
                                    <div className="text-gray-700">{campana.descripcion}</div>
                                </div>
                            )}
                            {campana.notas && (
                                <div>
                                    <div className="text-xs text-gray-500 uppercase">Notas</div>
                                    <div className="text-gray-700 text-xs whitespace-pre-wrap">{campana.notas}</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Pedidos de la campaña */}
                    <div className="col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100">
                            <h3 className="font-semibold text-gray-700 text-sm">
                                Pedidos atribuidos {campana.pedidos?.length > 0 && `(${campana.pedidos.length})`}
                            </h3>
                        </div>

                        {!campana.pedidos || campana.pedidos.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm">
                                Aún no hay pedidos asociados a esta campaña.
                                <div className="mt-2 text-xs text-gray-400">
                                    Los pedidos se asocian al crearlos seleccionando esta campaña.
                                </div>
                            </div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Pedido</th>
                                        <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Cliente</th>
                                        <th className="text-right px-4 py-2 text-xs font-medium text-gray-500">Total</th>
                                        <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Estado</th>
                                        <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Fecha</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {campana.pedidos.map(p => (
                                        <tr key={p.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-2">
                                                <Link href={route('pedidos.show', p.id)}
                                                    className="font-mono text-xs text-blue-800 hover:underline">
                                                    {p.numero_pedido}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-2 text-gray-700 text-xs">{p.cliente_nombre}</td>
                                            <td className="px-4 py-2 text-right font-medium text-gray-800">
                                                {fmt(p.total)}
                                            </td>
                                            <td className="px-4 py-2">
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${estadoColor(p.estado)}`}>
                                                    {p.estado}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 text-xs text-gray-500">
                                                {new Date(p.creado_en).toLocaleDateString('es-CO')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
