/**
 * PÁGINA: Editar Usuario
 * RUTA:   GET /usuarios/{id}/edit
 * ARCHIVO: resources/js/Pages/Usuarios/Editar.jsx
 *
 * Muy similar a Crear.jsx con dos diferencias clave:
 * 1. Los campos vienen pre-llenados con los datos del usuario existente
 * 2. Usamos put() en lugar de post() (ruta PUT /usuarios/{id})
 * 3. La contraseña es opcional (si viene vacía, no se actualiza)
 */

import { useForm, Link, Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { capitalize } from '@/utils/texto';

export default function Editar({ usuario, roles }) {
    /*
     * Inicializamos useForm con los datos actuales del usuario.
     * Si el usuario es proveedor, también cargamos los campos del perfil de proveedor.
     * Inertia los recibe del controller:
     * Inertia::render('Usuarios/Editar', ['usuario' => $usuario, 'roles' => $roles])
     */
    const proveedor = usuario.proveedor;

    const { data, setData, put, processing, errors } = useForm({
        nombre:                  usuario.nombre || '',
        email:                   usuario.email || '',
        contrasena:              '',             // vacío = no cambiar contraseña
        contrasena_confirmation: '',
        telefono:                usuario.telefono || '',
        rol:                     usuario.rol || 'cliente',
        estado:                  usuario.estado || 'activo',
        limite_credito:          usuario.limite_credito || 0,
        plazos_credito:          usuario.plazos_credito || 0,
        // Campos del perfil proveedor (solo se envían si rol === 'proveedor')
        proveedor_nombre_empresa:   proveedor?.nombre_empresa   || '',
        proveedor_nit:              proveedor?.numero_identificacion || '',
        proveedor_persona_contacto: proveedor?.persona_contacto || '',
        proveedor_sitio_web:        proveedor?.sitio_web        || '',
    });

    const enviar = (e) => {
        e.preventDefault();

        // put() → método HTTP PUT → Laravel llama al método update() del controller
        put(route('usuarios.update', usuario.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Editar Usuario: {usuario.nombre}
                </h2>
            }
        >
            <Head title={`Editar: ${usuario.nombre}`} />

            <div className="py-12">
                <div className="mx-auto max-w-2xl sm:px-6 lg:px-8">
                    <div className="bg-white shadow-sm rounded-lg p-6">

                        <form onSubmit={enviar} className="space-y-5">

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
                                <input
                                    type="text"
                                    value={data.nombre}
                                    onChange={e => {
                                        const v = e.target.value;
                                        setData('nombre', capitalize(v));
                                    }}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                />
                                {errors.nombre && <p className="text-red-600 text-xs mt-1">{errors.nombre}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                />
                                {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
                            </div>

                            {/* ─── Contraseña opcional ───────────── */}
                            <div className="border border-dashed border-gray-200 rounded-lg p-4 bg-gray-50">
                                <p className="text-xs text-gray-500 mb-3">
                                    🔒 Deja en blanco para no cambiar la contraseña
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
                                        <input
                                            type="password"
                                            value={data.contrasena}
                                            onChange={(e) => setData('contrasena', e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                            placeholder="Mínimo 8 caracteres"
                                        />
                                        {errors.contrasena && <p className="text-red-600 text-xs mt-1">{errors.contrasena}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
                                        <input
                                            type="password"
                                            value={data.contrasena_confirmation}
                                            onChange={(e) => setData('contrasena_confirmation', e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                                <input
                                    type="text"
                                    value={data.telefono}
                                    onChange={(e) => setData('telefono', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
                                    <select
                                        value={data.rol}
                                        onChange={(e) => setData('rol', e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                    >
                                        {roles.map((r) => (
                                            <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado *</label>
                                    <select
                                        value={data.estado}
                                        onChange={(e) => setData('estado', e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                    >
                                        <option value="activo">Activo</option>
                                        <option value="inactivo">Inactivo</option>
                                        <option value="suspendido">Suspendido</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Límite crédito (COP)</label>
                                    <input type="number" min="0" value={data.limite_credito}
                                        onChange={(e) => setData('limite_credito', e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Plazo crédito (días)</label>
                                    <input type="number" min="0" value={data.plazos_credito}
                                        onChange={(e) => setData('plazos_credito', e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                    />
                                </div>
                            </div>

                            {/* ─── Perfil de proveedor (solo visible si el rol es proveedor) ─── */}
                            {data.rol === 'proveedor' && (
                                <div className="border border-indigo-200 rounded-lg p-4 bg-gray-50 space-y-4">
                                    <p className="text-xs font-semibold text-blue-900 uppercase tracking-wide">
                                        Perfil de Proveedor
                                    </p>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de empresa</label>
                                        <input type="text" value={data.proveedor_nombre_empresa}
                                            onChange={e => setData('proveedor_nombre_empresa', e.target.value)}
                                            placeholder="Distribuciones XYZ S.A.S"
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                        />
                                        {errors.proveedor_nombre_empresa && (
                                            <p className="text-red-600 text-xs mt-1">{errors.proveedor_nombre_empresa}</p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">NIT / Cédula</label>
                                            <input type="text" value={data.proveedor_nit}
                                                onChange={e => setData('proveedor_nit', e.target.value)}
                                                placeholder="900123456-7"
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                            />
                                            {errors.proveedor_nit && (
                                                <p className="text-red-600 text-xs mt-1">{errors.proveedor_nit}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Persona de contacto</label>
                                            <input type="text" value={data.proveedor_persona_contacto}
                                                onChange={e => setData('proveedor_persona_contacto', e.target.value)}
                                                placeholder="Juan Pérez"
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                            />
                                            {errors.proveedor_persona_contacto && (
                                                <p className="text-red-600 text-xs mt-1">{errors.proveedor_persona_contacto}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Sitio web</label>
                                        <input type="url" value={data.proveedor_sitio_web}
                                            onChange={e => setData('proveedor_sitio_web', e.target.value)}
                                            placeholder="https://www.empresa.com"
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                        />
                                        {errors.proveedor_sitio_web && (
                                            <p className="text-red-600 text-xs mt-1">{errors.proveedor_sitio_web}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-blue-800 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-900 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                >
                                    {processing ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                                <Link
                                    href={route('usuarios.index')}
                                    className="bg-gray-100 text-gray-700 px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                                >
                                    Cancelar
                                </Link>
                            </div>

                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
