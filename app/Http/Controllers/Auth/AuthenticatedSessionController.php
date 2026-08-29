<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     *
     * REDIRECCIÓN POR ROL:
     *   Después del login, el sistema detecta el rol del usuario y lo dirige
     *   al área correcta. Así el mismo formulario /login sirve para todos.
     *
     *   proveedor          → /portal/dashboard (su portal privado)
     *   admin / cualquier  → /dashboard (panel de administración)
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        // Si el usuario tiene rol 'proveedor', siempre va directo a su portal.
        // NO usar ->intended() aquí: si el middleware auth guardó '/dashboard' como
        // URL intended (proveedor que intentó acceder al admin), ->intended() lo
        // llevaría al dashboard en lugar del portal.
        if ($request->user()->hasRole('proveedor')) {
            return redirect()->route('portal.dashboard');
        }

        // Cualquier otro rol va al dashboard administrativo
        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }
}
