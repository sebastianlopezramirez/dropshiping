<?php

/*
|--------------------------------------------------------------------------
| AutenticacionSocialController.php
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué hace este controlador?
|
|   Maneja el flujo completo de "Continuar con Google":
|
|   1. redirigir() → el usuario hace clic en "Continuar con Google"
|      → este método envía al usuario a la pantalla de login de Google
|
|   2. callback() → Google redirige de vuelta a nuestra app con un código
|      → tomamos los datos del usuario de Google
|      → si ya existe en BD (mismo email o google_id) → lo logueamos
|      → si es nuevo → lo creamos y logueamos
|
| PENSAR — ¿Por qué no pedimos contraseña?
|
|   Google ya verificó la identidad del usuario.
|   Su token OAuth es la "contraseña". Nosotros no guardamos nada secreto.
|   Guardamos solo el google_id para reconocerlo en futuros logins.
|
| ESCRIBIR — Dependencias:
|   - Laravel Socialite: composer require laravel/socialite (ya instalado)
|   - config/services.php: bloque 'google' con client_id, secret, redirect
|   - .env: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI
|   - Migración: google_id y avatar_url en tabla usuarios (ya ejecutada)
|   - User model: google_id y avatar_url en $fillable (ya actualizado)
|
*/

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class AutenticacionSocialController extends Controller
{
    /*
    |----------------------------------------------------------------------
    | PASO 1 — redirigir()
    |----------------------------------------------------------------------
    |
    | ENTENDER: El usuario hace clic en "Continuar con Google"
    |
    | ¿Qué hace Socialite::driver('google')->redirect()?
    |
    |   1. Lee las credenciales de config/services.php → 'google'
    |   2. Construye la URL de autorización de Google:
    |      https://accounts.google.com/o/oauth2/auth?
    |        client_id=271293249683-...
    |        &redirect_uri=http://localhost/auth/google/callback
    |        &scope=openid profile email
    |        &response_type=code
    |        &state=random_token_csrf
    |   3. Redirige al usuario a esa URL
    |
    | El usuario verá la pantalla de "Elegir cuenta" de Google.
    | Después de elegir, Google llama a nuestro /auth/google/callback.
    |
    | VERIFICAR: Si ves un error "redirect_uri_mismatch" en Google,
    |   significa que el URI en .env no coincide con el registrado
    |   en Google Cloud Console. Deben ser IDÉNTICOS (incluyendo http/https).
    |
    */
    public function redirigir()
    {
        return Socialite::driver('google')->redirect();
    }

    /*
    |----------------------------------------------------------------------
    | PASO 2 — callback()
    |----------------------------------------------------------------------
    |
    | ENTENDER: Google llama a /auth/google/callback con un código
    |
    | ¿Qué datos viene de Google?
    |   $usuarioGoogle->id       → ID único de Google (el "sub" del token)
    |   $usuarioGoogle->email    → email verificado por Google
    |   $usuarioGoogle->name     → nombre completo
    |   $usuarioGoogle->avatar   → URL de la foto de perfil
    |
    | PENSAR — Casos posibles:
    |
    |   CASO A: Usuario nuevo (no existe en BD)
    |     → Crear nuevo usuario con los datos de Google
    |     → No tiene contraseña (usa Google para autenticarse)
    |
    |   CASO B: Usuario existente que se registró con email (mismo email)
    |     → Vincular su cuenta de Google (actualizar google_id)
    |     → Loguearlo sin pedirle contraseña
    |
    |   CASO C: Usuario existente que ya usó Google antes
    |     → Simplemente loguearlo
    |
    |   CASO ERROR: Google rechazó / usuario canceló
    |     → $usuarioGoogle es null o Socialite lanza excepción
    |     → Redirigir al login con mensaje de error
    |
    */
    public function callback()
    {
        // ── Obtener datos de Google ───────────────────────────────────────
        try {
            $usuarioGoogle = Socialite::driver('google')->user();
        } catch (\Exception $e) {
            // El usuario canceló o hubo error en Google
            Log::warning('Google OAuth falló', [
                'error' => $e->getMessage(),
                'ip'    => request()->ip(),
            ]);

            return redirect()->route('login')
                ->with('error', 'No se pudo conectar con Google. Intenta de nuevo.');
        }

        // ── Buscar o crear el usuario ─────────────────────────────────────

        /*
        | PENSAR — ¿Por qué buscamos primero por google_id y luego por email?
        |
        |   Si el usuario ya inició sesión con Google antes,
        |   su google_id está en BD → búsqueda rápida y segura.
        |
        |   Si es la primera vez con Google pero ya tiene cuenta de email,
        |   el email coincide → vinculamos la cuenta (actualizamos google_id).
        |
        |   El email de Google siempre está verificado, así que es confiable
        |   para vincular cuentas. No hay riesgo de suplantación.
        */
        $usuario = User::where('google_id', $usuarioGoogle->id)->first()
                ?? User::where('email', $usuarioGoogle->email)->first();

        if ($usuario) {
            // CASOS B y C: actualizar datos de Google si cambiaron
            $usuario->update([
                'google_id'  => $usuarioGoogle->id,
                'avatar_url' => $usuarioGoogle->avatar,
            ]);
        } else {
            // CASO A: usuario completamente nuevo → crear cuenta
            $usuario = User::create([
                'nombre'     => $usuarioGoogle->name,
                'email'      => $usuarioGoogle->email,
                'google_id'  => $usuarioGoogle->id,
                'avatar_url' => $usuarioGoogle->avatar,
                'estado'     => 'activo',
                'rol'        => 'cliente',
                /*
                | PENSAR — ¿Por qué generamos una contraseña aleatoria?
                |
                |   La columna 'contrasena' es NOT NULL → la BD la exige.
                |   Usuarios OAuth nunca la usan (solo entran con Google).
                |   Str::random(64) = 64 caracteres imposibles de adivinar.
                |   El cast 'hashed' del modelo la hashea automáticamente.
                |   NO usar Hash::make() aquí — se hashearía dos veces.
                */
                'contrasena' => Str::random(64),
            ]);
        }

        // ── Verificar que la cuenta esté activa ───────────────────────────
        if ($usuario->estado !== 'activo') {
            return redirect()->route('login')
                ->with('error', 'Tu cuenta está ' . $usuario->estado . '. Contacta al soporte.');
        }

        // ── Logear al usuario ─────────────────────────────────────────────
        /*
        | Auth::login($usuario) inicia la sesión en Laravel.
        | Es equivalente a lo que hace Auth::attempt() pero sin validar contraseña.
        | Desde este momento $usuario está autenticado en esta sesión.
        |
        | regenerate() crea un nuevo ID de sesión para prevenir
        | Session Fixation attacks (buena práctica de seguridad).
        */
        Auth::login($usuario);
        request()->session()->regenerate();

        // ── Redirigir según el rol ────────────────────────────────────────
        /*
        | PENSAR — ¿Por qué redirigimos al dashboard y no a la tienda?
        |
        |   El GoogleOAuth está pensado para el panel admin (vendedores,
        |   admins). Los clientes de la tienda usan el flujo de checkout
        |   con cédula, no login con Google.
        |
        |   Si en el futuro quieres que clientes también usen Google,
        |   puedes redirigir a tienda.index según $usuario->rol.
        */
        $destino = match(true) {
            $usuario->hasRole(['super_administrador', 'administrador']) => route('dashboard'),
            $usuario->hasRole('proveedor')                             => route('portal.dashboard'),
            default                                                    => route('dashboard'),
        };

        return redirect()->intended($destino);
    }
}
