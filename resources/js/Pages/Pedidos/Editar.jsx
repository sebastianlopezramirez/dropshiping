/*
|--------------------------------------------------------------------------
| PÁGINA: Pedidos/Editar.jsx
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué permite editar esta página?
|
|   Solo los datos que pueden cambiar DESPUÉS de crear el pedido:
|   - Datos del cliente (nombre, email, teléfono, documento)
|   - Dirección de entrega
|   - Costo de envío y descuento global
|   - Notas del cliente y notas internas
|
|   NO se editan los ítems — son snapshot histórico del precio en el
|   momento de la venta. Para cambiar productos, hay que crear un nuevo
|   pedido o cancelar el actual.
|
| PENSAR — ¿Por qué no editar los ítems?
|
|   El principio del snapshot dice que los datos del pedido son
|   un registro histórico inmutable. Si se pudiera cambiar el precio
|   de un ítem después, el historial de ventas sería inconsistente.
|
*/

import { useForm, Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Editar({ pedido, estados }) {

    // useForm inicializa los campos con los datos actuales del pedido
    const { data, setData, put, processing, errors } = useForm({
        cliente_nombre:    pedido.cliente_nombre    ?? '',
        cliente_email:     pedido.cliente_email     ?? '',
        cliente_telefono:  pedido.cliente_telefono  ?? '',
        cliente_documento: pedido.cliente_documento ?? '',
        direccion_entrega: pedido.direccion_entrega  ?? '',
        ciudad:            pedido.ciudad            ?? '',
        departamento:      pedido.departamento      ?? '',
        barrio:            pedido.barrio            ?? '',
        codigo_postal:     pedido.codigo_postal     ?? '',
        costo_envio:       pedido.costo_envio       ?? 0,
        descuento:         pedido.descuento         ?? 0,
        notas:             pedido.notas             ?? '',
        notas_internas:    pedido.notas_internas    ?? '',
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('pedidos.update', pedido.id));
    };

    // Helpers visuales
    const formatearPrecio = (v) => new Intl.NumberFormat('es-CO', {
        style: 'currency', currency: 'COP', minimumFractionDigits: 0,
    }).format(v ?? 0);

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

    // Clases reutilizables
    const inputClass = (campo) =>
        `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            errors[campo] ? 'border-red-400' : 'border-gray-300'
        }`;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-gray-800">
                        Editar {pedido.numero_pedido}
                    </h2>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${colorEstado[pedido.estado] ?? 'bg-gray-100'}`}>
                        {etiquetaEstado[pedido.estado] ?? pedido.estado}
                    </span>
                </div>
            }
        >
            <Head title={`Editar ${pedido.numero_pedido}`} />

            <div className="py-8 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                    <Link href={route('pedidos.index')} className="hover:text-indigo-600">Pedidos</Link>
                    <span>/</span>
                    <Link href={route('pedidos.show', pedido.id)} className="hover:text-indigo-600">{pedido.numero_pedido}</Link>
                    <span>/</span>
                    <span className="text-gray-900">Editar</span>
                </div>

                <form onSubmit={submit} className="space-y-6">

                    {/* ── DATOS DEL CLIENTE ───────────────────────────────── */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <h3 className="text-base font-semibold text-gray-900 mb-4">Datos del Cliente</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre completo <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.cliente_nombre}
                                    onChange={e => setData('cliente_nombre', e.target.value)}
                                    className={inputClass('cliente_nombre')}
                                    placeholder="María González"
                                />
                                {errors.cliente_nombre && <p className="text-red-500 text-xs mt-1">{errors.cliente_nombre}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Correo electrónico <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={data.cliente_email}
                                    onChange={e => setData('cliente_email', e.target.value)}
                                    className={inputClass('cliente_email')}
                                    placeholder="maria@email.com"
                                />
                                {errors.cliente_email && <p className="text-red-500 text-xs mt-1">{errors.cliente_email}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                                <input
                                    type="text"
                                    value={data.cliente_telefono}
                                    onChange={e => setData('cliente_telefono', e.target.value)}
                                    className={inputClass('cliente_telefono')}
                                    placeholder="3001234567"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">CC / NIT</label>
                                <input
                                    type="text"
                                    value={data.cliente_documento}
                                    onChange={e => setData('cliente_documento', e.target.value)}
                                    className={inputClass('cliente_documento')}
                                    placeholder="12345678"
                                />
                            </div>
                        </div>
                    </div>

                    {/* ── DIRECCIÓN DE ENTREGA ────────────────────────────── */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <h3 className="text-base font-semibold text-gray-900 mb-4">Dirección de Entrega</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Dirección <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.direccion_entrega}
                                    onChange={e => setData('direccion_entrega', e.target.value)}
                                    className={inputClass('direccion_entrega')}
                                    placeholder="Calle 123 # 45-67"
                                />
                                {errors.direccion_entrega && <p className="text-red-500 text-xs mt-1">{errors.direccion_entrega}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Ciudad <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.ciudad}
                                    onChange={e => setData('ciudad', e.target.value)}
                                    className={inputClass('ciudad')}
                                    placeholder="Bogotá"
                                />
                                {errors.ciudad && <p className="text-red-500 text-xs mt-1">{errors.ciudad}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Departamento <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.departamento}
                                    onChange={e => setData('departamento', e.target.value)}
                                    className={inputClass('departamento')}
                                    placeholder="Cundinamarca"
                                />
                                {errors.departamento && <p className="text-red-500 text-xs mt-1">{errors.departamento}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Barrio</label>
                                <input
                                    type="text"
                                    value={data.barrio}
                                    onChange={e => setData('barrio', e.target.value)}
                                    className={inputClass('barrio')}
                                    placeholder="Chapinero"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Código Postal</label>
                                <input
                                    type="text"
                                    value={data.codigo_postal}
                                    onChange={e => setData('codigo_postal', e.target.value)}
                                    className={inputClass('codigo_postal')}
                                    placeholder="110111"
                                />
                            </div>
                        </div>
                    </div>

                    {/* ── PRODUCTOS (SOLO LECTURA) ─────────────────────────── */}
                    <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-base font-semibold text-gray-700">
                                Productos del pedido ({pedido.items?.length ?? 0})
                            </h3>
                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                                Solo lectura — snapshot histórico
                            </span>
                        </div>
                        <div className="divide-y divide-gray-200">
                            {pedido.items?.map(item => (
                                <div key={item.id} className="py-2 flex items-center gap-3">
                                    {item.imagen_url ? (
                                        <img src={item.imagen_url} alt={item.nombre_producto}
                                            className="w-10 h-10 object-cover rounded-lg border border-gray-200 opacity-75" />
                                    ) : (
                                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-300 text-xs">
                                            —
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-700">{item.nombre_producto}</p>
                                        <p className="text-xs text-gray-400">{item.cantidad} × {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(item.precio_unitario)}</p>
                                    </div>
                                    <p className="text-sm font-medium text-gray-600">
                                        {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(item.precio_unitario * item.cantidad)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── COSTOS ──────────────────────────────────────────── */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <h3 className="text-base font-semibold text-gray-900 mb-4">Costos y Totales</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Costo de envío (COP)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="100"
                                    value={data.costo_envio}
                                    onChange={e => setData('costo_envio', parseFloat(e.target.value) || 0)}
                                    className={inputClass('costo_envio')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Descuento global (COP)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="100"
                                    value={data.descuento}
                                    onChange={e => setData('descuento', parseFloat(e.target.value) || 0)}
                                    className={inputClass('descuento')}
                                />
                            </div>
                        </div>

                        {/* Total estimado */}
                        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-sm">
                            <span className="text-gray-500">
                                Subtotal {formatearPrecio(pedido.subtotal)}
                                {data.costo_envio > 0 && ` + envío ${formatearPrecio(data.costo_envio)}`}
                                {data.descuento > 0 && ` - descuento ${formatearPrecio(data.descuento)}`}
                            </span>
                            <span className="font-bold text-gray-900">
                                = {formatearPrecio(
                                    (pedido.subtotal || 0) + (data.costo_envio || 0) - (data.descuento || 0)
                                )}
                            </span>
                        </div>
                    </div>

                    {/* ── NOTAS ───────────────────────────────────────────── */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <h3 className="text-base font-semibold text-gray-900 mb-4">Notas</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Notas del cliente
                                </label>
                                <textarea
                                    rows={3}
                                    value={data.notas}
                                    onChange={e => setData('notas', e.target.value)}
                                    className={inputClass('notas')}
                                    placeholder="Instrucciones especiales del cliente..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Notas internas
                                    <span className="ml-1 text-xs text-gray-400">(solo visibles para el equipo)</span>
                                </label>
                                <textarea
                                    rows={3}
                                    value={data.notas_internas}
                                    onChange={e => setData('notas_internas', e.target.value)}
                                    className={inputClass('notas_internas')}
                                    placeholder="Observaciones internas..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* ── BOTONES ──────────────────────────────────────────── */}
                    <div className="flex items-center justify-between">
                        <Link
                            href={route('pedidos.show', pedido.id)}
                            className="px-4 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition"
                        >
                            Cancelar
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
                        >
                            {processing ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>

                </form>
            </div>
        </AuthenticatedLayout>
    );
}
