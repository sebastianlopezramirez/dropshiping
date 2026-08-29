/*
|--------------------------------------------------------------------------
| PÁGINA: Pedidos/Index.jsx — Vista dividida
|--------------------------------------------------------------------------
|
| ENTENDER — Dos secciones:
|   1. PENDIENTES — pedidos que requieren gestión inmediata (destacados)
|   2. HISTORIAL  — confirmados, entregados, cancelados (con filtros)
|
*/

import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index({ pendientes, historial, estadisticas, estados, filtros }) {

    const { flash } = usePage().props;

    const [buscar, setBuscar]   = useState(filtros.buscar || '');
    const [estado, setEstado]   = useState(filtros.estado || '');
    const [periodo, setPeriodo] = useState(filtros.periodo || '');

    // ── MODAL DE CONFIRMACIÓN DE PAGO ─────────────────────────────────────
    const [modalConfirmar, setModalConfirmar] = useState(null);
    const [metodoPagoModal, setMetodoPagoModal] = useState('efectivo');
    const [confirmando, setConfirmando] = useState(false);

    const aplicarFiltros = (e) => {
        e.preventDefault();
        router.get(route('pedidos.index'), { buscar, estado, periodo }, {
            preserveState: true,
            replace: true,
        });
    };

    const limpiarFiltros = () => {
        setBuscar(''); setEstado(''); setPeriodo('');
        router.get(route('pedidos.index'));
    };

    const cambiarEstado = (pedido, nuevoEstado) => {
        if (nuevoEstado === 'confirmado') {
            setModalConfirmar(pedido);
            setMetodoPagoModal('efectivo');
            return;
        }
        router.patch(route('pedidos.estado', pedido.id), { estado: nuevoEstado }, {
            preserveScroll: true,
        });
    };

    const confirmarConPago = () => {
        if (!modalConfirmar) return;
        setConfirmando(true);
        router.patch(
            route('pedidos.estado', modalConfirmar.id),
            { estado: 'confirmado', metodo_pago_confirmacion: metodoPagoModal },
            {
                preserveScroll: true,
                onFinish: () => { setConfirmando(false); setModalConfirmar(null); },
            }
        );
    };

    const eliminarPedido = (pedido) => {
        if (!confirm(`¿Eliminar el pedido ${pedido.numero_pedido}?`)) return;
        router.delete(route('pedidos.destroy', pedido.id), { preserveScroll: true });
    };

    const fmt = (v) => new Intl.NumberFormat('es-CO', {
        style: 'currency', currency: 'COP', minimumFractionDigits: 0,
    }).format(v ?? 0);

    const colorEstado = {
        pendiente:  'bg-yellow-100 text-yellow-800',
        confirmado: 'bg-blue-100 text-blue-800',
        entregado:  'bg-green-100 text-green-800',
        cancelado:  'bg-red-100 text-red-800',
    };

    const siguienteEstado = { pendiente: 'confirmado', confirmado: 'entregado' };

    const etiquetaEstado = {
        pendiente:  'Pendiente',
        confirmado: 'Confirmado',
        entregado:  'Entregado',
        cancelado:  'Cancelado',
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800">Pedidos</h2>}>
            <Head title="Pedidos" />

            <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

                {flash?.exito && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                        {flash.exito}
                    </div>
                )}

                {/* ── ESTADÍSTICAS ──────────────────────────────────────────── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { label: 'Pedidos hoy',    valor: estadisticas.total_hoy,   color: 'text-blue-800' },
                        { label: 'Pendientes',      valor: estadisticas.pendientes,  color: 'text-yellow-600' },
                        { label: 'Confirmados',     valor: estadisticas.confirmados, color: 'text-blue-600' },
                        { label: 'Ventas del mes',  valor: fmt(estadisticas.total_mes), color: 'text-green-600' },
                    ].map((s, i) => (
                        <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                            <p className={`text-xl font-bold ${s.color}`}>{s.valor}</p>
                        </div>
                    ))}
                </div>

                {/* ══ SECCIÓN 1: PENDIENTES ══════════════════════════════════ */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse inline-block"/>
                            <h2 className="text-base font-bold text-gray-900">
                                Pendientes de gestión
                                {pendientes.length > 0 && (
                                    <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-xs font-bold">
                                        {pendientes.length}
                                    </span>
                                )}
                            </h2>
                        </div>
                        <Link href={route('pedidos.create')}
                            className="px-3 py-1.5 bg-blue-800 text-white text-xs font-medium rounded-lg hover:bg-blue-900 transition">
                            + Nuevo pedido
                        </Link>
                    </div>

                    {pendientes.length === 0 ? (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center text-green-700 text-sm">
                            ✓ Sin pedidos pendientes — todo al día
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {pendientes.map(pedido => (
                                <div key={pedido.id}
                                    className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-sm font-bold text-blue-900">{pedido.numero_pedido}</span>
                                            <span className="text-xs text-gray-400">
                                                {new Date(pedido.creado_en).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-sm font-semibold text-gray-900 mt-0.5">{pedido.cliente_nombre}</p>
                                        <p className="text-xs text-gray-500">{pedido.ciudad} · {pedido.items?.length ?? 0} producto{(pedido.items?.length ?? 0) !== 1 ? 's' : ''}</p>
                                        {pedido.cliente_telefono && (
                                            <a
                                                href={`https://wa.me/57${pedido.cliente_telefono.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${pedido.cliente_nombre}, te contactamos por tu pedido ${pedido.numero_pedido}`)}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1 mt-1 text-xs font-medium text-green-700 hover:text-green-900"
                                            >
                                                💬 Gestionar por WhatsApp
                                            </a>
                                        )}
                                    </div>

                                    {/* Total + acciones */}
                                    <div className="flex items-center gap-3 shrink-0">
                                        <div className="text-right">
                                            <p className="text-base font-bold text-gray-900">{fmt(pedido.total)}</p>
                                            <p className="text-xs text-gray-400">{pedido.metodo_pago}</p>
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <button
                                                onClick={() => cambiarEstado(pedido, 'confirmado')}
                                                className="px-3 py-1.5 bg-blue-800 text-white text-xs font-semibold rounded-lg hover:bg-blue-900 transition whitespace-nowrap"
                                            >
                                                → Confirmar
                                            </button>
                                            <div className="flex gap-1">
                                                <Link href={route('pedidos.show', pedido.id)}
                                                    className="flex-1 text-center px-2 py-1 text-xs text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                                                    Ver
                                                </Link>
                                                <button
                                                    onClick={() => cambiarEstado(pedido, 'cancelado')}
                                                    className="flex-1 px-2 py-1 text-xs text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition"
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ══ SECCIÓN 2: HISTORIAL ══════════════════════════════════ */}
                <div>
                    <h2 className="text-base font-bold text-gray-900 mb-3">Historial de pedidos</h2>

                    {/* Filtros */}
                    <form onSubmit={aplicarFiltros} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                            <input type="text" placeholder="Buscar por cliente o # pedido..."
                                value={buscar} onChange={e => setBuscar(e.target.value)}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700" />
                            <select value={estado} onChange={e => setEstado(e.target.value)}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700">
                                <option value="">Todos los estados</option>
                                {estados.map(e => (
                                    <option key={e} value={e}>{etiquetaEstado[e] ?? e}</option>
                                ))}
                            </select>
                            <select value={periodo} onChange={e => setPeriodo(e.target.value)}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700">
                                <option value="">Todos los períodos</option>
                                <option value="hoy">Hoy</option>
                                <option value="semana">Esta semana</option>
                                <option value="mes">Este mes</option>
                            </select>
                            <div className="flex gap-2">
                                <button type="submit"
                                    className="flex-1 px-3 py-2 bg-blue-800 text-white text-sm rounded-lg hover:bg-blue-900 transition">
                                    Filtrar
                                </button>
                                <button type="button" onClick={limpiarFiltros}
                                    className="px-3 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition">
                                    Limpiar
                                </button>
                            </div>
                        </div>
                    </form>

                    {/* Tabla historial */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {['Pedido', 'Cliente', 'Items', 'Total', 'Estado', 'Acciones'].map(h => (
                                            <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {historial.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-10 text-center text-gray-400 text-sm">
                                                No hay pedidos en el historial.
                                            </td>
                                        </tr>
                                    ) : (
                                        historial.data.map(pedido => (
                                            <tr key={pedido.id} className="hover:bg-gray-50 transition">
                                                <td className="px-4 py-3">
                                                    <p className="text-sm font-medium text-blue-800">{pedido.numero_pedido}</p>
                                                    <p className="text-xs text-gray-400">{new Date(pedido.creado_en).toLocaleDateString('es-CO')}</p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="text-sm font-medium text-gray-900">{pedido.cliente_nombre}</p>
                                                    <p className="text-xs text-gray-400">{pedido.ciudad}</p>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                    {pedido.items?.length ?? 0} prod.
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="text-sm font-semibold text-gray-900">{fmt(pedido.total)}</p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${colorEstado[pedido.estado] ?? 'bg-gray-100 text-gray-600'}`}>
                                                            {etiquetaEstado[pedido.estado] ?? pedido.estado}
                                                        </span>
                                                        {siguienteEstado[pedido.estado] && (
                                                            <button
                                                                onClick={() => cambiarEstado(pedido, siguienteEstado[pedido.estado])}
                                                                className="text-xs text-blue-700 hover:underline"
                                                            >
                                                                → {etiquetaEstado[siguienteEstado[pedido.estado]]}
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link href={route('pedidos.show', pedido.id)} className="text-xs text-gray-600 hover:underline">Ver</Link>
                                                        <Link href={route('pedidos.edit', pedido.id)} className="text-xs text-blue-800 hover:underline">Editar</Link>
                                                        <button onClick={() => eliminarPedido(pedido)} className="text-xs text-red-500 hover:underline">Eliminar</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Paginación historial */}
                    {historial.last_page > 1 && (
                        <div className="mt-4 flex items-center justify-center gap-1">
                            {historial.links.map((link, i) => (
                                <Link key={i} href={link.url || '#'}
                                    className={`px-3 py-1 text-sm rounded-lg border transition ${
                                        link.active
                                            ? 'bg-blue-800 text-white border-blue-800'
                                            : link.url
                                                ? 'border-gray-300 text-gray-600 hover:bg-gray-50'
                                                : 'border-gray-200 text-gray-300 cursor-default'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    )}
                </div>

            </div>

            {/* ── MODAL: CONFIRMAR PEDIDO CON MÉTODO DE PAGO ─────────────── */}
            {modalConfirmar && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Confirmar pedido</h3>
                        <p className="text-sm text-gray-500 mb-5">
                            <span className="font-medium text-blue-800">{modalConfirmar.numero_pedido}</span>
                            {' '}— {modalConfirmar.cliente_nombre}
                        </p>
                        <div className="bg-gray-50 rounded-lg px-4 py-3 mb-5 flex justify-between items-center">
                            <span className="text-sm text-gray-600">Total del pedido</span>
                            <span className="text-base font-bold text-gray-900">{fmt(modalConfirmar.total)}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-700 mb-3">¿Cómo pagó el cliente?</p>
                        <div className="grid grid-cols-2 gap-2 mb-6">
                            {[
                                { valor: 'efectivo',        etiqueta: '💵 Efectivo' },
                                { valor: 'transferencia',   etiqueta: '🏦 Transferencia' },
                                { valor: 'nequi',           etiqueta: '📱 Nequi' },
                                { valor: 'tarjeta_credito', etiqueta: '💳 Tarjeta crédito' },
                                { valor: 'tarjeta_debito',  etiqueta: '💳 Tarjeta débito' },
                                { valor: 'otro',            etiqueta: '🔄 Otro' },
                            ].map(({ valor, etiqueta }) => (
                                <button key={valor} type="button"
                                    onClick={() => setMetodoPagoModal(valor)}
                                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition text-left ${
                                        metodoPagoModal === valor
                                            ? 'border-blue-800 bg-gray-50 text-blue-900'
                                            : 'border-gray-200 text-gray-600 hover:border-gray-400'
                                    }`}>
                                    {etiqueta}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-gray-400 mb-5">
                            Al confirmar se registrará el ingreso en el dashboard financiero.
                        </p>
                        <div className="flex gap-3">
                            <button type="button" onClick={() => setModalConfirmar(null)} disabled={confirmando}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition">
                                Cancelar
                            </button>
                            <button type="button" onClick={confirmarConPago} disabled={confirmando}
                                className="flex-1 px-4 py-2 bg-blue-800 text-white text-sm font-medium rounded-lg hover:bg-blue-900 disabled:opacity-60 transition">
                                {confirmando ? 'Confirmando...' : 'Confirmar pedido'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </AuthenticatedLayout>
    );
}
