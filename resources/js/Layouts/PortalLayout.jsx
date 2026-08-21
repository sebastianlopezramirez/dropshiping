/*
|--------------------------------------------------------------------------
| LAYOUT: PortalLayout — Portal de Proveedores
|--------------------------------------------------------------------------
|
| Identidad visual: navbar navy oscuro con badge naranja "Portal".
| Se diferencia del admin visualmente pero mantiene la misma identidad de marca.
|
*/

import { useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';

export default function PortalLayout({ header, children }) {

    const { auth } = usePage().props;
    const [menuAbierto, setMenuAbierto] = useState(false);

    const navItems = [
        { href: route('portal.dashboard'),  label: 'Dashboard',    icono: '📊' },
        { href: route('portal.productos'),  label: 'Mis Productos', icono: '📦' },
        { href: route('portal.pedidos'),    label: 'Pedidos',      icono: '🛒' },
        { href: route('portal.pagos'),      label: 'Mis Pagos',    icono: '💰' },
    ];

    const cerrarSesion = () => router.post(route('logout'));

    const esActivo = (href) =>
        window.location.pathname.startsWith(new URL(href, window.location.origin).pathname);

    return (
        <div className="min-h-screen bg-gray-50">

            {/* ── NAVBAR ─────────────────────────────────────────────────── */}
            <nav className="bg-gray-950 border-b border-gray-800 sticky top-0 z-50 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">

                        {/* Logo + badge Portal */}
                        <div className="flex items-center gap-3 shrink-0">
                            <Link href={route('tienda.index')} className="group">
                                <img
                                    src="/logo.webp"
                                    alt="GadGet Store"
                                    className="h-9 w-auto group-hover:scale-105 transition-transform duration-200"
                                    onError={e => { e.target.style.display = 'none'; }}
                                />
                            </Link>
                            <div className="hidden sm:flex flex-col leading-none">
                                <span className="text-xs font-bold text-white tracking-wide">GadGet Store</span>
                                <span className="text-xs font-semibold text-orange-400">
                                    Portal Proveedor
                                </span>
                            </div>
                        </div>

                        {/* Navegación desktop */}
                        <div className="hidden md:flex items-center gap-1">
                            {navItems.map(item => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5
                                        ${esActivo(item.href)
                                            ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                                            : 'text-gray-400 hover:bg-gray-800 hover:text-white border border-transparent'
                                        }`}
                                >
                                    <span>{item.icono}</span>
                                    {item.label}
                                </Link>
                            ))}
                        </div>

                        {/* Usuario + acciones */}
                        <div className="flex items-center gap-2">
                            {/* Nombre usuario */}
                            <div className="hidden md:flex items-center gap-2">
                                <span className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                    {(auth?.user?.nombre || 'P').charAt(0).toUpperCase()}
                                </span>
                                <span className="text-sm text-gray-400 max-w-32 truncate">
                                    {auth?.user?.nombre ?? 'Proveedor'}
                                </span>
                            </div>

                            {/* Link al admin si es super_admin */}
                            {auth?.user?.roles?.some(r => r.name === 'super_administrador') && (
                                <Link
                                    href={route('dashboard')}
                                    className="hidden md:inline-flex text-xs text-gray-500 hover:text-orange-400 transition-colors border border-gray-700 rounded-lg px-2 py-1.5"
                                >
                                    Admin →
                                </Link>
                            )}

                            <button
                                onClick={cerrarSesion}
                                className="hidden md:inline-flex text-sm text-gray-500 hover:text-red-400 transition-colors
                                    border border-gray-700 rounded-lg px-3 py-1.5 hover:border-red-800 hover:bg-red-900/20"
                            >
                                Salir
                            </button>

                            {/* Hamburger mobile */}
                            <button
                                className="md:hidden p-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
                                onClick={() => setMenuAbierto(!menuAbierto)}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d={menuAbierto ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Menú mobile */}
                    {menuAbierto && (
                        <div className="md:hidden border-t border-gray-800 pb-3 pt-2 space-y-1">
                            {navItems.map(item => (
                                <Link key={item.href} href={item.href}
                                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                                        ${esActivo(item.href)
                                            ? 'bg-orange-500/10 text-orange-400'
                                            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                        }`}
                                    onClick={() => setMenuAbierto(false)}>
                                    <span>{item.icono}</span>{item.label}
                                </Link>
                            ))}
                            <div className="border-t border-gray-800 pt-3 mt-2 flex items-center justify-between px-3">
                                <span className="text-sm text-gray-400">{auth?.user?.nombre ?? 'Proveedor'}</span>
                                <button onClick={cerrarSesion}
                                    className="text-sm text-red-400 hover:text-red-300 transition-colors">
                                    Salir
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </nav>

            {/* ── HEADER DE PÁGINA ───────────────────────────────────────── */}
            {header && (
                <header className="bg-white border-b border-gray-200 shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        {header}
                    </div>
                </header>
            )}

            {/* ── CONTENIDO ──────────────────────────────────────────────── */}
            <main>{children}</main>
        </div>
    );
}
