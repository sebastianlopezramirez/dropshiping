/*
|--------------------------------------------------------------------------
| LAYOUT: AuthenticatedLayout — Panel de Administración
|--------------------------------------------------------------------------
|
| Identidad visual: navbar navy oscuro (gray-950) con acentos naranja.
| Contenido interior: fondo claro (gray-50) para legibilidad del texto.
|
*/

import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function AuthenticatedLayout({ header, children }) {
    const { auth, productosPendientes = 0 } = usePage().props;
    const user = auth.user;
    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50">

            {/* ── NAVBAR ─────────────────────────────────────────────────── */}
            <nav className="bg-gray-950 border-b border-gray-800 sticky top-0 z-50 shadow-lg">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">

                        {/* Logo + nav links */}
                        <div className="flex items-center gap-8">
                            <Link href="/" className="shrink-0 group">
                                <img
                                    src="/logo.webp"
                                    alt="GadGet Store"
                                    className="h-9 w-auto group-hover:scale-105 transition-transform duration-200"
                                    onError={e => { e.target.style.display = 'none'; }}
                                />
                            </Link>

                            {/* Nav desktop */}
                            <div className="hidden sm:flex items-center gap-1">
                                <NavLink href={route('dashboard')} active={route().current('dashboard')}>Dashboard</NavLink>
                                <NavLink href={route('productos.index')} active={route().current('productos.*')}>
                                    <span className="flex items-center gap-1.5">
                                        Productos
                                        {productosPendientes > 0 && (
                                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange-500 text-white text-xs font-bold leading-none">
                                                {productosPendientes > 9 ? '9+' : productosPendientes}
                                            </span>
                                        )}
                                    </span>
                                </NavLink>
                                <NavLink href={route('pedidos.index')} active={route().current('pedidos.*')}>Pedidos</NavLink>
                                <NavLink href={route('usuarios.index')} active={route().current('usuarios.*')}>Usuarios</NavLink>

                                {/* Dropdown Finanzas */}
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <button type="button"
                                            className={`inline-flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-colors
                                                ${route().current('reportes.*') || route().current('transacciones.*') || route().current('gastos.*') || route().current('pagos-proveedor.*')
                                                    ? 'text-white bg-gray-800'
                                                    : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
                                            Finanzas
                                            <svg className="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </Dropdown.Trigger>
                                    <Dropdown.Content contentClasses="py-1 bg-gray-900 border border-gray-700 w-52">
                                        <Dropdown.Link href={route('reportes.financiero')} className="text-gray-300 hover:bg-gray-800 hover:text-white">
                                            📊 Dashboard financiero
                                        </Dropdown.Link>
                                        <Dropdown.Link href={route('pagos-proveedor.index')} className="text-gray-300 hover:bg-gray-800 hover:text-white">
                                            🏭 Pagos a proveedores
                                        </Dropdown.Link>
                                        <Dropdown.Link href={route('transacciones.index')} className="text-gray-300 hover:bg-gray-800 hover:text-white">
                                            💳 Transacciones
                                        </Dropdown.Link>
                                        <Dropdown.Link href={route('gastos.index')} className="text-gray-300 hover:bg-gray-800 hover:text-white">
                                            📋 Gastos operativos
                                        </Dropdown.Link>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>
                        </div>

                        {/* Usuario dropdown — desktop */}
                        <div className="hidden sm:flex items-center">
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button
                                        type="button"
                                        className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-900
                                            px-3 py-2 text-sm font-medium text-gray-300
                                            hover:bg-gray-800 hover:text-white hover:border-gray-600
                                            focus:outline-none transition-colors"
                                    >
                                        <span className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                            {(user?.nombre || user?.name || 'A').charAt(0).toUpperCase()}
                                        </span>
                                        <span className="max-w-32 truncate">{user?.nombre || user?.name}</span>
                                        <svg className="h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </Dropdown.Trigger>

                                <Dropdown.Content contentClasses="py-1 bg-gray-900 border border-gray-700">
                                    <Dropdown.Link href={route('profile.edit')} className="text-gray-300 hover:bg-gray-800 hover:text-white">
                                        Mi perfil
                                    </Dropdown.Link>
                                    <Dropdown.Link
                                        href={route('tienda.index')}
                                        className="text-gray-300 hover:bg-gray-800 hover:text-white"
                                    >
                                        Ver tienda →
                                    </Dropdown.Link>
                                    <div className="border-t border-gray-700 my-1" />
                                    <Dropdown.Link
                                        href={route('logout')}
                                        method="post"
                                        as="button"
                                        className="text-red-400 hover:bg-red-900/30 hover:text-red-300 w-full text-left"
                                    >
                                        Cerrar sesión
                                    </Dropdown.Link>
                                </Dropdown.Content>
                            </Dropdown>
                        </div>

                        {/* Hamburger — mobile */}
                        <button
                            onClick={() => setShowingNavigationDropdown(prev => !prev)}
                            className="sm:hidden inline-flex items-center justify-center rounded-lg p-2
                                text-gray-400 hover:bg-gray-800 hover:text-white focus:outline-none transition-colors"
                        >
                            <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                                <path
                                    className={!showingNavigationDropdown ? 'inline-flex' : 'hidden'}
                                    strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                                <path
                                    className={showingNavigationDropdown ? 'inline-flex' : 'hidden'}
                                    strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Menú mobile */}
                <div className={(showingNavigationDropdown ? 'block' : 'hidden') + ' sm:hidden border-t border-gray-800'}>
                    <div className="space-y-1 px-4 py-3">
                        <ResponsiveNavLink href={route('dashboard')} active={route().current('dashboard')}>Dashboard</ResponsiveNavLink>
                        <ResponsiveNavLink href={route('productos.index')} active={route().current('productos.*')}>Productos</ResponsiveNavLink>
                        <ResponsiveNavLink href={route('pedidos.index')} active={route().current('pedidos.*')}>Pedidos</ResponsiveNavLink>
                        <ResponsiveNavLink href={route('usuarios.index')} active={route().current('usuarios.*')}>Usuarios</ResponsiveNavLink>
                    </div>

                    <div className="border-t border-gray-800 px-4 py-3">
                        <div className="flex items-center gap-3 mb-3">
                            <span className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-sm font-bold">
                                {(user?.nombre || user?.name || 'A').charAt(0).toUpperCase()}
                            </span>
                            <div>
                                <p className="text-sm font-medium text-white">{user?.nombre || user?.name}</p>
                                <p className="text-xs text-gray-500">{user?.email}</p>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <ResponsiveNavLink href={route('profile.edit')}>Mi perfil</ResponsiveNavLink>
                            <ResponsiveNavLink method="post" href={route('logout')} as="button">Cerrar sesión</ResponsiveNavLink>
                        </div>
                    </div>
                </div>
            </nav>

            {/* ── HEADER DE PÁGINA ───────────────────────────────────────── */}
            {header && (
                <header className="bg-white border-b border-gray-200 shadow-sm">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
                        {header}
                    </div>
                </header>
            )}

            {/* ── CONTENIDO ──────────────────────────────────────────────── */}
            <main>{children}</main>
        </div>
    );
}
