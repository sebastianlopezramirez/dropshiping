/*
|--------------------------------------------------------------------------
| LAYOUT: GuestLayout — Página de login / registro
|--------------------------------------------------------------------------
|
| Identidad visual: fondo navy oscuro, card central con acentos naranja.
| Muestra el logo real de GadGet Store con el nombre de la marca.
|
*/

import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 px-4 py-12">

            {/* ── LOGO Y MARCA ──────────────────────────────────────── */}
            <div className="mb-8 flex flex-col items-center">
                <Link href="/" className="group">
                    <img
                        src="/logo.webp"
                        alt="GadGet Store"
                        className="h-16 w-auto group-hover:scale-105 transition-transform duration-200"
                        onError={e => { e.target.style.display = 'none'; }}
                    />
                </Link>
                <p className="mt-3 text-xs font-semibold tracking-widest text-orange-400 uppercase">
                    GadGet Store
                </p>
                <p className="text-xs text-gray-600 mt-0.5">Dropshipping Colombia</p>
            </div>

            {/* ── CARD ─────────────────────────────────────────────── */}
            <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl px-8 py-8">
                {children}
            </div>

            {/* ── FOOTER ───────────────────────────────────────────── */}
            <p className="mt-8 text-xs text-gray-700">
                © {new Date().getFullYear()} GadGet Store · Todos los derechos reservados
            </p>
        </div>
    );
}
