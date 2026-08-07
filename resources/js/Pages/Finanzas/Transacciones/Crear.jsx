/*
|--------------------------------------------------------------------------
| PÁGINA: Finanzas/Transacciones/Crear.jsx
|--------------------------------------------------------------------------
|
| Registrar un pago manual para un pedido (efectivo, transferencia, Nequi).
| El monto se pre-llena con el total del pedido seleccionado.
|
*/

import { useEffect } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Crear({ pedidos, metodos }) {

    const { data, setData, post, processing, errors } = useForm({
        pedido_id:       '',
        metodo_pago:     'efectivo',
        monto:           '',
        referencia_pago: '',
        descripcion:     '',
        estado:          'aprobada',
    });

    // Al seleccionar un pedido, pre-llenar el monto con su total
    useEffect(() => {
        if (data.pedido_id) {
            const pedido = pedidos.find(p => p.id === data.pedido_id);
            if (pedido) setData('monto', pedido.total);
        }
    }, [data.pedido_id]);

    const submit = (e) => {
        e.preventDefault();
        post(route('transacciones.store'));
    };

    const fmt = (v) => new Intl.NumberFormat('es-CO', {
        style: 'currency', currency: 'COP', minimumFractionDigits: 0,
    }).format(v ?? 0);

    const inputClass = (campo) =>
        `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors[campo] ? 'border-red-400' : 'border-gray-300'}`;

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800">Registrar Pago</h2>}>
            <Head title="Registrar Pago" />

            <div className="py-8 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                    <Link href={route('transacciones.index')} className="hover:text-indigo-600">Transacciones</Link>
                    <span>/</span>
                    <span className="text-gray-900">Registrar Pago</span>
                </div>

                <form onSubmit={submit} className="space-y-6">

                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">

                        {/* Pedido */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Pedido <span className="text-red-500">*</span>
                            </label>
                            <select value={data.pedido_id} onChange={e => setData('pedido_id', e.target.value)}
                                className={inputClass('pedido_id')}>
                                <option value="">Seleccionar pedido...</option>
                                {pedidos.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.numero_pedido} — {p.cliente_nombre} ({fmt(p.total)})
                                    </option>
                                ))}
                            </select>
                            {errors.pedido_id && <p className="text-red-500 text-xs mt-1">{errors.pedido_id}</p>}
                        </div>

                        {/* Método de pago */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Método de pago <span className="text-red-500">*</span>
                            </label>
                            <select value={data.metodo_pago} onChange={e => setData('metodo_pago', e.target.value)}
                                className={inputClass('metodo_pago')}>
                                {metodos.map(m => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Monto */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Monto (COP) <span className="text-red-500">*</span>
                            </label>
                            <input type="number" min="1" step="100"
                                value={data.monto} onChange={e => setData('monto', e.target.value)}
                                className={inputClass('monto')}
                                placeholder="70000" />
                            {errors.monto && <p className="text-red-500 text-xs mt-1">{errors.monto}</p>}
                        </div>

                        {/* Referencia */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Referencia / Comprobante
                                <span className="ml-1 text-xs text-gray-400">(número de transferencia, comprobante, etc.)</span>
                            </label>
                            <input type="text" value={data.referencia_pago}
                                onChange={e => setData('referencia_pago', e.target.value)}
                                className={inputClass('referencia_pago')}
                                placeholder="Ej: 2026080612345678" />
                        </div>

                        {/* Estado */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                            <select value={data.estado} onChange={e => setData('estado', e.target.value)}
                                className={inputClass('estado')}>
                                <option value="aprobada">Aprobada (pago confirmado)</option>
                                <option value="pendiente">Pendiente (esperando confirmación)</option>
                            </select>
                        </div>

                        {/* Descripción */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                            <input type="text" value={data.descripcion}
                                onChange={e => setData('descripcion', e.target.value)}
                                className={inputClass('descripcion')}
                                placeholder="Ej: Pago completo recibido por WhatsApp" />
                        </div>
                    </div>

                    {/* Botones */}
                    <div className="flex items-center justify-between">
                        <Link href={route('transacciones.index')}
                            className="px-4 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition">
                            Cancelar
                        </Link>
                        <button type="submit" disabled={processing}
                            className="px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition">
                            {processing ? 'Guardando...' : 'Registrar Pago'}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
