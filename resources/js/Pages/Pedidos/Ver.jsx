/*
|--------------------------------------------------------------------------
| PÁGINA: Pedidos/Ver.jsx
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué muestra esta página?
|
|   Vista de detalle completa de un pedido:
|   - Estado actual con selector para cambiarlo
|   - Datos del cliente y dirección de entrega
|   - Lista de productos comprados (con precios snapshot)
|   - Resumen de totales y ganancia
|   - Datos del envío (guía, operador, fechas)
|
*/

import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Ver({ pedido, estados }) {

    const { flash } = usePage().props;

    const formatearPrecio = (valor) => new Intl.NumberFormat('es-CO', {
        style: 'currency', currency: 'COP', minimumFractionDigits: 0,
    }).format(valor ?? 0);

    const formatearFecha = (fecha) => fecha
        ? new Date(fecha).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
        : '—';

    const colorEstado = {
        pendiente:      'bg-yellow-100 text-yellow-800',
        confirmado:     'bg-blue-100 text-blue-800',
        en_preparacion: 'bg-purple-100 text-purple-800',
        enviado:        'bg-indigo-100 text-indigo-800',
        entregado:      'bg-green-100 text-green-800',
        devuelto:       'bg-orange-100 text-orange-800',
        cancelado:      'bg-red-100 text-red-800',
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

    // Calcular ganancia total del pedido
    const gananciaTotal = pedido.items?.reduce((sum, item) =>
        sum + (item.precio_unitario - item.precio_costo) * item.cantidad, 0
    ) ?? 0;

    const cambiarEstado = (nuevoEstado) => {
        router.patch(route('pedidos.estado', pedido.id), { estado: nuevoEstado });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-gray-800">{pedido.numero_pedido}</h2>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${colorEstado[pedido.estado] ?? 'bg-gray-100 text-gray-600'}`}>
                        {etiquetaEstado[pedido.estado] ?? pedido.estado}
                    </span>
                </div>
            }
        >
            <Head title={`Pedido ${pedido.numero_pedido}`} />

            <div className="py-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* ── FLASH ──────────────────────────────────────────────── */}
                {flash?.exito && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                        {flash.exito}
                    </div>
                )}

                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                    <Link href={route('pedidos.index')} className="hover:text-indigo-600">Pedidos</Link>
                    <span>/</span>
                    <span className="text-gray-900">{pedido.numero_pedido}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* ── COLUMNA PRINCIPAL (2/3) ─────────────────────────── */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Productos del pedido */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                            <h3 className="text-base font-semibold text-gray-900 mb-4">
                                Productos ({pedido.items?.length ?? 0})
                            </h3>
                            <div className="divide-y divide-gray-100">
                                {pedido.items?.map(item => (
                                    <div key={item.id} className="py-3 flex items-center gap-3">
                                        {item.imagen_url ? (
                                            <img src={item.imagen_url} alt={item.nombre_producto}
                                                className="w-12 h-12 object-cover rounded-lg border border-gray-200" />
                                        ) : (
                                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                                                Sin img
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900">{item.nombre_producto}</p>
                                            {item.sku && <p className="text-xs text-gray-400">SKU: {item.sku}</p>}
                                            <p className="text-xs text-gray-500">
                                                {item.cantidad} × {formatearPrecio(item.precio_unitario)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-gray-900">
                                                {formatearPrecio(item.precio_unitario * item.cantidad)}
                                            </p>
                                            <p className="text-xs text-green-600">
                                                Ganancia: {formatearPrecio((item.precio_unitario - item.precio_costo) * item.cantidad)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Totales */}
                            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal</span>
                                    <span>{formatearPrecio(pedido.subtotal)}</span>
                                </div>
                                {pedido.costo_envio > 0 && (
                                    <div className="flex justify-between text-gray-600">
                                        <span>Envío</span>
                                        <span>{formatearPrecio(pedido.costo_envio)}</span>
                                    </div>
                                )}
                                {pedido.descuento > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Descuento</span>
                                        <span>- {formatearPrecio(pedido.descuento)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-bold text-gray-900 text-base border-t border-gray-200 pt-2">
                                    <span>TOTAL</span>
                                    <span>{formatearPrecio(pedido.total)}</span>
                                </div>
                                <div className="flex justify-between text-green-700 font-medium">
                                    <span>Ganancia estimada</span>
                                    <span>{formatearPrecio(gananciaTotal)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Envío */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                            <h3 className="text-base font-semibold text-gray-900 mb-4">Envío</h3>
                            {pedido.envio ? (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-gray-500">Operador</p>
                                            <p className="font-medium">{pedido.envio.operador}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Estado envío</p>
                                            <p className="font-medium">{pedido.envio.estado}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Número de guía</p>
                                            <p className="font-medium">{pedido.envio.numero_guia ?? '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Fecha de envío</p>
                                            <p className="font-medium">{formatearFecha(pedido.envio.fecha_envio)}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Entrega estimada</p>
                                            <p className="font-medium">{formatearFecha(pedido.envio.fecha_estimada_entrega)}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Entrega real</p>
                                            <p className="font-medium">{formatearFecha(pedido.envio.fecha_entrega_real)}</p>
                                        </div>
                                    </div>
                                    {pedido.envio.url_rastreo && (
                                        <a href={pedido.envio.url_rastreo} target="_blank" rel="noreferrer"
                                            className="inline-flex text-sm text-indigo-600 hover:underline">
                                            Ver rastreo →
                                        </a>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400">
                                    Sin envío registrado aún.
                                    {pedido.estado === 'confirmado' || pedido.estado === 'en_preparacion'
                                        ? ' El envío se registra cuando el pedido esté listo para despachar.'
                                        : ''}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* ── COLUMNA LATERAL (1/3) ───────────────────────────── */}
                    <div className="space-y-6">

                        {/* Cambiar estado */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                            <h3 className="text-base font-semibold text-gray-900 mb-3">Estado del pedido</h3>
                            <div className="space-y-2">
                                {estados.map(e => (
                                    <button
                                        key={e}
                                        onClick={() => cambiarEstado(e)}
                                        disabled={pedido.estado === e}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                                            pedido.estado === e
                                                ? colorEstado[e] + ' font-semibold cursor-default'
                                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                        }`}
                                    >
                                        {pedido.estado === e ? '● ' : '○ '}
                                        {etiquetaEstado[e]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Datos del cliente */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                            <h3 className="text-base font-semibold text-gray-900 mb-3">Cliente</h3>
                            <div className="space-y-2 text-sm">
                                <p className="font-medium text-gray-900">{pedido.cliente_nombre}</p>
                                <p className="text-gray-600">{pedido.cliente_email}</p>
                                {pedido.cliente_telefono && <p className="text-gray-600">{pedido.cliente_telefono}</p>}
                                {pedido.cliente_documento && <p className="text-gray-500 text-xs">CC/NIT: {pedido.cliente_documento}</p>}
                            </div>
                        </div>

                        {/* Dirección */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                            <h3 className="text-base font-semibold text-gray-900 mb-3">Dirección de entrega</h3>
                            <div className="text-sm text-gray-600 space-y-1">
                                <p>{pedido.direccion_entrega}</p>
                                {pedido.barrio && <p>{pedido.barrio}</p>}
                                <p>{pedido.ciudad}, {pedido.departamento}</p>
                                {pedido.codigo_postal && <p>CP: {pedido.codigo_postal}</p>}
                            </div>
                        </div>

                        {/* Notas */}
                        {(pedido.notas || pedido.notas_internas) && (
                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                                <h3 className="text-base font-semibold text-gray-900 mb-3">Notas</h3>
                                {pedido.notas && (
                                    <div className="mb-3">
                                        <p className="text-xs text-gray-500 mb-1">Del cliente:</p>
                                        <p className="text-sm text-gray-700">{pedido.notas}</p>
                                    </div>
                                )}
                                {pedido.notas_internas && (
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Internas:</p>
                                        <p className="text-sm text-gray-700">{pedido.notas_internas}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Acciones */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                            <h3 className="text-base font-semibold text-gray-900 mb-3">Acciones</h3>
                            <div className="space-y-2">
                                <Link href={route('pedidos.edit', pedido.id)}
                                    className="block w-full text-center px-4 py-2 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-lg hover:bg-indigo-100 transition">
                                    Editar pedido
                                </Link>
                                <Link href={route('pedidos.index')}
                                    className="block w-full text-center px-4 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition">
                                    Volver a la lista
                                </Link>
                            </div>
                            <p className="mt-3 text-xs text-gray-400 text-center">
                                Creado: {formatearFecha(pedido.creado_en)}
                            </p>
                        </div>

                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
