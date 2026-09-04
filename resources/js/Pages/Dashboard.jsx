import { usePage, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Dashboard() {
    const { auth, productosPendientes, pedidosPendientes = 0 } = usePage().props;
    const usuario = auth.user;
    const esSuperAdmin = (auth.roles ?? []).includes('super_administrador');

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Dashboard</h2>}
        >
            <Head title="Dashboard" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">

                    {/* Saludo */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-800">
                            ¡Bienvenido, {usuario?.nombre || usuario?.name}! 👋
                        </h3>
                        <p className="text-gray-600 mt-1">Panel de control — Dropshipping Colombia</p>
                        <div className="mt-3">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                                Rol: {usuario?.rol?.replace(/_/g, ' ')}
                            </span>
                        </div>
                    </div>

                    {/* Cards de acceso rápido */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="flex items-center">
                                <div className="text-3xl mr-4">👥</div>
                                <div>
                                    <h4 className="text-base font-semibold text-gray-800">Usuarios</h4>
                                    <p className="text-sm text-gray-500">Gestionar cuentas y roles</p>
                                </div>
                            </div>
                            <div className="mt-4">
                                <Link href={route('usuarios.index')} className="text-orange-600 hover:text-orange-800 text-sm font-medium">
                                    Ver usuarios →
                                </Link>
                            </div>
                        </div>

                        <div className={`overflow-hidden shadow-sm sm:rounded-lg p-6 ${productosPendientes > 0 ? 'bg-orange-50 border-2 border-orange-300' : 'bg-white'}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="text-3xl mr-4">📦</div>
                                    <div>
                                        <h4 className="text-base font-semibold text-gray-800">Productos</h4>
                                        <p className="text-sm text-gray-500">Catálogo y precios</p>
                                    </div>
                                </div>
                                {productosPendientes > 0 && (
                                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-500 text-white text-sm font-bold shadow">
                                        {productosPendientes}
                                    </span>
                                )}
                            </div>
                            {productosPendientes > 0 && (
                                <div className="mt-3 bg-orange-100 border border-orange-200 rounded-lg px-3 py-2 flex items-center gap-2">
                                    <span className="text-orange-600 text-sm">⚠️</span>
                                    <p className="text-sm font-medium text-orange-800">
                                        {productosPendientes} producto{productosPendientes > 1 ? 's' : ''} esperando aprobación
                                    </p>
                                </div>
                            )}
                            <div className="mt-4 flex flex-wrap gap-3">
                                <Link href={route('productos.index')} className="text-orange-600 hover:text-orange-800 text-sm font-medium">
                                    Ver productos →
                                </Link>
                                {productosPendientes > 0 && (
                                    <Link
                                        href={route('productos.index') + '?estado=inactivo'}
                                        className="text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 px-3 py-1 rounded-lg transition-colors"
                                    >
                                        Revisar pendientes →
                                    </Link>
                                )}
                            </div>
                        </div>

                        <div className={`overflow-hidden shadow-sm sm:rounded-lg p-6 ${pedidosPendientes > 0 ? 'bg-red-50 border-2 border-red-300' : 'bg-white'}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="text-3xl mr-4">🛒</div>
                                    <div>
                                        <h4 className="text-base font-semibold text-gray-800">Pedidos</h4>
                                        <p className="text-sm text-gray-500">Órdenes y seguimiento</p>
                                    </div>
                                </div>
                                {pedidosPendientes > 0 && (
                                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-500 text-white text-sm font-bold shadow">
                                        {pedidosPendientes}
                                    </span>
                                )}
                            </div>
                            {pedidosPendientes > 0 && (
                                <div className="mt-3 bg-red-100 border border-red-200 rounded-lg px-3 py-2 flex items-center gap-2">
                                    <span className="text-red-600 text-sm">🔴</span>
                                    <p className="text-sm font-medium text-red-800">
                                        {pedidosPendientes} pedido{pedidosPendientes > 1 ? 's' : ''} pendiente{pedidosPendientes > 1 ? 's' : ''} — ¡gestionar por WhatsApp!
                                    </p>
                                </div>
                            )}
                            <div className="mt-4 flex flex-wrap gap-3">
                                <Link href={route('pedidos.index')} className="text-orange-600 hover:text-orange-800 text-sm font-medium">
                                    Ver pedidos →
                                </Link>
                                {pedidosPendientes > 0 && (
                                    <Link
                                        href={route('pedidos.index') + '?estado=pendiente'}
                                        className="text-sm font-semibold text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded-lg transition-colors"
                                    >
                                        Ver pendientes →
                                    </Link>
                                )}
                                <Link href={route('tarifas.index')} className="text-orange-600 hover:text-orange-800 text-sm font-medium">
                                    🚚 Tarifas domicilio →
                                </Link>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="flex items-center">
                                <div className="text-3xl mr-4">💰</div>
                                <div>
                                    <h4 className="text-base font-semibold text-gray-800">Finanzas</h4>
                                    <p className="text-sm text-gray-500">Transacciones y gastos</p>
                                </div>
                            </div>
                            <div className="mt-4">
                                <Link href={route('reportes.financiero')} className="text-orange-600 hover:text-orange-800 text-sm font-medium">
                                    Ver finanzas →
                                </Link>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="flex items-center">
                                <div className="text-3xl mr-4">🏪</div>
                                <div>
                                    <h4 className="text-base font-semibold text-gray-800">Portal Proveedores</h4>
                                    <p className="text-sm text-gray-500">Vista del proveedor</p>
                                </div>
                            </div>
                            <div className="mt-4">
                                <Link href={route('portal.dashboard')} className="text-orange-600 hover:text-orange-800 text-sm font-medium">
                                    Ir al portal →
                                </Link>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="flex items-center">
                                <div className="text-3xl mr-4">📣</div>
                                <div>
                                    <h4 className="text-base font-semibold text-gray-800">Marketing</h4>
                                    <p className="text-sm text-gray-500">Cupones y campañas</p>
                                </div>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-3">
                                <Link href={route('cupones.index')} className="text-orange-600 hover:text-orange-800 text-sm font-medium">
                                    Cupones →
                                </Link>
                                <Link href={route('campanas.index')} className="text-blue-800 hover:text-purple-900 text-sm font-medium">
                                    Campañas →
                                </Link>
                                <a href="/marketing/exportar"
                                    className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center gap-1">
                                    📥 Exportar clientes →
                                </a>
                                {esSuperAdmin && (
                                    <Link href={route('marketing.asistente')}
                                        className="text-purple-600 hover:text-purple-800 text-sm font-medium flex items-center gap-1">
                                        🚀 Asistente Pro →
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* Analytics */}
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="flex items-center">
                                <div className="text-3xl mr-4">📊</div>
                                <div>
                                    <h4 className="text-base font-semibold text-gray-800">Analytics</h4>
                                    <p className="text-sm text-gray-500">Métricas del negocio</p>
                                </div>
                            </div>
                            <div className="mt-4">
                                <Link href={route('analytics.dashboard')} className="text-orange-600 hover:text-orange-800 text-sm font-medium">
                                    Ver analytics →
                                </Link>
                            </div>
                        </div>

                        {/* Tienda Pública */}
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="flex items-center">
                                <div className="text-3xl mr-4">🛍</div>
                                <div>
                                    <h4 className="text-base font-semibold text-gray-800">Tienda Pública</h4>
                                    <p className="text-sm text-gray-500">Catálogo para clientes</p>
                                </div>
                            </div>
                            <div className="mt-4">
                                <Link href={route('tienda.index')} className="text-orange-600 hover:text-orange-800 text-sm font-medium">
                                    Ver tienda →
                                </Link>
                            </div>
                        </div>

                    </div>

                    {/* Estado del sistema */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Estado del Sistema</h4>
                        <div className="flex gap-4 flex-wrap">
                            <span className="inline-flex items-center gap-1.5 text-sm text-green-700 bg-green-50 px-3 py-1 rounded-full">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                PostgreSQL: Conectada
                            </span>
                            <span className="inline-flex items-center gap-1.5 text-sm text-green-700 bg-green-50 px-3 py-1 rounded-full">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                Laravel 13 + React + Inertia
                            </span>
                            <span className="inline-flex items-center gap-1.5 text-sm text-green-700 bg-green-50 px-3 py-1 rounded-full">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                Fase 9 / 10 — Analytics + Tienda Pública ✅
                            </span>
                        </div>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
