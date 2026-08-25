/*
|--------------------------------------------------------------------------
| PÁGINA: Pedidos/Index.jsx
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué muestra esta página?
|
|   Lista de todos los pedidos con:
|   - Estadísticas rápidas (pedidos hoy, pendientes, total del mes)
|   - Filtros: buscar por cliente/número, filtrar por estado, por período
|   - Tabla con número, cliente, total, estado, acciones
|   - Botón para cambiar estado directamente desde la lista
|
*/

import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

/*
|--------------------------------------------------------------------------
| METODOLOGÍA: ENTENDER → PENSAR → ESCRIBIR → VERIFICAR
|--------------------------------------------------------------------------
| ENTENDER — ¿Qué hace esta página?
|   Lista pedidos con filtros, estadísticas y botón de avance rápido.
|
| PENSAR — ¿Qué cambia ahora?
|   Cuando el admin hace clic en "→ Confirmado", antes de llamar
|   router.patch() se muestra un MODAL que pregunta el método de pago
|   (efectivo, transferencia, nequi, etc.).
|   Esto permite que PedidoController cree la Transacción automáticamente
|   con el método correcto, y el dashboard financiero muestre el ingreso.
|
| ESCRIBIR — Nuevos estados:
|   modalConfirmar   → pedido que se está confirmando (null = cerrado)
|   metodoPagoModal → método seleccionado en el modal
*/

