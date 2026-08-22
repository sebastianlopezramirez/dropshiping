/*
|--------------------------------------------------------------------------
| LAYOUT: TiendaLayout — GadGet Store
|--------------------------------------------------------------------------
| Soporta dos temas: oscuro (default) y claro (modo luz).
| El toggle guarda la preferencia en localStorage.
| El cambio de colores se aplica via CSS inyectado — sin tocar cada componente.
*/

import { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { useCart } from '@/Context/CartContext';

/* ── ESTILOS MODO CLARO ─────────────────────────────────────────────────── */
/* Paleta: #06B6D4 cyan logo · #FF6B00 naranja logo · #1C1C1C charcoal      */
const ESTILOS_CLARO = `
    /* ── FONDOS ─────────────────────────────────────── */
    /* Fondo base — cyan del logo, un tono más oscuro/vivo */
    [data-tema="claro"] main,
    [data-tema="claro"] main .bg-gray-950 { background-color: #0891B2 !important; } /* cyan-600 */

    /* Cards de producto e información → charcoal #1C1C1C */
    [data-tema="claro"] main .bg-gray-900 { background-color: #1C1C1C !important; }

    /* Inputs y superficies secundarias → charcoal más claro */
    [data-tema="claro"] main .bg-gray-800         { background-color: #2A2A2A !important; }
    [data-tema="claro"] main .bg-gray-800\\/50     { background-color: rgba(42,42,42,0.7) !important; }
    [data-tema="claro"] main .bg-gray-700\\/50     { background-color: rgba(55,55,55,0.5) !important; }

    /* Secciones banda alternadas → cyan más vivo */
    [data-tema="claro"] main section.bg-gray-900   { background-color: #06B6D4 !important; } /* cyan exacto del logo */

    /* ── TEXTOS (fondo oscuro → texto blanco se mantiene) */
    /* Solo ajustamos textos en contextos específicos     */
    [data-tema="claro"] main .text-gray-500 { color: #A5F3FC !important; } /* cyan-200 */
    [data-tema="claro"] main .text-gray-600 { color: #67E8F9 !important; } /* cyan-300 */

    /* ── BORDES → cyan ───────────────────────────────── */
    [data-tema="claro"] main .border-gray-800      { border-color: #0891B2 !important; }
    [data-tema="claro"] main .border-gray-700      { border-color: #0E7490 !important; }
    [data-tema="claro"] main .border-gray-700\\/50 { border-color: rgba(8,145,178,0.4) !important; }

    /* ── HOVER en listas/sidebar ─────────────────────── */
    [data-tema="claro"] main .hover\\:bg-gray-800:hover { background-color: #333333 !important; }
    [data-tema="claro"] main .hover\\:bg-gray-700:hover { background-color: #3D3D3D !important; }

    /* ── INPUTS ──────────────────────────────────────── */
    [data-tema="claro"] main input,
    [data-tema="claro"] main select {
        background-color: #1C1C1C !important;
        color: #FFFFFF !important;
        border-color: #0891B2 !important;
    }
    [data-tema="claro"] main input::placeholder { color: #67E8F9 !important; }

    /* ── BOTONES GRISES → NEGRO con letra BLANCA NEGRILLA ─────── */
    [data-tema="claro"] main button[class*="bg-gray-800"],
    [data-tema="claro"] main button[class*="border-gray-700"],
    [data-tema="claro"] main button[class*="bg-gray-700"],
    [data-tema="claro"] main button[class*="bg-gray-600"] {
        background-color: #111111 !important;
        border-color: #111111 !important;
        color: #FFFFFF !important;
        font-weight: 700 !important;
    }
    [data-tema="claro"] main button[class*="bg-gray-800"] *,
    [data-tema="claro"] main button[class*="border-gray-700"] *,
    [data-tema="claro"] main button[class*="bg-gray-700"] *,
    [data-tema="claro"] main button[class*="bg-gray-600"] * {
        color: #FFFFFF !important;
        font-weight: 700 !important;
    }
    [data-tema="claro"] main button[class*="bg-gray-800"] svg,
    [data-tema="claro"] main button[class*="border-gray-700"] svg {
        stroke: #FFFFFF !important;
    }
    [data-tema="claro"] main button[class*="bg-gray-800"]:hover,
    [data-tema="claro"] main button[class*="border-gray-700"]:hover,
    [data-tema="claro"] main button[class*="bg-gray-700"]:hover,
    [data-tema="claro"] main button[class*="bg-gray-600"]:hover {
        background-color: #0E7490 !important;
        border-color: #0E7490 !important;
    }

    /* ── BOTONES CATEGORÍAS VISUALES → CHARCOAL + texto blanco ─ */
    [data-tema="claro"] main .gs-categorias button {
        background-color: #1C1C1C !important;
        border-color: #1C1C1C !important;
        color: #FFFFFF !important;
    }
    [data-tema="claro"] main .gs-categorias button span,
    [data-tema="claro"] main .gs-categorias button .text-gray-400 { color: #FFFFFF !important; }
    [data-tema="claro"] main .gs-categorias button:hover {
        background-color: #333333 !important;
        border-color: #06B6D4 !important;
        transform: scale(1.03);
    }

    /* ── SOMBRAS → cyan ──────────────────────────────── */
    [data-tema="claro"] main .hover\\:shadow-orange-900\\/20:hover {
        box-shadow: 0 10px 15px -3px rgba(6,182,212,0.3) !important;
    }

    /* ── FOOTER → rosa #FF1493 ──────────────────────── */
    [data-tema="claro"] footer {
        background-color: #FF1493 !important;
        border-color: #CC0070 !important;
    }
    /* Títulos footer → blanco negrilla */
    [data-tema="claro"] footer h4 {
        color: #FFFFFF !important;
        font-weight: 700 !important;
    }
    /* Texto, párrafos y listas footer → negro */
    [data-tema="claro"] footer p,
    [data-tema="claro"] footer li,
    [data-tema="claro"] footer a,
    [data-tema="claro"] footer .text-gray-400,
    [data-tema="claro"] footer .text-gray-500,
    [data-tema="claro"] footer .text-gray-600 {
        color: #111111 !important;
    }
    [data-tema="claro"] footer a:hover { color: #FFFFFF !important; }
    /* Línea divisoria footer */
    [data-tema="claro"] footer .border-gray-800 { border-color: #CC0070 !important; }

    /* ── TEXTOS FUERA DE CARDS (sobre fondo cyan) → NEGRO NEGRILLA ─── */
    /* Títulos de sección */
    [data-tema="claro"] main h1:not(.bg-gray-900 h1):not(.bg-gray-800 h1),
    [data-tema="claro"] main h2:not(.bg-gray-900 h2):not(.bg-gray-800 h2),
    [data-tema="claro"] main h3:not(.bg-gray-900 h3):not(.bg-gray-800 h3) {
        color: #111111 !important;
        font-weight: 700 !important;
    }
    /* Textos generales sobre el fondo */
    [data-tema="claro"] main .text-white:not(.bg-gray-900 *):not(.bg-gray-800 *):not(.bg-gray-700 *),
    [data-tema="claro"] main .text-gray-100:not(.bg-gray-900 *):not(.bg-gray-800 *),
    [data-tema="claro"] main .text-gray-200:not(.bg-gray-900 *):not(.bg-gray-800 *),
    [data-tema="claro"] main .text-gray-300:not(.bg-gray-900 *):not(.bg-gray-800 *) {
        color: #111111 !important;
        font-weight: 600 !important;
    }
    /* Labels y textos secundarios sobre el fondo */
    [data-tema="claro"] main .text-gray-400:not(.bg-gray-900 *):not(.bg-gray-800 *),
    [data-tema="claro"] main .text-gray-500:not(.bg-gray-900 *):not(.bg-gray-800 *) {
        color: #1C1C1C !important;
        font-weight: 600 !important;
    }
    /* Excepción: textos dentro de BOTONES oscuros siempre blancos */
    [data-tema="claro"] main button.bg-gray-800,
    [data-tema="claro"] main button.bg-gray-800 * { color: #FFFFFF !important; font-weight: 700 !important; }

    /* Excepciones: textos dentro de cards se mantienen como están */
    [data-tema="claro"] main .bg-gray-900 .text-white,
    [data-tema="claro"] main .bg-gray-900 .text-gray-100,
    [data-tema="claro"] main .bg-gray-900 .text-gray-200,
    [data-tema="claro"] main .bg-gray-900 .text-gray-300 { color: #FFFFFF !important; font-weight: inherit !important; }
    [data-tema="claro"] main .bg-gray-900 .text-gray-400 { color: #A0AEC0 !important; font-weight: inherit !important; }

    /* ── TRANSICIÓN SUAVE ────────────────────────────── */
    [data-tema] main, [data-tema] footer, [data-tema] main * {
        transition: background-color 0.25s ease, color 0.2s ease, border-color 0.2s ease !important;
    }
`;

export default function TiendaLayout({ children }) {

    const [busqueda, setBusqueda]   = useState('');
    const [menuMovil, setMenuMovil] = useState(false);
    const { totalItems } = useCart();

    // ── TEMA ──────────────────────────────────────────────────────────────
    const [temaClaro, setTemaClaro] = useState(() => {
        try { return localStorage.getItem('gs-tema') === 'claro'; } catch { return false; }
    });

    const toggleTema = () => {
        const nuevo = !temaClaro;
        setTemaClaro(nuevo);
        try { localStorage.setItem('gs-tema', nuevo ? 'claro' : 'oscuro'); } catch {}
    };

    const buscar = (e) => {
        e.preventDefault();
        if (busqueda.trim()) {
            router.get(route('tienda.index'), { q: busqueda.trim() });
        }
    };

    return (
        <div data-tema={temaClaro ? 'claro' : 'oscuro'}>

            {/* Inyección de estilos modo claro */}
            {temaClaro && <style>{ESTILOS_CLARO}</style>}

            {/* ── NAVBAR — siempre oscuro (identidad de marca) ───────────── */}
            <nav className="bg-gray-950 border-b border-gray-800 sticky top-0 z-50 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16 gap-4">

                        {/* Logo */}
                        <Link href={route('tienda.index')} className="flex items-center gap-2 shrink-0 group">
                            <img
                                src="/logo.webp"
                                alt="GadGet Store"
                                className="h-10 w-auto group-hover:scale-105 transition-transform duration-200"
                            />
                        </Link>

                        {/* Buscador central */}
                        <form onSubmit={buscar} className="flex-1 max-w-lg hidden sm:block">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={busqueda}
                                    onChange={e => setBusqueda(e.target.value)}
                                    placeholder="Buscar productos..."
                                    className="w-full bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-full px-4 py-2 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                                />
                                <button type="submit"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-400 transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </button>
                            </div>
                        </form>

                        {/* Acciones */}
                        <div className="flex items-center gap-1 shrink-0">

                            {/* Buscador icono móvil */}
                            <button className="sm:hidden p-2 text-gray-400 hover:text-orange-400 transition-colors"
                                onClick={() => setMenuMovil(!menuMovil)}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </button>

                            {/* ── TOGGLE TEMA — bombillo ─────────────────── */}
                            <button
                                onClick={toggleTema}
                                title={temaClaro ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
                                className="p-2 rounded-lg transition-all duration-200 hover:scale-110"
                            >
                                {temaClaro ? (
                                    /* Luna — cambiar a oscuro */
                                    <svg className="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                    </svg>
                                ) : (
                                    /* Bombillo — cambiar a claro */
                                    <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                )}
                            </button>

                            {/* Carrito */}
                            <Link href={route('tienda.carrito')}
                                className="relative p-2 text-gray-400 hover:text-orange-400 transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                {totalItems > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                        {totalItems > 99 ? '99+' : totalItems}
                                    </span>
                                )}
                            </Link>

                            <Link href={route('login')}
                                className="text-sm text-gray-400 hover:text-orange-400 transition-colors font-medium px-2 py-1">
                                Entrar
                            </Link>
                        </div>
                    </div>

                    {/* Buscador móvil expandible */}
                    {menuMovil && (
                        <form onSubmit={buscar} className="sm:hidden pb-3">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={busqueda}
                                    onChange={e => setBusqueda(e.target.value)}
                                    placeholder="Buscar productos..."
                                    autoFocus
                                    className="w-full bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-full px-4 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                                <button type="submit"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-400 transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </nav>

            {/* ── CONTENIDO ──────────────────────────────────────────────── */}
            <main className="min-h-screen bg-gray-950">
                {children}
            </main>

            {/* ── FOOTER ─────────────────────────────────────────────────── */}
            <footer className="bg-gray-900 border-t border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">

                        <div>
                            <div className="mb-3">
                                <img
                                    src="/logo.webp"
                                    alt="GadGet Store"
                                    className={temaClaro
                                        ? "h-16 w-16 rounded-full object-cover border-2 border-white shadow-lg"
                                        : "h-12 w-auto"}
                                />
                            </div>
                            <p className="text-sm text-gray-400 leading-relaxed">
                                Variedad en una sola tienda. Los mejores gadgets y accesorios con entrega a todo Colombia.
                            </p>
                        </div>

                        <div>
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Navegación</h4>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li><Link href={route('tienda.index')} className="hover:text-orange-400 transition-colors">Catálogo</Link></li>
                                <li><Link href={route('login')} className="hover:text-orange-400 transition-colors">Panel de administración</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Información</h4>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li>📦 Envíos a toda Colombia</li>
                                <li>💬 Atención por WhatsApp</li>
                                <li>✅ Precios en COP con IVA incluido</li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-gray-800 mt-8 pt-6 text-center text-xs text-gray-600">
                        © {new Date().getFullYear()} GadGet Store · Variedad en una sola tienda
                    </div>
                </div>
            </footer>

            {/* ── BOTONES FLOTANTES ─────────────────────────────────────── */}
            <a href="https://wa.me/573137921336?text=Hola%2C%20me%20interesa%20un%20producto%20de%20GadGet%20Store"
                target="_blank" rel="noopener noreferrer" title="Chatea con nosotros en WhatsApp"
                className="fixed bottom-24 right-4 z-50 w-14 h-14 bg-green-500 hover:bg-green-400 text-white rounded-full shadow-lg shadow-green-900/40 flex items-center justify-center transition-transform duration-200 hover:scale-110">
                <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
            </a>

            <a href="tel:+573137921336" title="Llámanos"
                className="fixed bottom-6 right-4 z-50 w-14 h-14 bg-gradient-to-br from-orange-500 to-pink-500 hover:from-orange-400 hover:to-pink-400 text-white rounded-full shadow-lg shadow-orange-900/40 flex items-center justify-center transition-transform duration-200 hover:scale-110">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                </svg>
            </a>
        </div>
    );
}
