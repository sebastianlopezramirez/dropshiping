/*
|--------------------------------------------------------------------------
| PÁGINA: Finanzas/Transacciones/Index.jsx
|--------------------------------------------------------------------------
|
| Lista de todos los pagos recibidos con filtros y estadísticas.
|
*/

import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index({ transacciones, estadisticas, estados, metodos, filtros }) {

    const { flash } = usePage().props;

    const [buscar, setBuscar]   = useState(filtros.buscar || '');
    const [estado, setEstado]   = useState(filtros.estado || '');
    const [metodo, setMetodo]   = useState(filtros.metodo || '');
    const [periodo, setPeriodo] = useState(filtros.periodo || '');

    const fmt = (v) => new Intl.NumberFormat('es-CO', {
        style: 'currency', currency: 'COP', minimumFractionDigits: 0,
    }).format(v ?? 0);

    const colorEstado = {
        aprobada:  'bg-green-100 text-green-800',
        pendiente: 'bg-yellow-100 text-yellow-800',
        rechazada: 'bg-red-100 text-red-800',
        anulada:   'bg-gray-100 text-gray-600',
        error:     'bg-orange-100 text-orange-800',
    };

    const etiquetaEstado = {
        aprobada: 'Aprobada', pendiente: 'Pendiente',
        rechazada: 'Rechazada', anulada: 'Anulada', error: 'Error',
    };

    const etiquetaMetodo = {
        efectivo: 'Efectivo', transferencia: 'Transferencia', nequi: 'Nequi',
        pse: 'PSE', tarjeta_credito: 'Tarjeta Crédito', tarjeta_debito: 'Tarjeta Débito',
        wompi: 'Wompi', otro: 'Otro',
    };

    const aplicarFiltros = (e) => {
        e.preventDefault();
        router.get(route('transacciones.index'), { buscar, estado, metodo, periodo }, {
            preserveState: true, replace: true,
        });
    };

    const limpiar = () => {
        setBuscar(''); setEstado(''); setMetodo(''); setPeriodo('');
        router.get(route('transacciones.index'));
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800">Transacciones</h2>}>
            <Head title="Transacciones" />

            <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {flash?.exito && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                        {flash.exito}
                    </div>
                )}

                {/* Estadísticas */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    {[
                        { label: 'Ingresos hoy',      valor: fmt(estadisticas.total_hoy),          color: 'text-blue-800' },
                        { label: 'Transac. hoy',      valor: estadisticas.count_hoy,               color: 'text-blue-600'   },
                        { label: 'Pendientes',         valor: estadisticas.total_pendientes,        color: 'text-yellow-600' },
                        { label: 'Ingresos del mes',  valor: fmt(estadisticas.total_aprobadas_mes), color: 'text-green-700'  },
                    ].map((s, i) => (
                        <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                            <p className={`text-xl font-bold ${s.color}`}>{s.valor}</p>
                        </div>
                    ))}
                </div>

                {/* Encabezado + botón */}
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Todos los Pagos</h1>
                        <p className="text-sm text-gray-500 mt-1">{transacciones.total} transacciones</p>
                    </div>
                    <div className="flex gap-2">
                        <Link href={route('reportes.financiero')}
                            className="px-4 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition">
                            📊 Dashboard
                        </Link>
                        <Link href={route('transacciones.create')}
                            className="px-4 py-2 bg-blue-800 text-white text-sm font-medium rounded-lg hover:bg-blue-900 transition">
                            + Registrar Pago
                        </Link>
                    </div>
                </div>

                {/* Filtros */}
                <form onSubmit={aplicarFiltros} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                        <input type="text" placeholder="Buscar pedido, cliente..."
                            value={buscar} onChange={e => setBuscar(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700" />
                        <select value={estado} onChange={e => setEstado(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700">
                            <option value="">Todos los estados</option>
                            {estados.map(e => <option key={e} value={e}>{etiquetaEstado[e] ?? e}</option>)}
                        </select>
                        <select value={metodo} onChange={e => setMetodo(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700">
                            <option value="">Todos los métodos</option>
                            {metodos.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                        <select value={periodo} onChange={e => setPeriodo(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700">
                            <option value="">Todo el tiempo</option>
                            <option value="hoy">Hoy</option>
                            <option value="semana">Esta semana</option>
                            <option value="mes">Este mes</option>
                        </select>
                        <div className="flex gap-2">
                            <button type="submit" className="flex-1 px-3 py-2 bg-blue-800 text-white text-sm rounded-lg hover:bg-blue-900 transition">
                                Filtrar
                            </button>
                            <button type="button" onClick={limpiar} className="px-3 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition">
                                ✕
                            </button>
                        </div>
                    </div>
                </form>

                {/* Tabla */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {['Fecha y hora', 'Pedido / Cliente', 'Monto', 'Método', 'Estado', 'Acciones'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {transacciones.data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                                        No hay transacciones.{' '}
                                        <Link href={route('transacciones.create')} className="text-blue-800 hover:underline">
                                            Registrar el primer pago
                                        </Link>
                                    </td>
                                </tr>
                            ) : (
                                transacciones.data.map(tx => {
                                    // pagado_en tiene fecha+hora exacta de cuando se confirmó
                                    const fechaPago = tx.pagado_en
                                        ? new Date(tx.pagado_en)
                                        : new Date(tx.creado_en);
                                    const fechaStr = fechaPago.toLocaleDateString('es-CO', {
                                        day: '2-digit', month: '2-digit', year: 'numeric',
                                    });
                                    const horaStr = fechaPago.toLocaleTimeString('es-CO', {
                                        hour: '2-digit', minute: '2-digit',
                                    });
                                    return (
                                    <tr key={tx.id} className="hover:bg-gray-50 transition">

                                        {/* Fecha y hora exacta */}
                                        <td className="px-4 py-3">
                                            <p className="text-sm font-medium text-gray-900">{fechaStr}</p>
                                            <p className="text-xs text-gray-400">{horaStr}</p>
                                        </td>

                                        {/* Pedido + cliente + ciudad */}
                                        <td className="px-4 py-3">
                                            {tx.pedido ? (
                                                <>
                                                    <p className="text-sm font-medium text-blue-800">{tx.pedido.numero_pedido}</p>
                                                    <p className="text-xs text-gray-700">{tx.pedido.cliente_nombre}</p>
                                                    <p className="text-xs text-gray-400">{tx.pedido.ciudad}</p>
                                                </>
                                            ) : (
                                                <span className="text-xs text-gray-400">—</span>
                                            )}
                                        </td>

                                        {/* Monto + referencia */}
                                        <td className="px-4 py-3">
                                            <p className="text-sm font-bold text-gray-900">{fmt(tx.monto)}</p>
                                            {tx.referencia_pago && (
                                                <p className="text-xs text-gray-400">Ref: {tx.referencia_pago}</p>
                                            )}
                                        </td>

                                        {/* Método con icono */}
                                        <td className="px-4 py-3">
                                            <span className="inline-flex items-center gap-1 text-sm text-gray-700">
                                                {tx.metodo_pago === 'efectivo' ? '💵' :
                                                 tx.metodo_pago === 'transferencia' ? '🏦' :
                                                 tx.metodo_pago === 'nequi' ? '📱' :
                                                 tx.metodo_pago === 'tarjeta_credito' ? '💳' :
                                                 tx.metodo_pago === 'tarjeta_debito' ? '💳' : '🔄'}
                                                {etiquetaMetodo[tx.metodo_pago] ?? tx.metodo_pago}
                                            </span>
                                        </td>

                                        {/* Estado */}
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${colorEstado[tx.estado] ?? 'bg-gray-100'}`}>
                                                {etiquetaEstado[tx.estado] ?? tx.estado}
                                            </span>
                                        </td>

                                        {/* Acción */}
                                        <td className="px-4 py-3 text-right">
                                            <Link href={route('transacciones.show', tx.id)}
                                                className="text-xs text-blue-800 hover:underline">
                                                Ver detalle
                                            </Link>
                                        </td>
                                    </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table></div>
                </div>

                {/* Paginación */}
                {transacciones.last_page > 1 && (
                    <div className="mt-4 flex items-center justify-center gap-1">
                        {transacciones.links.map((link, i) => (
                            <Link key={i} href={link.url || '#'}
                                className={`px-3 py-1 text-sm rounded-lg border transition ${link.active ? 'bg-blue-800 text-white border-blue-800' : link.url ? 'border-gray-300 text-gray-600 hover:bg-gray-50' : 'border-gray-200 text-gray-300 cursor-default'}`}
                                dangerouslySetInnerHTML={{ __html: link.label }} />
                        ))}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
