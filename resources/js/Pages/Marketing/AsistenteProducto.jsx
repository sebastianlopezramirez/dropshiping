/*
|--------------------------------------------------------------------------
| PÁGINA: Marketing/AsistenteProducto.jsx
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué hace esta página?
|
|   Es el ANÁLISIS DETALLADO de un producto en el asistente IA.
|   Solo visible para super_administrador.
|
|   MODO LANZAMIENTO (sin métricas previas):
|     → Muestra datos del producto (precio, margen, CPA máx)
|     → Botón "Generar estrategia" → llama a Groq → muestra plan completo
|
|   MODO OPTIMIZACIÓN (con métricas reales de Meta Ads):
|     → Formulario para ingresar: CTR, ROAS, CPA, ventas, gasto, ingresos
|     → La IA analiza y devuelve: decisión + acciones concretas
|     → Guarda métricas en BD (no la respuesta de la IA)
|
|   HISTORIAL: tabla de todas las métricas registradas por fase
|   ELIMINAR: botón solo si el producto NO está activo
|
*/

import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

// ──────────────────────────────────────────────────────────────────────
// SUBCOMPONENTE: Tarjeta de datos del producto
// ──────────────────────────────────────────────────────────────────────
function TarjetaDatoProducto({ icono, label, valor, color = 'gray' }) {
    const colores = {
        gray:   'bg-gray-50   border-gray-200   text-gray-700',
        green:  'bg-green-50  border-green-200  text-green-700',
        orange: 'bg-orange-50 border-orange-200 text-orange-700',
        red:    'bg-red-50    border-red-200    text-red-700',
        blue:   'bg-blue-50   border-blue-200   text-blue-700',
    };
    return (
        <div className={`border rounded-xl p-4 ${colores[color]}`}>
            <p className="text-xs uppercase tracking-wide opacity-70">{icono} {label}</p>
            <p className="text-lg font-bold mt-1">{valor}</p>
        </div>
    );
}

