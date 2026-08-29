/*
|--------------------------------------------------------------------------
| PÁGINA: Login — GadGet Store
|--------------------------------------------------------------------------
|
| Formulario de inicio de sesión con identidad de marca:
| inputs con fondo oscuro, botón naranja, texto legible sobre card oscura.
|
*/

import InputError from '@/Components/InputError';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email:    '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Iniciar sesión · GadGet Store" />

            {/* Título del formulario */}
            <h2 className="text-xl font-bold text-white mb-1">Bienvenido de nuevo</h2>
            <p className="text-sm text-gray-500 mb-6">Ingresa tus credenciales para continuar</p>

            {status && (
                <div className="mb-4 rounded-lg bg-green-900/40 border border-green-700 px-4 py-3 text-sm text-green-400">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-5">

                {/* Email */}
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
                        Correo electrónico
                    </label>
                    <input
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        autoComplete="username"
                        autoFocus
                        onChange={e => setData('email', e.target.value)}
                        className="w-full rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500
                            px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent
                            transition-colors"
                        placeholder="correo@ejemplo.com"
                    />
                    <InputError message={errors.email} className="mt-1.5" />
                </div>

                {/* Contraseña */}
                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                            Contraseña
                        </label>
                        {canResetPassword && (
                            <Link
                                href={route('password.request')}
                                className="text-xs text-orange-400 hover:text-orange-300 transition-colors"
                            >
                                ¿Olvidaste tu contraseña?
                            </Link>
                        )}
                    </div>
                    <input
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        autoComplete="current-password"
                        onChange={e => setData('password', e.target.value)}
                        className="w-full rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500
                            px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent
                            transition-colors"
                        placeholder="••••••••"
                    />
                    <InputError message={errors.password} className="mt-1.5" />
                </div>

                {/* Recordarme */}
                <div className="flex items-center gap-2">
                    <input
                        id="remember"
                        type="checkbox"
                        name="remember"
                        checked={data.remember}
                        onChange={e => setData('remember', e.target.checked)}
                        className="rounded border-gray-600 bg-gray-800 text-orange-500
                            focus:ring-orange-500 focus:ring-offset-gray-900"
                    />
                    <label htmlFor="remember" className="text-sm text-gray-400 cursor-pointer">
                        Recordarme en este dispositivo
                    </label>
                </div>

                {/* Botón */}
                <button
                    type="submit"
                    disabled={processing}
                    className="w-full rounded-lg bg-orange-500 hover:bg-orange-600 active:bg-orange-700
                        text-white font-semibold py-2.5 text-sm tracking-wide
                        focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-900
                        transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {processing ? 'Ingresando...' : 'Ingresar'}
                </button>
            </form>

            {/* ── Separador + Botón Google ────────────────────────────────────── */}
            <div className="mt-6 space-y-4">

                {/* Divisor "O continúa con" */}
                <div className="relative flex items-center gap-3">
                    <div className="flex-1 border-t border-gray-800" />
                    <span className="text-xs text-gray-500 font-medium whitespace-nowrap">O continúa con</span>
                    <div className="flex-1 border-t border-gray-800" />
                </div>

                {/* Botón "Continuar con Google" */}
                {/*
                    ENTENDER — ¿Por qué usamos <a href> y no <Link>?

                    <Link> de Inertia hace una navegación SPA sin recargar la página.
                    Pero /auth/google devuelve una redirección HTTP 302 hacia Google.
                    Inertia no puede seguir redirecciones externas — la pantalla de
                    Google se abre en una URL completamente diferente al dominio.

                    <a href> sí sigue el 302 normalmente → el browser va a Google.
                    target="_self" asegura que NO abra una nueva pestaña.
                */}
                <a
                    href="/auth/google"
                    className={`
                        w-full flex items-center justify-center gap-3
                        rounded-lg border border-gray-700 bg-gray-800
                        hover:bg-gray-750 hover:border-gray-600
                        text-white font-medium py-2.5 text-sm
                        transition-colors active:scale-[0.99]
                    `}
                >
                    {/* Logo de Google en SVG — sin dependencias externas */}
                    <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continuar con Google
                </a>
            </div>

            {/* Link a la tienda */}
            <div className="mt-6 pt-5 border-t border-gray-800 text-center">
                <Link
                    href={route('tienda.index')}
                    className="text-xs text-gray-500 hover:text-orange-400 transition-colors"
                >
                    ← Volver a la tienda
                </Link>
            </div>
        </GuestLayout>
    );
}
