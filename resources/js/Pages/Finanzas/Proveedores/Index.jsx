/*
|--------------------------------------------------------------------------
| PÁGINA: Finanzas/Proveedores/Index.jsx
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué hace esta página?
|
|   El admin ve una tabla con TODOS los proveedores activos.
|   Por cada proveedor muestra:
|     - Deuda acumulada (lo que le vendió al negocio a precio_costo)
|     - Total pagado (lo que el admin ya le transfirió)
|     - Saldo pendiente = deuda - pagado
|
|   Al dar clic en "Registrar pago" → modal con formulario.
|   Al dar clic en el nombre del proveedor → drawer con detalle de pedidos del mes.
|
| PENSAR — ¿Por qué aquí y no en el módulo de pedidos?
|
|   Porque el pago al proveedor es un hecho FINANCIERO, no logístico.
|   El admin confirma primero que recibió el dinero del cliente,
|   y DESPUÉS en este módulo decide cuándo y cuánto le paga al proveedor.
|
*/

import { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index({ proveedores, metodos_pago, flash }) {

    const [modalPago, setModalPago]           = useState(null); // proveedor seleccionado
    const [drawerDetalle, setDrawerDetalle]   = useState(null); // proveedor para ver pedidos

    const fmt = (v) => new Intl.NumberFormat('es-CO', {
        style: 'currency', currency: 'COP', minimumFractionDigits: 0,
    }).format(v ?? 0);

    // ── Formulario de pago ─────────────────────────────────────────────────
    const { data, setData, post, processing, errors, reset } = useForm({
        proveedor_id: '',
        monto:        '',
        fecha_pago:   new Date().toISOString().split('T')[0],
        metodo_pago:  'transferencia',
        concepto:     '',
        notas:        '',
    });

    const abrirModal = (proveedor) => {
        setModalPago(proveedor);
        setData({
            proveedor_id: proveedor.id,
            monto:        proveedor.saldo_pendiente > 0 ? Math.round(proveedor.saldo_pendiente) : '',
            fecha_pago:   new Date().toISOString().split('T')[0],
            metodo_pago:  'transferencia',
            concepto:     `Liquidación ${new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })} — ${proveedor.nombre_empresa}`,
            notas:        '',
        });
    };

    const registrarPago = (e) => {
        e.preventDefault();
        post(route('pagos-proveedor.store'), {
            onSuccess: () => { reset(); setModalPago(null); },
        });
    };

    const totalSaldo    = proveedores.reduce((s, p) => s + p.saldo_pendiente, 0);
    const totalDeuda    = proveedores.reduce((s, p) => s + p.deuda_total, 0);
    const totalPagado   = proveedores.reduce((s, p) => s + p.total_pagado, 0);

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold text-gray-800">Pagos a Proveedores</h2>}
        >
            <Head title="Pagos a Proveedores" />

            <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

                {/* Flash */}
                {flash?.exito && (
                    <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-sm">
                        ✅ {flash.exito}
                    </div>
                )}

                {/* ── Breadcrumb ── */}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Link href={route('reportes.financiero')} className="hover:text-indigo-600">Finanzas</Link>
                    <span>/</span>
                    <span className="text-gray-900">Proveedores</span>
                </div>

                {/* ── KPIs resumen ── */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: 'Deuda total acumulada', valor: totalDeuda,  color: 'text-orange-600', bg: 'bg-orange-50' },
                        { label: 'Total pagado',           valor: totalPagado, color: 'text-green-700',  bg: 'bg-green-50'  },
                        { label: 'Saldo pendiente',        valor: totalSaldo,  color: totalSaldo > 0 ? 'text-red-600' : 'text-green-700', bg: totalSaldo > 0 ? 'bg-red-50' : 'bg-green-50' },
                    ].map((k) => (
                        <div key={k.label} className={`${k.bg} rounded-xl border border-gray-100 shadow-sm p-4`}>
                            <p className="text-xs text-gray-500 mb-1">{k.label}</p>
                            <p className={`text-2xl font-bold ${k.color}`}>{fmt(k.valor)}</p>
                        </div>
                    ))}
                </div>

                {/* ── Tabla de proveedores ── */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h3 className="text-base font-semibold text-gray-900">Proveedores activos</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{proveedores.length} proveedor{proveedores.length !== 1 ? 'es' : ''}</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50">
                                <tr>
                                    {['Proveedor', 'Ventas mes actual', 'Deuda total', 'Total pagado', 'Saldo pendiente', 'Acciones'].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {proveedores.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-sm">
                                            No hay proveedores activos
                                        </td>
                                    </tr>
                                ) : proveedores.map((p) => (
                                    <tr key={p.id} className="hover:bg-gray-50 transition">
                                        <td className="px-4 py-3">
                                            <button onClick={() => setDrawerDetalle(drawerDetalle?.id === p.id ? null : p)}
                                                className="text-sm font-medium text-indigo-600 hover:underline text-left">
                                                {p.nombre_empresa}
                                            </button>
                                            <p className="text-xs text-gray-400">{p.persona_contacto} · {p.telefono}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-sm text-gray-700">{fmt(p.ventas_mes)}</span>
                                            <p className="text-xs text-gray-400">{p.pedidos_mes?.length ?? 0} pedidos</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-sm font-medium text-orange-700">{fmt(p.deuda_total)}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-sm font-medium text-green-700">{fmt(p.total_pagado)}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-sm font-bold ${p.saldo_pendiente > 0 ? 'text-red-600' : 'text-green-700'}`}>
                                                {fmt(p.saldo_pendiente)}
                                            </span>
                                            {p.saldo_pendiente <= 0 && (
                                                <span className="ml-1 text-xs text-green-500">✓ Al día</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <button onClick={() => abrirModal(p)}
                                                className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition">
                                                💳 Registrar pago
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ── Drawer detalle de pedidos del mes ── */}
                {drawerDetalle && (
                    <div className="bg-white rounded-xl border border-indigo-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-indigo-100 flex items-center justify-between bg-indigo-50">
                            <div>
                                <h3 className="text-base font-semibold text-indigo-900">
                                    {drawerDetalle.nombre_empresa} — Pedidos del mes
                                </h3>
                                <p className="text-xs text-indigo-500">{drawerDetalle.pedidos_mes?.length ?? 0} pedidos confirmados/entregados</p>
                            </div>
                            <button onClick={() => setDrawerDetalle(null)} className="text-indigo-400 hover:text-indigo-700 text-xl">✕</button>
                        </div>
                        <div className="p-4 space-y-3">
                            {drawerDetalle.pedidos_mes?.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-6">Sin pedidos este mes</p>
                            ) : drawerDetalle.pedidos_mes?.map((ped) => (
                                <div key={ped.id} className="border border-gray-100 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-indigo-700">{ped.numero_pedido}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-400">{ped.fecha}</span>
                                            <span className="text-sm font-bold text-orange-600">{fmt(ped.costo_proveedor)}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        {ped.items?.map((item, i) => (
                                            <div key={i} className="flex justify-between text-xs text-gray-600">
                                                <span>{item.nombre} × {item.cantidad}</span>
                                                <span>{fmt(item.subtotal)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Últimos pagos */}
                        {drawerDetalle.ultimos_pagos?.length > 0 && (
                            <div className="border-t border-gray-100 px-4 py-4">
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Últimos pagos registrados</p>
                                <div className="space-y-2">
                                    {drawerDetalle.ultimos_pagos.map((pago) => (
                                        <div key={pago.id} className="flex justify-between items-center text-sm">
                                            <div>
                                                <span className="font-medium text-green-700">{fmt(pago.monto)}</span>
                                                <span className="text-xs text-gray-400 ml-2">{pago.fecha_pago} · {pago.metodo_pago}</span>
                                            </div>
                                            <span className="text-xs text-gray-500">{pago.concepto}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

            </div>

            {/* ── MODAL: Registrar pago ── */}
            {modalPago && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
                    onClick={(e) => e.target === e.currentTarget && setModalPago(null)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">

                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Registrar pago</h3>
                                <p className="text-sm text-gray-500">{modalPago.nombre_empresa}</p>
                            </div>
                            <button onClick={() => setModalPago(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
                        </div>

                        {/* Resumen financiero del proveedor */}
                        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 grid grid-cols-3 gap-3 text-center">
                            <div>
                                <p className="text-xs text-gray-400">Deuda total</p>
                                <p className="text-sm font-bold text-orange-600">{fmt(modalPago.deuda_total)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Ya pagado</p>
                                <p className="text-sm font-bold text-green-700">{fmt(modalPago.total_pagado)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Saldo pendiente</p>
                                <p className={`text-sm font-bold ${modalPago.saldo_pendiente > 0 ? 'text-red-600' : 'text-green-700'}`}>
                                    {fmt(modalPago.saldo_pendiente)}
                                </p>
                            </div>
                        </div>

                        <form onSubmit={registrarPago} className="p-6 space-y-4">

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Monto a pagar <span className="text-red-500">*</span>
                                </label>
                                <input type="number" min="1" step="100"
                                    value={data.monto} onChange={e => setData('monto', e.target.value)}
                                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.monto ? 'border-red-400' : 'border-gray-300'}`}
                                    placeholder="500000" />
                                {errors.monto && <p className="text-red-500 text-xs mt-1">{errors.monto}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha <span className="text-red-500">*</span></label>
                                    <input type="date" value={data.fecha_pago} onChange={e => setData('fecha_pago', e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Método <span className="text-red-500">*</span></label>
                                    <select value={data.metodo_pago} onChange={e => setData('metodo_pago', e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                        {Object.entries(metodos_pago).map(([k, v]) => (
                                            <option key={k} value={k}>{v}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Concepto</label>
                                <input type="text" value={data.concepto} onChange={e => setData('concepto', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Liquidación agosto 2026" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                                <textarea rows={2} value={data.notas} onChange={e => setData('notas', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Comprobante #12345..." />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setModalPago(null)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={processing}
                                    className="flex-1 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition">
                                    {processing ? 'Guardando...' : '✓ Registrar pago'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </AuthenticatedLayout>
    );
}