export default function Index({ pedidos, estadisticas, estados, filtros }) {

    const { flash } = usePage().props;

    // Estado local del formulario de filtros
    const [buscar, setBuscar]   = useState(filtros.buscar || '');
    const [estado, setEstado]   = useState(filtros.estado || '');
    const [periodo, setPeriodo] = useState(filtros.periodo || '');

    // ── MODAL DE CONFIRMACIÓN DE PAGO ─────────────────────────────────────
    // PENSAR: Solo se activa cuando nuevoEstado === 'confirmado'.
    // Para otros estados se sigue llamando router.patch() directamente.
    const [modalConfirmar, setModalConfirmar] = useState(null); // pedido | null
    const [metodoPagoModal, setMetodoPagoModal] = useState('efectivo');
    const [confirmando, setConfirmando] = useState(false);

    // ── FILTROS ──────────────────────────────────────────────────────────

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

    // ── CAMBIAR ESTADO DESDE LA LISTA ────────────────────────────────────
    /*
    | PENSAR — Flujo de confirmación:
    |   1. Admin hace clic en "→ Confirmado"
    |   2. Se abre el modal → admin elige método de pago
    |   3. Admin hace clic en "Confirmar pedido" en el modal
    |   4. Se llama router.patch() con estado + metodo_pago_confirmacion
    |   5. PedidoController crea la Transaccion aprobada automáticamente
    |   6. El dashboard financiero ya muestra el ingreso
    */
    const cambiarEstado = (pedido, nuevoEstado) => {
        if (nuevoEstado === 'confirmado') {
            // Abrir modal para capturar método de pago
            setModalConfirmar(pedido);
            setMetodoPagoModal('efectivo');
            return;
        }
        // Para otros estados: avance directo sin modal
        router.patch(route('pedidos.estado', pedido.id), { estado: nuevoEstado }, {
            preserveScroll: true,
        });
    };

    // Confirmación desde el modal: envía estado + método de pago
    const confirmarConPago = () => {
        if (!modalConfirmar) return;
        setConfirmando(true);
        router.patch(
            route('pedidos.estado', modalConfirmar.id),
            { estado: 'confirmado', metodo_pago_confirmacion: metodoPagoModal },
            {
                preserveScroll: true,
                onFinish: () => {
                    setConfirmando(false);
                    setModalConfirmar(null);
                },
            }
        );
    };

    // ── ELIMINAR ─────────────────────────────────────────────────────────
    const eliminarPedido = (pedido) => {
        if (!confirm(`¿Eliminar el pedido ${pedido.numero_pedido}?`)) return;
        router.delete(route('pedidos.destroy', pedido.id), { preserveScroll: true });
    };

    // ── HELPERS DE PRESENTACIÓN ──────────────────────────────────────────

    const formatearPrecio = (valor) => new Intl.NumberFormat('es-CO', {
        style: 'currency', currency: 'COP', minimumFractionDigits: 0,
    }).format(valor ?? 0);

    // Color del badge según el estado
    const colorEstado = {
        pendiente:      'bg-yellow-100 text-yellow-800',
        confirmado:     'bg-blue-100 text-blue-800',
        en_preparacion: 'bg-purple-100 text-purple-800',
        enviado:        'bg-indigo-100 text-indigo-800',
        entregado:      'bg-green-100 text-green-800',
        devuelto:       'bg-orange-100 text-orange-800',
        cancelado:      'bg-red-100 text-red-800',
    };

    // Siguiente estado lógico para el botón de avance rápido
    const siguienteEstado = {
        pendiente:      'confirmado',
        confirmado:     'en_preparacion',
        en_preparacion: 'enviado',
        enviado:        'entregado',
    };

    const etiquetaEstado = {
        pendiente:      'Pendiente',
        confirmado:     'Confirmado',
        en_preparacion: 'En preparación',
        enviado:        'Enviado',
        entregado:      'Entregado',
        devuelto:       'Devuelto',
        cancelado:      'Cancelado',
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold text-gray-800">Pedidos</h2>}
        >
            <Head title="Pedidos" />

            <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* ── FLASH ──────────────────────────────────────────────── */}
                {flash?.exito && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                        {flash.exito}
                    </div>
                )}

                {/* ── ESTADÍSTICAS RÁPIDAS ────────────────────────────────── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    {[
                        { label: 'Pedidos hoy',  valor: estadisticas.total_hoy,  color: 'text-indigo-600' },
                        { label: 'Pendientes',   valor: estadisticas.pendientes, color: 'text-yellow-600' },
                        { label: 'En tránsito',  valor: estadisticas.enviados,   color: 'text-blue-600' },
                        { label: 'Ventas del mes', valor: formatearPrecio(estadisticas.total_mes), color: 'text-green-600' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                            <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                            <p className={`text-xl font-bold ${stat.color}`}>{stat.valor}</p>
                        </div>
                    ))}
                </div>

                {/* ── ENCABEZADO ──────────────────────────────────────────── */}
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Todos los Pedidos</h1>
                        <p className="text-sm text-gray-500 mt-1">{pedidos.total} pedidos en total</p>
                    </div>
                    <Link
                        href={route('pedidos.create')}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition"
                    >
                        + Nuevo Pedido
                    </Link>
                </div>

                {/* ── FILTROS ─────────────────────────────────────────────── */}
                <form onSubmit={aplicarFiltros} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <input
                            type="text"
                            placeholder="Buscar por cliente o # pedido..."
                            value={buscar}
                            onChange={e => setBuscar(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <select
                            value={estado}
                            onChange={e => setEstado(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">Todos los estados</option>
                            {estados.map(e => (
                                <option key={e} value={e}>{etiquetaEstado[e] ?? e}</option>
                            ))}
                        </select>
                        <select
                            value={periodo}
                            onChange={e => setPeriodo(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">Todos los períodos</option>
                            <option value="hoy">Hoy</option>
                            <option value="semana">Esta semana</option>
                            <option value="mes">Este mes</option>
                        </select>
                        <div className="flex gap-2">
                            <button type="submit" className="flex-1 px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition">
                                Filtrar
                            </button>
                            <button type="button" onClick={limpiarFiltros} className="px-3 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition">
                                Limpiar
                            </button>
                        </div>
                    </div>
                </form>

                {/* ── TABLA ───────────────────────────────────────────────── */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pedido</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {pedidos.data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                                        No hay pedidos.{' '}
                                        <Link href={route('pedidos.create')} className="text-indigo-600 hover:underline">
                                            Registrar el primero
                                        </Link>
                                    </td>
                                </tr>
                            ) : (
                                pedidos.data.map(pedido => (
                                    <tr key={pedido.id} className="hover:bg-gray-50 transition">

                                        {/* Número y fecha */}
                                        <td className="px-4 py-3">
                                            <p className="text-sm font-medium text-indigo-600">
                                                {pedido.numero_pedido}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {new Date(pedido.creado_en).toLocaleDateString('es-CO')}
                                            </p>
                                        </td>

                                        {/* Cliente */}
                                        <td className="px-4 py-3">
                                            <p className="text-sm font-medium text-gray-900">{pedido.cliente_nombre}</p>
                                            <p className="text-xs text-gray-400">{pedido.ciudad}, {pedido.departamento}</p>
                                        </td>

                                        {/* Cantidad de ítems */}
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {pedido.items?.length ?? 0} producto{(pedido.items?.length ?? 0) !== 1 ? 's' : ''}
                                        </td>

                                        {/* Total */}
                                        <td className="px-4 py-3">
                                            <p className="text-sm font-semibold text-gray-900">
                                                {formatearPrecio(pedido.total)}
                                            </p>
                                        </td>

                                        {/* Estado + avance rápido */}
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${colorEstado[pedido.estado] ?? 'bg-gray-100 text-gray-600'}`}>
                                                {etiquetaEstado[pedido.estado] ?? pedido.estado}
                                            </span>
                                            {/* Botón para avanzar al siguiente estado */}
                                            {siguienteEstado[pedido.estado] && (
                                                <button
                                                    onClick={() => cambiarEstado(pedido, siguienteEstado[pedido.estado])}
                                                    className="ml-2 text-xs text-indigo-500 hover:text-indigo-700 hover:underline"
                                                >
                                                    → {etiquetaEstado[siguienteEstado[pedido.estado]]}
                                                </button>
                                            )}
                                        </td>

                                        {/* Acciones */}
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={route('pedidos.show', pedido.id)}
                                                    className="text-xs text-gray-600 hover:underline"
                                                >
                                                    Ver
                                                </Link>
                                                <Link
                                                    href={route('pedidos.edit', pedido.id)}
                                                    className="text-xs text-indigo-600 hover:underline"
                                                >
                                                    Editar
                                                </Link>
                                                <button
                                                    onClick={() => eliminarPedido(pedido)}
                                                    className="text-xs text-red-500 hover:underline"
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table></div>
                </div>

                {/* ── PAGINACIÓN ──────────────────────────────────────────── */}
                {pedidos.last_page > 1 && (
                    <div className="mt-4 flex items-center justify-center gap-1">
                        {pedidos.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url || '#'}
                                className={`px-3 py-1 text-sm rounded-lg border transition ${
                                    link.active
                                        ? 'bg-indigo-600 text-white border-indigo-600'
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

            {/* ── MODAL: CONFIRMAR PEDIDO CON MÉTODO DE PAGO ────────────────
            |
            | ENTENDER — ¿Para qué sirve este modal?
            |   Cuando el admin confirma un pedido, necesitamos saber cómo
            |   pagó el cliente para registrar la Transaccion en finanzas.
            |
            | PENSAR — ¿Por qué un modal y no un campo en la tabla?
            |   Porque la confirmación es un acto deliberado. El admin debe
            |   elegir activamente el método antes de confirmar.
            |
            ─────────────────────────────────────────────────────────────── */}
            {modalConfirmar && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">

                        {/* Encabezado */}
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                            Confirmar pedido
                        </h3>
                        <p className="text-sm text-gray-500 mb-5">
                            <span className="font-medium text-indigo-600">{modalConfirmar.numero_pedido}</span>
                            {' '}— {modalConfirmar.cliente_nombre}
                        </p>

                        {/* Total del pedido */}
                        <div className="bg-gray-50 rounded-lg px-4 py-3 mb-5 flex justify-between items-center">
                            <span className="text-sm text-gray-600">Total del pedido</span>
                            <span className="text-base font-bold text-gray-900">
                                {new Intl.NumberFormat('es-CO', {
                                    style: 'currency', currency: 'COP', minimumFractionDigits: 0,
                                }).format(modalConfirmar.total ?? 0)}
                            </span>
                        </div>

                        {/* Método de pago */}
                        <p className="text-sm font-medium text-gray-700 mb-3">
                            ¿Cómo pagó el cliente?
                        </p>
                        <div className="grid grid-cols-2 gap-2 mb-6">
                            {[
                                { valor: 'efectivo',          etiqueta: '💵 Efectivo' },
                                { valor: 'transferencia',     etiqueta: '🏦 Transferencia' },
                                { valor: 'nequi',             etiqueta: '📱 Nequi' },
                                { valor: 'tarjeta_credito',   etiqueta: '💳 Tarjeta crédito' },
                                { valor: 'tarjeta_debito',    etiqueta: '💳 Tarjeta débito' },
                                { valor: 'otro',              etiqueta: '🔄 Otro' },
                            ].map(({ valor, etiqueta }) => (
                                <button
                                    key={valor}
                                    type="button"
                                    onClick={() => setMetodoPagoModal(valor)}
                                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition text-left ${
                                        metodoPagoModal === valor
                                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                            : 'border-gray-200 text-gray-600 hover:border-gray-400'
                                    }`}
                                >
                                    {etiqueta}
                                </button>
                            ))}
                        </div>

                        {/* Aviso */}
                        <p className="text-xs text-gray-400 mb-5">
                            Al confirmar se registrará el ingreso en el dashboard financiero
                            y se descontará el stock del inventario.
                        </p>

                        {/* Botones */}
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setModalConfirmar(null)}
                                disabled={confirmando}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={confirmarConPago}
                                disabled={confirmando}
                                className="flex-1 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition"
                            >
                                {confirmando ? 'Confirmando...' : 'Confirmar pedido'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </AuthenticatedLayout>
    );
}
