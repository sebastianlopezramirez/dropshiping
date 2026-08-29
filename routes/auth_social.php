<?php

/*
|--------------------------------------------------------------------------
| auth_social.php — Rutas de Autenticación Social (Google OAuth)
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué son estas 2 rutas?
|
|   RUTA 1: GET /auth/google
|     → El usuario hace clic en "Continuar con Google"
|     → Esta ruta llama a redirigir() que envía al usuario a Google
|     → No hay formulario, no hay datos que procesar
|
|   RUTA 2: GET /auth/google/callback
|     → Google llama a esta URL después de que el usuario elige su cuenta
|     → Viene con un parámetro 'code' en la URL (código de autorización)
|     → Esta ruta llama a callback() que intercambia el code por datos del usuario
|
| PENSAR — ¿Por qué van aquí separadas y no en auth.php?
|
|   auth.php es generado por Breeze y puede ser sobreescrito en el futuro.
|   Mantener las rutas sociales en un archivo separado las protege de
|   ser borradas accidentalmente. Además, hace el código más organizado:
|   auth.php = auth tradicional, auth_social.php = OAuth social.
|
| PENSAR — ¿Por qué van fuera del middleware 'guest'?
|
|   El middleware 'guest' bloquea el acceso si ya estás logueado.
|   El flujo OAuth puede iniciarse incluso si hay sesión activa
|   (para re-autenticar o vincular cuenta). Las dejamos sin middleware.
|
|   Tampoco necesitan 'auth' porque precisamente sirven para CREAR la sesión.
|
| VERIFICAR — Lista de chequeo antes de probar:
|   ✅ .env tiene GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI
|   ✅ config/services.php tiene el bloque 'google'
|   ✅ Google Cloud Console tiene http://localhost/auth/google/callback en URIs autorizados
|   ✅ Migración add_google_auth_to_usuarios_table ejecutada (php artisan migrate)
|   ✅ User.php tiene google_id y avatar_url en $fillable
|   ✅ AutenticacionSocialController.php existe en app/Http/Controllers/Auth/
|
*/

use App\Http\Controllers\Auth\AutenticacionSocialController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| RUTA 1 — Iniciar flujo OAuth
|--------------------------------------------------------------------------
|
| GET /auth/google
|
| Cuando el usuario hace clic en "Continuar con Google",
| esta ruta llama a redirigir() y envía al usuario a Google.
|
| No genera una página propia — es una redirección inmediata.
|
*/
Route::get('auth/google', [AutenticacionSocialController::class, 'redirigir'])
     ->name('auth.google');

/*
|--------------------------------------------------------------------------
| RUTA 2 — Callback de Google
|--------------------------------------------------------------------------
|
| GET /auth/google/callback
|
| Google llama a esta URL con ?code=XXXX&state=YYYY después de que
| el usuario elige su cuenta de Google.
|
| Socialite automáticamente valida el 'state' (protección CSRF)
| e intercambia el 'code' por los datos del usuario.
|
| URI que debes registrar en Google Cloud Console:
|   Local:      http://localhost/auth/google/callback
|   Producción: https://tudominio.com/auth/google/callback
|
*/
Route::get('auth/google/callback', [AutenticacionSocialController::class, 'callback'])
     ->name('auth.google.callback');
