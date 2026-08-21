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
