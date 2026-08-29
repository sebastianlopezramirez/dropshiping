/*
|--------------------------------------------------------------------------
| PÁGINA: Tienda/Index.jsx — GadGet Store
|--------------------------------------------------------------------------
*/

import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import TiendaLayout from '@/Layouts/TiendaLayout';
import { useCart } from '@/Context/CartContext';

export default function Index({ productos, categorias, filtros = {}, categoriaActual = null, productosNuevos = [] }) {

    const [busqueda, setBusqueda]   = useState(filtros.q          || '');
    const [precioMin, setPrecioMin] = useState(filtros.precio_min || '');
    const [precioMax, setPrecioMax] = useState(filtros.precio_max || '');
    const [filtroMovil, setFiltroMovil]       = useState(false);
    const [categoriasAbiertas, setCategoriasAbiertas] = useState(true);
    const [precioAbierto, setPrecioAbierto]   = useState(true);

    // Categorías jerárquicas
    const categoriasRaiz   = categorias.filter(c => c.padre_id === null);
    const hijosDe          = (padreId) => categorias.filter(c => c.padre_id === padreId);
    const [padreExpandido, setPadreExpandido] = useState(() => {
        if (!filtros.categoria) return null;
        const activa = categorias.find(c => c.slug === filtros.categoria);
        return activa?.padre_id ?? activa?.id ?? null;
    });

    // Hero: categoría expandida para mostrar subcategorías antes de filtrar
    const [catHeroExpandida, setCatHeroExpandida] = useState(null);

    const aplicarFiltros = (extra = {}) => {
        const params = {};
        if (busqueda)  params.q          = busqueda;
        if (precioMin) params.precio_min = precioMin;
        if (precioMax) params.precio_max = precioMax;
        Object.assign(params, extra);
        router.get(route('tienda.index'), params, { preserveScroll: false });
    };

    const limpiarFiltros = () => {
        setBusqueda(''); setPrecioMin(''); setPrecioMax('');
        router.get(route('tienda.index'));
    };

    const cop = (n) => Number(n).toLocaleString('es-CO', {
        style: 'currency', currency: 'COP', maximumFractionDigits: 0
    });

    const hayFiltros = filtros.q || filtros.categoria || filtros.precio_min || filtros.precio_max || filtros.todos;
    const mostrandoHero = !hayFiltros && !categoriaActual;

    return (
        <TiendaLayout>
            <Head title={categoriaActual ? `${categoriaActual.nombre} — GadGet Store` : 'GadGet Store · Variedad en una sola tienda'} />

            {/* ── HERO BANNER ──────────────────────────────────────────── */}
            {mostrandoHero && (
                <div className="w-full h-40 sm:h-52 md:h-64 lg:h-72 overflow-hidden">
                    <img
                        src="/home-page-gadget-store.jpg"
                        alt="GadGet Store — Variedad en una sola tienda"
                        className="w-full h-full object-cover object-center"
                    />
                </div>
            )}

            {/* ── DRAWER FILTROS MÓVIL ──────────────────────────────────── */}
            {filtroMovil && (
                <div className="fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setFiltroMovil(false)} />
                    <div className="absolute bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 rounded-t-2xl p-6 space-y-5 max-h-[85vh] overflow-y-auto">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-white text-lg">Filtros</h3>
                            <button onClick={() => setFiltroMovil(false)} className="text-gray-500 hover:text-white">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Categorías en móvil */}
                        {categorias.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Categorías</p>
                                <div className="space-y-1">
                                    <button onClick={() => { aplicarFiltros(); setFiltroMovil(false); }}
                                        className={`w-full text-left text-sm px-3 py-2 rounded-xl transition-colors
                                            ${!filtros.categoria ? 'bg-gradient-to-r from-orange-500/20 to-pink-500/20 text-orange-400 border border-orange-500/30' : 'text-gray-400 hover:bg-gray-800'}`}>
                                        Todas las categorías
                                    </button>
                                    {categoriasRaiz.map(padre => {
                                        const hijos      = hijosDe(padre.id);
                                        const expandido  = padreExpandido === padre.id;
                                        const hijoActivo = hijos.some(h => h.slug === filtros.categoria);
                                        const activo     = hijoActivo;
                                        return (
                                            <div key={padre.id}>
                                                <button
                                                    onClick={() => {
                                                        setPadreExpandido(expandido ? null : padre.id);
                                                        if (hijos.length === 0) {
                                                            aplicarFiltros({ categoria: padre.slug });
                                                            setFiltroMovil(false);
                                                        }
                                                    }}
                                                    className={`w-full text-left text-sm px-3 py-2 rounded-xl transition-colors flex items-center gap-2
                                                        ${activo ? 'bg-gradient-to-r from-orange-500/20 to-pink-500/20 text-orange-400 border border-orange-500/30' : 'text-gray-400 hover:bg-gray-800'}`}>
                                                    <span className="flex-1">{padre.nombre}</span>
                                                    {hijos.length > 0 && (
                                                        <svg className={`w-3 h-3 shrink-0 transition-transform ${expandido ? 'rotate-180' : ''}`}
                                                            fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    )}
                                                </button>
                                                {expandido && hijos.length > 0 && (
                                                    <div className="ml-3 mt-0.5 mb-1 space-y-0.5 border-l border-gray-700 pl-3">
                                                        {hijos.map(hijo => (
                                                            <button
                                                                key={hijo.id}
                                                                onClick={() => { aplicarFiltros({ categoria: hijo.slug }); setFiltroMovil(false); }}
                                                                className={`w-full text-left text-xs px-2 py-1.5 rounded-lg transition-colors
                                                                    ${filtros.categoria === hijo.slug
                                                                        ? 'text-orange-400 font-semibold'
                                                                        : 'text-gray-500 hover:text-gray-200 hover:bg-gray-800'}`}
                                                            >
                                                                {hijo.nombre}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Precio mínimo</p>
                            <input type="number" placeholder="$ 0" value={precioMin}
                                onChange={e => setPrecioMin(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder-gray-500" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Precio máximo</p>
                            <input type="number" placeholder="$ 999.999" value={precioMax}
                                onChange={e => setPrecioMax(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder-gray-500" />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button onClick={limpiarFiltros}
                                className="flex-1 border border-gray-700 text-gray-400 text-sm font-medium py-3 rounded-xl hover:bg-gray-800 transition-colors">
                                Limpiar
                            </button>
                            <button onClick={() => { aplicarFiltros(filtros.categoria ? { categoria: filtros.categoria } : {}); setFiltroMovil(false); }}
                                className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-sm font-bold py-3 rounded-xl hover:opacity-90 transition-opacity">
                                Aplicar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── CATEGORÍAS DESTACADAS ─────────────────────────────────── */}
            {mostrandoHero && categoriasRaiz.length > 0 && (
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col gap-0.5">
                                <span className="w-5 h-0.5 bg-orange-500 rounded-full"></span>
                                <span className="w-3 h-0.5 bg-pink-500 rounded-full"></span>
                            </div>
                            <h2 className="text-lg sm:text-xl font-bold text-white">Explora por categoría</h2>
                        </div>
                        {/* Botón filtros — visible en todos los tamaños */}
                        <button onClick={() => setFiltroMovil(true)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-[#2c2c2c] text-white hover:bg-gray-700 border border-gray-600 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
                            </svg>
                            Filtros {hayFiltros && <span className="w-2 h-2 rounded-full bg-orange-500 inline-block"></span>}
                        </button>
                    </div>
                    {/* ── Tarjetas categorías padre ── */}
                    <div className="gs-categorias grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                        {categoriasRaiz.map(cat => {
                            const emojis = {
                                tecnologia: '📱', hogar: '🏠', electrodomesticos: '⚡',
                                moda: '👗', 'belleza-y-cuidado-personal': '💄',
                                'deportes-y-fitness': '🏋️', 'juguetes-y-bebes': '🧸',
                                mascotas: '🐾', 'libros-y-entretenimiento': '📚',
                                'autos-y-motos': '🚗',
                            };
                            const emoji    = emojis[cat.slug] || '🛍️';
                            const hijos    = hijosDe(cat.id);
                            const abierta  = catHeroExpandida === cat.id;
                            return (
                                <button key={cat.id}
                                    onClick={() => {
                                        if (hijos.length > 0) {
                                            // Si ya está abierta, cerrar; si no, expandir
                                            setCatHeroExpandida(abierta ? null : cat.id);
                                        } else {
                                            aplicarFiltros({ categoria: cat.slug });
                                        }
                                    }}
                                    className={`group flex flex-col items-center justify-center gap-1.5
                                        border rounded-xl px-2 py-3 h-20
                                        transition-all duration-200
                                        ${abierta
                                            ? 'bg-orange-500/10 border-orange-500/60'
                                            : 'bg-gray-900 border-gray-800 hover:border-orange-500/50 hover:bg-gray-800'}`}>
                                    <span className="text-xl group-hover:scale-110 transition-transform duration-200 leading-none">{emoji}</span>
                                    <span className={`text-xs font-bold text-center leading-tight line-clamp-2 transition-colors w-full px-1
                                        ${abierta ? 'text-orange-400' : 'text-white group-hover:text-orange-400'}`}>
                                        {cat.nombre}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* ── Subcategorías de la categoría seleccionada ── */}
                    {catHeroExpandida && (() => {
                        const padre = categoriasRaiz.find(c => c.id === catHeroExpandida);
                        const hijos = hijosDe(catHeroExpandida);
                        return hijos.length > 0 ? (
                            <div className="mt-3 bg-gray-900 border border-orange-500/20 rounded-2xl p-4">
                                <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-3">
                                    {padre?.nombre} — elige una subcategoría
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {/* Opción "Ver todos en esta categoría" */}
                                    <button
                                        onClick={() => { aplicarFiltros({ categoria: padre.slug }); setCatHeroExpandida(null); }}
                                        className="text-xs bg-orange-500/10 border border-orange-500/30 text-orange-400 font-semibold px-3 py-1.5 rounded-full hover:bg-orange-500/20 transition-colors">
                                        Ver todo en {padre?.nombre}
                                    </button>
                                    {hijos.map(hijo => (
                                        <button
                                            key={hijo.id}
                                            onClick={() => { aplicarFiltros({ categoria: hijo.slug }); setCatHeroExpandida(null); }}
                                            className="text-xs bg-gray-800 border border-gray-700 text-gray-300 font-medium px-3 py-1.5 rounded-full hover:border-orange-500/50 hover:text-white hover:bg-gray-700 transition-colors">
                                            {hijo.nombre}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : null;
                    })()}
                </section>
            )}

            {/* ── PRODUCTOS NUEVOS ──────────────────────────────────────── */}
            {mostrandoHero && productosNuevos.length > 0 && (
                <section className="bg-gray-900 border-y border-gray-800 py-6">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <div className="flex flex-col gap-0.5">
                                    <span className="w-5 h-0.5 bg-orange-500 rounded-full"></span>
                                    <span className="w-3 h-0.5 bg-pink-500 rounded-full"></span>
                                </div>
                                <h2 className="text-lg sm:text-xl font-bold text-white">Recién llegados</h2>
                                <span className="bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full tracking-wide">NEW</span>
                            </div>
                            <button onClick={() => aplicarFiltros({ todos: '1' })}
                                className="text-sm text-orange-400 hover:text-orange-300 font-medium transition-colors flex items-center gap-1">
                                Ver todos <span className="text-base">→</span>
                            </button>
                        </div>
                        {/* Grid 4 columnas × 2 filas */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                            {productosNuevos.map(producto => (
                                <TarjetaProducto key={producto.id} producto={producto} cop={cop} />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ── CONFIANZA Y CONVERSIÓN ────────────────────────────────── */}
            {mostrandoHero && (
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

                        {/* Envío */}
                        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-900 border border-gray-800">
                            <span className="text-xl shrink-0 mt-0.5">🚚</span>
                            <div>
                                <p className="text-xs font-semibold text-white">Envío a todo Colombia</p>
                                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">Medellín, área metropolitana y envío a otras ciudades</p>
                            </div>
                        </div>

                        {/* Pago */}
                        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-900 border border-gray-800">
                            <span className="text-xl shrink-0 mt-0.5">🔒</span>
                            <div>
                                <p className="text-xs font-semibold text-white">Pago seguro</p>
                                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">Transferencia bancaria y pago en efectivo</p>
                            </div>
                        </div>

                        {/* WhatsApp — enlace real */}
                        <a href="https://wa.me/573137921336" target="_blank" rel="noopener noreferrer"
                            className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-900 border border-gray-800 hover:border-green-500/50 hover:bg-gray-800 transition-all group">
                            {/* Logo WhatsApp SVG */}
                            <svg className="w-5 h-5 shrink-0 mt-0.5 text-green-400 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                            <div>
                                <p className="text-xs font-semibold text-white group-hover:text-green-400 transition-colors">Soporte por WhatsApp</p>
                                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">Escríbenos ahora →</p>
                            </div>
                        </a>

                        {/* Productos importados */}
                        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-900 border border-gray-800">
                            <span className="text-xl shrink-0 mt-0.5">🌎</span>
                            <div>
                                <p className="text-xs font-semibold text-white">Productos importados</p>
                                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">Artículos seleccionados de todo el mundo</p>
                            </div>
                        </div>

                    </div>
                </section>
            )}

            {/* ── CONTENIDO (solo cuando hay filtros activos o categoría) ── */}
            {!mostrandoHero && <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

                {/* Botón filtros móvil */}
                <div className="lg:hidden flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-white">
                        {categoriaActual ? categoriaActual.nombre : 'Productos'}
                        <span className="text-gray-500 font-normal text-sm ml-2">({productos.total})</span>
                    </h2>
                    <button onClick={() => setFiltroMovil(true)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-gray-800 text-white hover:bg-gray-700 border border-gray-700 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
                        </svg>
                        Filtros {hayFiltros && <span className="w-2 h-2 rounded-full bg-orange-500 inline-block"></span>}
                    </button>
                </div>

                <div className="flex gap-6">

                    {/* ── SIDEBAR DESKTOP ──────────────────────────────────── */}
                    <aside className="hidden lg:flex flex-col w-56 shrink-0 gap-3">

                        {/* Categorías — desplegable */}
                        {categorias.length > 0 && (
                            <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
                                <button
                                    onClick={() => setCategoriasAbiertas(!categoriasAbiertas)}
                                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-800/50 transition-colors"
                                >
                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Categorías</span>
                                    <svg className={`w-4 h-4 text-gray-500 transition-transform ${categoriasAbiertas ? 'rotate-180' : ''}`}
                                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {categoriasAbiertas && (
                                    <div className="px-3 pb-3 space-y-0.5">
                                        {/* Todas */}
                                        <button
                                            onClick={() => aplicarFiltros()}
                                            className={`w-full text-left text-sm px-3 py-2 rounded-xl transition-colors flex items-center gap-2
                                                ${!filtros.categoria
                                                    ? 'bg-gradient-to-r from-orange-500/20 to-pink-500/20 text-orange-400 font-semibold'
                                                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}
                                        >
                                            {!filtros.categoria && <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0"></span>}
                                            Todas
                                        </button>

                                        {categoriasRaiz.map(padre => {
                                            const hijos      = hijosDe(padre.id);
                                            const expandido  = padreExpandido === padre.id;
                                            const hijoActivo = hijos.some(h => h.slug === filtros.categoria);
                                            const activo     = hijoActivo;
                                            return (
                                                <div key={padre.id}>
                                                    <button
                                                        onClick={() => {
                                                            setPadreExpandido(expandido ? null : padre.id);
                                                            if (hijos.length === 0) {
                                                                aplicarFiltros({ categoria: padre.slug });
                                                            }
                                                        }}
                                                        className={`w-full text-left text-sm px-3 py-2 rounded-xl transition-colors flex items-center gap-2
                                                            ${activo
                                                                ? 'bg-gradient-to-r from-orange-500/20 to-pink-500/20 text-orange-400 font-semibold'
                                                                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}
                                                    >
                                                        {activo && <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0"></span>}
                                                        <span className="flex-1">{padre.nombre}</span>
                                                        {hijos.length > 0 && (
                                                            <svg className={`w-3 h-3 shrink-0 transition-transform ${expandido ? 'rotate-180' : ''}`}
                                                                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                    {expandido && hijos.length > 0 && (
                                                        <div className="ml-3 mt-0.5 mb-1 space-y-0.5 border-l border-gray-700 pl-3">
                                                            {hijos.map(hijo => (
                                                                <button
                                                                    key={hijo.id}
                                                                    onClick={() => aplicarFiltros({ categoria: hijo.slug })}
                                                                    className={`w-full text-left text-xs px-2 py-1.5 rounded-lg transition-colors
                                                                        ${filtros.categoria === hijo.slug
                                                                            ? 'text-orange-400 font-semibold'
                                                                            : 'text-gray-500 hover:text-gray-200 hover:bg-gray-800'}`}
                                                                >
                                                                    {hijo.nombre}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Búsqueda */}
                        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4">
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Buscar</h3>
                            <form onSubmit={e => { e.preventDefault(); aplicarFiltros(filtros.categoria ? { categoria: filtros.categoria } : {}); }}>
                                <div className="relative">
                                    <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
                                        placeholder="Nombre del producto..."
                                        className="w-full bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-xl px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-orange-500" />
                                    <button type="submit" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-orange-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Precio — desplegable */}
                        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
                            <button
                                onClick={() => setPrecioAbierto(!precioAbierto)}
                                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-800/50 transition-colors"
                            >
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Precio (COP)</span>
                                <svg className={`w-4 h-4 text-gray-500 transition-transform ${precioAbierto ? 'rotate-180' : ''}`}
                                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {precioAbierto && (
                                <div className="px-4 pb-4 space-y-2">
                                    <input type="number" placeholder="Mínimo" value={precioMin}
                                        onChange={e => setPrecioMin(e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                                    <input type="number" placeholder="Máximo" value={precioMax}
                                        onChange={e => setPrecioMax(e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                                    <button
                                        onClick={() => aplicarFiltros(filtros.categoria ? { categoria: filtros.categoria } : {})}
                                        className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white text-sm font-bold rounded-xl py-2 hover:opacity-90 transition-opacity">
                                        Aplicar
                                    </button>
                                </div>
                            )}
                        </div>

                        {hayFiltros && (
                            <button onClick={limpiarFiltros}
                                className="w-full text-sm text-gray-500 hover:text-orange-400 transition-colors flex items-center justify-center gap-1.5 py-1">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Limpiar filtros
                            </button>
                        )}
                    </aside>

                    {/* ── GRID DE PRODUCTOS ─────────────────────────────────── */}
                    <div className="flex-1 min-w-0">

                        {/* Encabezado desktop */}
                        <div className="hidden lg:flex items-center justify-between mb-5">
                            <div>
                                <h2 className="text-lg font-bold text-white">
                                    {categoriaActual ? categoriaActual.nombre : hayFiltros ? 'Resultados' : 'Todos los productos'}
                                </h2>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    {productos.total} producto{productos.total !== 1 ? 's' : ''}
                                </p>
                            </div>
                            {hayFiltros && (
                                <div className="flex items-center gap-2 flex-wrap justify-end">
                                    {filtros.q && <ChipFiltro label={`"${filtros.q}"`} onRemove={limpiarFiltros} />}
                                    {filtros.precio_min && <ChipFiltro label={`Desde ${cop(filtros.precio_min)}`} onRemove={() => { setPrecioMin(''); aplicarFiltros({ ...(filtros.categoria ? { categoria: filtros.categoria } : {}), ...(filtros.precio_max ? { precio_max: filtros.precio_max } : {}) }); }} />}
                                    {filtros.precio_max && <ChipFiltro label={`Hasta ${cop(filtros.precio_max)}`} onRemove={() => { setPrecioMax(''); aplicarFiltros({ ...(filtros.categoria ? { categoria: filtros.categoria } : {}), ...(filtros.precio_min ? { precio_min: filtros.precio_min } : {}) }); }} />}
                                </div>
                            )}
                        </div>

                        {productos.data.length === 0 ? (
                            <div className="text-center py-24 bg-gray-900 rounded-2xl border border-gray-800">
                                <p className="text-5xl mb-4">🔍</p>
                                <p className="text-white text-lg font-semibold">Sin resultados</p>
                                <p className="text-gray-500 text-sm mt-1 mb-5">Intenta con otra búsqueda o elimina los filtros.</p>
                                <button onClick={limpiarFiltros}
                                    className="text-sm bg-gradient-to-r from-orange-500 to-pink-500 text-white px-5 py-2.5 rounded-full font-medium hover:opacity-90 transition-opacity">
                                    Ver todos los productos
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                                {productos.data.map(producto => (
                                    <TarjetaProducto key={producto.id} producto={producto} cop={cop} />
                                ))}
                            </div>
                        )}

                        {productos.last_page > 1 && (
                            <div className="mt-10 flex justify-center items-center gap-1.5">
                                {productos.links.map((link, i) => (
                                    <button key={i}
                                        onClick={() => link.url && router.get(link.url)}
                                        disabled={!link.url}
                                        className={`min-w-[36px] h-9 px-3 text-sm rounded-xl border transition-colors font-medium
                                            ${link.active
                                                ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white border-transparent shadow-sm'
                                                : link.url
                                                    ? 'border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white bg-gray-900'
                                                    : 'border-gray-800 text-gray-700 cursor-not-allowed bg-gray-900'}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>}
        </TiendaLayout>
    );
}

function ChipFiltro({ label, onRemove }) {
    return (
        <span className="flex items-center gap-1 bg-orange-500/10 text-orange-400 text-xs font-medium px-2.5 py-1 rounded-full border border-orange-500/20">
            {label}
            <button onClick={onRemove} className="text-orange-400/60 hover:text-orange-400 ml-0.5">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </span>
    );
}

function TarjetaProducto({ producto, cop }) {
    const imagen = producto.media?.[0]?.original_url || producto.imagenes?.[0] || null;
    const tieneOferta = producto.precio_oferta && Number(producto.precio_oferta) < Number(producto.precio_venta);
    const descuentoPct = tieneOferta
        ? Math.round((1 - producto.precio_oferta / producto.precio_venta) * 100)
        : 0;

    // ─── CARRITO RÁPIDO ────────────────────────────────────────────────
    const { agregarItem } = useCart();
    const [agregado, setAgregado] = useState(false);

    function handleAgregarRapido(e) {
        // Detener la navegación del Link padre
        e.preventDefault();
        e.stopPropagation();

        agregarItem({
            id:     producto.id,
            nombre: producto.nombre,
            slug:   producto.slug,
            precio: tieneOferta ? Number(producto.precio_oferta) : Number(producto.precio_venta),
            imagen: imagen,
        });

        // Feedback visual 1.5 segundos
        setAgregado(true);
        setTimeout(() => setAgregado(false), 1500);
    }

    return (
        <Link
            href={route('tienda.show', producto.slug)}
            className="group bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-900/20 hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
        >
            <div className="relative aspect-square bg-gray-800 overflow-hidden">
                {imagen ? (
                    <img src={imagen} alt={producto.nombre}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400"
                        loading="lazy" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-700 text-5xl">📦</div>
                )}

                {/* ── Botón agregar al carrito (esquina superior derecha) ── */}
                <button
                    onClick={handleAgregarRapido}
                    title="Agregar al carrito"
                    className={`
                        absolute top-2 right-2 z-10
                        w-8 h-8 rounded-full shadow-lg
                        flex items-center justify-center
                        transition-all duration-200
                        ${agregado
                            ? 'bg-green-500 scale-110'
                            : 'bg-orange-500 hover:bg-orange-400'}
                    `}
                >
                    {agregado ? (
                        /* Check mark */
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                    ) : (
                        /* Cart icon */
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9m12-9l2 9M9 21a1 1 0 100-2 1 1 0 000 2zm10 0a1 1 0 100-2 1 1 0 000 2z" />
                        </svg>
                    )}
                </button>

                <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-center pb-3">
                    <span className="bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
                        Ver producto →
                    </span>
                </div>
                {tieneOferta && (
                    <div className="absolute top-2 left-2">
                        <span className="bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow">
                            -{descuentoPct}%
                        </span>
                    </div>
                )}
            </div>
            <div className="p-3 flex flex-col flex-1">
                {producto.categoria && (
                    <span className="text-xs text-orange-400 font-medium mb-1 truncate">{producto.categoria.nombre}</span>
                )}
                <p className="text-sm font-semibold text-gray-100 line-clamp-2 leading-snug flex-1 mb-2">
                    {producto.nombre}
                </p>
                <div>
                    {tieneOferta ? (
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                            <span className="text-base font-bold text-orange-400">{cop(producto.precio_oferta)}</span>
                            <span className="text-xs text-gray-600 line-through">{cop(producto.precio_venta)}</span>
                        </div>
                    ) : (
                        <span className="text-base font-bold text-white">{cop(producto.precio_venta)}</span>
                    )}
                </div>
            </div>
        </Link>
    );
}
