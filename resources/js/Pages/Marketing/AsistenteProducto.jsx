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

    const badgeDQ = {
        'COMPLETO':                    'bg-green-100 text-green-700',
        'NECESITA_INVESTIGACION_WEB':  'bg-yellow-100 text-yellow-700',
        'ECONOMICS_INCOMPLETOS':       'bg-orange-100 text-orange-700',
        'NO_META_DATA':                'bg-red-100 text-red-700',
        'NO_DISPONIBLE':               'bg-gray-100 text-gray-600',
    };
    const colorSemaforo = {
        'ROJO':     'bg-red-50 border-red-300 text-red-700',
        'AMARILLO': 'bg-yellow-50 border-yellow-300 text-yellow-700',
        'VERDE':    'bg-green-50 border-green-300 text-green-700',
    };

    // ══════════════════════════════════════════════════════════════
    // RENDERER LANZAMIENTO — Prompt Maestro v2 (Phase 1)
    // ══════════════════════════════════════════════════════════════
    if (modo === 'lanzamiento') {
        const d = datos;
        const fmtCOP = (n) => n != null ? `$${Number(n).toLocaleString('es-CO')} COP` : '—';

        return (
            <div className="space-y-5">

                {/* ── DECISIÓN + CONFIANZA ── */}
                <div className="flex flex-wrap items-center gap-3">
                    <span className={`text-2xl font-black px-5 py-2 rounded-xl ${colorDecision[d.decision] ?? 'bg-gray-100 text-gray-800'}`}>
                        {d.decision}
                    </span>
                    {d.confidence && (
                        <span className={`text-sm font-bold px-3 py-1 rounded-lg border ${
                            d.confidence === 'ALTA'  ? 'bg-green-50 border-green-300 text-green-700' :
                            d.confidence === 'MEDIA' ? 'bg-yellow-50 border-yellow-300 text-yellow-700' :
                                                       'bg-red-50 border-red-300 text-red-700'}`}>
                            Confianza {d.confidence}
                        </span>
                    )}
                </div>

                {/* ── RESUMEN EJECUTIVO ── */}
                {d.executive_summary && (
                    <p className="text-gray-800 font-medium text-base border-l-4 border-orange-400 pl-3 leading-relaxed">
                        {d.executive_summary}
                    </p>
                )}

                {/* ── NEXT ACTION ── */}
                {d.next_action && (
                    <div className="bg-orange-50 border border-orange-300 rounded-xl p-4 flex items-start gap-3">
                        <span className="text-2xl">⚡</span>
                        <div>
                            <p className="text-xs font-bold text-orange-600 uppercase tracking-wide mb-1">Acción más importante HOY</p>
                            <p className="text-sm font-semibold text-gray-800">{d.next_action}</p>
                        </div>
                    </div>
                )}

                {/* ── CALIDAD DE DATOS ── */}
                {d.data_quality && (
                    <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">📡 Calidad de datos disponibles</h4>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(d.data_quality).map(([clave, estado]) => (
                                <div key={clave} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${badgeDQ[estado] ?? 'bg-gray-100 text-gray-600'}`}>
                                    <span>{estado === 'COMPLETO' ? '✅' : estado === 'NECESITA_INVESTIGACION_WEB' ? '🔍' : estado === 'ECONOMICS_INCOMPLETOS' ? '⚠️' : '❌'}</span>
                                    <span className="font-semibold uppercase tracking-wide">{clave.replace(/_/g, ' ')}</span>
                                    <span className="ml-auto opacity-75 truncate">{estado}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── UNIT ECONOMICS ── */}
                {d.unit_economics && (
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">💰 Unit Economics</h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <p className="text-xs text-gray-500 uppercase mb-0.5">Precio venta</p>
                                <p className="font-bold text-gray-800">{fmtCOP(d.unit_economics.precio_venta_cop)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase mb-0.5">Costo declarado</p>
                                <p className="font-bold text-gray-800">{fmtCOP(d.unit_economics.precio_costo_declarado_cop)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase mb-0.5">Margen bruto</p>
                                <p className="font-bold text-green-700">{d.unit_economics.margen_bruto_pct}%</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase mb-0.5">CPA máximo</p>
                                <p className="font-bold text-orange-600">{fmtCOP(d.unit_economics.cpa_maximo_cop)}</p>
                            </div>
                        </div>
                        {d.unit_economics.alerta && (
                            <p className="mt-3 text-xs text-orange-700 bg-orange-50 rounded-lg px-3 py-2">
                                ⚠️ {d.unit_economics.alerta}
                            </p>
                        )}
                    </div>
                )}

                {/* ── IDENTIDAD DEL PRODUCTO ── */}
                {d.product_identity && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <h4 className="text-sm font-semibold text-blue-800 mb-3">🎯 Identidad del producto</h4>
                        <div className="space-y-2 text-sm">
                            {d.product_identity.problema_resuelve && (
                                <p><span className="font-semibold text-blue-700">Problema que resuelve: </span>{d.product_identity.problema_resuelve}</p>
                            )}
                            {d.product_identity.cliente_ideal && (
                                <p><span className="font-semibold text-blue-700">Cliente ideal: </span>{d.product_identity.cliente_ideal}</p>
                            )}
                            {d.product_identity.posicionamiento && (
                                <p><span className="font-semibold text-blue-700">Posicionamiento: </span>{d.product_identity.posicionamiento}</p>
                            )}
                        </div>
                    </div>
                )}

                {/* ── ANÁLISIS CATÁLOGO INTERNO ── */}
                {d.internal_catalog_analysis && (
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">📦 Catálogo relacionado</h4>
                        <div className="flex flex-wrap gap-3 text-sm">
                            <div className="bg-gray-50 rounded-lg px-3 py-2">
                                <p className="text-xs text-gray-500">Productos relacionados</p>
                                <p className="font-bold text-gray-800">{d.internal_catalog_analysis.productos_relacionados_count}</p>
                            </div>
                            {d.internal_catalog_analysis.riesgo_canibalizacion && (
                                <div className={`rounded-lg px-3 py-2 ${
                                    d.internal_catalog_analysis.riesgo_canibalizacion === 'ALTO' ? 'bg-red-50' :
                                    d.internal_catalog_analysis.riesgo_canibalizacion === 'MEDIO' ? 'bg-yellow-50' : 'bg-green-50'}`}>
                                    <p className="text-xs text-gray-500">Riesgo canibalización</p>
                                    <p className="font-bold text-gray-800">{d.internal_catalog_analysis.riesgo_canibalizacion}</p>
                                </div>
                            )}
                        </div>
                        {d.internal_catalog_analysis.diferenciacion_vs_catalogo && (
                            <p className="mt-2 text-xs text-gray-600">
                                <span className="font-semibold">Diferenciación:</span> {d.internal_catalog_analysis.diferenciacion_vs_catalogo}
                            </p>
                        )}
                        {d.internal_catalog_analysis.oportunidad_upsell && (
                            <p className="mt-1 text-xs text-green-700">
                                🔼 <span className="font-semibold">Upsell:</span> {d.internal_catalog_analysis.oportunidad_upsell}
                            </p>
                        )}
                    </div>
                )}

                {/* ── MERCADO ── */}
                {d.market_research && d.market_research.status !== 'NECESITA_INVESTIGACION_WEB' && (
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">🔍 Investigación de mercado</h4>
                        <p className="text-sm text-gray-700">{d.market_research.nota}</p>
                    </div>
                )}
                {d.market_research?.status === 'NECESITA_INVESTIGACION_WEB' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-800">
                        🔍 <strong>Datos de mercado pendientes</strong> — {d.market_research.nota}
                    </div>
                )}

                {/* ── ANÁLISIS FODA ── */}
                {d.product_analysis && (
                    <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">📊 Análisis FODA</h4>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { key: 'fortalezas',    label: 'Fortalezas',    color: 'border-green-300 bg-green-50',  dot: 'text-green-600' },
                                { key: 'debilidades',   label: 'Debilidades',   color: 'border-red-300 bg-red-50',     dot: 'text-red-500' },
                                { key: 'oportunidades', label: 'Oportunidades', color: 'border-blue-300 bg-blue-50',   dot: 'text-blue-600' },
                                { key: 'amenazas',      label: 'Amenazas',      color: 'border-orange-300 bg-orange-50', dot: 'text-orange-500' },
                            ].map(({ key, label, color, dot }) => d.product_analysis[key]?.length > 0 && (
                                <div key={key} className={`rounded-xl border p-3 ${color}`}>
                                    <p className="text-xs font-bold uppercase mb-2 text-gray-600">{label}</p>
                                    <ul className="space-y-1">
                                        {d.product_analysis[key].map((item, i) => (
                                            <li key={i} className={`text-xs text-gray-700 flex items-start gap-1`}>
                                                <span className={`${dot} flex-shrink-0 font-bold`}>•</span> {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── ANÁLISIS DE CLIENTE ── */}
                {d.customer_analysis && (
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">👤 Análisis de cliente</h4>
                        {d.customer_analysis.perfil_primario && (
                            <p className="text-sm text-gray-800 mb-3 font-medium">{d.customer_analysis.perfil_primario}</p>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                            {d.customer_analysis.pain_points?.length > 0 && (
                                <div>
                                    <p className="text-xs font-bold text-red-600 uppercase mb-1">Pain points</p>
                                    <ul className="space-y-0.5">
                                        {d.customer_analysis.pain_points.map((p, i) => (
                                            <li key={i} className="text-xs text-gray-700">• {p}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {d.customer_analysis.motivadores_compra?.length > 0 && (
                                <div>
                                    <p className="text-xs font-bold text-green-600 uppercase mb-1">Motivadores</p>
                                    <ul className="space-y-0.5">
                                        {d.customer_analysis.motivadores_compra.map((p, i) => (
                                            <li key={i} className="text-xs text-gray-700">• {p}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {d.customer_analysis.objeciones_frecuentes?.length > 0 && (
                                <div>
                                    <p className="text-xs font-bold text-orange-600 uppercase mb-1">Objeciones</p>
                                    <ul className="space-y-0.5">
                                        {d.customer_analysis.objeciones_frecuentes.map((p, i) => (
                                            <li key={i} className="text-xs text-gray-700">• {p}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {d.customer_analysis.donde_pasa_tiempo?.length > 0 && (
                                <div>
                                    <p className="text-xs font-bold text-blue-600 uppercase mb-1">Dónde está</p>
                                    <div className="flex flex-wrap gap-1">
                                        {d.customer_analysis.donde_pasa_tiempo.map((p, i) => (
                                            <span key={i} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">{p}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── OFERTA ── */}
                {d.offer_analysis && (
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">🏷️ Análisis de oferta</h4>
                        <div className="space-y-2 text-sm text-gray-700">
                            {d.offer_analysis.propuesta_valor && (
                                <p><span className="font-semibold">Propuesta de valor:</span> {d.offer_analysis.propuesta_valor}</p>
                            )}
                            {d.offer_analysis.garantia_recomendada && (
                                <p><span className="font-semibold">Garantía recomendada:</span> {d.offer_analysis.garantia_recomendada}</p>
                            )}
                            {d.offer_analysis.urgencia_escasez && (
                                <p><span className="font-semibold">Urgencia/escasez:</span> {d.offer_analysis.urgencia_escasez}</p>
                            )}
                            {d.offer_analysis.precio_competitivo && (
                                <p className="text-xs text-gray-500">Precio competitivo: {d.offer_analysis.precio_competitivo}</p>
                            )}
                        </div>
                    </div>
                )}

                {/* ── STOCK WARNING ── */}
                {d.stock_warning && (
                    <div className={`rounded-xl p-3 text-sm flex items-center gap-3 border ${
                        d.stock_warning.alerta === 'SIN_STOCK' ? 'bg-red-50 border-red-300 text-red-700' :
                        d.stock_warning.alerta === 'STOCK_BAJO' ? 'bg-orange-50 border-orange-300 text-orange-700' :
                        'bg-green-50 border-green-300 text-green-700'}`}>
                        <span className="text-xl">{d.stock_warning.alerta === 'SIN_STOCK' ? '🚫' : d.stock_warning.alerta === 'STOCK_BAJO' ? '⚠️' : '✅'}</span>
                        <div>
                            <span className="font-bold">Stock: {d.stock_warning.stock_actual} unidades</span>
                            {d.stock_warning.dias_estimados && (
                                <span className="ml-2 text-xs opacity-80">({d.stock_warning.dias_estimados})</span>
                            )}
                        </div>
                    </div>
                )}

                {/* ── META ADS STRATEGY — FASES ── */}
                {d.meta_ads_strategy?.fases?.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-1">📅 Estrategia Meta Ads — Fases</h4>
                        {d.meta_ads_strategy.presupuesto_diario_inicial_cop && (
                            <p className="text-xs text-gray-500 mb-2">
                                Presupuesto inicial: <strong>{fmtCOP(d.meta_ads_strategy.presupuesto_diario_inicial_cop)}/día</strong> · Prueba: {d.meta_ads_strategy.duracion_prueba_dias} días
                            </p>
                        )}
                        <div className="space-y-3">
                            {d.meta_ads_strategy.fases.map((fase, i) => (
                                <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="w-7 h-7 rounded-full bg-orange-500 text-white text-sm flex items-center justify-center font-bold">{fase.fase}</span>
                                        <h5 className="font-semibold text-gray-800">{fase.nombre}</h5>
                                        <span className="ml-auto text-xs text-gray-500">⏱ {fase.duracion}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">{fase.objetivo}</p>
                                    {fase.metricas_objetivo && (
                                        <div className="flex flex-wrap gap-2 text-xs">
                                            {fase.metricas_objetivo.ctr && (
                                                <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">CTR ≥ {fase.metricas_objetivo.ctr}%</span>
                                            )}
                                            {fase.metricas_objetivo.roas && (
                                                <span className="bg-green-50 text-green-700 px-2 py-1 rounded">ROAS ≥ {fase.metricas_objetivo.roas}x</span>
                                            )}
                                            {fase.metricas_objetivo.cpa && (
                                                <span className="bg-orange-50 text-orange-700 px-2 py-1 rounded">CPA ≤ {fmtCOP(fase.metricas_objetivo.cpa)}</span>
                                            )}
                                            {fase.presupuesto_diario && (
                                                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded">{fmtCOP(fase.presupuesto_diario)}/día</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        {/* Segmentación */}
                        {d.meta_ads_strategy.segmentacion && (
                            <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
                                <p className="text-xs font-bold text-blue-700 uppercase mb-2">🎯 Segmentación inicial</p>
                                {d.meta_ads_strategy.segmentacion.ciudades?.length > 0 && (
                                    <div className="mb-2">
                                        <p className="text-xs text-blue-600 font-semibold mb-1">Ciudades</p>
                                        <div className="flex flex-wrap gap-1">
                                            {d.meta_ads_strategy.segmentacion.ciudades.map((c, i) => (
                                                <span key={i} className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">{c}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {d.meta_ads_strategy.segmentacion.intereses?.length > 0 && (
                                    <div className="mb-2">
                                        <p className="text-xs text-blue-600 font-semibold mb-1">Intereses</p>
                                        <div className="flex flex-wrap gap-1">
                                            {d.meta_ads_strategy.segmentacion.intereses.map((c, i) => (
                                                <span key={i} className="bg-white text-blue-700 border border-blue-200 text-xs px-2 py-0.5 rounded">{c}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ── ESTRATEGIA CREATIVA ── */}
                {d.creative_strategy && (
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                        <h4 className="text-sm font-semibold text-purple-800 mb-2">🎨 Estrategia creativa</h4>
                        {d.creative_strategy.formato_prioritario && (
                            <p className="text-sm font-bold text-purple-700 mb-1">📱 {d.creative_strategy.formato_prioritario}</p>
                        )}
                        {d.creative_strategy.gancho_apertura && (
                            <p className="text-sm text-gray-700 italic mb-3">"{d.creative_strategy.gancho_apertura}"</p>
                        )}
                        {d.creative_strategy.angulos_creativos?.length > 0 && (
                            <div className="space-y-2 mb-3">
                                <p className="text-xs font-bold text-purple-600 uppercase">Ángulos creativos</p>
                                {d.creative_strategy.angulos_creativos.map((a, i) => (
                                    <div key={i} className="bg-white rounded-lg p-3 border border-purple-100">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-bold text-purple-700">{a.angulo}</span>
                                            {a.duracion && <span className="text-xs text-gray-400 ml-auto">{a.duracion}</span>}
                                        </div>
                                        <p className="text-xs text-gray-600">{a.descripcion}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                        {d.creative_strategy.tips_produccion?.length > 0 && (
                            <div>
                                <p className="text-xs font-bold text-purple-600 uppercase mb-1">Tips de producción</p>
                                <ul className="space-y-0.5">
                                    {d.creative_strategy.tips_produccion.map((t, i) => (
                                        <li key={i} className="text-xs text-purple-700">• {t}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                {/* ── COPY — TEXTOS PRINCIPALES ── */}
                {d.copy?.primary_texts?.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">✍️ Copy — Textos principales</h4>
                        {/* Link de compra */}
                        {urlProducto && (
                            <div className="mb-3 bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex items-center gap-3">
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-indigo-600 uppercase mb-1">🔗 Link de compra</p>
                                    <p className="text-sm text-indigo-900 font-mono break-all">{urlProducto}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(urlProducto)
                                            .then(() => { const b = document.activeElement; if (b) { b.textContent = '✅'; setTimeout(() => { b.textContent = '📋'; }, 1500); } })
                                            .catch(() => {});
                                    }}
                                    className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors"
                                >
                                    📋
                                </button>
                            </div>
                        )}
                        <div className="space-y-3">
                            {d.copy.primary_texts.map((t, i) => (
                                <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded">Variante {t.variante}</span>
                                        {t.framework && <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded">{t.framework}</span>}
                                        {t.target && <span className="text-xs text-gray-400">{t.target}</span>}
                                    </div>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{t.texto}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── COPY — HOOKS ── */}
                {d.copy?.hooks?.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">🎣 Hooks (primeros 3 segundos)</h4>
                        <div className="grid grid-cols-2 gap-2">
                            {d.copy.hooks.map((h, i) => (
                                <div key={i} className="bg-white border border-gray-200 rounded-lg p-3">
                                    <p className="text-xs font-bold text-orange-600 uppercase mb-1">{h.tipo}</p>
                                    <p className="text-sm text-gray-800 italic">"{h.texto}"</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── COPY — TITULARES ── */}
                {d.copy?.headlines?.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <h5 className="text-xs font-bold text-blue-800 uppercase mb-2">📌 Titulares del anuncio</h5>
                        <div className="space-y-1">
                            {d.copy.headlines.map((h, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm">
                                    <span className="text-blue-700 font-medium flex-1">"{h.texto}"</span>
                                    {h.uso && <span className="text-xs text-blue-400 flex-shrink-0">{h.uso}</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── HASHTAGS ── */}
                {d.copy?.hashtags && (
                    <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">🏷️ Hashtags</h4>
                        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-3">
                            {['masivos', 'medianos', 'nicho'].map((nivel) => d.copy.hashtags[nivel]?.length > 0 && (
                                <div key={nivel}>
                                    <p className="text-xs font-bold text-purple-600 uppercase mb-1">
                                        {nivel === 'masivos' ? '🔴 Masivos' : nivel === 'medianos' ? '🟡 Medianos' : '🟢 Nicho'}
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                        {d.copy.hashtags[nivel].map((h, i) => (
                                            <span key={i} className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-xs font-mono">{h}</span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            <button
                                onClick={() => {
                                    const todos = [
                                        ...(d.copy.hashtags?.masivos ?? []),
                                        ...(d.copy.hashtags?.medianos ?? []),
                                        ...(d.copy.hashtags?.nicho ?? []),
                                    ].join(' ');
                                    navigator.clipboard.writeText(todos)
                                        .then(() => { const b = document.activeElement; if (b) { b.textContent = '✅ Copiado'; setTimeout(() => { b.textContent = '📋 Copiar hashtags'; }, 1500); } })
                                        .catch(() => {});
                                }}
                                className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                            >
                                📋 Copiar hashtags
                            </button>
                        </div>
                    </div>
                )}

                {/* ── KPIs ── */}
                {d.kpis && (
                    <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">📈 KPIs objetivo</h4>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { label: 'CTR mínimo',   val: `${d.kpis.ctr_minimo}%`,   color: 'bg-gray-50 border-gray-200' },
                                { label: 'CTR objetivo', val: `${d.kpis.ctr_objetivo}%`,  color: 'bg-blue-50 border-blue-200' },
                                { label: 'ROAS mínimo',  val: `${d.kpis.roas_minimo}x`,   color: 'bg-gray-50 border-gray-200' },
                                { label: 'ROAS objetivo',val: `${d.kpis.roas_objetivo}x`,  color: 'bg-green-50 border-green-200' },
                                { label: 'ROAS escala',  val: `${d.kpis.roas_escala}x`,    color: 'bg-emerald-50 border-emerald-200' },
                                { label: 'Frecuencia máx', val: `${d.kpis.frecuencia_maxima}`, color: 'bg-orange-50 border-orange-200' },
                            ].map(({ label, val, color }, i) => val !== 'undefinedx' && val !== 'undefined%' && (
                                <div key={i} className={`rounded-lg border p-3 text-center ${color}`}>
                                    <p className="text-xs text-gray-500 uppercase mb-1">{label}</p>
                                    <p className="text-lg font-black text-gray-800">{val}</p>
                                </div>
                            ))}
                        </div>
                        {d.kpis.cpa_maximo_cop && (
                            <div className="mt-2 bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
                                <p className="text-xs text-orange-600 uppercase mb-1">CPA máximo</p>
                                <p className="text-lg font-black text-orange-700">{fmtCOP(d.kpis.cpa_maximo_cop)}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ── REGLAS DE PAUSA ── */}
                {d.pause_rules?.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">🚦 Reglas de pausa</h4>
                        <div className="space-y-2">
                            {d.pause_rules.map((r, i) => (
                                <div key={i} className={`flex items-start gap-3 rounded-lg border px-3 py-2 text-xs ${colorSemaforo[r.semaforo] ?? 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                                    <span className="font-bold flex-shrink-0">
                                        {r.semaforo === 'ROJO' ? '🔴' : r.semaforo === 'AMARILLO' ? '🟡' : '🟢'}
                                    </span>
                                    <div className="flex-1">
                                        <p className="font-semibold">{r.senal}</p>
                                    </div>
                                    <span className="font-bold flex-shrink-0 text-right">{r.accion}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── PLAN DE ACCIÓN ── */}
                {d.action_plan && (
                    <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">📋 Plan de acción</h4>
                        <div className="space-y-3">
                            {[
                                { key: 'today',       label: 'HOY',           color: 'bg-red-50 border-red-200' },
                                { key: 'tomorrow',    label: 'MAÑANA',        color: 'bg-orange-50 border-orange-200' },
                                { key: 'days_3_to_7', label: 'DÍAS 3–7',      color: 'bg-yellow-50 border-yellow-200' },
                                { key: 'week_2',      label: 'SEMANA 2',      color: 'bg-blue-50 border-blue-200' },
                            ].map(({ key, label, color }) => d.action_plan[key]?.length > 0 && (
                                <div key={key} className={`rounded-xl border p-3 ${color}`}>
                                    <p className="text-xs font-bold uppercase tracking-wide text-gray-600 mb-2">{label}</p>
                                    <ul className="space-y-1">
                                        {d.action_plan[key].map((a, i) => (
                                            <li key={i} className="text-xs text-gray-700 flex items-start gap-1">
                                                <span className="text-orange-400 flex-shrink-0 font-bold">→</span> {a}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                            {d.action_plan.scaling && (
                                <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                                    <p className="text-xs font-bold uppercase text-green-700 mb-1">🚀 ESCALADO</p>
                                    <p className="text-xs text-gray-700">{d.action_plan.scaling}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── RIESGOS ── */}
                {d.risks?.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">⚠️ Riesgos identificados</h4>
                        <div className="space-y-2">
                            {d.risks.map((r, i) => (
                                <div key={i} className="bg-white border border-gray-200 rounded-xl p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-semibold text-gray-800">{r.riesgo}</span>
                                        {r.probabilidad && (
                                            <span className={`text-xs px-2 py-0.5 rounded font-bold ml-auto ${
                                                r.probabilidad === 'ALTA' ? 'bg-red-100 text-red-700' :
                                                r.probabilidad === 'MEDIA' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-gray-100 text-gray-600'}`}>
                                                {r.probabilidad}
                                            </span>
                                        )}
                                    </div>
                                    {r.mitigacion && (
                                        <p className="text-xs text-green-700">✅ {r.mitigacion}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── DATOS FALTANTES ── */}
                {d.missing_data?.length > 0 && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                        <h4 className="text-sm font-semibold text-gray-600 mb-2">📌 Datos que mejorarían el análisis</h4>
                        <ul className="space-y-1">
                            {d.missing_data.map((m, i) => (
                                <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                                    <span className="text-gray-400 flex-shrink-0">•</span> {m}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

            </div>
        );
    }
    // ══════════════════════════════════════════════════════════════
    // FIN RENDERER LANZAMIENTO
    // ══════════════════════════════════════════════════════════════

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

            {/* ══════════════════════════════════════════════════════
                🎓 APRENDE DE TUS MÉTRICAS — Sección educativa
            ══════════════════════════════════════════════════════ */}
            {datos.aprende && (
                <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border-2 border-violet-200 rounded-xl p-4">
                    <h4 className="text-sm font-bold text-violet-800 mb-4 flex items-center gap-2">
                        🎓 Aprende de tus métricas
                        <span className="text-xs font-normal text-violet-500 bg-violet-100 px-2 py-0.5 rounded-full">
                            modo mentor
                        </span>
                    </h4>

                    <div className="space-y-3">

                        {/* Lección principal — destacada arriba */}
                        {datos.aprende.leccion_principal && (
                            <div className="bg-white border border-violet-200 rounded-xl p-4">
                                <p className="text-xs font-bold text-violet-600 uppercase mb-2">💡 Lección principal de esta fase</p>
                                <p className="text-sm text-gray-800 leading-relaxed">{datos.aprende.leccion_principal}</p>
                            </div>
                        )}

                        {/* Grid de 2 columnas con las 4 métricas */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                            {/* ROAS */}
                            {datos.aprende.roas && (
                                <div className="bg-white border border-violet-100 rounded-xl p-3">
                                    <p className="text-xs font-bold text-violet-700 mb-1 flex items-center gap-1">
                                        📈 ROAS
                                    </p>
                                    <p className="text-xs text-violet-500 italic mb-2 border-b border-violet-50 pb-2">
                                        {datos.aprende.roas.concepto}
                                    </p>
                                    <p className="text-xs text-gray-700 leading-relaxed">
                                        {datos.aprende.roas.tu_caso}
                                    </p>
                                </div>
                            )}

                            {/* CPA vs Margen */}
                            {datos.aprende.cpa_vs_margen && (
                                <div className="bg-white border border-violet-100 rounded-xl p-3">
                                    <p className="text-xs font-bold text-violet-700 mb-1 flex items-center gap-1">
                                        🎯 CPA vs Margen
                                    </p>
                                    <p className="text-xs text-violet-500 italic mb-2 border-b border-violet-50 pb-2">
                                        {datos.aprende.cpa_vs_margen.concepto}
                                    </p>
                                    <p className="text-xs text-gray-700 leading-relaxed">
                                        {datos.aprende.cpa_vs_margen.tu_caso}
                                    </p>
                                </div>
                            )}

                            {/* Frecuencia */}
                            {datos.aprende.frecuencia && (
                                <div className="bg-white border border-violet-100 rounded-xl p-3">
                                    <p className="text-xs font-bold text-violet-700 mb-1 flex items-center gap-1">
                                        🔁 Frecuencia
                                    </p>
                                    <p className="text-xs text-violet-500 italic mb-2 border-b border-violet-50 pb-2">
                                        {datos.aprende.frecuencia.concepto}
                                    </p>
                                    <p className="text-xs text-gray-700 leading-relaxed">
                                        {datos.aprende.frecuencia.tu_caso}
                                    </p>
                                </div>
                            )}

                            {/* Embudo */}
                            {datos.aprende.embudo && (
                                <div className="bg-white border border-violet-100 rounded-xl p-3">
                                    <p className="text-xs font-bold text-violet-700 mb-1 flex items-center gap-1">
                                        🛒 Embudo de conversión
                                    </p>
                                    <p className="text-xs text-violet-500 italic mb-2 border-b border-violet-50 pb-2">
                                        {datos.aprende.embudo.concepto}
                                    </p>
                                    <p className="text-xs text-gray-700 leading-relaxed">
                                        {datos.aprende.embudo.tu_caso}
                                    </p>
                                </div>
                            )}

                        </div>
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

    // ── Costos del negocio (Phase 2: DATOS_COSTOS → COMPLETO) ──
    const [modalCostos, setModalCostos] = useState(false);
    const [costos, setCostos] = useState({
        costo_envio:       '',   // Costo de envío al cliente (COP)
        costo_empaque:     '',   // Caja, bolsa, cinta, etc. (COP)
        comision_pasarela: '',   // Wompi / PSE: monto fijo o % (COP)
    });
    const costosTienenDatos = costos.costo_envio || costos.costo_empaque || costos.comision_pasarela;

    // Formulario de métricas — cubre todos los campos de Meta Ads Manager
    const [formMetricas, setFormMetricas] = useState({
        fase:     (metricas.length + 1).toString(),
        // ── Originales ─────────────────────────
        ctr:             '',
        roas:            '',
        cpa:             '',
        ventas:          '',
        gasto:           '',
        ingresos:        '',
        notas:           '',
        // ── Alcance y visibilidad ───────────────
        alcance:         '',
        impresiones:     '',
        frecuencia:      '',
        cpm:             '',
        // ── Clics y tráfico ────────────────────
        clics_enlace:    '',
        cpc_enlace:      '',
        // ── Conversiones ───────────────────────
        agregar_carrito: '',
        inicios_pago:    '',
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

            // Si hay costos definidos, incluirlos para completar unit_economics
            if (modo === 'lanzamiento' && costosTienenDatos) {
                cuerpo.costos = {
                    costo_envio:       costos.costo_envio       ? parseFloat(costos.costo_envio)       : null,
                    costo_empaque:     costos.costo_empaque     ? parseFloat(costos.costo_empaque)     : null,
                    comision_pasarela: costos.comision_pasarela ? parseFloat(costos.comision_pasarela) : null,
                };
            }

            if (modo === 'optimizacion') {
                cuerpo.metricas = {
                    // ── Originales ────────────────────────────────
                    ctr:             formMetricas.ctr             ? parseFloat(formMetricas.ctr)             : null,
                    roas:            formMetricas.roas            ? parseFloat(formMetricas.roas)            : null,
                    cpa:             formMetricas.cpa             ? parseFloat(formMetricas.cpa)             : null,
                    ventas:          formMetricas.ventas          ? parseInt(formMetricas.ventas)            : null,
                    gasto:           formMetricas.gasto           ? parseFloat(formMetricas.gasto)           : null,
                    ingresos:        formMetricas.ingresos        ? parseFloat(formMetricas.ingresos)        : null,
                    // ── Alcance y visibilidad ─────────────────────
                    alcance:         formMetricas.alcance         ? parseInt(formMetricas.alcance)           : null,
                    impresiones:     formMetricas.impresiones     ? parseInt(formMetricas.impresiones)       : null,
                    frecuencia:      formMetricas.frecuencia      ? parseFloat(formMetricas.frecuencia)      : null,
                    cpm:             formMetricas.cpm             ? parseFloat(formMetricas.cpm)             : null,
                    // ── Clics y tráfico ──────────────────────────
                    clics_enlace:    formMetricas.clics_enlace    ? parseInt(formMetricas.clics_enlace)      : null,
                    cpc_enlace:      formMetricas.cpc_enlace      ? parseFloat(formMetricas.cpc_enlace)      : null,
                    // ── Conversiones ──────────────────────────────
                    agregar_carrito: formMetricas.agregar_carrito ? parseInt(formMetricas.agregar_carrito)   : null,
                    inicios_pago:    formMetricas.inicios_pago    ? parseInt(formMetricas.inicios_pago)      : null,
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
                    fase:            parseInt(formMetricas.fase),
                    // ── Originales ───────────────────────────────
                    ctr:             formMetricas.ctr             ? parseFloat(formMetricas.ctr)           : null,
                    roas:            formMetricas.roas            ? parseFloat(formMetricas.roas)          : null,
                    cpa:             formMetricas.cpa             ? parseFloat(formMetricas.cpa)           : null,
                    ventas:          formMetricas.ventas          ? parseInt(formMetricas.ventas)          : null,
                    gasto:           formMetricas.gasto           ? parseFloat(formMetricas.gasto)         : null,
                    ingresos:        formMetricas.ingresos        ? parseFloat(formMetricas.ingresos)      : null,
                    notas:           formMetricas.notas           || null,
                    // ── Alcance y visibilidad ─────────────────────
                    alcance:         formMetricas.alcance         ? parseInt(formMetricas.alcance)         : null,
                    impresiones:     formMetricas.impresiones     ? parseInt(formMetricas.impresiones)     : null,
                    frecuencia:      formMetricas.frecuencia      ? parseFloat(formMetricas.frecuencia)    : null,
                    cpm:             formMetricas.cpm             ? parseFloat(formMetricas.cpm)           : null,
                    // ── Clics y tráfico ──────────────────────────
                    clics_enlace:    formMetricas.clics_enlace    ? parseInt(formMetricas.clics_enlace)    : null,
                    cpc_enlace:      formMetricas.cpc_enlace      ? parseFloat(formMetricas.cpc_enlace)    : null,
                    // ── Conversiones ──────────────────────────────
                    agregar_carrito: formMetricas.agregar_carrito ? parseInt(formMetricas.agregar_carrito) : null,
                    inicios_pago:    formMetricas.inicios_pago    ? parseInt(formMetricas.inicios_pago)    : null,
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
                            {/* ── Botón costos opcionales ── */}
                            <button
                                onClick={() => setModalCostos(true)}
                                className={`w-full text-sm font-semibold py-2.5 rounded-xl border transition-colors flex items-center justify-center gap-2
                                    ${costosTienenDatos
                                        ? 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100'
                                        : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100 hover:border-gray-300'
                                    }`}
                            >
                                ⚙️ {costosTienenDatos ? 'Costos ingresados ✓ — editar' : 'Agregar costos del negocio (opcional)'}
                            </button>
                            {costosTienenDatos && (
                                <p className="text-xs text-green-600 text-center -mt-1">
                                    Los unit economics quedarán <strong>COMPLETOS</strong> — el análisis será más preciso
                                </p>
                            )}

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

                    {/* ══ MODAL DATOS_COSTOS ══════════════════════════════════════════ */}
                    {modalCostos && (
                        <div
                            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                            onClick={e => { if (e.target === e.currentTarget) setModalCostos(false); }}
                        >
                            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                                {/* Header */}
                                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                                    <div>
                                        <h3 className="text-base font-bold text-gray-900">⚙️ Costos del negocio</h3>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Completa para que la IA calcule la ganancia neta real
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setModalCostos(false)}
                                        className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                                    >×</button>
                                </div>

                                {/* Body */}
                                <div className="p-5 space-y-4">
                                    {/* Resumen de referencia */}
                                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-xs text-orange-800">
                                        <p className="font-semibold mb-1">📊 Referencia del producto</p>
                                        <div className="grid grid-cols-2 gap-1">
                                            <span>Precio venta: <strong>{fmt(producto.precio_venta)}</strong></span>
                                            <span>Precio costo: <strong>{fmt(producto.precio_costo)}</strong></span>
                                            <span>Margen bruto: <strong>{producto.margen_porcentaje}%</strong></span>
                                            <span>CPA máx actual: <strong>{fmt(producto.cpa_maximo)}</strong></span>
                                        </div>
                                    </div>

                                    {/* Costo envío */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                                            🚚 Costo de envío
                                        </label>
                                        <p className="text-xs text-gray-500 mb-2">
                                            Lo que pagas a la transportadora por entrega (Servientrega, Interrapidísimo, etc.)
                                        </p>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                                            <input
                                                type="number" min="0" placeholder="ej. 8000"
                                                value={costos.costo_envio}
                                                onChange={e => setCostos(p => ({...p, costo_envio: e.target.value}))}
                                                className="w-full border border-gray-300 rounded-lg pl-7 pr-12 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">COP</span>
                                        </div>
                                    </div>

                                    {/* Costo empaque */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                                            📦 Costo de empaque
                                        </label>
                                        <p className="text-xs text-gray-500 mb-2">
                                            Caja, bolsa, cinta, papel burbuja, sticker, etc. por pedido
                                        </p>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                                            <input
                                                type="number" min="0" placeholder="ej. 2500"
                                                value={costos.costo_empaque}
                                                onChange={e => setCostos(p => ({...p, costo_empaque: e.target.value}))}
                                                className="w-full border border-gray-300 rounded-lg pl-7 pr-12 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">COP</span>
                                        </div>
                                    </div>

                                    {/* Comisión pasarela */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                                            💳 Comisión de pasarela de pago
                                        </label>
                                        <p className="text-xs text-gray-500 mb-2">
                                            Wompi/PSE: comisión por transacción (monto fijo en COP por venta)
                                        </p>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                                            <input
                                                type="number" min="0" placeholder="ej. 3500"
                                                value={costos.comision_pasarela}
                                                onChange={e => setCostos(p => ({...p, comision_pasarela: e.target.value}))}
                                                className="w-full border border-gray-300 rounded-lg pl-7 pr-12 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">COP</span>
                                        </div>
                                    </div>

                                    {/* Vista previa de ganancia neta */}
                                    {(costos.costo_envio || costos.costo_empaque || costos.comision_pasarela) && (() => {
                                        const totalCostos = (parseFloat(costos.costo_envio) || 0)
                                                          + (parseFloat(costos.costo_empaque) || 0)
                                                          + (parseFloat(costos.comision_pasarela) || 0);
                                        const gananciaNeta = (producto.precio_venta || 0) - (producto.precio_costo || 0) - totalCostos;
                                        const cpaMaxNeto   = Math.round(gananciaNeta * 0.5);
                                        return (
                                            <div className={`rounded-xl p-3 border text-xs ${gananciaNeta > 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                                <p className="font-bold mb-1 text-gray-700">📐 Vista previa</p>
                                                <div className="grid grid-cols-2 gap-1 text-gray-700">
                                                    <span>Total costos adicionales:</span>
                                                    <span className="font-semibold">{fmt(totalCostos)}</span>
                                                    <span>Ganancia neta real:</span>
                                                    <span className={`font-bold ${gananciaNeta > 0 ? 'text-green-700' : 'text-red-700'}`}>{fmt(gananciaNeta)}</span>
                                                    <span>CPA máximo real:</span>
                                                    <span className="font-bold text-orange-700">{fmt(cpaMaxNeto)}</span>
                                                </div>
                                                {gananciaNeta <= 0 && (
                                                    <p className="mt-1 text-red-600 font-semibold">⚠️ Con estos costos, el margen neto es negativo. Revisa los valores.</p>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Footer */}
                                <div className="flex gap-3 p-5 border-t border-gray-100">
                                    <button
                                        onClick={() => {
                                            setCostos({ costo_envio: '', costo_empaque: '', comision_pasarela: '' });
                                            setModalCostos(false);
                                        }}
                                        className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2 rounded-xl text-sm hover:bg-gray-50 transition-colors"
                                    >
                                        Limpiar
                                    </button>
                                    <button
                                        onClick={() => setModalCostos(false)}
                                        className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 rounded-xl text-sm transition-colors"
                                    >
                                        ✓ Guardar costos
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── MODO OPTIMIZACIÓN ── */}
                    {modo === 'optimizacion' && (
                        <div className="space-y-4">
                            {/* Encabezado e instrucción */}
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800">
                                <p className="font-semibold mb-1">📊 ¿Dónde encuentro estos datos?</p>
                                <p className="text-xs">Abre <strong>Meta Ads Manager → tu campaña → Ver detalles</strong>. Cada campo indica el nombre exacto como aparece en Meta.</p>
                            </div>

                            {/* Fase */}
                            <div className="flex items-center gap-3">
                                <div className="w-32">
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
                                <p className="text-xs text-gray-500 mt-4">Número de semana o ciclo de análisis. Empieza en 1.</p>
                            </div>

                            {/* ── SECCIÓN 1: Alcance y visibilidad ── */}
                            <div className="border border-gray-200 rounded-xl overflow-hidden">
                                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                                    <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">👁 Alcance y visibilidad</p>
                                    <p className="text-xs text-gray-500">Meta Ads Manager → columna "Rendimiento"</p>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            Alcance
                                            <span className="block text-gray-400 font-normal normal-case">Meta: "Alcance"</span>
                                        </label>
                                        <input type="number" min="0"
                                            value={formMetricas.alcance}
                                            onChange={e => setFormMetricas(p => ({...p, alcance: e.target.value}))}
                                            className={inputCls} placeholder="12400" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            Impresiones
                                            <span className="block text-gray-400 font-normal normal-case">Meta: "Impresiones"</span>
                                        </label>
                                        <input type="number" min="0"
                                            value={formMetricas.impresiones}
                                            onChange={e => setFormMetricas(p => ({...p, impresiones: e.target.value}))}
                                            className={inputCls} placeholder="28500" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            Frecuencia
                                            <span className="block text-gray-400 font-normal normal-case">Meta: "Frecuencia"</span>
                                        </label>
                                        <input type="number" step="0.01" min="0"
                                            value={formMetricas.frecuencia}
                                            onChange={e => setFormMetricas(p => ({...p, frecuencia: e.target.value}))}
                                            className={inputCls} placeholder="2.3" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            CPM (COP)
                                            <span className="block text-gray-400 font-normal normal-case">Meta: "CPM"</span>
                                        </label>
                                        <input type="number" min="0"
                                            value={formMetricas.cpm}
                                            onChange={e => setFormMetricas(p => ({...p, cpm: e.target.value}))}
                                            className={inputCls} placeholder="3200" />
                                    </div>
                                </div>
                            </div>

                            {/* ── SECCIÓN 2: Clics y tráfico ── */}
                            <div className="border border-gray-200 rounded-xl overflow-hidden">
                                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                                    <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">🖱 Clics y tráfico</p>
                                    <p className="text-xs text-gray-500">Meta Ads Manager → columna "Rendimiento y clics"</p>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            CTR enlace (%)
                                            <span className="block text-gray-400 font-normal normal-case">Meta: "CTR (todos)"</span>
                                        </label>
                                        <input type="number" step="0.01" min="0" max="100"
                                            value={formMetricas.ctr}
                                            onChange={e => setFormMetricas(p => ({...p, ctr: e.target.value}))}
                                            className={inputCls} placeholder="1.8" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            Clics en enlace
                                            <span className="block text-gray-400 font-normal normal-case">Meta: "Clics en el enlace"</span>
                                        </label>
                                        <input type="number" min="0"
                                            value={formMetricas.clics_enlace}
                                            onChange={e => setFormMetricas(p => ({...p, clics_enlace: e.target.value}))}
                                            className={inputCls} placeholder="512" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            CPC enlace (COP)
                                            <span className="block text-gray-400 font-normal normal-case">Meta: "CPC del enlace"</span>
                                        </label>
                                        <input type="number" min="0"
                                            value={formMetricas.cpc_enlace}
                                            onChange={e => setFormMetricas(p => ({...p, cpc_enlace: e.target.value}))}
                                            className={inputCls} placeholder="680" />
                                    </div>
                                </div>
                            </div>

                            {/* ── SECCIÓN 3: Conversiones ── */}
                            <div className="border border-blue-200 rounded-xl overflow-hidden">
                                <div className="bg-blue-50 px-4 py-2 border-b border-blue-200">
                                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">🛒 Conversiones — Lo más importante</p>
                                    <p className="text-xs text-blue-500">Meta Ads Manager → columna "Conversiones" → activar "Compras"</p>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            Añadir al carrito
                                            <span className="block text-gray-400 font-normal normal-case">Meta: "Artículos añadidos"</span>
                                        </label>
                                        <input type="number" min="0"
                                            value={formMetricas.agregar_carrito}
                                            onChange={e => setFormMetricas(p => ({...p, agregar_carrito: e.target.value}))}
                                            className={inputCls} placeholder="47" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            Inicios de pago
                                            <span className="block text-gray-400 font-normal normal-case">Meta: "Pagos iniciados"</span>
                                        </label>
                                        <input type="number" min="0"
                                            value={formMetricas.inicios_pago}
                                            onChange={e => setFormMetricas(p => ({...p, inicios_pago: e.target.value}))}
                                            className={inputCls} placeholder="18" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            Compras (ventas)
                                            <span className="block text-gray-400 font-normal normal-case">Meta: "Compras"</span>
                                        </label>
                                        <input type="number" min="0"
                                            value={formMetricas.ventas}
                                            onChange={e => setFormMetricas(p => ({...p, ventas: e.target.value}))}
                                            className={inputCls} placeholder="12" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            Valor compras (COP)
                                            <span className="block text-gray-400 font-normal normal-case">Meta: "Valor de conversión"</span>
                                        </label>
                                        <input type="number" min="0"
                                            value={formMetricas.ingresos}
                                            onChange={e => setFormMetricas(p => ({...p, ingresos: e.target.value}))}
                                            className={inputCls} placeholder="960000" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            Gasto total (COP)
                                            <span className="block text-gray-400 font-normal normal-case">Meta: "Importe gastado"</span>
                                        </label>
                                        <input type="number" min="0"
                                            value={formMetricas.gasto}
                                            onChange={e => setFormMetricas(p => ({...p, gasto: e.target.value}))}
                                            className={inputCls} placeholder="85000" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            ROAS
                                            <span className="block text-gray-400 font-normal normal-case">Meta: "ROAS de compras"</span>
                                        </label>
                                        <input type="number" step="0.01" min="0"
                                            value={formMetricas.roas}
                                            onChange={e => setFormMetricas(p => ({...p, roas: e.target.value}))}
                                            className={inputCls} placeholder="11.3" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            CPA (COP)
                                            <span className="block text-gray-400 font-normal normal-case">Meta: "Coste por resultado"</span>
                                        </label>
                                        <input type="number" min="0"
                                            value={formMetricas.cpa}
                                            onChange={e => setFormMetricas(p => ({...p, cpa: e.target.value}))}
                                            className={inputCls} placeholder="7083" />
                                    </div>
                                </div>
                            </div>

                            {/* ── Notas / observaciones ── */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">📝 Notas / observaciones</label>
                                <textarea
                                    value={formMetricas.notas}
                                    onChange={e => setFormMetricas(p => ({...p, notas: e.target.value}))}
                                    className={inputCls}
                                    rows={2}
                                    placeholder="Ej: creativos de video funcionan mejor que imagen estática…"
                                />
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
