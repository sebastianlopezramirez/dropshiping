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