// ──────────────────────────────────────────────────────────────────────
// SUBCOMPONENTE: Visualizador del análisis JSON de la IA
// ──────────────────────────────────────────────────────────────────────
function PanelAnalisisIA({ analisis, modo, urlProducto }) {
    // Intentar parsear el JSON de la IA
    let datos = null;
    try {
        // La IA puede devolver el JSON con backticks o sin ellos
        const limpio = analisis.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        // groq/compound-mini puede devolver texto antes/después del JSON — extraemos solo el bloque {}
        const match = limpio.match(/\{[\s\S]*\}/);
        datos = JSON.parse(match ? match[0] : limpio);
    } catch {
        // Si no es JSON válido, mostrar como texto
        return (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap">{analisis}</pre>
            </div>
        );
    }

    if (!datos) return null;

    // ── Colores por decisión ──
    const colorDecision = {
        'LANZAR':           'bg-blue-100 text-blue-800',
        'ESCALAR':          'bg-green-100 text-green-800',
        'ESCALAR MODERADO': 'bg-emerald-100 text-emerald-800',
        'OPTIMIZAR':        'bg-yellow-100 text-yellow-800',
        'PAUSAR':           'bg-red-100 text-red-800',
        'MANTENER':         'bg-gray-100 text-gray-800',
    };

    const colorNivel = {
        'ALTA':  'text-red-600',
        'MEDIA': 'text-yellow-600',
        'BAJA':  'text-green-600',
    };

    return (
        <div className="space-y-4">
            {/* Decisión principal */}
            <div className="flex items-center gap-3">
                <span className={`text-xl font-black px-4 py-2 rounded-xl ${colorDecision[datos.decision] ?? 'bg-gray-100 text-gray-800'}`}>
                    {datos.decision}
                </span>
                {datos.nivel_urgencia && (
                    <span className={`text-sm font-semibold ${colorNivel[datos.nivel_urgencia]}`}>
                        Urgencia {datos.nivel_urgencia}
                    </span>
                )}
            </div>

            {/* Resumen */}
            {datos.resumen && (
                <p className="text-gray-700 font-medium text-base border-l-4 border-orange-400 pl-3">
                    {datos.resumen}
                </p>
            )}

            {/* DIAGNÓSTICO (modo optimización) */}
            {datos.diagnostico && (
                <div className="grid grid-cols-3 gap-3">
                    {Object.entries(datos.diagnostico).map(([clave, info]) => {
                        const colorEstado = {
                            'OK':         'border-green-300 bg-green-50',
                            'ADVERTENCIA':'border-yellow-300 bg-yellow-50',
                            'CRITICO':    'border-red-300 bg-red-50',
                        };
                        return (
                            <div key={clave} className={`rounded-lg border p-3 ${colorEstado[info.estado] ?? 'border-gray-200 bg-gray-50'}`}>
                                <p className="text-xs uppercase font-semibold text-gray-500">{clave.toUpperCase()}</p>
                                <p className="text-lg font-bold text-gray-900">{info.valor}</p>
                                <p className="text-xs text-gray-600 mt-1">{info.interpretacion}</p>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ACCIONES INMEDIATAS */}
            {datos.acciones_inmediatas && datos.acciones_inmediatas.length > 0 && (
                <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">⚡ Acciones inmediatas</h4>
                    <div className="space-y-2">
                        {datos.acciones_inmediatas.map((accion, i) => (
                            <div key={i} className="flex items-start gap-3 bg-white border border-gray-200 rounded-lg p-3">
                                <span className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center flex-shrink-0 font-bold">
                                    {accion.prioridad ?? i + 1}
                                </span>
                                <div>
                                    <p className="text-sm text-gray-800">{accion.accion}</p>
                                    {accion.plazo && (
                                        <p className="text-xs text-gray-500 mt-0.5">⏱ {accion.plazo}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* FASES (modo lanzamiento) */}
            {datos.fases && datos.fases.length > 0 && (
                <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">📅 Plan por fases</h4>
                    <div className="space-y-3">
                        {datos.fases.map((fase, i) => (
                            <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="w-7 h-7 rounded-full bg-orange-500 text-white text-sm flex items-center justify-center font-bold">
                                        {fase.fase}
                                    </span>
                                    <h5 className="font-semibold text-gray-800">{fase.nombre}</h5>
                                    <span className="ml-auto text-xs text-gray-500">⏱ {fase.duracion}</span>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{fase.objetivo}</p>
                                {fase.acciones && (
                                    <ul className="text-xs text-gray-600 space-y-1">
                                        {fase.acciones.map((a, j) => (
                                            <li key={j} className="flex items-start gap-1">
                                                <span className="text-orange-400">→</span> {a}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {fase.metricas_objetivo && (
                                    <div className="mt-3 flex gap-3 text-xs">
                                        {fase.metricas_objetivo.ctr && (
                                            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">CTR ≥ {fase.metricas_objetivo.ctr}%</span>
                                        )}
                                        {fase.metricas_objetivo.roas && (
                                            <span className="bg-green-50 text-green-700 px-2 py-1 rounded">ROAS ≥ {fase.metricas_objetivo.roas}x</span>
                                        )}
                                        {fase.metricas_objetivo.cpa && (
                                            <span className="bg-orange-50 text-orange-700 px-2 py-1 rounded">CPA ≤ ${Number(fase.metricas_objetivo.cpa).toLocaleString('es-CO')}</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* COPY ORGÁNICO — Hooks */}
            {datos.copy_organico?.hooks && datos.copy_organico.hooks.length > 0 && (
                <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">🎣 Hooks para los primeros 3 segundos</h4>
                    <div className="grid grid-cols-2 gap-2">
                        {datos.copy_organico.hooks.map((h, i) => (
                            <div key={i} className="bg-white border border-gray-200 rounded-lg p-3">
                                <p className="text-xs font-bold text-orange-600 uppercase mb-1">{h.tipo}</p>
                                <p className="text-sm text-gray-800 font-medium italic">"{h.texto}"</p>
                                {h.nota && <p className="text-xs text-gray-500 mt-1">{h.nota}</p>}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* COPY ORGÁNICO — Captions */}
            {datos.copy_organico?.captions && datos.copy_organico.captions.length > 0 && (
                <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">✍️ Captions listos para publicar</h4>
                    <div className="space-y-3">
                        {datos.copy_organico.captions.map((c, i) => (
                            <div key={i} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded">Variante {c.variante}</span>
                                    <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded">{c.framework}</span>
                                </div>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.texto}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* COPY META ADS */}
            {datos.copy_meta_ads?.textos && datos.copy_meta_ads.textos.length > 0 && (
                <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">📢 Copy para Meta Ads</h4>

                    {/* ── Link de compra directa — aparece siempre antes de las variantes ── */}
                    {urlProducto && (
                        <div className="mb-3 bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide mb-1">
                                    🔗 Link de compra directa
                                </p>
                                <p className="text-sm text-indigo-900 font-mono break-all">{urlProducto}</p>
                            </div>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(urlProducto)
                                        .then(() => {
                                            // Feedback visual breve en el botón
                                            const btn = document.activeElement;
                                            if (btn) { btn.textContent = '✅ Copiado'; setTimeout(() => { btn.textContent = '📋 Copiar'; }, 1500); }
                                        })
                                        .catch(() => {});
                                }}
                                className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors"
                            >
                                📋 Copiar
                            </button>
                        </div>
                    )}

                    <div className="space-y-3">
                        {datos.copy_meta_ads.textos.map((t, i) => (
                            <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded">Variante {t.variante} — {t.tipo}</span>
                                    <span className="text-xs text-gray-500">{t.mejor_para}</span>
                                </div>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{t.texto}</p>
                            </div>
                        ))}
                    </div>
                    {datos.copy_meta_ads.titulares && datos.copy_meta_ads.titulares.length > 0 && (
                        <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <h5 className="text-xs font-bold text-blue-800 mb-2 uppercase">Titulares del anuncio</h5>
                            <div className="space-y-1">
                                {datos.copy_meta_ads.titulares.map((tit, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm">
                                        <span className="text-blue-600 font-medium flex-1">"{tit.texto}"</span>
                                        <span className="text-xs text-blue-400 flex-shrink-0">{tit.usa_en}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── DESCRIPCIÓN LISTA PARA PEGAR ───────────────────────────── */}
            {datos.descripcion_lista && (
                <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">📝 Descripción lista para pegar</h4>
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                        <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-2">
                            Instagram · WhatsApp · Redes sociales
                        </p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap mb-3">{datos.descripcion_lista}</p>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(datos.descripcion_lista)
                                    .then((e) => {
                                        e && e.preventDefault && e.preventDefault();
                                        const btn = document.activeElement;
                                        if (btn) { btn.textContent = '✅ Copiado'; setTimeout(() => { btn.textContent = '📋 Copiar descripción'; }, 1500); }
                                    })
                                    .catch(() => {});
                            }}
                            className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                        >
                            📋 Copiar descripción
                        </button>
                    </div>
                </div>
            )}

            {/* ── HASHTAGS INSTAGRAM ───────────────────────────────────────── */}
            {datos.hashtags_instagram && (
                <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">🏷️ Hashtags para Instagram</h4>
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-3">
                        {datos.hashtags_instagram.masivos?.length > 0 && (
                            <div>
                                <p className="text-xs font-bold text-purple-600 uppercase mb-1">🔴 Masivos (+1M usos)</p>
                                <p className="text-sm text-gray-700 flex flex-wrap gap-1">
                                    {datos.hashtags_instagram.masivos.map((h, i) => (
                                        <span key={i} className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-xs font-mono">{h}</span>
                                    ))}
                                </p>
                            </div>
                        )}
                        {datos.hashtags_instagram.medianos?.length > 0 && (
                            <div>
                                <p className="text-xs font-bold text-purple-600 uppercase mb-1">🟡 Medianos (100K–1M)</p>
                                <p className="text-sm text-gray-700 flex flex-wrap gap-1">
                                    {datos.hashtags_instagram.medianos.map((h, i) => (
                                        <span key={i} className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-xs font-mono">{h}</span>
                                    ))}
                                </p>
                            </div>
                        )}
                        {datos.hashtags_instagram.nicho?.length > 0 && (
                            <div>
                                <p className="text-xs font-bold text-purple-600 uppercase mb-1">🟢 Nicho (-100K)</p>
                                <p className="text-sm text-gray-700 flex flex-wrap gap-1">
                                    {datos.hashtags_instagram.nicho.map((h, i) => (
                                        <span key={i} className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-xs font-mono">{h}</span>
                                    ))}
                                </p>
                            </div>
                        )}
                        <button
                            onClick={() => {
                                const todos = [
                                    ...(datos.hashtags_instagram.masivos ?? []),
                                    ...(datos.hashtags_instagram.medianos ?? []),
                                    ...(datos.hashtags_instagram.nicho ?? []),
                                ].join(' ');
                                navigator.clipboard.writeText(todos)
                                    .then(() => {
                                        const btn = document.activeElement;
                                        if (btn) { btn.textContent = '✅ Copiado'; setTimeout(() => { btn.textContent = '📋 Copiar todos los hashtags'; }, 1500); }
                                    })
                                    .catch(() => {});
                            }}
                            className="bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                        >
                            📋 Copiar todos los hashtags
                        </button>
                    </div>
                </div>
            )}

            {/* BRIEF CREATIVO */}
            {datos.brief_creativo?.creatividades && datos.brief_creativo.creatividades.length > 0 && (
                <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">🎨 Brief Creativo — por prioridad</h4>
                    <div className="space-y-2">
                        {datos.brief_creativo.creatividades.map((cr, i) => (
                            <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-base">{'🥇🥈🥉'[i] ?? '⭐'}</span>
                                    <span className="font-semibold text-sm text-gray-800">{cr.tipo}</span>
                                </div>
                                <ul className="text-xs text-gray-600 space-y-1">
                                    {cr.acciones && cr.acciones.map((a, j) => (
                                        <li key={j} className="flex items-start gap-1">
                                            <span className="text-orange-400 flex-shrink-0">→</span> {a}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* SEGMENTACIÓN */}
            {datos.segmentacion && (
                <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">🎯 Audiencia & Segmentación</h4>
                    <div className="grid grid-cols-2 gap-3">
                        {datos.segmentacion.intereses_fria && datos.segmentacion.intereses_fria.length > 0 && (
                            <div className="bg-white border border-gray-200 rounded-xl p-3">
                                <p className="text-xs font-bold text-gray-500 uppercase mb-2">🧊 Audiencia Fría — Intereses</p>
                                {datos.segmentacion.tamano_audiencia && (
                                    <p className="text-xs text-gray-400 mb-2">{datos.segmentacion.tamano_audiencia}</p>
                                )}
                                <div className="flex flex-wrap gap-1">
                                    {datos.segmentacion.intereses_fria.map((int, i) => (
                                        <span key={i} className="bg-blue-50 text-blue-700 border border-blue-200 text-xs px-2 py-0.5 rounded">{int}</span>
                                    ))}
                                </div>
                                {datos.segmentacion.edad_min && (
                                    <p className="text-xs text-gray-400 mt-2">Edad: {datos.segmentacion.edad_min}–{datos.segmentacion.edad_max} · Colombia</p>
                                )}
                            </div>
                        )}
                        {datos.segmentacion.retargeting_pixeles && datos.segmentacion.retargeting_pixeles.length > 0 && (
                            <div className="bg-white border border-gray-200 rounded-xl p-3">
                                <p className="text-xs font-bold text-gray-500 uppercase mb-2">🔥 Retargeting (Pixel)</p>
                                <div className="flex flex-wrap gap-1">
                                    {datos.segmentacion.retargeting_pixeles.map((px, i) => (
                                        <span key={i} className="bg-green-50 text-green-700 border border-green-200 text-xs px-2 py-0.5 rounded">{px}</span>
                                    ))}
                                </div>
                                {datos.segmentacion.lookalike && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {datos.segmentacion.lookalike.map((lal, i) => (
                                            <span key={i} className="bg-purple-50 text-purple-700 border border-purple-200 text-xs px-2 py-0.5 rounded">{lal}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    {datos.segmentacion.broad_advantage && (
                        <div className="mt-2 bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600">
                            ⚡ <strong>Broad / Advantage+:</strong> {datos.segmentacion.broad_advantage}
                        </div>
                    )}
                </div>
            )}

            {/* KPIs */}
            {datos.kpis && (
                <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">📈 KPIs & Señales de decisión</h4>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                        {datos.kpis.ctr_objetivo && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                                <p className="text-xs text-blue-500 uppercase font-semibold mb-1">CTR objetivo</p>
                                <p className="text-xl font-black text-blue-700">{datos.kpis.ctr_objetivo}%</p>
                            </div>
                        )}
                        {datos.kpis.roas_objetivo && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                                <p className="text-xs text-green-500 uppercase font-semibold mb-1">ROAS objetivo</p>
                                <p className="text-xl font-black text-green-700">{datos.kpis.roas_objetivo}x</p>
                            </div>
                        )}
                        {datos.kpis.cpa_maximo && (
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
                                <p className="text-xs text-orange-500 uppercase font-semibold mb-1">CPA máximo</p>
                                <p className="text-xl font-black text-orange-700">${Number(datos.kpis.cpa_maximo).toLocaleString('es-CO')}</p>
                            </div>
                        )}
                    </div>
                    {datos.kpis.senales_escalar && (
                        <div className="bg-green-50 border-l-4 border-green-400 rounded-r-lg p-3 mb-2">
                            <p className="text-xs font-bold text-green-700 mb-1">🚀 Señales para ESCALAR</p>
                            <ul className="text-xs text-green-600 space-y-0.5">
                                {datos.kpis.senales_escalar.map((s, i) => <li key={i}>• {s}</li>)}
                            </ul>
                        </div>
                    )}
                    {datos.kpis.senales_pausar && (
                        <div className="bg-red-50 border-l-4 border-red-400 rounded-r-lg p-3">
                            <p className="text-xs font-bold text-red-700 mb-1">⛔ Señales para PAUSAR</p>
                            <ul className="text-xs text-red-600 space-y-0.5">
                                {datos.kpis.senales_pausar.map((s, i) => <li key={i}>• {s}</li>)}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {/* AJUSTE DE PRESUPUESTO */}
            {datos.ajuste_presupuesto && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-blue-800 mb-1">💰 Ajuste de presupuesto</h4>
                    <p className="text-sm text-blue-700">
                        <strong>{datos.ajuste_presupuesto.recomendacion}</strong> {datos.ajuste_presupuesto.porcentaje_cambio > 0 && `+${datos.ajuste_presupuesto.porcentaje_cambio}%`}
                        {datos.ajuste_presupuesto.nuevo_presupuesto_diario_cop && (
                            <span> → Nuevo presupuesto: <strong>${Number(datos.ajuste_presupuesto.nuevo_presupuesto_diario_cop).toLocaleString('es-CO')} COP/día</strong></span>
                        )}
                    </p>
                    {datos.ajuste_presupuesto.justificacion && (
                        <p className="text-xs text-blue-600 mt-1">{datos.ajuste_presupuesto.justificacion}</p>
                    )}
                </div>
            )}

            {/* CREATIVOS */}
            {datos.creativos && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-purple-800 mb-1">🎨 Creativos</h4>
                    <p className="text-sm text-purple-700">
                        <strong>{datos.creativos.accion ?? datos.creativos.formato_recomendado}</strong>
                        {datos.creativos.razon && <span> — {datos.creativos.razon}</span>}
                    </p>
                    {datos.creativos.gancho_apertura && (
                        <p className="text-xs mt-2 text-purple-700 italic">"{datos.creativos.gancho_apertura}"</p>
                    )}
                    {datos.creativos.tips_creativos && (
                        <ul className="text-xs text-purple-600 mt-2 space-y-1">
                            {datos.creativos.tips_creativos.map((t, i) => (
                                <li key={i}>• {t}</li>
                            ))}
                        </ul>
                    )}
                    {datos.creativos.ideas_nuevos_creativos && (
                        <ul className="text-xs text-purple-600 mt-2 space-y-1">
                            {datos.creativos.ideas_nuevos_creativos.map((t, i) => (
                                <li key={i}>• {t}</li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {/* HORARIOS (modo lanzamiento) */}
            {datos.horarios && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-green-800 mb-1">🕐 Horarios recomendados</h4>
                    <p className="text-sm text-green-700">
                        <strong>{datos.horarios.mejor_horario}</strong>
                    </p>
                    {datos.horarios.mejores_dias && (
                        <p className="text-xs text-green-600 mt-1">Días: {datos.horarios.mejores_dias.join(', ')}</p>
                    )}
                    {datos.horarios.justificacion && (
                        <p className="text-xs text-green-600 mt-1">{datos.horarios.justificacion}</p>
                    )}
                </div>
            )}

            {/* ══════════════════════════════════════════════════════
                GOOGLE SHOPPING
            ══════════════════════════════════════════════════════ */}
            {datos.google_shopping && (
                <div className="bg-white border-2 border-blue-200 rounded-xl p-4">
                    <h4 className="text-sm font-bold text-blue-700 mb-3 flex items-center gap-2">
                        🛒 Google Shopping — Configura tu ficha de producto
                    </h4>
                    <div className="space-y-3">
                        {datos.google_shopping.titulo_optimizado && (
                            <div className="bg-blue-50 rounded-lg p-3">
                                <p className="text-xs font-semibold text-blue-600 uppercase mb-1">Título optimizado (70 chars)</p>
                                <p className="text-sm text-gray-800 font-medium">{datos.google_shopping.titulo_optimizado}</p>
                            </div>
                        )}
                        {datos.google_shopping.descripcion_optimizada && (
                            <div className="bg-blue-50 rounded-lg p-3">
                                <p className="text-xs font-semibold text-blue-600 uppercase mb-1">Descripción (150 chars)</p>
                                <p className="text-sm text-gray-800">{datos.google_shopping.descripcion_optimizada}</p>
                            </div>
                        )}
                        {datos.google_shopping.categoria_google && (
                            <div className="bg-blue-50 rounded-lg p-3">
                                <p className="text-xs font-semibold text-blue-600 uppercase mb-1">Categoría Google Taxonomy</p>
                                <p className="text-sm text-gray-800">{datos.google_shopping.categoria_google}</p>
                            </div>
                        )}
                        {datos.google_shopping.tips_feed && datos.google_shopping.tips_feed.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold text-blue-600 uppercase mb-2">Tips para el feed</p>
                                <ul className="space-y-1">
                                    {datos.google_shopping.tips_feed.map((tip, i) => (
                                        <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                                            <span className="text-blue-500 mt-0.5 flex-shrink-0">✓</span> {tip}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {datos.google_shopping.como_hacerlo && (
                            <div className="bg-gray-50 border border-blue-100 rounded-lg p-3">
                                <p className="text-xs font-bold text-blue-700 uppercase mb-2">📋 Cómo hacerlo — paso a paso</p>
                                <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">
                                    {datos.google_shopping.como_hacerlo.replace(/PASO /g, '\nPASO ').trim()}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════
                GOOGLE SEARCH
            ══════════════════════════════════════════════════════ */}
            {datos.google_search && (
                <div className="bg-white border-2 border-indigo-200 rounded-xl p-4">
                    <h4 className="text-sm font-bold text-indigo-700 mb-3 flex items-center gap-2">
                        🔍 Google Search Ads — Palabras clave y anuncios
                    </h4>
                    <div className="space-y-3">
                        {/* Keywords */}
                        {datos.google_search.palabras_clave && datos.google_search.palabras_clave.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold text-indigo-600 uppercase mb-2">Palabras clave con CPC máximo</p>
                                <div className="space-y-2">
                                    {datos.google_search.palabras_clave.map((kw, i) => (
                                        <div key={i} className="flex items-start gap-2 bg-indigo-50 rounded-lg px-3 py-2">
                                            <span className={`text-xs px-2 py-0.5 rounded font-bold flex-shrink-0 ${
                                                kw.concordancia === 'EXACTA' ? 'bg-indigo-600 text-white' : 'bg-indigo-200 text-indigo-800'
                                            }`}>{kw.concordancia}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-800">{kw.keyword}</p>
                                                <p className="text-xs text-gray-500">{kw.intencion}</p>
                                            </div>
                                            <span className="text-xs font-bold text-indigo-700 flex-shrink-0">
                                                CPC máx ${Number(kw.cpc_max_cop).toLocaleString('es-CO')}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {/* Titulares */}
                        {datos.google_search.titulares_responsivos && datos.google_search.titulares_responsivos.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold text-indigo-600 uppercase mb-2">Titulares para el anuncio responsivo</p>
                                <div className="flex flex-wrap gap-2">
                                    {datos.google_search.titulares_responsivos.map((t, i) => (
                                        <span key={i} className="bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs px-2 py-1 rounded-lg">{t}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {/* Descripciones */}
                        {datos.google_search.descripciones && datos.google_search.descripciones.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold text-indigo-600 uppercase mb-2">Descripciones del anuncio</p>
                                <div className="space-y-1">
                                    {datos.google_search.descripciones.map((d, i) => (
                                        <p key={i} className="text-xs text-gray-700 bg-indigo-50 px-3 py-2 rounded-lg">{d}</p>
                                    ))}
                                </div>
                            </div>
                        )}
                        {/* Presupuesto */}
                        {datos.google_search.presupuesto_inicial_cop && (
                            <div className="flex items-center gap-2 bg-indigo-50 rounded-lg px-3 py-2">
                                <span className="text-xs font-semibold text-indigo-600">💰 Presupuesto inicial diario:</span>
                                <span className="text-sm font-bold text-indigo-800">
                                    ${Number(datos.google_search.presupuesto_inicial_cop).toLocaleString('es-CO')} COP
                                </span>
                            </div>
                        )}
                        {/* Como hacerlo */}
                        {datos.google_search.como_hacerlo && (
                            <div className="bg-gray-50 border border-indigo-100 rounded-lg p-3">
                                <p className="text-xs font-bold text-indigo-700 uppercase mb-2">📋 Cómo hacerlo — paso a paso</p>
                                <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">
                                    {datos.google_search.como_hacerlo.replace(/PASO /g, '\nPASO ').trim()}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════
                ALERTAS DE ACCIÓN — SEMÁFORO
            ══════════════════════════════════════════════════════ */}
            {datos.alertas_accion && datos.alertas_accion.length > 0 && (
                <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
                    <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                        🚦 Alertas de acción — Semáforo de rendimiento
                    </h4>
                    <div className="space-y-2">
                        {datos.alertas_accion.map((alerta, i) => {
                            const estilos = {
                                ROJO:     { borde: 'border-red-200 bg-red-50',       punto: 'bg-red-500',    texto: 'text-red-700',    badge: 'bg-red-100 text-red-700' },
                                AMARILLO: { borde: 'border-yellow-200 bg-yellow-50', punto: 'bg-yellow-500', texto: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-700' },
                                VERDE:    { borde: 'border-green-200 bg-green-50',   punto: 'bg-green-500',  texto: 'text-green-700',  badge: 'bg-green-100 text-green-700' },
                            };
                            const e = estilos[alerta.semaforo] ?? estilos.AMARILLO;
                            return (
                                <div key={i} className={`flex items-start gap-3 border rounded-lg p-3 ${e.borde}`}>
                                    <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-0.5 ${e.punto}`} />
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-xs font-semibold mb-1 ${e.texto}`}>
                                            {alerta.senal ?? alerta.señal}
                                        </p>
                                        <p className="text-xs text-gray-700">{alerta.accion}</p>
                                    </div>
                                    <span className={`text-xs px-2 py-0.5 rounded font-bold flex-shrink-0 ${e.badge}`}>
                                        {alerta.semaforo}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* PRÓXIMA REVISIÓN */}
            {datos.proxima_revision && (
                <div className="text-center py-3 bg-gray-50 rounded-xl border border-gray-200">
                    <p className="text-sm text-gray-600">
                        ⏰ <strong>Próxima revisión:</strong> {datos.proxima_revision}
                    </p>
                </div>
            )}
        </div>
    );
}

// ──────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ──────────────────────────────────────────────────────────────────────
export default function AsistenteProducto({ producto, metricas, puede_eliminar }) {

    // URL pública del producto en la tienda — se intenta via Ziggy, con fallback por slug
    const urlProducto = (() => {
        try { return route('tienda.producto', producto.slug); }
        catch { return `${window.location.origin}/productos/${producto.slug}`; }
    })();

    const [modo, setModo] = useState(metricas.length === 0 ? 'lanzamiento' : 'optimizacion');
    const [cargandoIA, setCargandoIA] = useState(false);
    const [analisisIA, setAnalisisIA] = useState(null);
    const [errorIA, setErrorIA] = useState(null);
    const [guardando, setGuardando] = useState(false);
    const [eliminando, setEliminando] = useState(false);
    const [mensajeExito, setMensajeExito] = useState('');
    const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);

    // Formulario de métricas
    const [formMetricas, setFormMetricas] = useState({
        fase:     (metricas.length + 1).toString(),
        ctr:      '',
        roas:     '',
        cpa:      '',
        ventas:   '',
        gasto:    '',
        ingresos: '',
        notas:    '',
    });

    const fmt = (v) => new Intl.NumberFormat('es-CO', {
        style: 'currency', currency: 'COP', minimumFractionDigits: 0,
    }).format(v ?? 0);

    // ── Llamar a la IA ──
    const generarAnalisis = async () => {
        setCargandoIA(true);
        setAnalisisIA(null);
        setErrorIA(null);

        try {
            const cuerpo = {
                modo,
                _token: document.querySelector('meta[name="csrf-token"]')?.content,
            };

            if (modo === 'optimizacion') {
                cuerpo.metricas = {
                    ctr:      formMetricas.ctr      ? parseFloat(formMetricas.ctr)      : null,
                    roas:     formMetricas.roas     ? parseFloat(formMetricas.roas)     : null,
                    cpa:      formMetricas.cpa      ? parseFloat(formMetricas.cpa)      : null,
                    ventas:   formMetricas.ventas   ? parseInt(formMetricas.ventas)     : null,
                    gasto:    formMetricas.gasto    ? parseFloat(formMetricas.gasto)    : null,
                    ingresos: formMetricas.ingresos ? parseFloat(formMetricas.ingresos) : null,
                };
            }

            const resp = await fetch(route('marketing.asistente.analizar', producto.id), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                    'Accept': 'application/json',
                },
                body: JSON.stringify(cuerpo),
            });

            const data = await resp.json();

            if (!resp.ok) {
                setErrorIA(data.error ?? 'Error desconocido al contactar la IA.');
            } else {
                setAnalisisIA(data.analisis);
            }
        } catch (e) {
            setErrorIA('Error de conexión. Verifica GROQ_API_KEY en .env');
        } finally {
            setCargandoIA(false);
        }
    };

    // ── Guardar métricas en BD ──
    const guardarMetricas = async () => {
        setGuardando(true);
        setMensajeExito('');

        try {
            const resp = await fetch(route('marketing.asistente.guardar', producto.id), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    fase:     parseInt(formMetricas.fase),
                    ctr:      formMetricas.ctr      ? parseFloat(formMetricas.ctr)      : null,
                    roas:     formMetricas.roas     ? parseFloat(formMetricas.roas)     : null,
                    cpa:      formMetricas.cpa      ? parseFloat(formMetricas.cpa)      : null,
                    ventas:   formMetricas.ventas   ? parseInt(formMetricas.ventas)     : null,
                    gasto:    formMetricas.gasto    ? parseFloat(formMetricas.gasto)    : null,
                    ingresos: formMetricas.ingresos ? parseFloat(formMetricas.ingresos) : null,
                    notas:    formMetricas.notas    || null,
                }),
            });

            const data = await resp.json();
            if (resp.ok) {
                setMensajeExito(data.mensaje ?? 'Métricas guardadas.');
                // Recargar la página para reflejar el historial actualizado
                setTimeout(() => router.reload(), 1500);
            } else {
                setErrorIA(data.error ?? 'Error al guardar.');
            }
        } catch (e) {
            setErrorIA('Error de conexión al guardar.');
        } finally {
            setGuardando(false);
        }
    };

    // ── Eliminar todas las métricas ──
    const eliminarMetricas = async () => {
        setEliminando(true);
        try {
            const resp = await fetch(route('marketing.asistente.eliminar', producto.id), {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                    'Accept': 'application/json',
                },
            });
            const data = await resp.json();
            if (resp.ok) {
                setMensajeExito(data.mensaje ?? 'Métricas eliminadas.');
                setConfirmandoEliminar(false);
                setTimeout(() => router.reload(), 1500);
            } else {
                setErrorIA(data.error ?? 'Error al eliminar.');
            }
        } catch (e) {
            setErrorIA('Error de conexión al eliminar.');
        } finally {
            setEliminando(false);
        }
    };

    const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400";

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route('marketing.asistente')}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            ←
                        </Link>
                        <span className="text-2xl">🤖</span>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{producto.nombre}</h2>
                            <p className="text-sm text-gray-500">
                                SKU: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{producto.sku}</code>
                                <span className="mx-2">·</span>
                                Fase actual:
                                <span className={`ml-1 font-semibold ${
                                    producto.fase_actual?.color === 'verde'   ? 'text-green-600'  :
                                    producto.fase_actual?.color === 'amarillo'? 'text-yellow-600' :
                                    producto.fase_actual?.color === 'rojo'    ? 'text-red-600'    : 'text-gray-500'
                                }`}>
                                    {producto.fase_actual?.nombre ?? 'Sin iniciar'}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title={`Asistente — ${producto.nombre}`} />

            <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-6">

                {/* ── Alertas de éxito / error ── */}
                {mensajeExito && (
                    <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
                        ✅ {mensajeExito}
                    </div>
                )}
                {errorIA && (
                    <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
                        ❌ {errorIA}
                        <button onClick={() => setErrorIA(null)} className="ml-auto text-red-500 hover:text-red-700">×</button>
                    </div>
                )}

                {/* ══ SECCIÓN 1: Datos del producto ══ */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">📦 Datos del producto</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <TarjetaDatoProducto
                            icono="💰" label="Precio venta"
                            valor={fmt(producto.precio_venta)}
                            color="green"
                        />
                        <TarjetaDatoProducto
                            icono="🏭" label="Precio costo"
                            valor={fmt(producto.precio_costo)}
                            color="gray"
                        />
                        <TarjetaDatoProducto
                            icono="📈" label="Margen"
                            valor={`${producto.margen_porcentaje ?? 0}%`}
                            color="blue"
                        />
                        <TarjetaDatoProducto
                            icono="🎯" label="CPA máximo"
                            valor={fmt(producto.cpa_maximo)}
                            color={producto.cpa_maximo > 0 ? 'orange' : 'red'}
                        />
                    </div>
                    {producto.roas_reciente > 0 && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                            <span>ROAS promedio reciente:</span>
                            <span className={`font-bold text-base ${
                                producto.roas_reciente >= 3.5 ? 'text-green-600' :
                                producto.roas_reciente >= 2.5 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                                {producto.roas_reciente}x
                            </span>
                        </div>
                    )}
                </div>

                {/* ══ SECCIÓN 2: Selector de modo ══ */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <div className="flex gap-3 mb-5">
                        <button
                            onClick={() => { setModo('lanzamiento'); setAnalisisIA(null); }}
                            className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all border-2 ${
                                modo === 'lanzamiento'
                                    ? 'bg-orange-500 text-white border-orange-500'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
                            }`}
                        >
                            🚀 Estrategia de Lanzamiento
                            <p className="font-normal text-xs mt-0.5 opacity-80">
                                {modo === 'lanzamiento' ? 'Plan completo desde cero' : 'Generar plan inicial'}
                            </p>
                        </button>
                        <button
                            onClick={() => { setModo('optimizacion'); setAnalisisIA(null); }}
                            className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all border-2 ${
                                modo === 'optimizacion'
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                            }`}
                        >
                            📊 Optimización por Fase
                            <p className="font-normal text-xs mt-0.5 opacity-80">
                                {modo === 'optimizacion' ? 'Ingresa métricas reales' : 'Analizar con datos de Meta Ads'}
                            </p>
                        </button>
                    </div>

                    {/* ── MODO LANZAMIENTO ── */}
                    {modo === 'lanzamiento' && (
                        <div className="space-y-4">
                            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-orange-800">
                                <p className="font-semibold mb-1">🎯 ¿Qué genera el asistente?</p>
                                <ul className="space-y-1 text-xs">
                                    <li>• Plan completo de 3 fases (Lanzamiento → Optimización → Escala)</li>
                                    <li>• Presupuesto diario en COP recomendado para tu margen</li>
                                    <li>• Segmentación de audiencia para Colombia</li>
                                    <li>• Horarios y días óptimos para pauta</li>
                                    <li>• Ideas de creativos y gancho de apertura</li>
                                    <li>• Métricas objetivo por fase (CTR, ROAS, CPA)</li>
                                </ul>
                            </div>
                            <button
                                onClick={generarAnalisis}
                                disabled={cargandoIA}
                                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                {cargandoIA ? (
                                    <>
                                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                                        </svg>
                                        Generando estrategia con IA…
                                    </>
                                ) : (
                                    '🚀 Generar estrategia completa'
                                )}
                            </button>
                        </div>
                    )}

                    {/* ── MODO OPTIMIZACIÓN ── */}
                    {modo === 'optimizacion' && (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-600">
                                Ingresa las métricas reales de <strong>Meta Ads / Instagram Insights</strong> del período actual:
                            </p>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                        Fase actual <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number" min="1" max="10"
                                        value={formMetricas.fase}
                                        onChange={e => setFormMetricas(p => ({...p, fase: e.target.value}))}
                                        className={inputCls}
                                        placeholder="1"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">CTR (%)</label>
                                    <input
                                        type="number" step="0.01" min="0" max="100"
                                        value={formMetricas.ctr}
                                        onChange={e => setFormMetricas(p => ({...p, ctr: e.target.value}))}
                                        className={inputCls}
                                        placeholder="1.5"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">ROAS</label>
                                    <input
                                        type="number" step="0.01" min="0"
                                        value={formMetricas.roas}
                                        onChange={e => setFormMetricas(p => ({...p, roas: e.target.value}))}
                                        className={inputCls}
                                        placeholder="2.8"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">CPA (COP)</label>
                                    <input
                                        type="number" min="0"
                                        value={formMetricas.cpa}
                                        onChange={e => setFormMetricas(p => ({...p, cpa: e.target.value}))}
                                        className={inputCls}
                                        placeholder="45000"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Ventas (unidades)</label>
                                    <input
                                        type="number" min="0"
                                        value={formMetricas.ventas}
                                        onChange={e => setFormMetricas(p => ({...p, ventas: e.target.value}))}
                                        className={inputCls}
                                        placeholder="12"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Gasto pub. (COP)</label>
                                    <input
                                        type="number" min="0"
                                        value={formMetricas.gasto}
                                        onChange={e => setFormMetricas(p => ({...p, gasto: e.target.value}))}
                                        className={inputCls}
                                        placeholder="210000"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Ingresos generados (COP)</label>
                                    <input
                                        type="number" min="0"
                                        value={formMetricas.ingresos}
                                        onChange={e => setFormMetricas(p => ({...p, ingresos: e.target.value}))}
                                        className={inputCls}
                                        placeholder="588000"
                                    />
                                </div>
                                <div className="col-span-3">
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Notas / observaciones</label>
                                    <textarea
                                        value={formMetricas.notas}
                                        onChange={e => setFormMetricas(p => ({...p, notas: e.target.value}))}
                                        className={inputCls}
                                        rows={2}
                                        placeholder="Ej: creativos de video funcionan mejor que imagen estática…"
                                    />
                                </div>
                            </div>

                            {/* ── PANEL DE ACCIONES con explicación visual ── */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                                {/* Botón 1: Analizar con IA — SOLO pantalla */}
                                <div className="border-2 border-blue-200 bg-blue-50 rounded-xl p-3">
                                    <div className="flex items-start gap-2 mb-2">
                                        <span className="text-lg">🧠</span>
                                        <div>
                                            <p className="text-sm font-bold text-blue-800">Analizar con IA</p>
                                            <p className="text-xs text-blue-600 leading-snug">
                                                Genera recomendaciones en pantalla usando los datos del formulario.
                                                <strong className="block mt-0.5">No guarda nada en la base de datos.</strong>
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={generarAnalisis}
                                        disabled={cargandoIA}
                                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        {cargandoIA ? (
                                            <>
                                                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                                                </svg>
                                                Analizando…
                                            </>
                                        ) : (
                                            '🧠 Analizar con IA'
                                        )}
                                    </button>
                                </div>

                                {/* Botón 2: Guardar métricas — GUARDA en BD */}
                                <div className="border-2 border-green-200 bg-green-50 rounded-xl p-3">
                                    <div className="flex items-start gap-2 mb-2">
                                        <span className="text-lg">💾</span>
                                        <div>
                                            <p className="text-sm font-bold text-green-800">Guardar métricas</p>
                                            <p className="text-xs text-green-700 leading-snug">
                                                Registra los datos del formulario en la base de datos (histórico real de Meta Ads).
                                                <strong className="block mt-0.5">Sí guarda en BD. Selecciona una fase primero.</strong>
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={guardarMetricas}
                                        disabled={guardando || !formMetricas.fase}
                                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-bold py-2.5 rounded-lg transition-colors"
                                    >
                                        {guardando ? 'Guardando…' : '💾 Guardar métricas'}
                                    </button>
                                    {!formMetricas.fase && (
                                        <p className="text-xs text-green-600 mt-1 text-center">↑ Selecciona una fase para habilitar</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ══ SECCIÓN 3: Resultado del análisis IA ══ */}
                {analisisIA && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <h3 className="text-sm font-semibold text-gray-700">🤖 Análisis del Asistente IA</h3>
                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                Llama 3.3 70B · Groq
                            </span>
                        </div>
                        <PanelAnalisisIA analisis={analisisIA} modo={modo} urlProducto={urlProducto} />
                    </div>
                )}

                {/* ══ SECCIÓN 4: Historial de métricas ══ */}
                {metricas.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-700">
                                📋 Historial de métricas ({metricas.length} registros)
                            </h3>
                            {/* Botón eliminar: solo si producto NO está activo */}
                            {puede_eliminar && (
                                <div>
                                    {!confirmandoEliminar ? (
                                        <button
                                            onClick={() => setConfirmandoEliminar(true)}
                                            className="text-xs text-red-500 hover:text-red-700 border border-red-200 px-3 py-1.5 rounded-lg transition-colors"
                                        >
                                            🗑 Eliminar historial
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-red-600 font-medium">¿Confirmar?</span>
                                            <button
                                                onClick={eliminarMetricas}
                                                disabled={eliminando}
                                                className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg"
                                            >
                                                {eliminando ? 'Eliminando…' : 'Sí, eliminar todo'}
                                            </button>
                                            <button
                                                onClick={() => setConfirmandoEliminar(false)}
                                                className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1.5"
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 text-left">
                                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Fase</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">CTR</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">ROAS</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">CPA</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Ventas</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Gasto</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Ingresos</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {metricas.map((m) => (
                                        <tr key={m.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <span className="w-7 h-7 rounded-full bg-orange-100 text-orange-700 text-xs font-bold flex items-center justify-center">
                                                    {m.fase}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 tabular-nums text-gray-700">{m.ctr ? `${m.ctr}%` : '—'}</td>
                                            <td className="px-4 py-3 tabular-nums">
                                                <span className={`font-semibold ${
                                                    m.roas >= 3.5 ? 'text-green-600' :
                                                    m.roas >= 2.5 ? 'text-yellow-600' : 'text-red-600'
                                                }`}>
                                                    {m.roas ? `${m.roas}x` : '—'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 tabular-nums text-gray-700">{m.cpa ? fmt(m.cpa) : '—'}</td>
                                            <td className="px-4 py-3 tabular-nums text-gray-700">{m.ventas ?? '—'}</td>
                                            <td className="px-4 py-3 tabular-nums text-gray-700">{m.gasto ? fmt(m.gasto) : '—'}</td>
                                            <td className="px-4 py-3 tabular-nums text-gray-700">{m.ingresos ? fmt(m.ingresos) : '—'}</td>
                                            <td className="px-4 py-3 text-xs text-gray-500">
                                                {new Date(m.creado_en).toLocaleDateString('es-CO', {
                                                    day: '2-digit', month: 'short', year: 'numeric'
                                                })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {!puede_eliminar && (
                            <p className="px-5 py-3 text-xs text-gray-400 border-t border-gray-50">
                                ℹ️ El historial solo se puede eliminar cuando el producto está en estado borrador o inactivo.
                            </p>
                        )}
                    </div>
                )}

            </div>
        </AuthenticatedLayout>
    );
}
