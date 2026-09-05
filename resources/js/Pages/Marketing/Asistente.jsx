/*
|--------------------------------------------------------------------------
| PÁGINA: Marketing/Asistente.jsx  — Mobile-first refactor
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué cambió?
|
|   Versión 2: diseño mobile-first.
|   - Móvil: categorías en drawer deslizable (botón ☰ Categorías)
|   - Móvil: productos como tarjetas verticales (no tabla)
|   - Desktop: layout de dos columnas original (sin cambios)
|
|   El flujo de negocio es idéntico — solo cambia la presentación.
|
*/

import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

// ──────────────────────────────────────────────────────────────────────
// SUBCOMPONENTE: Nodo del árbol de categorías (sin cambios)
// ──────────────────────────────────────────────────────────────────────
function NodoCategoria({ categoria, seleccionada, onSeleccionar }) {
    const [expandido, setExpandido] = useState(false);
    const tieneHijos = categoria.hijos && categoria.hijos.length > 0;
    const activa     = seleccionada?.id === categoria.id;

    return (
        <div>
            <button
                onClick={() => {
                    onSeleccionar(categoria);
                    if (tieneHijos) setExpandido(!expandido);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${
                    activa
                        ? 'bg-orange-50 text-orange-700 font-semibold'
                        : 'text-gray-700 hover:bg-gray-100'
                }`}
            >
                {tieneHijos && (
                    <span className="text-gray-400 text-xs w-3 flex-shrink-0">
                        {expandido ? '▾' : '▸'}
                    </span>
                )}
                {!tieneHijos && <span className="w-3 flex-shrink-0" />}
                <span className="truncate flex-1">{categoria.nombre}</span>
                {(categoria.productos?.length ?? 0) > 0 && (
                    <span className="ml-auto bg-gray-200 text-gray-600 text-xs rounded-full px-2 py-0.5 flex-shrink-0">
                        {categoria.productos.length}
                    </span>
                )}
            </button>

            {tieneHijos && expandido && (
                <div className="ml-4 border-l border-gray-200 pl-2 mt-1 space-y-0.5">
                    {categoria.hijos.map(hijo => (
                        <NodoCategoria
                            key={hijo.id}
                            categoria={hijo}
                            seleccionada={seleccionada}
                            onSeleccionar={onSeleccionar}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ──────────────────────────────────────────────────────────────────────
// SUBCOMPONENTE: Badge de estado IA
// Muestra cuándo se inició el análisis y cuántos días llevan.
// ──────────────────────────────────────────────────────────────────────
function BadgeEstado({ roas, totalMetricas, iaIniciadoEn }) {
    // Sin ningún análisis iniciado
    if (!iaIniciadoEn) {
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500">⚪ Sin iniciar</span>;
    }

    // Calcular días transcurridos desde el primer análisis
    const inicio = new Date(iaIniciadoEn);
    const hoy    = new Date();
    const dias   = Math.floor((hoy - inicio) / (1000 * 60 * 60 * 24));
    const etiq   = dias === 0 ? 'hoy' : dias === 1 ? '1 día' : `${dias} días`;

    // Si tiene métricas reales, mostrar fase
    if (totalMetricas > 0) {
        if (roas >= 3.5)
            return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 font-medium">🟢 Escalando · {etiq}</span>;
        if (roas >= 2.5)
            return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700 font-medium">🟡 Optimizando · {etiq}</span>;
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700 font-medium">🔴 Atención · {etiq}</span>;
    }

    // Tiene fecha de inicio pero aún sin métricas registradas
    const colorDias = dias >= 7 ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700';
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colorDias}`}>
            🔵 En seguimiento · {etiq}
        </span>
    );
}

// ──────────────────────────────────────────────────────────────────────
// SUBCOMPONENTE: Panel de categorías (contenido reutilizado en drawer y sidebar)
// ──────────────────────────────────────────────────────────────────────
function PanelCategorias({ categorias, categoriaSeleccionada, onSeleccionar, onCerrar }) {
    return (
        <div className="flex flex-col h-full">
            {/* Header del panel */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50 flex-shrink-0">
                <h3 className="text-sm font-semibold text-gray-700">📂 Categorías</h3>
                {/* Botón cerrar solo visible en móvil */}
                {onCerrar && (
                    <button
                        onClick={onCerrar}
                        className="md:hidden text-gray-400 hover:text-gray-600 text-xl leading-none p-1"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* Lista de categorías */}
            <div className="p-2 space-y-0.5 flex-1 overflow-y-auto">
                {/* "Todos los productos" */}
                <button
                    onClick={() => { onSeleccionar(null); onCerrar?.(); }}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${
                        !categoriaSeleccionada
                            ? 'bg-orange-50 text-orange-700 font-semibold'
                            : 'text-gray-700 hover:bg-gray-100'
                    }`}
                >
                    <span>🏪</span>
                    <span>Todos los productos</span>
                </button>

                {categorias.map(cat => (
                    <NodoCategoria
                        key={cat.id}
                        categoria={cat}
                        seleccionada={categoriaSeleccionada}
                        onSeleccionar={(c) => { onSeleccionar(c); onCerrar?.(); }}
                    />
                ))}
            </div>
        </div>
    );
}

// ──────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ──────────────────────────────────────────────────────────────────────
export default function Asistente({ categorias, estadisticas }) {

    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
    const [buscar, setBuscar]               = useState('');
    const [drawerAbierto, setDrawerAbierto] = useState(false);
    // filtroIA: 'todos' | 'en_analisis' | 'sin_analisis' | 'revisar'
    const [filtroIA, setFiltroIA]           = useState('todos');
    const [limpiando, setLimpiando]         = useState(null); // id del producto que se está limpiando

    const fmt = (v) => new Intl.NumberFormat('es-CO', {
        style: 'currency', currency: 'COP', minimumFractionDigits: 0,
    }).format(v ?? 0);

    // Calcular días desde ia_iniciado_en
    const diasDesdeInicio = (iaIniciadoEn) => {
        if (!iaIniciadoEn) return null;
        return Math.floor((new Date() - new Date(iaIniciadoEn)) / (1000 * 60 * 60 * 24));
    };

    // Limpiar análisis: elimina métricas + resetea ia_iniciado_en
    const limpiarAnalisis = (producto) => {
        const confirmado = window.confirm(
            `¿Limpiar el análisis IA de "${producto.nombre}"?\n\nEsto eliminará todas las métricas guardadas y reseteará la fecha de inicio. El producto no se elimina.`
        );
        if (!confirmado) return;

        setLimpiando(producto.id);
        router.delete(route('marketing.asistente.limpiar', producto.id), {
            preserveScroll: true,
            onSuccess: () => setLimpiando(null),
            onError:   () => { setLimpiando(null); alert('Error al limpiar el análisis. Intenta nuevamente.'); },
        });
    };

    // ── Calcular lista de productos según categoría seleccionada ──
    const productosDeCategoria = () => {
        if (!categoriaSeleccionada) {
            const todos = [];
            categorias.forEach(cat => {
                (cat.productos || []).forEach(p => todos.push(p));
                (cat.hijos || []).forEach(hijo =>
                    (hijo.productos || []).forEach(p => todos.push(p))
                );
            });
            return todos;
        }
        const directos = categoriaSeleccionada.productos || [];
        const deHijos  = [];
        (categoriaSeleccionada.hijos || []).forEach(h =>
            (h.productos || []).forEach(p => deHijos.push(p))
        );
        return [...directos, ...deHijos];
    };

    const productosFiltrados = productosDeCategoria().filter(p => {
        // Filtro de texto
        if (buscar.trim()) {
            const q = buscar.toLowerCase();
            if (!p.nombre.toLowerCase().includes(q) && !(p.sku || '').toLowerCase().includes(q)) return false;
        }
        // Filtros IA
        if (filtroIA === 'en_analisis') {
            if (!p.ia_iniciado_en) return false;
        } else if (filtroIA === 'sin_analisis') {
            if (p.ia_iniciado_en) return false;
        } else if (filtroIA === 'revisar') {
            const dias = diasDesdeInicio(p.ia_iniciado_en);
            if (dias === null || dias < 7) return false;
        }
        return true;
    });

    const tituloCat = categoriaSeleccionada ? `📁 ${categoriaSeleccionada.nombre}` : '🏪 Todos los productos';

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🚀</span>
                        <div>
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Asistente de Marketing Pro</h2>
                            <p className="text-xs sm:text-sm text-gray-500">Estrategia y optimización con IA para cada producto</p>
                        </div>
                    </div>
                    <Link href={route('campanas.index')} className="text-xs sm:text-sm text-gray-500 hover:text-gray-700 whitespace-nowrap">
                        ← Campañas
                    </Link>
                </div>
            }
        >
            <Head title="Asistente Marketing Pro" />

            {/* ══ DRAWER MÓVIL: categorías deslizables ══
                Solo visible en móvil (md:hidden). Overlay + panel lateral.  */}
            {drawerAbierto && (
                <div className="md:hidden fixed inset-0 z-50 flex">
                    {/* Fondo oscuro semi-transparente → cerrar al hacer clic */}
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={() => setDrawerAbierto(false)}
                    />
                    {/* Panel deslizable desde la izquierda */}
                    <div className="relative w-72 max-w-[85vw] bg-white h-full shadow-xl flex flex-col animate-slide-in-left">
                        <PanelCategorias
                            categorias={categorias}
                            categoriaSeleccionada={categoriaSeleccionada}
                            onSeleccionar={setCategoriaSeleccionada}
                            onCerrar={() => setDrawerAbierto(false)}
                        />
                    </div>
                </div>
            )}

            <div className="py-4 px-3 sm:py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">

                {/* ── Tarjetas de estadísticas ── */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3 mb-4">
                    <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                        <p className="text-xs text-gray-500 uppercase tracking-wide leading-tight">Total</p>
                        <p className="text-xl font-bold text-gray-900 mt-1">{estadisticas.total_productos}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                        <p className="text-xs text-gray-500 uppercase tracking-wide leading-tight">Métricas</p>
                        <p className="text-xl font-bold text-blue-600 mt-1">{estadisticas.con_metricas}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                        <p className="text-xs text-gray-500 uppercase tracking-wide leading-tight">🟢 Escalando</p>
                        <p className="text-xl font-bold text-green-600 mt-1">{estadisticas.escalando}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 shadow-sm border border-blue-100">
                        <p className="text-xs text-blue-500 uppercase tracking-wide leading-tight">🔵 En análisis</p>
                        <p className="text-xl font-bold text-blue-700 mt-1">{estadisticas.en_analisis ?? 0}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                        <p className="text-xs text-gray-400 uppercase tracking-wide leading-tight">⚪ Sin iniciar</p>
                        <p className="text-xl font-bold text-gray-500 mt-1">{estadisticas.sin_analisis ?? 0}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 shadow-sm border border-orange-100">
                        <p className="text-xs text-orange-500 uppercase tracking-wide leading-tight">🟠 Revisar</p>
                        <p className="text-xl font-bold text-orange-600 mt-1">{estadisticas.revisar ?? 0}</p>
                    </div>
                </div>

                {/* ── Filtros rápidos IA ── */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {[
                        { id: 'todos',       label: '🏪 Todos',         count: estadisticas.total_productos, color: 'gray'   },
                        { id: 'en_analisis', label: '🔵 En análisis',   count: estadisticas.en_analisis ?? 0, color: 'blue'   },
                        { id: 'sin_analisis',label: '⚪ Sin iniciar',   count: estadisticas.sin_analisis ?? 0, color: 'slate'  },
                        { id: 'revisar',     label: '🟠 Necesitan revisión', count: estadisticas.revisar ?? 0, color: 'orange' },
                    ].map(f => {
                        const activo = filtroIA === f.id;
                        const estilos = {
                            gray:   activo ? 'bg-gray-800 text-white border-gray-800'     : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400',
                            blue:   activo ? 'bg-blue-600 text-white border-blue-600'     : 'bg-white text-blue-600 border-blue-200 hover:border-blue-400',
                            slate:  activo ? 'bg-slate-600 text-white border-slate-600'   : 'bg-white text-slate-500 border-gray-200 hover:border-slate-400',
                            orange: activo ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-orange-600 border-orange-200 hover:border-orange-400',
                        };
                        return (
                            <button
                                key={f.id}
                                onClick={() => setFiltroIA(f.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${estilos[f.color]}`}
                            >
                                {f.label}
                                <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${activo ? 'bg-white/20' : 'bg-gray-100'}`}>
                                    {f.count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* ── BARRA MÓVIL: buscador + botón categorías ── */}
                <div className="md:hidden flex gap-2 mb-3">
                    <button
                        onClick={() => setDrawerAbierto(true)}
                        className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm flex-shrink-0"
                    >
                        ☰ <span className="hidden xs:inline">Categorías</span>
                        {categoriaSeleccionada && (
                            <span className="bg-orange-500 text-white text-xs rounded-full px-1.5 py-0.5 ml-1">1</span>
                        )}
                    </button>
                    <input
                        type="text"
                        placeholder="Buscar producto o SKU…"
                        value={buscar}
                        onChange={e => setBuscar(e.target.value)}
                        className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                </div>

                {/* Etiqueta de categoría activa en móvil */}
                {categoriaSeleccionada && (
                    <div className="md:hidden mb-3 flex items-center gap-2">
                        <span className="text-xs text-gray-500">Filtrando por:</span>
                        <span className="bg-orange-50 text-orange-700 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
                            {categoriaSeleccionada.nombre}
                            <button onClick={() => setCategoriaSeleccionada(null)} className="ml-1 hover:text-orange-900">✕</button>
                        </span>
                    </div>
                )}

                {/* ══ LAYOUT DESKTOP: dos columnas ══ */}
                <div className="flex gap-5">

                    {/* Sidebar de categorías — SOLO DESKTOP */}
                    <div className="hidden md:block w-64 flex-shrink-0">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <PanelCategorias
                                categorias={categorias}
                                categoriaSeleccionada={categoriaSeleccionada}
                                onSeleccionar={setCategoriaSeleccionada}
                                onCerrar={null}
                            />
                        </div>
                    </div>

                    {/* ══ COLUMNA DE PRODUCTOS (ocupa todo el ancho en móvil) ══ */}
                    <div className="flex-1 min-w-0">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

                            {/* Header con buscador DESKTOP */}
                            <div className="hidden md:flex px-4 py-3 border-b border-gray-100 items-center justify-between gap-3 flex-wrap">
                                <h3 className="text-sm font-semibold text-gray-700">
                                    {tituloCat}
                                    <span className="ml-2 text-gray-400 font-normal">({productosFiltrados.length})</span>
                                </h3>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        placeholder="Buscar por nombre o SKU…"
                                        value={buscar}
                                        onChange={e => setBuscar(e.target.value)}
                                        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-orange-400"
                                    />
                                </div>
                            </div>

                            {/* Header MÓVIL — solo título y contador */}
                            <div className="md:hidden px-4 py-3 border-b border-gray-100 bg-gray-50">
                                <h3 className="text-sm font-semibold text-gray-700">
                                    {tituloCat}
                                    <span className="ml-2 text-gray-400 font-normal">({productosFiltrados.length})</span>
                                </h3>
                            </div>

                            {/* Estado vacío */}
                            {productosFiltrados.length === 0 ? (
                                <div className="py-16 text-center text-gray-400">
                                    <p className="text-4xl mb-3">📦</p>
                                    <p className="text-sm">
                                        {buscar ? 'No hay productos que coincidan.' : 'No hay productos en esta categoría.'}
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {/* ── VISTA MÓVIL: tarjetas ── */}
                                    <div className="md:hidden divide-y divide-gray-100">
                                        {productosFiltrados.map(producto => (
                                            <div key={producto.id} className="p-4">
                                                {/* Fila 1: SKU + Estado tienda */}
                                                <div className="flex items-center justify-between mb-1">
                                                    <code className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">
                                                        {producto.sku || '—'}
                                                    </code>
                                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                                        producto.estado === 'activo'
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                        {producto.estado === 'activo' ? '✅ Activo' : '📝 Borrador'}
                                                    </span>
                                                </div>

                                                {/* Fila 2: Nombre del producto */}
                                                <p className="font-semibold text-gray-900 text-sm mb-1 leading-snug">
                                                    {producto.nombre}
                                                </p>

                                                {/* Fila 3: Precio + Estado IA */}
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-sm text-gray-700 font-medium tabular-nums">
                                                        {fmt(producto.precio_venta)}
                                                    </span>
                                                    <BadgeEstado roas={0} totalMetricas={0} iaIniciadoEn={producto.ia_iniciado_en} />
                                                </div>

                                                {/* Botones — ancho completo en móvil */}
                                                <div className="flex gap-2">
                                                    <Link
                                                        href={route('marketing.asistente.producto', producto.id)}
                                                        className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                                                    >
                                                        🤖 Analizar
                                                    </Link>
                                                    {producto.ia_iniciado_en && (
                                                        <button
                                                            onClick={() => limpiarAnalisis(producto)}
                                                            disabled={limpiando === producto.id}
                                                            className="flex items-center justify-center gap-1 bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-500 text-sm px-3 py-2.5 rounded-xl transition-colors disabled:opacity-50"
                                                            title="Limpiar análisis IA"
                                                        >
                                                            {limpiando === producto.id ? '⏳' : '🗑'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* ── VISTA DESKTOP: tabla ── */}
                                    <div className="hidden md:block overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-gray-50 text-left">
                                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">SKU</th>
                                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Producto</th>
                                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Precio</th>
                                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado tienda</th>
                                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado IA</th>
                                                    <th className="px-4 py-3"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {productosFiltrados.map(producto => (
                                                    <tr key={producto.id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-4 py-3">
                                                            <code className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-mono">
                                                                {producto.sku || '—'}
                                                            </code>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <p className="font-medium text-gray-900 line-clamp-1">{producto.nombre}</p>
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-600 tabular-nums">
                                                            {fmt(producto.precio_venta)}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                                                producto.estado === 'activo'
                                                                    ? 'bg-green-100 text-green-700'
                                                                    : 'bg-yellow-100 text-yellow-700'
                                                            }`}>
                                                                {producto.estado === 'activo' ? '✅ Activo' : '📝 Borrador'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <BadgeEstado roas={0} totalMetricas={0} iaIniciadoEn={producto.ia_iniciado_en} />
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <Link
                                                                    href={route('marketing.asistente.producto', producto.id)}
                                                                    className="inline-flex items-center gap-1 bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                                                                >
                                                                    🤖 Analizar
                                                                </Link>
                                                                {producto.ia_iniciado_en && (
                                                                    <button
                                                                        onClick={() => limpiarAnalisis(producto)}
                                                                        disabled={limpiando === producto.id}
                                                                        className="inline-flex items-center gap-1 bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-500 text-xs px-2 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                                                                        title="Limpiar análisis IA (elimina métricas y resetea fecha)"
                                                                    >
                                                                        {limpiando === producto.id ? '⏳' : '🗑'}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Leyenda de estados — oculta en móvil para ganar espacio */}
                        <div className="hidden sm:flex mt-3 items-center gap-4 text-xs text-gray-500 flex-wrap">
                            <span>⚪ Sin iniciar</span>
                            <span>🔵 En seguimiento (iniciado, sin métricas)</span>
                            <span>🟢 Escalando (ROAS ≥ 3.5x)</span>
                            <span>🟡 Optimizando (ROAS 2.5–3.5x)</span>
                            <span>🔴 Atención (ROAS &lt; 2.5x)</span>
                            <span>🗑 = limpiar análisis (libera espacio)</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── CSS para la animación del drawer ── */}
            <style>{`
                @keyframes slide-in-left {
                    from { transform: translateX(-100%); }
                    to   { transform: translateX(0); }
                }
                .animate-slide-in-left {
                    animation: slide-in-left 0.22s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                }
            `}</style>
        </AuthenticatedLayout>
    );
}
