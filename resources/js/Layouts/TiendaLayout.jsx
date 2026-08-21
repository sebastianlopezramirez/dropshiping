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
        </>
    );
}
