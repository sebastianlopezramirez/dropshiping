/**
 * PÁGINA: Lista de Usuarios
 * RUTA:   GET /usuarios
 * ARCHIVO: resources/js/Pages/Usuarios/Index.jsx
 *
 * ¿QUÉ DATOS RECIBE DEL CONTROLLER?
 *   - usuarios: objeto paginado de Laravel (data, links, meta)
 *   - filtros: { buscar, estado, rol }
 *   - estadisticas: { total, activos, inactivos, suspendidos }
 *
 * ¿QUÉ APRENDE AQUÍ?
 *   - Cómo recibir y usar props de Inertia en React
 *   - Paginación con Inertia (respeta la SPA sin recargar)
 *   - router.get() para filtros sin recargar la página
 *   - Cómo hacer DELETE con método spoofing (HTML forms solo soportan GET/POST)
 */

import { useState } from 'react';
// Link: navegación SPA sin recargar
// router: para hacer peticiones programáticas (GET, POST, DELETE, etc.)
// usePage: para acceder a props globales (flash messages)
import { Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Index({ usuarios, filtros, estadisticas }) {
    /*
     * useState: hook de React para manejar estado local del componente.
     * 'buscar' es el valor del input de búsqueda.
     * Inicializamos con el filtro que viene del controller (si existe).
     */
    const [buscar, setBuscar] = useState(filtros?.buscar || '');

    // Acceder a flash messages (éxito/error) que Laravel envía con with()
    const { flash } = usePage().props;

    /**
     * Aplicar filtros sin recargar la página.
     *
     * router.get() de Inertia hace una petición GET al servidor
     * y actualiza el componente con los nuevos datos — sin full reload.
     *
     * preserveState: true → mantiene el estado del scroll y el formulario
     * replace: true → no agrega una nueva entrada al historial del browser
     */
    const filtrar = (nuevos) => {
        router.get(
            route('usuarios.index'),
            { ...filtros, ...nuevos },
            { preserveState: true, replace: true }
        );
    };

    /**
     * Eliminar un usuario con confirmación.
     *
     * ¿Por qué router.delete() y no un <form method="DELETE">?
     *   HTML solo soporta GET y POST en formularios.
     *   Inertia/Laravel usa "method spoofing": envía POST con _method=DELETE.
     *   router.delete() hace esto automáticamente.
     */
    const eliminar = (id, nombre) => {
        if (!confirm(`¿Seguro que deseas eliminar a ${nombre}? Esta acción se puede deshacer.`)) {
            return; // Si el usuario cancela, no hacemos nada
        }

        router.delete(route('usuarios.destroy', id), {
            preserveScroll: true, // No hace scroll al top después de la acción
        });
    };

    // Colores para los badges de estado
    const colorEstado = {
        activo:      'bg-green-100 text-green-800',
        inactivo:    'bg-gray-100 text-gray-800',
        suspendido:  'bg-red-100 text-red-800',
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Gestión de Usuarios
                </h2>
            }
        >
            <Head title="Usuarios" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">

                    {/* ─── Flash Message de éxito/error ────────────────── */}
                    {flash?.exito && (
                        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
                            ✅ {flash.exito}
                        </div>
                    )}
                    {flash?.error && (
                        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                            ❌ {flash.error}
                        </div>
                    )}

                    {/* ─── Cards de estadísticas ────────────────────────── */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Total',       valor: estadisticas.total,       color: 'text-gray-800' },
                            { label: 'Activos',     valor: estadisticas.activos,     color: 'text-green-600' },
                            { label: 'Inactivos',   valor: estadisticas.inactivos,   color: 'text-gray-500' },
                            { label: 'Suspendidos', valor: estadisticas.suspendidos, color: 'text-red-600' },
                        ].map((stat) => (
                            <div key={stat.label} className="bg-white shadow-sm rounded-lg p-4 text-center">
                                <div className={`text-2xl font-bold ${stat.color}`}>{stat.valor}</div>
                                <div className="text-sm text-gray-500">{stat.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* ─── Barra de herramientas: búsqueda + filtros + crear ─ */}
                    <div className="bg-white shadow-sm rounded-lg p-4">
                        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">

                            {/* Buscador */}
                            <input
                                type="text"
                                placeholder="Buscar por nombre o email..."
                                value={buscar}
                                onChange={(e) => setBuscar(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && filtrar({ buscar })}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full md:w-72 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                            />

                            {/* Filtro por estado */}
                            <select
                                value={filtros?.estado || ''}
                                onChange={(e) => filtrar({ estado: e.target.value })}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                            >
                                <option value="">Todos los estados</option>
                                <option value="activo">Activos</option>
                                <option value="inactivo">Inactivos</option>
                                <option value="suspendido">Suspendidos</option>
                            </select>

                            {/* Filtro por rol */}
                            <select
                                value={filtros?.rol || ''}
                                onChange={(e) => filtrar({ rol: e.target.value })}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                            >
                                <option value="">Todos los roles</option>
                                <option value="super_administrador">Super Admin</option>
                                <option value="administrador">Administrador</option>
                                <option value="vendedor">Vendedor</option>
                                <option value="proveedor">Proveedor</option>
                                <option value="soporte">Soporte</option>
                                <option value="cliente">Cliente</option>
                            </select>

                            {/* Espaciador */}
                            <div className="flex-1" />

                            {/* Botón crear nuevo usuario */}
                            <Link
                                href={route('usuarios.create')}
                                className="bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors"
                            >
                                + Nuevo Usuario
                            </Link>
                        </div>
                    </div>

                    {/* ─── Tabla de usuarios ────────────────────────────── */}
                    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    {['Nombre', 'Email', 'Rol', 'Estado', 'Creado', 'Acciones'].map((col) => (
                                        <th key={col} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {col}
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            <tbody className="bg-white divide-y divide-gray-200">
                                {/*
                                 * usuarios.data: el array de usuarios de la página actual.
                                 * Laravel paginate() devuelve: { data: [], links: [], meta: {} }
                                 */}
                                {usuarios.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                            No se encontraron usuarios con esos filtros.
                                        </td>
                                    </tr>
                                ) : (
                                    usuarios.data.map((u) => (
                                        <tr key={u.id} className="hover:bg-gray-50">

                                            {/* Nombre + Avatar inicial */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-blue-900 font-semibold text-sm mr-3">
                                                        {u.nombre?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-900">{u.nombre}</span>
                                                </div>
                                            </td>

                                            {/* Email */}
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {u.email}
                                            </td>

                                            {/* Rol */}
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {u.rol?.replace(/_/g, ' ')}
                                            </td>

                                            {/* Estado con badge de color */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${colorEstado[u.estado] || 'bg-gray-100'}`}>
                                                    {u.estado}
                                                </span>
                                            </td>

                                            {/* Fecha de creación formateada */}
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(u.creado_en).toLocaleDateString('es-CO')}
                                            </td>

                                            {/* Botones de acción */}
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                                                <Link
                                                    href={route('usuarios.edit', u.id)}
                                                    className="text-blue-800 hover:text-indigo-900"
                                                >
                                                    Editar
                                                </Link>
                                                <button
                                                    onClick={() => eliminar(u.id, u.nombre)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Eliminar
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                      </div>

                        {/* ─── Paginación ────────────────────────────────── */}
                        {/*
                         * usuarios.links: array de objetos { url, label, active }
                         * que Laravel genera automáticamente con paginate().
                         * Inertia's Link los convierte en navegación SPA.
                         */}
                        {usuarios.links && usuarios.links.length > 3 && (
                            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                                <div className="text-sm text-gray-500">
                                    Mostrando {usuarios.from}–{usuarios.to} de {usuarios.total} usuarios
                                </div>
                                <div className="flex gap-1">
                                    {usuarios.links.map((link, i) => (
                                        link.url ? (
                                            <Link
                                                key={i}
                                                href={link.url}
                                                preserveScroll
                                                className={`px-3 py-1 text-sm rounded ${
                                                    link.active
                                                        ? 'bg-blue-800 text-white'
                                                        : 'text-gray-600 hover:bg-gray-100'
                                                }`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ) : (
                                            <span
                                                key={i}
                                                className="px-3 py-1 text-sm rounded text-gray-300"
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        )
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
