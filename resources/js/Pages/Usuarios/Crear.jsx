/**
 * PÁGINA: Crear Usuario
 * RUTA:   GET /usuarios/create
 * ARCHIVO: resources/js/Pages/Usuarios/Crear.jsx
 *
 * ¿QUÉ APRENDE AQUÍ?
 *   - useForm(): hook de Inertia para manejar formularios con validación
 *   - Inertia maneja el CSRF automáticamente (no necesitas el token en JSX)
 *   - Cómo mostrar errores de validación de Laravel en campos React
 *   - Cómo deshabilitar el botón mientras el form está procesando
 */

// useForm: hook de Inertia para forms — maneja datos, errores, estado de envío
import { useForm, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Crear({ roles }) {
    /*
     * useForm({ campo: valorInicial })
     *
     * Retorna:
     *   data      → objeto con los valores actuales del formulario
     *   setData   → función para actualizar un campo
     *   post()    → envía el form con método POST
     *   processing → true mientras el form está enviándose al server
     *   errors    → objeto con errores de validación de Laravel
     *               { nombre: "El nombre es requerido", email: "El email ya existe" }
     *   reset()   → limpia todos los campos
     */
    const { data, setData, post, processing, errors, reset } = useForm({
        nombre:                 '',
        email:                  '',
        contrasena:             '',
        contrasena_confirmation: '', // Laravel usa este campo para validar 'confirmed'
        telefono:               '',
        rol:                    'cliente',
        estado:                 'activo',
        limite_credito:         0,
        plazos_credito:         0,
    });

    /**
     * Manejar el envío del formulario.
     *
     * post(ruta, opciones):
     *   Hace un POST a la ruta indicada con los datos del formulario.
     *   Laravel recibe los datos en $request dentro del controller.
     *   Si la validación falla → errors se llena automáticamente.
     *   Si todo ok → redirige según lo que diga el controller.
     */
    const enviar = (e) => {
        // Prevenir que el form haga submit HTML nativo
        e.preventDefault();

        post(route('usuarios.store'), {
            // onSuccess: se ejecuta si Laravel responde con redirect
            onSuccess: () => reset(),
            // onError: los errores ya los maneja useForm automáticamente
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Nuevo Usuario
                </h2>
            }
        >
            <Head title="Crear Usuario" />

            <div className="py-12">
                <div className="mx-auto max-w-2xl sm:px-6 lg:px-8">
                    <div className="bg-white shadow-sm rounded-lg p-6">

                        <form onSubmit={enviar} className="space-y-5">

                            {/* ─── Nombre ──────────────────────────── */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre completo *
                                </label>
                                <input
                                    type="text"
                                    value={data.nombre}
                                    onChange={(e) => setData('nombre', e.target.value)}
                                    // setData('campo', valor) actualiza data.nombre
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                    placeholder="Ej: Juan Carlos Pérez"
                                />
                                {/* Mostrar error si Laravel devuelve validación fallida */}
                                {errors.nombre && (
                                    <p className="text-red-600 text-xs mt-1">{errors.nombre}</p>
                                )}
                            </div>

                            {/* ─── Email ───────────────────────────── */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                    placeholder="usuario@ejemplo.com"
                                />
                                {errors.email && (
                                    <p className="text-red-600 text-xs mt-1">{errors.email}</p>
                                )}
                            </div>

                            {/* ─── Contraseña ──────────────────────── */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Contraseña *
                                    </label>
                                    <input
                                        type="password"
                                        value={data.contrasena}
                                        onChange={(e) => setData('contrasena', e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                        placeholder="Mínimo 8 caracteres"
                                    />
                                    {errors.contrasena && (
                                        <p className="text-red-600 text-xs mt-1">{errors.contrasena}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Confirmar contraseña *
                                    </label>
                                    <input
                                        type="password"
                                        value={data.contrasena_confirmation}
                                        onChange={(e) => setData('contrasena_confirmation', e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                        placeholder="Repetir contraseña"
                                    />
                                </div>
                            </div>

                            {/* ─── Teléfono ────────────────────────── */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Teléfono
                                </label>
                                <input
                                    type="text"
                                    value={data.telefono}
                                    onChange={(e) => setData('telefono', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                    placeholder="+57 300 000 0000"
                                />
                            </div>

                            {/* ─── Rol y Estado ────────────────────── */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Rol *
                                    </label>
                                    <select
                                        value={data.rol}
                                        onChange={(e) => setData('rol', e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                    >
                                        {/*
                                         * roles viene como prop del controller:
                                         * Role::pluck('name') → ['administrador', 'vendedor', ...]
                                         */}
                                        {roles.map((r) => (
                                            <option key={r} value={r}>
                                                {r.replace(/_/g, ' ')}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.rol && (
                                        <p className="text-red-600 text-xs mt-1">{errors.rol}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Estado *
                                    </label>
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

                            {/* ─── Crédito (solo para mayoristas) ─── */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Límite de crédito (COP)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={data.limite_credito}
                                        onChange={(e) => setData('limite_credito', e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Plazo de crédito (días)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={data.plazos_credito}
                                        onChange={(e) => setData('plazos_credito', e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                    />
                                </div>
                            </div>

                            {/* ─── Botones ──────────────────────────── */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                >
                                    {/* processing: true mientras Inertia envía al server */}
                                    {processing ? 'Guardando...' : 'Crear Usuario'}
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
