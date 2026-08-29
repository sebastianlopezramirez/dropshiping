/*
|--------------------------------------------------------------------------
| PÁGINA: Portal/Dashboard.jsx
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué ve el proveedor al entrar?
|
|   1. KPIs financieros reales:
|      - Deuda acumulada (lo que el negocio le debe)
|      - Total cobrado (lo que ya le pagaron)
|      - Saldo pendiente
|      - Ventas del mes
|
|   2. Tabla "Mis ventas" — pedidos confirmados/entregados con sus productos
|      → clic en pedido → detalle expandible
|
|   3. Tabla "Mis cobros" — historial de pagos recibidos del admin
|
|   4. Accesos rápidos al resto del portal
|
*/

import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import PortalLayout from '@/Layouts/PortalLayout';

export default function Dashboard({ proveedor, estadisticas, ultimasVentas = [], pagosRecibidos = [] }) {

    const [ventaExpandida, setVentaExpandida] = useState(null);

    const fmt = (v) => new Intl.NumberFormat('es-CO', {
        style: 'currency', currency: 'COP', minimumFractionDigits: 0,
    }).format(v ?? 0);

    const colorEstado = {
        pendiente:  'bg-yellow-100 text-yellow-800',
        confirmado: 'bg-blue-100 text-blue-800',
        entregado:  'bg-green-100 text-green-800',
        cancelado:  'bg-red-100 text-red-800',
    };

    const etiquetaMetodo = {
        transferencia: 'Transferencia', nequi: 'Nequi', efectivo: 'Efectivo', otro: 'Otro',
    };

    return (
        <PortalLayout header={
            <div>
                <h2 className="text-xl font-semibold text-gray-800">
                    Bienvenido, {proveedor.nombre_empresa}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                    {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
            </div>
        }>
            <Head title="Portal Proveedor" />

            <div className="py-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

                {/* ── KPIs Financieros ──────────────────────────────────── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        {
                            label: 'Mis ventas (mes)',
                            valor: fmt(estadisticas.ventas_mes),
                            color: 'text-blue-800',
                            bg:    'bg-gray-50',
                            desc:  'A precio de costo',
                        },
                        {
                            label: 'Total cobrado',
                            valor: fmt(estadisticas.total_pagado),
                            color: 'text-green-700',
                            bg:    'bg-green-50',
                            desc:  'Pagos recibidos',
                        },
                        {
                            label: 'Saldo pendiente',
                            valor: fmt(estadisticas.saldo_pendiente),
                            color: estadisticas.saldo_pendiente > 0 ? 'text-orange-600' : 'text-green-700',
                            bg:    estadisticas.saldo_pendiente > 0 ? 'bg-orange-50' : 'bg-green-50',
                            desc:  'Lo que te deben',
                        },
                        {
                            label: 'Pedidos pendientes',
                            valor: estadisticas.pedidos_pendientes,
                            color: 'text-yellow-700',
                            bg:    'bg-yellow-50',
                            desc:  'Sin confirmar',
                        },
                    ].map((s, i) => (
                        <div key={i} className={`${s.bg} rounded-xl border border-gray-100 shadow-sm p-4`}>
                            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                            <p className={`text-xl font-bold ${s.color}`}>{s.valor}</p>
                            <p className="text-xs text-gray-400 mt-1">{s.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Alerta si hay saldo pendiente grande */}
                {estadisticas.saldo_pendiente > 100000 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-800">
                        💰 Tienes un saldo pendiente de <strong>{fmt(estadisticas.saldo_pendiente)}</strong>.
                        Comunícate con el administrador para gestionar el pago.
                    </div>
                )}

                {/* ── Accesos rápidos ───────────────────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    {/* Tienda */}
                    <Link href={route('tienda.index')}
                        className="flex items-start gap-4 p-5 bg-white rounded-xl border border-orange-200 hover:bg-orange-50 transition group">
                        <span className="text-3xl mt-0.5">🛍️</span>
                        <div>
                            <p className="font-semibold text-gray-800 group-hover:text-orange-700 transition">Tienda</p>
                            <p className="text-sm text-gray-500 mt-1">
                                Visita la tienda pública y ve cómo aparecen tus productos a los clientes. Aquí puedes revisar precios, fotos y disponibilidad de tu catálogo.
                            </p>
                        </div>
                    </Link>

                    {/* Portal Proveedor */}
                    <div className="p-5 bg-white rounded-xl border border-emerald-200">
                        <div className="flex items-start gap-4 mb-4">
                            <span className="text-3xl mt-0.5">📦</span>
                            <div>
                                <p className="font-semibold text-gray-800">Mi portal de proveedor</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    Gestiona tu inventario, revisa los pedidos que incluyen tus productos y consulta el historial de pagos recibidos.
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { href: route('portal.productos'),        label: 'Mis productos', icono: '📋' },
                                { href: route('portal.pedidos'),          label: 'Pedidos',       icono: '🛒' },
                                { href: route('portal.pagos'),            label: 'Mis cobros',    icono: '💰' },
                            ].map((a, i) => (
                                <Link key={i} href={a.href}
                                    className="flex flex-col items-center justify-center py-2.5 px-2 rounded-lg border border-emerald-100 hover:bg-emerald-50 transition text-center">
                                    <span className="text-lg mb-0.5">{a.icono}</span>
                                    <span className="text-xs font-medium text-gray-600">{a.label}</span>
                                </Link>
                            ))}
                        </div>
                    </div>

                </div>

                {/* ── Mis ventas (pedidos confirmados/entregados) ───────── */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-gray-800">Mis ventas recientes</h3>
                            <p className="text-xs text-gray-400 mt-0.5">Pedidos confirmados y entregados con tus productos</p>
                        </div>
                        <Link href={route('portal.pedidos')} className="text-sm text-emerald-600 hover:underline">
                            Ver todos →
                        </Link>
                    </div>

                    {ultimasVentas.length === 0 ? (
                        <div className="px-6 py-12 text-center text-gray-400">
                            <p className="text-4xl mb-2">📋</p>
                            <p>Aún no hay ventas confirmadas con tus productos.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {ultimasVentas.map((venta) => (
                                <div key={venta.id}>
                                    {/* Fila principal */}
                                    <button
                                        onClick={() => setVentaExpandida(ventaExpandida === venta.id ? null : venta.id)}
                                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition text-left"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div>
                                                <p className="text-sm font-medium text-emerald-700">{venta.numero_pedido}</p>
                                                <p className="text-xs text-gray-400">{venta.fecha} · {venta.hora}</p>
                                            </div>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colorEstado[venta.estado] ?? 'bg-gray-100 text-gray-600'}`}>
                                                {venta.estado}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm font-bold text-orange-600">{fmt(venta.costo_proveedor)}</span>
                                            <span className="text-gray-400 text-xs">{ventaExpandida === venta.id ? '▲' : '▼'}</span>
                                        </div>
                                    </button>

                                    {/* Detalle expandible */}
                                    {ventaExpandida === venta.id && (
                                        <div className="bg-gray-50 px-6 pb-4 pt-2 space-y-1">
                                            <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Productos de este pedido</p>
                                            {venta.items.map((item, i) => (
                                                <div key={i} className="flex justify-between text-sm">
                                                    <span className="text-gray-700">{item.nombre} <span className="text-gray-400">× {item.cantidad}</span></span>
                                                    <span className="font-medium text-orange-600">{fmt(item.subtotal)}</span>
                                                </div>
                                            ))}
                                            <div className="flex justify-between text-sm border-t border-gray-200 pt-2 mt-2">
                                                <span className="font-semibold text-gray-900">Total a cobrar</span>
                                                <span className="font-bold text-orange-700">{fmt(venta.costo_proveedor)}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Historial de pagos recibidos ──────────────────────── */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-gray-800">Mis cobros</h3>
                            <p className="text-xs text-gray-400 mt-0.5">Pagos recibidos del administrador</p>
                        </div>
                        <Link href={route('portal.pagos')} className="text-sm text-emerald-600 hover:underline">
                            Ver historial →
                        </Link>
                    </div>

                    {pagosRecibidos.length === 0 ? (
                        <div className="px-6 py-10 text-center text-gray-400">
                            <p className="text-4xl mb-2">💳</p>
                            <p className="text-sm">Aún no hay pagos registrados.</p>
                            <p className="text-xs mt-1">Cuando el admin registre un pago, aparecerá aquí.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {pagosRecibidos.map((pago) => (
                                <div key={pago.id} className="flex items-center justify-between px-6 py-3">
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">{pago.concepto || 'Pago recibido'}</p>
                                        <p className="text-xs text-gray-400">{pago.fecha_pago} · {etiquetaMetodo[pago.metodo_pago] ?? pago.metodo_pago}</p>
                                    </div>
                                    <span className="text-base font-bold text-green-700">{fmt(pago.monto)}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Resumen total */}
                    {pagosRecibidos.length > 0 && (
                        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-between">
                            <span className="text-sm text-gray-600">Total cobrado (mostrado)</span>
                            <span className="text-sm font-bold text-green-700">
                                {fmt(pagosRecibidos.reduce((s, p) => s + p.monto, 0))}
                            </span>
                        </div>
                    )}
                </div>

            </div>
        </PortalLayout>
    );
}
