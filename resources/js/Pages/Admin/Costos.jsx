/*
|--------------------------------------------------------------------------
| PÁGINA: Admin/Costos.jsx
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué hace esta página?
|
|   Dashboard de monitoreo de costos de infraestructura del mes actual.
|   Muestra semáforos (verde/amarillo/rojo) para cada servicio,
|   barras de progreso con porcentaje de uso del free tier,
|   y el costo total proyectado del mes.
|
| PENSAR — Props que recibe del controller:
|
|   metrica   → { emails_enviados, conversaciones_wa, anio, mes }
|   costos    → { whatsapp, resend, r2, railway, dominio, total, pedidos_mes }
|   historial → array últimos 6 meses [{ label, emails, conversaciones }]
|   periodo   → { mes, anio, label }
|
*/

import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

// ── Helpers ───────────────────────────────────────────────────────────────

const usd = (n) => `$${Number(n).toFixed(2)}`;

const coloresSemaforo = {
    verde:    { bg: 'bg-green-100',  text: 'text-green-700',  barra: 'bg-green-500',  punto: 'bg-green-500'  },
    amarillo: { bg: 'bg-yellow-100', text: 'text-yellow-700', barra: 'bg-yellow-400', punto: 'bg-yellow-400' },
    rojo:     { bg: 'bg-red-100',    text: 'text-red-700',    barra: 'bg-red-500',    punto: 'bg-red-500'    },
};

const mensajeSemaforo = {
    verde:    'Dentro del free tier ✅',
    amarillo: 'Próximo al límite — planifica ⚠️',
    rojo:     'Límite casi alcanzado — actúa ahora 🔴',
};

// ── Componente: Barra de progreso ─────────────────────────────────────────

function BarraUso({ porcentaje, semaforo }) {
    const col = coloresSemaforo[semaforo] ?? coloresSemaforo.verde;
    return (
        <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
            <div
                className={`h-2 rounded-full transition-all duration-500 ${col.barra}`}
                style={{ width: `${Math.min(100, porcentaje)}%` }}
            />
        </div>
    );
}

// ── Componente: Tarjeta de servicio ───────────────────────────────────────

