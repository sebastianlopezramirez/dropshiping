/*
|--------------------------------------------------------------------------
| PÁGINA: Tienda/Cuenta/Login
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué hace esta página?
|
|   Muestra el formulario de identificación del cliente.
|   El cliente ingresa:
|     1. Su número de cédula
|     2. Los últimos 4 dígitos de su celular (PIN)
|
|   NO hay contraseña tradicional.
|   La cédula es el "usuario" y los 4 dígitos son el "pin".
|
| PENSAR — ¿Qué pasa si el cliente no está registrado?
|
|   Solo los clientes que ya hicieron UNA compra tienen cuenta.
|   Cuando completan un pedido en /tienda/carrito, el sistema
|   crea automáticamente su registro si la cédula no existe.
|
|   Si intenta identificarse sin haber comprado → error "Cédula o PIN incorrecto".
|   El mensaje no distingue entre "cédula no existe" o "PIN malo" — por seguridad.
|
*/

import { Head, useForm, Link } from '@inertiajs/react';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        cedula:      '',
        celular_pin: '',
    });

    function handleSubmit(e) {
        e.preventDefault();
        post(route('tienda.cuenta.autenticar'));
    }

    return (
        <>
            <Head title="Mi cuenta — Tienda" />

            {/* ── LAYOUT CENTRADO ─────────────────────────────────────────── */}
            <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-16">

                <div className="w-full max-w-md">

                    {/* ── ENCABEZADO ─────────────────────────────────────── */}
                    <div className="text-center mb-8">
                        <Link href={route('tienda.index')} className="text-gray-400 hover:text-orange-400 text-sm mb-6 inline-block transition-colors">
                            ← Volver a la tienda
                        </Link>
                        <h1 className="text-2xl font-bold text-white">Identifícate</h1>
                        <p className="text-gray-400 mt-2 text-sm">
                            Usá tu número de cédula y los últimos 4 dígitos de tu celular
                        </p>
                    </div>

                    {/* ── TARJETA DEL FORMULARIO ─────────────────────────── */}
                    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8">

                        <form onSubmit={handleSubmit} className="space-y-5">

                            {/* Cédula */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Número de cédula
                                </label>
                                <input
                                    type="text"
                                    value={data.cedula}
                                    onChange={e => setData('cedula', e.target.value)}
                                    placeholder="1234567890"
                                    autoComplete="off"
                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                                />
                                {errors.cedula && (
                                    <p className="mt-2 text-sm text-red-400">{errors.cedula}</p>
                                )}
                            </div>

                            {/* PIN — últimos 4 dígitos del celular */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Últimos 4 dígitos de tu celular
                                </label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={4}
                                    value={data.celular_pin}
                                    onChange={e => setData('celular_pin', e.target.value.replace(/\D/g, '').slice(0, 4))}
                                    placeholder="••••"
                                    autoComplete="off"
                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors text-center text-xl tracking-widest"
                                />
                                {errors.celular_pin && (
                                    <p className="mt-2 text-sm text-red-400">{errors.celular_pin}</p>
                                )}
                                <p className="mt-1 text-xs text-gray-500">
                                    Ej: si tu celular es 310 123 <strong className="text-gray-400">4567</strong>, ingresá 4567
                                </p>
                            </div>

                            {/* Botón */}
                            <button
                                type="submit"
                                disabled={processing || data.cedula.length < 5 || data.celular_pin.length !== 4}
                                className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-colors"
                            >
                                {processing ? 'Verificando...' : 'Ingresar a mi cuenta'}
                            </button>

                        </form>

                        {/* ── SEPARADOR ─────────────────────────────────── */}
                        <div className="mt-6 relative flex items-center gap-3">
                            <div className="flex-1 border-t border-gray-800" />
                            <span className="text-xs text-gray-500 font-medium whitespace-nowrap">O ingresá con</span>
                            <div className="flex-1 border-t border-gray-800" />
                        </div>

                        {/* ── BOTÓN GOOGLE ───────────────────────────────── */}
                        {/*
                          * PENSAR — ¿Por qué <a href> y no <Link>?
                          *
                          * Google OAuth hace una redirección a un dominio externo
                          * (accounts.google.com). Inertia's <Link> maneja navegación
                          * interna (SPA). Para seguir una redirección 302 a un dominio
                          * externo, necesitamos un <a> HTML normal.
                          */}
                        <a
                            href="/tienda/auth/google"
                            className="mt-4 w-full flex items-center justify-center gap-3 rounded-xl border border-gray-700 bg-gray-800 hover:bg-gray-700 hover:border-gray-600 text-white font-medium py-3 text-sm transition-colors active:scale-[0.99]"
                        >
                            {/* Logo oficial de Google */}
                            <svg width="18" height="18" viewBox="0 0 18 18">
                                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                                <path fill="#FBBC05" d="M3.964 10.706c-.18-.54-.282-1.117-.282-1.706s.102-1.166.282-1.706V4.962H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.038l3.007-2.332z"/>
                                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z"/>
                            </svg>
                            Continuar con Google
                        </a>

                        {/* ── AYUDA ──────────────────────────────────────── */}
                        <div className="mt-6 pt-6 border-t border-gray-800 text-center text-sm text-gray-500">
                            <p>¿Primera vez comprando?</p>
                            <p className="mt-1">
                                Tu cuenta se crea automáticamente cuando{' '}
                                <Link href={route('tienda.index')} className="text-orange-400 hover:text-orange-300 transition-colors">
                                    completás tu primer pedido
                                </Link>
                                .
                            </p>
                        </div>

                        {/* ── ACCESO ADMIN / PROVEEDOR ───────────────────── */}
                        <div className="mt-4 pt-4 border-t border-gray-800/50 text-center">
                            <Link
                                href={route('login')}
                                className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
                            >
                                ¿Eres administrador o proveedor? → Acceder al panel
                            </Link>
                        </div>

                    </div>

                    {/* ── SEGURIDAD ──────────────────────────────────────── */}
                    <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-600">
                        <span>🔒</span>
                        <span>Conexión segura — tus datos están protegidos</span>
                    </div>

                </div>
            </div>
        </>
    );
}
