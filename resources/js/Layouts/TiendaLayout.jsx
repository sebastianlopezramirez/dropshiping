/*
|--------------------------------------------------------------------------
| LAYOUT: TiendaLayout
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Para qué sirve este layout?
|
|   Es el envoltorio de todas las páginas públicas de la tienda.
|   NO usa AuthenticatedLayout (ese es solo para el panel de admin).
|   Cualquier visitante sin login puede verlo.
|
| PENSAR — ¿Qué tiene este layout?
|
|   1. Navbar pública:
|      - Logo + nombre de la tienda (link a /tienda)
|      - Buscador de productos
|      - Link "Entrar" para admins/vendedores
|
|   2. <main> donde se inyecta el contenido de cada página ({children})
|
|   3. Footer: nombre del negocio, links de navegación, info de contacto
|
| PENSAR — ¿Por qué NO hay carrito aquí?
|
|   El carrito requiere estado persistente (localStorage o sesión).
|   Lo agregaremos en una fase futura cuando implementemos checkout.
|   Por ahora la tienda es informativa (catálogo + detalle).
|
*/

import { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { Head } from '@inertiajs/react';

export default function TiendaLayout({ children, title = 'Tienda' }) {

    // Estado del buscador en la navbar
    const [busqueda, setBusqueda] = useState('');

    // Al presionar Enter en el buscador, navega a /tienda?q=termino
    const buscar = (e) => {
        e.preventDefault();
        if (busqueda.trim()) {
            router.get(route('tienda.index'), { q: busqueda.trim() });
        }
    };

    return (
        <>
            {/* ── NAVBAR PÚBLICA ─────────────────────────────── */}
            <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16 gap-4">

                        {/* Logo + nombre */}
                        <Link
                            href={route('tienda.index')}
                            className="flex items-center gap-2 shrink-0"
                        >
                            <span className="text-xl font-bold text-indigo-600 tracking-tight">
                                🛍 Tienda
                            </span>
                        </Link>

                        {/* Buscador — ocupa el espacio del centro */}
                        <form onSubmit={buscar} className="flex-1 max-w-xl">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={busqueda}
                                    onChange={e => setBusqueda(e.target.value)}
                                    placeholder="Buscar productos..."
                                    className="w-full border border-gray-300 rounded-full px-4 py-2 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                                />
                                <button
                                    type="submit"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition-colors"
                                >
                                    {/* Ícono lupa */}
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </button>
                            </div>
                        </form>

                        {/* Link de acceso al panel de admin */}
                        <Link
                            href={route('login')}
                            className="shrink-0 text-sm text-gray-500 hover:text-indigo-600 transition-colors font-medium"
                        >
                            Entrar →
                        </Link>

                    </div>
                </div>
            </nav>

            {/* ── CONTENIDO DE LA PÁGINA ─────────────────────── */}
            <main className="min-h-screen bg-gray-50">
                {children}
            </main>

            {/* ── FOOTER ─────────────────────────────────────── */}
            <footer className="bg-white border-t border-gray-200 mt-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">

                        {/* Columna 1: Marca */}
                        <div>
                            <span className="text-lg font-bold text-indigo-600">🛍 Tienda</span>
                            <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                                Los mejores productos al mejor precio,
                                con entrega a todo Colombia.
                            </p>
                        </div>

                        {/* Columna 2: Navegación */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                                Navegación
                            </h4>
                            <ul className="space-y-2 text-sm text-gray-500">
                                <li>
                                    <Link href={route('tienda.index')} className="hover:text-indigo-600 transition-colors">
                                        Catálogo
                                    </Link>
                                </li>
                                <li>
                                    <Link href={route('login')} className="hover:text-indigo-600 transition-colors">
                                        Panel de administración
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Columna 3: Info legal */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                                Legal
                            </h4>
                            <ul className="space-y-2 text-sm text-gray-500">
                                <li>Precios en COP con IVA incluido</li>
                                <li>Envíos a toda Colombia</li>
                            </ul>
                        </div>

                    </div>

                    {/* Línea de copyright */}
                    <div className="border-t border-gray-100 mt-8 pt-6 text-center text-xs text-gray-400">
                        © {new Date().getFullYear()} Dropshipping Colombia. Todos los derechos reservados.
                    </div>
                </div>
            </footer>
        </>
    );
}
