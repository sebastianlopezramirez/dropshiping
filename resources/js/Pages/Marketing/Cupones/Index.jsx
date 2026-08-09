/*
|--------------------------------------------------------------------------
| PÁGINA: Marketing/Cupones/Index.jsx
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué muestra esta página?
|
|   Lista de todos los cupones de descuento con:
|   - Filtros por tipo y estado
|   - Estadísticas: total, activos, vigentes
|   - Por cada cupón: código, tipo, valor, usos, validez
|   - Acciones: editar, desactivar
|
*/

import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index({ cupones, estadisticas, filtros }) {

    const { flash } = usePage().props;
    const [buscar, setBuscar] = useState(filtros.buscar || '');
    const [tipo,   setTipo]   = useState(filtros.tipo   || '');
    const [activo, setActivo] = useState(filtros.activo || '');

    // ── Formateo de pesos colombianos ──────────────────────────────────────
    const fmt = (v) => new Intl.NumberFormat('es-CO', {
        style: 'currency', currency: 'COP', minimumFractionDigits: 0,
    }).format(v ?? 0);

    const aplicarFiltros = (e) => {
        e.preventDefault();
        router.get(route('cupones.index'), { buscar, tipo, activo }, {
            preserveState: true, replace: true,
        });
    };

    const limpiar = () => {
        setBuscar(''); setTipo(''); setActivo('');
        router.get(route('cupones.index'));
    };

    const desactivar = (cupon) => {
        if (!confirm(`¿Desactivar el cupón "${cupon.codigo}"? El historial de uso se mantendrá.`)) return;
        router.delete(route('cupones.destroy', cupon.id), { preserveScroll: true });
    };

    // ── Helpers de presentación ────────────────────────────────────────────
    const labelTipo = (tipo) => tipo === 'porcentaje' ? '% Porcentaje' : '$ Valor fijo';

    const valorFormateado = (cupon) =>
        cupon.tipo === 'porcentaje'
            ? `${cupon.valor}%`
            : fmt(cupon.valor);

    const estadoColor = (activo) =>
        activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500';

    const vigenciaTexto = (cupon) => {
        if (!cupon.fecha_expiracion) return 'Sin expiración';
        const hoy = new Date();
        const exp = new Date(cupon.fecha_expiracion);
        return exp < hoy ? '⚠️ Expirado' : `Hasta ${cupon.fecha_expiracion}`;
    };

    return (
        <AuthenticatedLayout header={
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">Cupones de Descuento</h2>
                <Link href={route('cupones.create')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition">
                    <span className="text-base leading-none">+</span> Nuevo Cupón
                </Link>
            </div>
        }>
            <Head title="Cupones" />

            <div className="py-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

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
                        { label: 'Total cupones', valor: estadisticas.total, color: 'text-gray-700' },
                        { label: 'Activos',       valor: estadisticas.activos, color: 'text-green-600' },
                        { label: 'Vigentes hoy',  valor: estadisticas.vigentes, color: 'text-emerald-600' },
                    ].map(s => (
                        <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                            <div className={`text-2xl font-bold ${s.color}`}>{s.valor}</div>
                            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Filtros */}
                <form onSubmit={aplicarFiltros} className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap gap-3 items-end">
                    <div className="flex-1 min-w-[180px]">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Buscar código</label>
                        <input value={buscar} onChange={e => setBuscar(e.target.value)}
                            placeholder="VERANO20, BLACK..."
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                    </div>
                    <div className="min-w-[140px]">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
                        <select value={tipo} onChange={e => setTipo(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                            <option value="">Todos</option>
                            <option value="porcentaje">% Porcentaje</option>
                            <option value="valor_fijo">$ Valor fijo</option>
                        </select>
                    </div>
                    <div className="min-w-[130px]">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Estado</label>
                        <select value={activo} onChange={e => setActivo(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                            <option value="">Todos</option>
                            <option value="true">Activos</option>
                            <option value="false">Inactivos</option>
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
                    <div className="overflow-x-auto"><table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Código</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Tipo / Valor</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Mínimo compra</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Usos</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Vigencia</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
                                <th className="text-right px-4 py-3 font-medium text-gray-600">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {cupones.data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-12 text-gray-400">
                                        No hay cupones. <Link href={route('cupones.create')} className="text-emerald-600 hover:underline">Crear el primero →</Link>
                                    </td>
                                </tr>
                            ) : cupones.data.map(cupon => (
                                <tr key={cupon.id} className="hover:bg-gray-50 transition">
                                    <td className="px-4 py-3">
                                        <span className="font-mono font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
                                            {cupon.codigo}
                                        </span>
                                        {cupon.descripcion && (
                                            <div className="text-xs text-gray-500 mt-0.5">{cupon.descripcion}</div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-semibold text-gray-800">{valorFormateado(cupon)}</div>
                                        <div className="text-xs text-gray-500">{labelTipo(cupon.tipo)}</div>
                                        {cupon.maximo_descuento && (
                                            <div className="text-xs text-orange-600">Tope: {fmt(cupon.maximo_descuento)}</div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {cupon.minimo_compra > 0 ? fmt(cupon.minimo_compra) : <span className="text-gray-400">Sin mínimo</span>}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-gray-800 font-medium">{cupon.usos_actuales}</span>
                                        {cupon.limite_usos && (
                                            <span className="text-gray-400"> / {cupon.limite_usos}</span>
                                        )}
                                        {cupon.pedidos_count > 0 && (
                                            <div className="text-xs text-gray-400">{cupon.pedidos_count} pedido{cupon.pedidos_count !== 1 ? 's' : ''}</div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-600">
                                        {vigenciaTexto(cupon)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${estadoColor(cupon.activo)}`}>
                                            {cupon.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link href={route('cupones.edit', cupon.id)}
                                                className="text-xs px-3 py-1 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition">
                                                Editar
                                            </Link>
                                            {cupon.activo && (
                                                <button onClick={() => desactivar(cupon)}
                                                    className="text-xs px-3 py-1 border border-red-200 rounded-lg text-red-600 hover:bg-red-50 transition">
                                                    Desactivar
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table></div>

                    {/* Paginación */}
                    {cupones.last_page > 1 && (
                        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600">
                            <span>Página {cupones.current_page} de {cupones.last_page}</span>
                            <div className="flex gap-2">
                                {cupones.prev_page_url && (
                                    <Link href={cupones.prev_page_url} className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50">← Anterior</Link>
                                )}
                                {cupones.next_page_url && (
                                    <Link href={cupones.next_page_url} className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50">Siguiente →</Link>
                                )}
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </AuthenticatedLayout>
    );
}
