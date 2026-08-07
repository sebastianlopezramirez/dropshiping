/*
|--------------------------------------------------------------------------
| PÁGINA: Finanzas/Transacciones/Ver.jsx
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué muestra esta página?
|
|   El detalle completo de una transacción (pago):
|   - Encabezado: monto, método, estado
|   - Información del pedido asociado (cliente, items)
|   - Acción: anular la transacción (solo si está aprobada)
|
| DATOS QUE RECIBE DEL CONTROLLER (show()):
|   transaccion: {
|     id, pedido_id, referencia_wompi, referencia_pago,
|     metodo_pago, monto, estado, descripcion, datos_wompi,
|     pagado_en, creado_en,
|     pedido: {
|       numero_pedido, cliente_nombre, cliente_email, cliente_telefono,
|       cliente_ciudad, subtotal, costo_envio, descuento_manual,
|       descuento_aplicado, total, estado,
|       items: [{ nombre_producto, cantidad, precio_unitario, subtotal }]
|     }
|   }
|
*/

import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Ver({ transaccion }) {

    const { flash } = usePage().props;

    // useForm para la acción de anular
    const { patch, processing } = useForm({});

    const fmt = (v) => new Intl.NumberFormat('es-CO', {
        style: 'currency', currency: 'COP', minimumFractionDigits: 0,
    }).format(v ?? 0);

    const fmtFecha = (f) => f
        ? new Date(f).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })
        : '—';

    const colorEstado = {
        aprobada:  'bg-green-100 text-green-800 border-green-200',
        pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        rechazada: 'bg-red-100 text-red-800 border-red-200',
        anulada:   'bg-gray-100 text-gray-600 border-gray-200',
        error:     'bg-orange-100 text-orange-800 border-orange-200',
    };

    const etiquetaEstado = {
        aprobada: 'Aprobada', pendiente: 'Pendiente', rechazada: 'Rechazada',
        anulada: 'Anulada', error: 'Error',
    };

    const etiquetaMetodo = {
        efectivo: 'Efectivo', transferencia: 'Transferencia', nequi: 'Nequi',
        pse: 'PSE', tarjeta_credito: 'Tarjeta Crédito', tarjeta_debito: 'Tarjeta Débito',
        wompi: 'Wompi', otro: 'Otro',
    };

    const colorEstadoPedido = {
        pendiente:      'bg-yellow-100 text-yellow-800',
        en_preparacion: 'bg-blue-100 text-blue-800',
        enviado:        'bg-indigo-100 text-indigo-800',
        entregado:      'bg-green-100 text-green-800',
        cancelado:      'bg-red-100 text-red-800',
    };

    const anular = () => {
        if (!confirm('¿Estás seguro de anular esta transacción? Esta acción no se puede deshacer.')) return;
        patch(route('transacciones.update', transaccion.id), {
            data: { estado: 'anulada' },
        });
    };

    const pedido = transaccion.pedido;

    return (
        <AuthenticatedLayout header={
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href={route('transacciones.index')} className="text-gray-400 hover:text-gray-600 transition">←</Link>
                    <h2 className="text-xl font-semibold text-gray-800">Detalle de Transacción</h2>
                </div>
                {transaccion.estado === 'aprobada' && (
                    <button onClick={anular} disabled={processing}
                        className="px-4 py-2 border border-red-300 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 disabled:opacity-50 transition">
                        {processing ? 'Anulando...' : 'Anular Transacción'}
                    </button>
                )}
            </div>
        }>
            <Head title="Detalle Transacción" />

            <div className="py-8 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

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

                {/* Encabezado: monto + estado */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="text-3xl font-bold text-gray-900 mb-1">{fmt(transaccion.monto)}</div>
                            <div className="text-sm text-gray-500">
                                {etiquetaMetodo[transaccion.metodo_pago] || transaccion.metodo_pago}
                                {transaccion.pagado_en && (
                                    <> · pagado el {fmtFecha(transaccion.pagado_en)}</>
                                )}
                            </div>
                            {transaccion.descripcion && (
                                <p className="mt-2 text-sm text-gray-600">{transaccion.descripcion}</p>
                            )}
                        </div>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border
                            ${colorEstado[transaccion.estado] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                            {etiquetaEstado[transaccion.estado] || transaccion.estado}
                        </span>
                    </div>

                    {/* Referencias */}
                    <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4 text-sm">
                        {transaccion.referencia_pago && (
                            <div>
                                <span className="text-gray-500">Referencia de pago</span>
                                <div className="font-mono text-gray-800 mt-0.5">{transaccion.referencia_pago}</div>
                            </div>
                        )}
                        {transaccion.referencia_wompi && (
                            <div>
                                <span className="text-gray-500">Referencia Wompi</span>
                                <div className="font-mono text-gray-800 mt-0.5">{transaccion.referencia_wompi}</div>
                            </div>
                        )}
                        <div>
                            <span className="text-gray-500">Registrada</span>
                            <div className="text-gray-800 mt-0.5">{fmtFecha(transaccion.creado_en)}</div>
                        </div>
                    </div>
                </div>

                {/* Pedido asociado */}
                {pedido && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex items-start justify-between mb-4">
                            <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Pedido Asociado</h3>
                            <Link href={route('pedidos.show', pedido.id)}
                                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                                Ver pedido completo →
                            </Link>
                        </div>

                        {/* Info del cliente */}
                        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                            <div>
                                <span className="text-gray-500">Número</span>
                                <div className="font-mono font-semibold text-gray-800 mt-0.5">#{pedido.numero_pedido}</div>
                            </div>
                            <div>
                                <span className="text-gray-500">Estado del pedido</span>
                                <div className="mt-0.5">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                                        ${colorEstadoPedido[pedido.estado] || 'bg-gray-100 text-gray-600'}`}>
                                        {pedido.estado?.replace(/_/g, ' ')}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <span className="text-gray-500">Cliente</span>
                                <div className="font-medium text-gray-800 mt-0.5">{pedido.cliente_nombre}</div>
                            </div>
                            <div>
                                <span className="text-gray-500">Ciudad</span>
                                <div className="text-gray-800 mt-0.5">{pedido.cliente_ciudad || '—'}</div>
                            </div>
                            {pedido.cliente_email && (
                                <div>
                                    <span className="text-gray-500">Email</span>
                                    <div className="text-gray-800 mt-0.5">{pedido.cliente_email}</div>
                                </div>
                            )}
                            {pedido.cliente_telefono && (
                                <div>
                                    <span className="text-gray-500">Teléfono</span>
                                    <div className="text-gray-800 mt-0.5">{pedido.cliente_telefono}</div>
                                </div>
                            )}
                        </div>

                        {/* Items del pedido */}
                        {pedido.items && pedido.items.length > 0 && (
                            <>
                                <div className="border-t border-gray-100 pt-4">
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Productos</h4>
                                    <div className="space-y-2">
                                        {pedido.items.map((item, i) => (
                                            <div key={i} className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-gray-400 text-xs w-6 text-center">{item.cantidad}x</span>
                                                    <span className="text-gray-800">{item.nombre_producto}</span>
                                                </div>
                                                <span className="text-gray-700 font-medium tabular-nums">
                                                    {fmt(item.subtotal)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Totales */}
                                <div className="border-t border-gray-100 pt-3 mt-3 space-y-1 text-sm">
                                    <div className="flex justify-between text-gray-600">
                                        <span>Subtotal</span>
                                        <span className="tabular-nums">{fmt(pedido.subtotal)}</span>
                                    </div>
                                    {Number(pedido.costo_envio) > 0 && (
                                        <div className="flex justify-between text-gray-600">
                                            <span>Costo de envío</span>
                                            <span className="tabular-nums">{fmt(pedido.costo_envio)}</span>
                                        </div>
                                    )}
                                    {Number(pedido.descuento_manual) > 0 && (
                                        <div className="flex justify-between text-green-600">
                                            <span>Descuento manual</span>
                                            <span className="tabular-nums">−{fmt(pedido.descuento_manual)}</span>
                                        </div>
                                    )}
                                    {Number(pedido.descuento_aplicado) > 0 && (
                                        <div className="flex justify-between text-green-600">
                                            <span>Descuento cupón{pedido.cupon_codigo ? ` (${pedido.cupon_codigo})` : ''}</span>
                                            <span className="tabular-nums">−{fmt(pedido.descuento_aplicado)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between font-semibold text-gray-900 text-base pt-1 border-t border-gray-200">
                                        <span>Total</span>
                                        <span className="tabular-nums">{fmt(pedido.total)}</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Datos Wompi (si existen) */}
                {transaccion.datos_wompi && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-3">Datos Wompi</h3>
                        <pre className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 overflow-auto">
                            {JSON.stringify(transaccion.datos_wompi, null, 2)}
                        </pre>
                    </div>
                )}

            </div>
        </AuthenticatedLayout>
    );
}
