/*
|--------------------------------------------------------------------------
| LAYOUT: PortalLayout
|--------------------------------------------------------------------------
|
| Layout exclusivo del Portal de Proveedores.
| Se diferencia del admin por:
|   - Color de acento: VERDE (admin usa índigo/morado)
|   - Navbar con logo "Portal Proveedor"
|   - Navegación simplificada: solo las 4 secciones del proveedor
|
| Uso: wrappear las páginas del portal
|   <PortalLayout header={<h2>Mi Dashboard</h2>}>
|     { contenido }
|   </PortalLayout>
|
*/

import { useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';

export default function PortalLayout({ header, children }) {

    const { auth } = usePage().props;
    const [menuAbierto, setMenuAbierto] = useState(false);

    // Navegación del portal — solo las secciones del proveedor
    const navItems = [
        { href: route('portal.dashboard'),  label: 'Dashboard',   icono: '📊' },
        { href: route('portal.productos'),  label: 'Mis Productos', icono: '📦' },
        { href: route('portal.pedidos'),    label: 'Pedidos',     icono: '🛒' },
        { href: route('portal.pagos'),      label: 'Mis Pagos',   icono: '💰' },
    ];

    const cerrarSesion = () => {
        router.post(route('logout'));
    };

    // ¿La URL actual coincide con el href? → resalta el link activo
    const esActivo = (href) => window.location.pathname.startsWith(new URL(href, window.location.origin).pathname);

    return (
        <div className="min-h-screen bg-gray-50">

            {/* ── NAVBAR ─────────────────────────────────────────────── */}
            <nav className="bg-white border-b border-gray-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">

                        {/* Logo / Marca */}
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                                <span className="text-white text-sm font-bold">P</span>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-900 leading-tight">Portal Proveedor</p>
                                <p className="text-xs text-gray-400 leading-tight">{auth?.user?.nombre ?? 'Proveedor'}</p>
                            </div>
                        </div>

                        {/* Navegación desktop */}
                        <div className="hidden md:flex items-center gap-1">
                            {navItems.map(item => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5
                                        ${esActivo(item.href)
                                            ? 'bg-emerald-50 text-emerald-700'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                >
                                    <span>{item.icono}</span>
                                    {item.label}
                                </Link>
                            ))}
                        </div>

                        {/* Botón cerrar sesión */}
                        <div className="flex items-center gap-3">
                            {/* Link al admin si es super_admin */}
                            {auth?.user?.roles?.some(r => r.name === 'super_administrador') && (
                                <Link href={route('dashboard')}
                                    className="hidden md:inline-flex text-xs text-gray-400 hover:text-indigo-600 transition">
                                    ← Admin
                                </Link>
                            )}
                            <button onClick={cerrarSesion}
                                className="text-sm text-gray-500 hover:text-red-600 transition px-3 py-2 rounded-lg hover:bg-red-50">
                                Salir
                            </button>

                            {/* Hamburger mobile */}
                            <button
                                className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
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
                        <div className="md:hidden pb-3 space-y-1">
                            {navItems.map(item => (
                                <Link key={item.href} href={item.href}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition
                                        ${esActivo(item.href)
                                            ? 'bg-emerald-50 text-emerald-700'
                                            : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                    onClick={() => setMenuAbierto(false)}>
                                    <span>{item.icono}</span>{item.label}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </nav>

            {/* ── HEADER DE PÁGINA ───────────────────────────────────── */}
            {header && (
                <header className="bg-white border-b border-gray-100">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        {header}
                    </div>
                </header>
            )}

            {/* ── CONTENIDO ──────────────────────────────────────────── */}
            <main>
                {children}
            </main>
        </div>
    );
}
