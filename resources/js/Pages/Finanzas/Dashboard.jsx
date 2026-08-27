/*
|--------------------------------------------------------------------------
| PÁGINA: Finanzas/Dashboard.jsx
|--------------------------------------------------------------------------
|
| MÓDULO FINANCIERO COMPLETO — todo en una pantalla:
|
|   1. Selector de período (año / mes / día / proveedor)
|   2. KPIs: Ingresos, Costo, Gastos, Utilidad, Margen %
|   3. Tabla de ventas (6 columnas) + modal de detalle por pedido
|   4. Gastos por categoría
|   5. Resumen de proveedores + registrar pago (al final de la misma página)
|
*/

import { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Dashboard({
    periodo, kpis, ventas = [], gastos_por_categoria,
    proveedores = [], metodos_pago = {}, flash,
}) {

    const [año, setAño]           = useState(periodo.año);
    const [mes, setMes]           = useState(periodo.mes);
    const [dia, setDia]           = useState(periodo.dia ?? 0);
    const [proveedorFiltro, setProveedorFiltro] = useState(periodo.proveedor_id ?? '');

    const [pedidoModal, setPedidoModal]   = useState(null);
    const [modalPago, setModalPago]       = useState(null);
    const [detalleProveedor, setDetalleProveedor] = useState(null);

    const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                   'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

    const fmt = (v) => new Intl.NumberFormat('es-CO', {
        style: 'currency', currency: 'COP', minimumFractionDigits: 0,
    }).format(v ?? 0);

    const fmtK = (v) => {
        const n = v ?? 0;
        if (Math.abs(n) >= 1_000_000) return `$${(n/1_000_000).toFixed(1)}M`;
        if (Math.abs(n) >= 1_000)     return `$${(n/1_000).toFixed(0)}K`;
        return fmt(n);
    };

    const aplicarFiltro = () => {
        const params = { año, mes };
        if (dia > 0)         params.dia = dia;
        if (proveedorFiltro) params.proveedor_id = proveedorFiltro;
        router.get(route('reportes.financiero'), params, { preserveState: true });
    };

    // ── Formulario de pago al proveedor ────────────────────────────────────
    const { data, setData, post, processing, errors, reset } = useForm({
        proveedor_id: '', monto: '', fecha_pago: new Date().toISOString().split('T')[0],
        metodo_pago: 'transferencia', concepto: '', notas: '',
    });

    const abrirPago = (prov) => {
        setModalPago(prov);
        setData({
            proveedor_id: prov.id,
            monto: prov.saldo_pendiente > 0 ? Math.round(prov.saldo_pendiente) : '',
            fecha_pago: new Date().toISOString().split('T')[0],
            metodo_pago: 'transferencia',
            concepto: `Liquidación ${meses[mes-1]} ${año} — ${prov.nombre_empresa}`,
            notas: '',
        });
    };

    const registrarPago = (e) => {
        e.preventDefault();
        post(route('pagos-proveedor.store'), {
            onSuccess: () => { reset(); setModalPago(null); },
        });
    };

    const colorEstado = {
        pendiente: 'bg-yellow-100 text-yellow-800', confirmado: 'bg-blue-100 text-blue-800',
        entregado: 'bg-green-100 text-green-800',   cancelado:  'bg-red-100 text-red-800',
    };

    const etiquetaMetodo = {
        contra_entrega: 'Contraentrega', transferencia: 'Transferencia',
        efectivo: 'Efectivo', nequi: 'Nequi',
    };

    const etiquetaCategoria = {
        publicidad: 'Publicidad', empaque: 'Empaque', hosting: 'Hosting',
        dominio: 'Dominio', herramientas: 'Herramientas', logistica: 'Logística',
        devolucion: 'Devolución', otro: 'Otro',
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800">Dashboard Financiero</h2>}>
            <Head title="Dashboard Financiero" />

            <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

                {/* Flash */}
                {flash?.exito && (
                    <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-sm">
                        ✅ {flash.exito}
                    </div>
                )}

                {/* ── SELECTOR DE PERÍODO ──────────────────────────────────── */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="text-sm font-medium text-gray-700">Período:</span>

                        <select value={mes} onChange={e => setMes(Number(e.target.value))}
                            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            {meses.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                        </select>

                        <input type="number" value={año} onChange={e => setAño(Number(e.target.value))}
                            min="2024" max="2030"
                            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-indigo-500" />

                        <div className="flex items-center gap-1.5">
                            <span className="text-xs text-gray-400">Día:</span>
                            <input type="number" value={dia === 0 ? '' : dia} placeholder="Todos"
                                onChange={e => setDia(e.target.value === '' ? 0 : Math.min(31, Math.max(1, Number(e.target.value))))}
                                min="1" max="31"
                                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-20 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            {dia > 0 && (
                                <button onClick={() => setDia(0)} className="text-xs text-gray-400 hover:text-red-500">✕</button>
                            )}
                        </div>

                        {/* Filtro por proveedor */}
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs text-gray-400">Proveedor:</span>
                            <select value={proveedorFiltro} onChange={e => setProveedorFiltro(e.target.value)}
                                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                <option value="">Todos</option>
                                {proveedores.map(p => (
                                    <option key={p.id} value={p.id}>{p.nombre_empresa}</option>
                                ))}
                            </select>
                            {proveedorFiltro && (
                                <button onClick={() => setProveedorFiltro('')} className="text-xs text-gray-400 hover:text-red-500">✕</button>
                            )}
                        </div>

                        <button onClick={aplicarFiltro}
                            className="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition">
                            Ver
                        </button>

                        <span className="ml-auto text-sm font-medium text-gray-700">
                            {dia > 0 ? `${dia} de ` : ''}{meses[mes-1]} {año}
                            {proveedorFiltro && proveedores.find(p => p.id === proveedorFiltro)
                                ? ` · ${proveedores.find(p => p.id === proveedorFiltro).nombre_empresa}` : ''}
                        </span>
                    </div>
                </div>

                {/* ── KPIs ─────────────────────────────────────────────────── */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                        { label: 'Ingresos',        valor: kpis.ingresos,         color: 'text-indigo-600',  bg: 'bg-indigo-50',  desc: 'Ventas confirmadas del período' },
                        { label: 'Costo productos',  valor: kpis.costo_productos,  color: 'text-orange-600',  bg: 'bg-orange-50',  desc: 'Costo de productos vendidos' },
                        { label: 'Gastos operativos',valor: kpis.gastos_op,        color: 'text-red-600',     bg: 'bg-red-50',     desc: 'Operativos del período' },
                        { label: 'Utilidad',         valor: kpis.utilidad,         color: kpis.utilidad >= 0 ? 'text-green-700' : 'text-red-600', bg: kpis.utilidad >= 0 ? 'bg-green-50' : 'bg-red-50', desc: 'Ingresos − Costo − Gastos' },
                        { label: 'Margen %',         valor: `${kpis.margen}%`,     color: kpis.margen >= 20 ? 'text-green-700' : 'text-yellow-700', bg: 'bg-white', noFmt: true, desc: 'Rentabilidad del período' },
                        {
                            label: 'Cuentas x Pagar',
                            valor: kpis.cuentas_x_pagar,
                            color: kpis.cuentas_x_pagar > 0 ? 'text-rose-700' : 'text-green-700',
                            bg: kpis.cuentas_x_pagar > 0 ? 'bg-rose-50' : 'bg-green-50',
                            desc: 'Deuda acumulada con proveedores',
                            badge: kpis.cuentas_x_pagar > 0 ? '⚠️ Pendiente de pago' : '✅ Al día',
                        },
                    ].map((kpi, i) => (
                        <div key={i} className={`${kpi.bg} rounded-xl border border-gray-100 shadow-sm p-4`}>
                            <p className="text-xs text-gray-500 mb-0.5">{kpi.label}</p>
                            <p className={`text-xl font-bold ${kpi.color}`}>
                                {kpi.noFmt ? kpi.valor : fmtK(kpi.valor)}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">{kpi.badge ?? kpi.desc}</p>
                        </div>
                    ))}
                </div>

                {/* ── TABLA DE VENTAS ───────────────────────────────────────── */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-semibold text-gray-900">Ventas del período</h3>
                            <p className="text-xs text-gray-400 mt-0.5">{ventas.length} pedido{ventas.length !== 1 ? 's' : ''}</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50">
                                <tr>
                                    {['Fecha','# Pedido','Costo total','Precio venta','Utilidad','Proveedor'].map(h => (
                                        <th key={h} className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${['Costo total','Precio venta','Utilidad'].includes(h) ? 'text-right' : 'text-left'}`}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {ventas.length === 0 ? (
                                    <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-sm">Sin ventas en este período</td></tr>
                                ) : ventas.map((v) => (
                                    <tr key={v.id} className="hover:bg-gray-50 transition">
                                        <td className="px-4 py-3">
                                            <p className="text-sm text-gray-900">{v.fecha}</p>
                                            <p className="text-xs text-gray-400">{v.hora}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <button onClick={() => setPedidoModal(v)}
                                                className="text-sm font-medium text-indigo-600 hover:underline text-left">
                                                {v.numero_pedido}
                                            </button>
                                            <p className="text-xs text-gray-400">{v.cliente_nombre}</p>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <p className="text-sm font-medium text-orange-700">{fmt(v.costo_total)}</p>
                                            {v.gastos_pedido > 0 && <p className="text-xs text-gray-400">+{fmt(v.gastos_pedido)} gastos</p>}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <p className="text-sm font-semibold text-gray-900">{fmt(v.precio_venta)}</p>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <p className={`text-sm font-bold ${v.utilidad >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                                                {v.utilidad >= 0 ? '' : '-'}{fmt(Math.abs(v.utilidad))}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-sm text-gray-700">{v.proveedor}</p>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            {ventas.length > 0 && (
                                <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                                    <tr>
                                        <td colSpan={2} className="px-4 py-3 text-sm font-semibold text-gray-700">Totales ({ventas.length})</td>
                                        <td className="px-4 py-3 text-right text-sm font-bold text-orange-700">{fmt(ventas.reduce((s,v)=>s+v.costo_total,0))}</td>
                                        <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">{fmt(ventas.reduce((s,v)=>s+v.precio_venta,0))}</td>
                                        <td className="px-4 py-3 text-right text-sm font-bold text-green-700">{fmt(ventas.reduce((s,v)=>s+v.utilidad,0))}</td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>

                {/* ── GASTOS POR CATEGORÍA ──────────────────────────────────── */}
                {Object.keys(gastos_por_categoria).length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <h3 className="text-base font-semibold text-gray-900 mb-4">Gastos por categoría</h3>
                        <div className="space-y-3">
                            {Object.entries(gastos_por_categoria).sort(([,a],[,b])=>b-a).map(([cat, monto]) => {
                                const total = Object.values(gastos_por_categoria).reduce((s,v)=>s+v,0);
                                const pct = total > 0 ? Math.round((monto/total)*100) : 0;
                                return (
                                    <div key={cat}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-700">{etiquetaCategoria[cat] ?? cat}</span>
                                            <span className="font-medium">{fmt(monto)} <span className="text-gray-400 text-xs">({pct}%)</span></span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                                            <div className="h-1.5 rounded-full bg-red-400" style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between text-sm">
                            <span className="text-gray-500">Total gastos</span>
                            <span className="font-bold text-red-600">{fmt(kpis.gastos_op)}</span>
                        </div>
                    </div>
                )}

                {/* ── PROVEEDORES — Deuda y pagos ──────────────────────────── */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h3 className="text-base font-semibold text-gray-900">Pagos a proveedores</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Deuda acumulada histórica · Registra pagos directamente aquí</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50">
                                <tr>
                                    {['Proveedor','Deuda acumulada','Total pagado','Saldo pendiente','Último pago','Acciones'].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {proveedores.length === 0 ? (
                                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">No hay proveedores activos</td></tr>
                                ) : proveedores.map((p) => {
                                    const ultimoPago = p.ultimos_pagos?.[0];
                                    return (
                                        <tr key={p.id} className="hover:bg-gray-50 transition">
                                            <td className="px-4 py-3">
                                                <button onClick={() => setDetalleProveedor(detalleProveedor?.id === p.id ? null : p)}
                                                    className="text-sm font-medium text-indigo-600 hover:underline text-left">
                                                    {p.nombre_empresa}
                                                </button>
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
                                                {p.saldo_pendiente <= 0 && <span className="ml-1 text-xs text-green-500">✓</span>}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-gray-500">
                                                {ultimoPago ? `${ultimoPago.fecha_pago} · ${fmt(ultimoPago.monto)}` : '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                {p.saldo_pendiente > 0 ? (
                                                    <button onClick={() => abrirPago(p)}
                                                        className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition">
                                                        💳 Registrar pago
                                                    </button>
                                                ) : (
                                                    <span className="text-xs text-green-600 font-medium">✓ Al día</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            {proveedores.length > 0 && (
                                <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                                    <tr>
                                        <td className="px-4 py-3 text-sm font-semibold text-gray-700">Totales</td>
                                        <td className="px-4 py-3 text-sm font-bold text-orange-700">{fmt(proveedores.reduce((s,p)=>s+p.deuda_total,0))}</td>
                                        <td className="px-4 py-3 text-sm font-bold text-green-700">{fmt(proveedores.reduce((s,p)=>s+p.total_pagado,0))}</td>
                                        <td className="px-4 py-3 text-sm font-bold text-red-600">{fmt(proveedores.reduce((s,p)=>s+p.saldo_pendiente,0))}</td>
                                        <td colSpan={2}></td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>

                    {/* Historial de pagos del proveedor seleccionado */}
                    {detalleProveedor && (
                        <div className="border-t border-indigo-100 bg-indigo-50 px-6 py-4">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-sm font-semibold text-indigo-900">
                                    Últimos pagos — {detalleProveedor.nombre_empresa}
                                </p>
                                <button onClick={() => setDetalleProveedor(null)} className="text-indigo-400 hover:text-indigo-700">✕</button>
                            </div>
                            {detalleProveedor.ultimos_pagos?.length === 0 ? (
                                <p className="text-sm text-indigo-500">Sin pagos registrados</p>
                            ) : (
                                <div className="space-y-2">
                                    {detalleProveedor.ultimos_pagos?.map((pg, i) => (
                                        <div key={i} className="flex justify-between text-sm">
                                            <span className="text-indigo-700">{pg.fecha_pago} · {pg.metodo_pago}</span>
                                            <div className="text-right">
                                                <span className="font-bold text-green-700">{fmt(pg.monto)}</span>
                                                {pg.concepto && <span className="text-xs text-gray-500 ml-2">{pg.concepto}</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </div>

            {/* ── MODAL DETALLE PEDIDO ─────────────────────────────────────── */}
            {pedidoModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
                    onClick={(e) => e.target === e.currentTarget && setPedidoModal(null)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">{pedidoModal.numero_pedido}</h3>
                                <p className="text-sm text-gray-500">{pedidoModal.fecha} · {pedidoModal.hora}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${colorEstado[pedidoModal.estado] ?? 'bg-gray-100 text-gray-600'}`}>
                                    {pedidoModal.estado}
                                </span>
                                <button onClick={() => setPedidoModal(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
                            </div>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Cliente</p>
                                <p className="text-sm font-medium text-gray-900">{pedidoModal.cliente_nombre}</p>
                                <p className="text-sm text-gray-500">{pedidoModal.cliente_telefono}</p>
                                <p className="text-sm text-gray-500">{pedidoModal.ciudad} — {pedidoModal.direccion_entrega}</p>
                                <p className="text-sm text-gray-500">Pago: {etiquetaMetodo[pedidoModal.metodo_pago] ?? pedidoModal.metodo_pago}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Productos</p>
                                <div className="space-y-2">
                                    {pedidoModal.items.map((item, i) => (
                                        <div key={i} className="flex justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                                            <div>
                                                <p className="font-medium text-gray-900">{item.nombre_producto}</p>
                                                <p className="text-xs text-gray-400">Cant: {item.cantidad} · Costo: {fmt(item.precio_costo)}</p>
                                            </div>
                                            <p className="font-semibold">{fmt(item.subtotal)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {pedidoModal.gastos_detalle?.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Gastos vinculados</p>
                                    {pedidoModal.gastos_detalle.map((g,i) => (
                                        <div key={i} className="flex justify-between text-sm">
                                            <span className="text-gray-600">{g.descripcion}</span>
                                            <span className="font-medium text-red-600">{fmt(g.monto)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                                <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Resumen financiero</p>
                                <div className="flex justify-between text-sm"><span className="text-gray-600">Precio de venta</span><span className="font-medium">{fmt(pedidoModal.precio_venta)}</span></div>
                                <div className="flex justify-between text-sm"><span className="text-gray-600">Costo productos</span><span className="font-medium text-orange-600">- {fmt(pedidoModal.costo_items)}</span></div>
                                {pedidoModal.gastos_pedido > 0 && (
                                    <div className="flex justify-between text-sm"><span className="text-gray-600">Gastos del pedido</span><span className="font-medium text-red-600">- {fmt(pedidoModal.gastos_pedido)}</span></div>
                                )}
                                <div className="flex justify-between text-sm border-t border-gray-200 pt-2 mt-2">
                                    <span className="font-semibold text-gray-900">Utilidad</span>
                                    <span className={`font-bold text-base ${pedidoModal.utilidad >= 0 ? 'text-green-700' : 'text-red-600'}`}>{fmt(pedidoModal.utilidad)}</span>
                                </div>
                            </div>
                            <div className="flex gap-2 pt-1">
                                <Link href={route('pedidos.show', pedidoModal.id)}
                                    className="flex-1 text-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition">
                                    Ver pedido completo →
                                </Link>
                                <button onClick={() => setPedidoModal(null)}
                                    className="px-4 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition">
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL REGISTRAR PAGO ─────────────────────────────────────── */}
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
                        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 grid grid-cols-3 gap-3 text-center">
                            <div><p className="text-xs text-gray-400">Deuda total</p><p className="text-sm font-bold text-orange-600">{fmt(modalPago.deuda_total)}</p></div>
                            <div><p className="text-xs text-gray-400">Ya pagado</p><p className="text-sm font-bold text-green-700">{fmt(modalPago.total_pagado)}</p></div>
                            <div><p className="text-xs text-gray-400">Saldo</p><p className={`text-sm font-bold ${modalPago.saldo_pendiente > 0 ? 'text-red-600' : 'text-green-700'}`}>{fmt(modalPago.saldo_pendiente)}</p></div>
                        </div>
                        <form onSubmit={registrarPago} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Monto <span className="text-red-500">*</span></label>
                                <input type="number" min="1" step="1" value={data.monto} onChange={e => setData('monto', e.target.value)}
                                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.monto ? 'border-red-400' : 'border-gray-300'}`}
                                    placeholder="500000" />
                                {errors.monto && <p className="text-red-500 text-xs mt-1">{errors.monto}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                                    <input type="date" value={data.fecha_pago} onChange={e => setData('fecha_pago', e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Método</label>
                                    <select value={data.metodo_pago} onChange={e => setData('metodo_pago', e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                        {Object.entries(metodos_pago).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Concepto</label>
                                <input type="text" value={data.concepto} onChange={e => setData('concepto', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
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
