/*
|--------------------------------------------------------------------------
| LAYOUT: TiendaLayout — GadGet Store
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Para qué sirve este layout?
|
|   Envoltorio de todas las páginas públicas de la tienda GadGet Store.
|   Identidad visual: fondo oscuro navy, acentos naranja + rosa + cyan.
|
*/

import { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { useCart } from '@/Context/CartContext';

export default function TiendaLayout({ children }) {

    const [busqueda, setBusqueda]   = useState('');
    const [menuMovil, setMenuMovil] = useState(false);
    const { totalItems } = useCart();

    const buscar = (e) => {
        e.preventDefault();
        if (busqueda.trim()) {
            router.get(route('tienda.index'), { q: busqueda.trim() });
        }
    };

    return (
        <>
            {/* ── NAVBAR ─────────────────────────────────────────────────── */}
            <nav className="bg-gray-950 border-b border-gray-800 sticky top-0 z-50 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16 gap-4">

                        {/* Logo + nombre */}
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
                        <div className="flex items-center gap-2 shrink-0">
                            {/* Buscador icono móvil */}
                            <button className="sm:hidden p-2 text-gray-400 hover:text-orange-400 transition-colors"
                                onClick={() => setMenuMovil(!menuMovil)}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </button>

                            {/* Ícono carrito con badge */}
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

                        {/* Marca */}
                        <div>
                            <div className="mb-3">
                                <img src="/logo.webp" alt="GadGet Store" className="h-12 w-auto" />
                            </div>
                            <p className="text-sm text-gray-400 leading-relaxed">
                                Variedad en una sola tienda. Los mejores gadgets y accesorios con entrega a todo Colombia.
                            </p>
                        </div>

                        {/* Navegación */}
                        <div>
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Navegación</h4>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li>
                                    <Link href={route('tienda.index')} className="hover:text-orange-400 transition-colors">
                                        Catálogo
                                    </Link>
                                </li>
                                <li>
                                    <Link href={route('login')} className="hover:text-orange-400 transition-colors">
                                        Panel de administración
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Info */}
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

            {/* ── BOTONES FLOTANTES ─────────────────────────────────────────── */}
            {/* WhatsApp */}
            <a
                href="https://wa.me/573137921336?text=Hola%2C%20me%20interesa%20un%20producto%20de%20GadGet%20Store"
                target="_blank"
                rel="noopener noreferrer"
                title="Chatea con nosotros en WhatsApp"
                className="fixed bottom-24 right-4 z-50 w-14 h-14 bg-green-500 hover:bg-green-400 text-white rounded-full shadow-lg shadow-green-900/40 flex items-center justify-center transition-transform duration-200 hover:scale-110"
            >
                {/* WhatsApp icon */}
                <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
            </a>

            {/* Llamar */}
            <a
                href="tel:+573137921336"
                title="Llámanos"
                className="fixed bottom-6 right-4 z-50 w-14 h-14 bg-gradient-to-br from-orange-500 to-pink-500 hover:from-orange-400 hover:to-pink-400 text-white rounded-full shadow-lg shadow-orange-900/40 flex items-center justify-center transition-transform duration-200 hover:scale-110"
            >
                {/* Phone icon */}
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                </svg>
            </a>
        </>
    );
}