function TarjetaServicio({ icono, nombre, costo, semaforo, porcentaje, children }) {
    const col = coloresSemaforo[semaforo] ?? coloresSemaforo.verde;
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-xl">{icono}</span>
                    <span className="font-semibold text-gray-800">{nombre}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${col.punto}`} />
                    <span className="font-bold text-gray-900">{usd(costo)}<span className="text-xs text-gray-400 font-normal">/mes</span></span>
                </div>
            </div>
            {children}
            {porcentaje !== undefined && (
                <>
                    <BarraUso porcentaje={porcentaje} semaforo={semaforo} />
                    <p className={`text-xs font-medium ${col.text}`}>
                        {porcentaje}% del free tier · {mensajeSemaforo[semaforo]}
                    </p>
                </>
            )}
        </div>
    );
}

// ── Componente principal ──────────────────────────────────────────────────

export default function Costos({ metrica, costos, historial, periodo }) {
    const { whatsapp, resend, r2, railway, dominio, total, pedidos_mes } = costos;

    return (
        <AuthenticatedLayout header={
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">💰 Costos de Infraestructura</h2>
                    <p className="text-sm text-gray-500 mt-0.5">{periodo.label} · {pedidos_mes} pedidos este mes</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Total proyectado</p>
                    <p className="text-2xl font-bold text-gray-900">{usd(total)}<span className="text-sm text-gray-400 font-normal">/mes</span></p>
                </div>
            </div>
        }>
            <Head title="Costos de Infraestructura" />

            <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">

                {/* Resumen en chips */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: 'WhatsApp', valor: usd(whatsapp.costo), semaforo: whatsapp.semaforo },
                        { label: 'Resend',   valor: usd(resend.costo),   semaforo: resend.semaforo   },
                        { label: 'R2',       valor: usd(r2.costo),       semaforo: r2.semaforo       },
                        { label: 'Railway',  valor: usd(railway.costo),  semaforo: railway.semaforo  },
                    ].map(({ label, valor, semaforo }) => {
                        const col = coloresSemaforo[semaforo];
                        return (
                            <div key={label} className={`rounded-lg px-4 py-3 ${col.bg}`}>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
                                <p className={`text-lg font-bold ${col.text}`}>{valor}</p>
                            </div>
                        );
                    })}
                </div>

                {/* Servicios detallados */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Detalle por servicio</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                        {/* WhatsApp */}
                        <TarjetaServicio icono="💬" nombre="WhatsApp API" costo={whatsapp.costo} semaforo={whatsapp.semaforo} porcentaje={whatsapp.porcentaje}>
                            <div className="text-sm text-gray-600 space-y-0.5">
                                <p><span className="font-medium">{whatsapp.conversaciones.toLocaleString()}</span> / {whatsapp.limite_gratis.toLocaleString()} conv. gratis</p>
                                {whatsapp.conv_pagadas > 0 && (
                                    <p className="text-yellow-600">{whatsapp.conv_pagadas} conv. pagadas × $0.0165</p>
                                )}
                            </div>
                        </TarjetaServicio>

                        {/* Resend */}
                        <TarjetaServicio icono="📧" nombre="Resend Email" costo={resend.costo} semaforo={resend.semaforo} porcentaje={resend.porcentaje}>
                            <div className="text-sm text-gray-600">
                                <p><span className="font-medium">{resend.emails.toLocaleString()}</span> / {resend.limite_gratis.toLocaleString()} emails gratis</p>
                                {resend.costo > 0 && <p className="text-yellow-600">Plan Pro activo ($20/mes)</p>}
                            </div>
                        </TarjetaServicio>

                        {/* R2 */}
                        <TarjetaServicio icono="☁️" nombre="Cloudflare R2" costo={r2.costo} semaforo={r2.semaforo} porcentaje={r2.porcentaje}>
                            <div className="text-sm text-gray-600 space-y-0.5">
                                <p><span className="font-medium">{r2.productos.toLocaleString()}</span> productos → {r2.storage_gb} GB</p>
                                <p className="text-gray-400">Free tier: {r2.limite_gratis_gb} GB · $0.015/GB adicional</p>
                            </div>
                        </TarjetaServicio>

                        {/* Railway */}
                        <TarjetaServicio icono="🚂" nombre="Railway" costo={railway.costo} semaforo="verde">
                            <div className="text-sm text-gray-600">
                                <p>Plan <span className="font-medium">{railway.plan}</span> · {pedidos_mes.toLocaleString()} pedidos este mes</p>
                                <p className="text-gray-400">Upgrade a Pro cuando superes 2,000 pedidos/mes</p>
                            </div>
                        </TarjetaServicio>

                        {/* Asistente IA (Groq) */}
                        <TarjetaServicio icono="🤖" nombre="Asistente IA (Groq)" costo={0} semaforo="verde" porcentaje={0}>
                            <div className="text-sm text-gray-600">
                                <p>Modelo <span className="font-medium">Llama 3.3 70B</span> · Free tier activo</p>
                                <p className="text-green-600">500,000 tokens/día gratuitos · Sin vencimiento</p>
                                <p className="text-gray-400">Costo sube a ~$0.59 USD / 1M tokens si se paga</p>
                            </div>
                        </TarjetaServicio>

                    </div>
                </div>

                {/* Reglas de acción */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Cuándo actuar</h3>
                    <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
                        {[
                            { icono: '💬', servicio: 'WhatsApp', amarillo: '700 conv/mes',  rojo: '900 conv/mes',   accion: 'Revisar volumen de notificaciones — WA ya cobra a 1,000' },
                            { icono: '📧', servicio: 'Resend',   amarillo: '2,000 emails',   rojo: '2,700 emails',   accion: 'Activar plan Pro ($20/mes) antes de llegar a 3,000' },
                            { icono: '☁️', servicio: 'R2',       amarillo: '8 GB storage',   rojo: '9.5 GB storage', accion: 'Comprimir imágenes o activar plan pago ($0.015/GB)' },
                            { icono: '🚂', servicio: 'Railway',  amarillo: '1,500 pedidos',  rojo: '2,000 pedidos',  accion: 'Migrar a plan Pro — Hobby tiene recursos limitados' },
                        ].map(({ icono, servicio, amarillo, rojo, accion }) => (
                            <div key={servicio} className="px-5 py-3 grid grid-cols-[2rem_6rem_1fr_1fr] gap-3 items-center text-sm">
                                <span>{icono}</span>
                                <span className="font-medium text-gray-700">{servicio}</span>
                                <span className="text-yellow-600">⚠️ {amarillo}</span>
                                <span className="text-red-500">🔴 {rojo}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Historial últimos 6 meses */}
                {historial.length > 0 && (
                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Historial — últimos 6 meses</h3>
                        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                                    <tr>
                                        <th className="px-5 py-3 text-left">Mes</th>
                                        <th className="px-5 py-3 text-right">Emails</th>
                                        <th className="px-5 py-3 text-right">Conv. WA</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {historial.map((h, i) => (
                                        <tr key={i} className={i === 0 ? 'bg-blue-50' : ''}>
                                            <td className="px-5 py-2.5 font-medium text-gray-700">
                                                {h.label} {i === 0 && <span className="text-xs text-blue-500 ml-1">← actual</span>}
                                            </td>
                                            <td className="px-5 py-2.5 text-right tabular-nums">{h.emails.toLocaleString()}</td>
                                            <td className="px-5 py-2.5 text-right tabular-nums">{h.conversaciones.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Nota de integración */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
                    <p className="font-semibold mb-1">💡 Cómo se actualizan los contadores</p>
                    <p>Los emails se incrementan automáticamente al enviar notificaciones. Las conversaciones de WhatsApp se registran al enviar mensajes desde el sistema. El storage de R2 se calcula en tiempo real desde el catálogo de productos.</p>
                </div>

            </div>
        </AuthenticatedLayout>
    );
}
