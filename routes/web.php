<?php

/*
|--------------------------------------------------------------------------
| RUTAS WEB — routes/web.php
|--------------------------------------------------------------------------
|
| ¿QUÉ ES UNA RUTA EN LARAVEL?
|   Una ruta mapea una URL + método HTTP → a una acción (closure o controller).
|   Ejemplo: GET /usuarios → UsuarioController@index → página React Usuarios/Index
|
| ¿QUÉ ES INERTIA::RENDER()?
|   En lugar de devolver una vista Blade (HTML plano), Inertia.js
|   le pasa los datos al componente React correcto.
|   Inertia::render('Dashboard') → resources/js/Pages/Dashboard.jsx
|
| ¿QUÉ ES MIDDLEWARE EN RUTAS?
|   Es un filtro que se aplica ANTES de entrar al controller:
|   'auth'       → el usuario debe estar autenticado (logged in)
|   'verified'   → el usuario debe tener el email verificado
|   'role:admin' → el usuario debe tener el rol 'admin' de Spatie
|
| ESTRUCTURA DE GRUPOS DE RUTAS:
|   Las rutas se agrupan por nivel de acceso.
|   Esto evita repetir ->middleware() en cada ruta individualmente.
|
*/

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Web\TiendaController;
use App\Http\Controllers\Web\CampanaController;
use App\Http\Controllers\Web\CategoriaController;
use App\Http\Controllers\Web\CuponController;
use App\Http\Controllers\Web\GastoController;
use App\Http\Controllers\Web\PedidoController;
use App\Http\Controllers\Web\ProductoController;
use App\Http\Controllers\Web\AnalyticsController;
use App\Http\Controllers\Web\ReporteFinancieroController;
use App\Http\Controllers\Web\TransaccionController;
use App\Http\Controllers\Web\PagoProveedorController;
use App\Http\Controllers\Web\UsuarioController;
use App\Http\Controllers\Portal\PortalController;
use App\Http\Controllers\Tienda\CarritoController;
use App\Http\Controllers\Tienda\ClienteController;
use App\Http\Controllers\Web\TarifaController;
use App\Http\Controllers\Web\AsistenteMarketingController;
use App\Http\Controllers\Web\MarketingExportController;
use App\Http\Controllers\Web\LeadController;
use App\Http\Controllers\Web\CostosController;
use App\Http\Controllers\Web\ConfiguracionController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| RUTA PÚBLICA: Página de bienvenida
|--------------------------------------------------------------------------
| No requiere autenticación.
| Muestra la pantalla de inicio con botones Log in / Register.
*/
/*
|--------------------------------------------------------------------------
| RUTAS PÚBLICAS: Tienda — No requieren autenticación
|--------------------------------------------------------------------------
|
| PENSAR — ¿Por qué van ANTES del grupo auth?
|
|   Estas rutas no tienen middleware. Cualquier visitante puede acceder.
|   Las registramos primero para que Laravel las evalúe antes de entrar
|   a los grupos con middleware, aunque en la práctica el orden no afecta
|   el match — sí es buena práctica para legibilidad.
|
| PENSAR — ¿Por qué /tienda/categoria/{slug} va ANTES de /tienda/{slug}?
|
|   Si registráramos /tienda/{slug} primero, Laravel interpretaría
|   'categoria' como un slug de producto → error 404.
|   La ruta más específica siempre va primero.
|
*/
Route::prefix('tienda')->name('tienda.')->group(function () {

    // GET /tienda — Catálogo completo con filtros
    Route::get('/', [TiendaController::class, 'index'])
         ->name('index');

    // GET /tienda/categoria/{slug} — Productos de una categoría
    // Va ANTES de /tienda/{slug} para evitar que 'categoria' se resuelva como slug
    Route::get('categoria/{slug}', [TiendaController::class, 'categoria'])
         ->name('categoria');

    // ── CARRITO Y PEDIDOS PÚBLICOS ────────────────────────────────────────
    // Van ANTES de {slug} para que 'carrito' y 'pedido' no se traten como slug

    // GET  /tienda/carrito          → página del carrito
    Route::get('carrito', [CarritoController::class, 'index'])
         ->name('carrito');

    // POST /tienda/pedido           → guardar pedido en BD
    Route::post('pedido', [CarritoController::class, 'store'])
         ->name('pedido.store');

    // GET  /tienda/pedido/{numero}/gracias → página de confirmación
    Route::get('pedido/{numero}/gracias', [CarritoController::class, 'gracias'])
         ->name('pedido.gracias');

    // POST /tienda/lead   → guardar datos del cliente interesado en un producto
    Route::post('lead', [LeadController::class, 'guardar'])
         ->name('lead');

    // POST /tienda/cupones/validar → AJAX público — valida cupón desde el carrito
    // Va aquí (rutas públicas) porque los clientes NO están logueados.
    // La ruta homónima dentro del grupo auth es solo para el admin.
    Route::post('cupones/validar', [CuponController::class, 'validar'])
         ->name('cupones.validar');

    // ── CUENTA DEL CLIENTE ────────────────────────────────────────────────
    // Rutas públicas de cuenta — identificación por cédula + PIN (no password)
    // Van ANTES de {slug} para que 'cuenta' no se resuelva como slug de producto

    // GET  /tienda/cuenta         → formulario de identificación (o dashboard si ya logueado)
    Route::get('cuenta', [ClienteController::class, 'login'])
         ->name('cuenta.login');

    // POST /tienda/cuenta/login   → verificar cédula + últimos 4 del celular
    Route::post('cuenta/login', [ClienteController::class, 'autenticar'])
         ->name('cuenta.autenticar');

    // GET  /tienda/cuenta/mis-pedidos → dashboard del cliente identificado
    Route::get('cuenta/mis-pedidos', [ClienteController::class, 'cuenta'])
         ->name('cuenta');

    // POST /tienda/cuenta/logout  → cerrar sesión del cliente
    Route::post('cuenta/logout', [ClienteController::class, 'logout'])
         ->name('cuenta.logout');

    // GET  /tienda/cuenta/datos   → AJAX — retorna datos del cliente para pre-llenar carrito
    Route::get('cuenta/datos', [ClienteController::class, 'datosActuales'])
         ->name('cuenta.datos');

    // GET /tienda/{slug} — Detalle de un producto (va AL FINAL)
    Route::get('{slug}', [TiendaController::class, 'show'])
         ->name('show');
});

/*
|--------------------------------------------------------------------------
| RUTA PÚBLICA: Página de bienvenida
|--------------------------------------------------------------------------
| No requiere autenticación.
| Muestra la pantalla de inicio con botones Log in / Register.
*/
// Redirige la raíz directamente a la tienda pública
Route::get('/', function () {
    return redirect()->route('tienda.index');
});

/*
|--------------------------------------------------------------------------
| RUTAS AUTENTICADAS: Requieren login + email verificado
|--------------------------------------------------------------------------
| middleware(['auth', 'verified']):
|   auth     → si no está logueado, redirige a /login
|   verified → si no verificó el email, redirige a /verify-email
*/
Route::middleware(['auth', 'verified'])->group(function () {

    /*
    |----------------------------------------------------------------------
    | DASHBOARD — Página principal después de login
    |----------------------------------------------------------------------
    | El controller detecta el rol del usuario y muestra el dashboard
    | adecuado (admin ve estadísticas, vendedor ve sus pedidos, etc.)
    */
    Route::get('/dashboard', function () {
        return Inertia::render('Dashboard');
    })->name('dashboard');

    /*
    |----------------------------------------------------------------------
    | PERFIL DE USUARIO — Generado por Breeze
    |----------------------------------------------------------------------
    | Breeze genera estos controllers automáticamente.
    | Permiten al usuario editar su nombre, email y contraseña.
    */
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    /*
    |----------------------------------------------------------------------
    | MÓDULO: USUARIOS — Solo para admin y super_admin
    |----------------------------------------------------------------------
    |
    | middleware('role:super_administrador|administrador'):
    |   El pipe | significa OR — debe tener uno de los dos roles.
    |   Si el usuario tiene rol 'vendedor' e intenta entrar a /usuarios,
    |   Spatie devuelve un 403 Forbidden.
    |
    | Route::resource() genera automáticamente 7 rutas:
    |   GET    /usuarios           → index   (listar todos)
    |   GET    /usuarios/create    → create  (formulario crear)
    |   POST   /usuarios           → store   (guardar nuevo)
    |   GET    /usuarios/{id}      → show    (ver uno)
    |   GET    /usuarios/{id}/edit → edit    (formulario editar)
    |   PUT    /usuarios/{id}      → update  (guardar cambios)
    |   DELETE /usuarios/{id}      → destroy (eliminar/soft delete)
    |
    */
    // Importar CSV — accesible para admin, super admin y proveedor
    Route::post('productos/importar', [ProductoController::class, 'importar'])
         ->name('productos.importar')
         ->middleware('role:super_administrador|administrador|proveedor');

    Route::delete('productos/borrar-todos', [ProductoController::class, 'borrarTodos'])
         ->name('productos.borrarTodos')
         ->middleware('role:super_administrador');

    Route::post('productos/importar/preview', [ProductoController::class, 'previewImportar'])
         ->name('productos.importar.preview')
         ->middleware('role:super_administrador|administrador|proveedor');

    Route::middleware('role:super_administrador|administrador')->group(function () {

        // Resource completo de usuarios
        Route::resource('usuarios', UsuarioController::class);

        // Ruta adicional: cambiar estado activo/inactivo/suspendido
        Route::patch('usuarios/{usuario}/estado', [UsuarioController::class, 'cambiarEstado'])
             ->name('usuarios.estado');

        // Ruta adicional: asignar/cambiar rol de un usuario
        Route::patch('usuarios/{usuario}/rol', [UsuarioController::class, 'cambiarRol'])
             ->name('usuarios.rol');

        /*
        |----------------------------------------------------------------------
        | MÓDULO: PRODUCTOS — Admin y vendedor pueden gestionar catálogo
        |----------------------------------------------------------------------
        |
        | Route::resource() genera las 7 rutas estándar:
        |   GET    /productos              → index   (catálogo completo)
        |   GET    /productos/crear        → create  (formulario nuevo producto)
        |   POST   /productos              → store   (guardar producto)
        |   GET    /productos/{producto}   → show    (detalle del producto)
        |   GET    /productos/{producto}/editar → edit (formulario edición)
        |   PUT    /productos/{producto}   → update  (guardar cambios)
        |   DELETE /productos/{producto}   → destroy (soft delete)
        |
        | El parámetro 'parameters' cambia el nombre en la URL:
        |   Por defecto: /productos/{producto}
        |   Con esto:    /productos/{producto} (igual, pero explícito en español)
        |
        */
        // !! DEBE ir ANTES del resource para no ser capturada por {producto} !!
        Route::get('productos/verificar-nombre', [ProductoController::class, 'verificarNombre'])
             ->name('productos.verificar-nombre');

        Route::post('productos/{producto}/autorizar', [ProductoController::class, 'autorizar'])
             ->name('productos.autorizar')
             ->middleware('role:super_administrador');

        Route::resource('productos', ProductoController::class)
             ->parameters(['productos' => 'producto']);

        // Eliminar una imagen específica de un producto (Spatie Media Library)
        // DELETE /productos/{producto}/imagenes/{mediaId}
        Route::delete('productos/{producto}/imagenes/{mediaId}', [ProductoController::class, 'eliminarImagen'])
             ->name('productos.imagenes.eliminar');

        /*
        |----------------------------------------------------------------------
        | MÓDULO: PEDIDOS — Admin y vendedor gestionan pedidos
        |----------------------------------------------------------------------
        |
        | Rutas estándar del resource:
        |   GET    /pedidos              → index   (lista de pedidos)
        |   GET    /pedidos/crear        → create  (nuevo pedido)
        |   POST   /pedidos              → store   (guardar pedido)
        |   GET    /pedidos/{pedido}     → show    (detalle del pedido)
        |   GET    /pedidos/{pedido}/editar → edit (formulario editar)
        |   PUT    /pedidos/{pedido}     → update  (guardar cambios)
        |   DELETE /pedidos/{pedido}     → destroy (soft delete)
        |
        | Ruta extra:
        |   PATCH  /pedidos/{pedido}/estado → cambiarEstado() — avanzar estado
        |
        */
        Route::resource('pedidos', PedidoController::class)
             ->parameters(['pedidos' => 'pedido']);

        // Ruta extra: cambio de estado desde la lista/detalle
        Route::patch('pedidos/{pedido}/estado', [PedidoController::class, 'cambiarEstado'])
             ->name('pedidos.estado');

        /*
        |----------------------------------------------------------------------
        | MÓDULO: TARIFAS DE DOMICILIO — Solo admin/superadmin
        |----------------------------------------------------------------------
        | GET    /tarifas              → index   (lista con precios)
        | POST   /tarifas              → store   (crear nueva ciudad)
        | PUT    /tarifas/{tarifa}     → update  (editar precio)
        | DELETE /tarifas/{tarifa}     → destroy (eliminar)
        | PATCH  /tarifas/{tarifa}/toggle → activar/desactivar
        */
        Route::resource('tarifas', TarifaController::class)
             ->parameters(['tarifas' => 'tarifa'])
             ->only(['index', 'store', 'update', 'destroy']);

        Route::patch('tarifas/{tarifa}/toggle', [TarifaController::class, 'toggle'])
             ->name('tarifas.toggle');

        // Exportar base de datos de clientes con consentimiento de marketing
        Route::get('marketing/exportar', [MarketingExportController::class, 'exportar'])
             ->name('marketing.exportar');

        // ──────────────────────────────────────────────────────────────
        // ASISTENTE DE MARKETING PRO — Solo super_administrador
        // ──────────────────────────────────────────────────────────────
        Route::prefix('marketing/asistente')
             ->middleware('role:super_administrador')
             ->group(function () {
                 // Índice: árbol de categorías + productos
                 Route::get('/', [AsistenteMarketingController::class, 'index'])
                      ->name('marketing.asistente');

                 // Detalle: análisis de un producto específico
                 Route::get('{producto}', [AsistenteMarketingController::class, 'show'])
                      ->name('marketing.asistente.producto');

                 // Llamada a Groq: generar análisis IA (no persiste en BD)
                 Route::post('{producto}/analizar', [AsistenteMarketingController::class, 'analizar'])
                      ->name('marketing.asistente.analizar');

                 // Guardar métricas reales del período
                 Route::post('{producto}/metricas', [AsistenteMarketingController::class, 'guardarMetrica'])
                      ->name('marketing.asistente.guardar');

                 // TEMPORAL: diagnóstico Groq — eliminar tras solucionar
                 Route::get('debug-groq', [AsistenteMarketingController::class, 'debugGroq'])
                      ->name('marketing.asistente.debug');

                 // Eliminar métricas (solo si producto NO está activo)
                 Route::delete('{producto}/metricas', [AsistenteMarketingController::class, 'eliminarMetricas'])
                      ->name('marketing.asistente.eliminar');
             });

        // Exportar lista de clientes registrados (cédula + historial de pedidos)
        Route::get('clientes/exportar', [ClienteController::class, 'exportarExcel'])
             ->name('clientes.exportar');

        /*
        |----------------------------------------------------------------------
        | MÓDULO: FINANZAS — Transacciones, Gastos y Reportes
        |----------------------------------------------------------------------
        |
        | Transacciones: pagos recibidos por pedidos (manual o Wompi)
        |   GET    /transacciones              → index
        |   GET    /transacciones/create       → create
        |   POST   /transacciones              → store
        |   GET    /transacciones/{id}         → show
        |   PATCH  /transacciones/{id}         → update (solo anular)
        |
        | Gastos operativos: costos del negocio (publicidad, empaque, etc.)
        |   7 rutas resource estándar
        |
        | Reporte financiero: dashboard con KPIs del mes
        |   GET    /reportes/financiero        → dashboard
        |
        | Wompi link: genera link de pago para un pedido
        |   POST   /transacciones/wompi/{pedido} → generarLinkWompi
        |
        */

        // Transacciones (sin destroy — registros financieros son inmutables)
        Route::resource('transacciones', TransaccionController::class)
             ->only(['index', 'create', 'store', 'show', 'update'])
             ->parameters(['transacciones' => 'transaccion']);

        // Link de pago Wompi para un pedido específico
        Route::post('transacciones/wompi/{pedido}', [TransaccionController::class, 'generarLinkWompi'])
             ->name('transacciones.wompi-link');

        // Gastos operativos — CRUD completo
        Route::resource('gastos', GastoController::class);

        // Dashboard financiero
        Route::get('reportes/financiero', [ReporteFinancieroController::class, 'dashboard'])
             ->name('reportes.financiero');

        // Pagos a proveedores — deuda acumulada + registrar pagos
        Route::get('finanzas/proveedores', [PagoProveedorController::class, 'index'])
             ->name('pagos-proveedor.index');
        Route::post('finanzas/proveedores', [PagoProveedorController::class, 'store'])
             ->name('pagos-proveedor.store');

        // Dashboard de Analytics — métricas ejecutivas del negocio
        Route::get('analytics', [AnalyticsController::class, 'dashboard'])
             ->name('analytics.dashboard');

        // Dashboard de Costos — solo super administrador (información sensible de infraestructura)
        Route::get('admin/costos', [CostosController::class, 'index'])
             ->name('admin.costos')
             ->middleware('role:super_administrador');

        /*
        |----------------------------------------------------------------------
        | MÓDULO: MARKETING — Cupones y Campañas (FASE 7)
        |----------------------------------------------------------------------
        |
        | Cupones:
        |   GET    /cupones              → index   (lista con estadísticas)
        |   GET    /cupones/crear        → create  (formulario nuevo cupón)
        |   POST   /cupones              → store   (guardar cupón)
        |   GET    /cupones/{cupon}/editar → edit  (formulario edición)
        |   PUT    /cupones/{cupon}      → update  (guardar cambios)
        |   DELETE /cupones/{cupon}      → destroy (desactivar, no borrar)
        |   POST   /cupones/validar      → validar (AJAX — valida código + total)
        |
        | Campañas:
        |   GET    /campanas             → index   (lista con métricas de ROI)
        |   GET    /campanas/crear       → create  (formulario nueva campaña)
        |   POST   /campanas             → store   (guardar campaña)
        |   GET    /campanas/{campana}   → show    (detalle + pedidos)
        |   GET    /campanas/{campana}/editar → edit (formulario edición)
        |   PUT    /campanas/{campana}   → update  (guardar cambios)
        |   DELETE /campanas/{campana}   → destroy (borrar si no tiene pedidos)
        |
        | PENSAR — ¿Por qué validar() va ANTES del resource?
        |
        |   Route::resource() genera la ruta POST /cupones → store().
        |   Si ponemos la ruta POST /cupones/validar DESPUÉS, Laravel
        |   intentará resolver 'validar' como el ID de un cupón → error.
        |   Solución: registrar la ruta explícita ANTES del resource.
        |
        */

        // NOTA: La ruta POST cupones/validar es PÚBLICA y vive en el grupo /tienda.
        // No se repite aquí para evitar que Ziggy sobreescriba el nombre 'cupones.validar'
        // con la URL del admin (que requiere auth y rompería la validación desde el carrito).

        // Configuración general del sistema (solo super admin)
        Route::get('configuracion', [ConfiguracionController::class, 'index'])
             ->name('configuracion.index');
        Route::post('configuracion', [ConfiguracionController::class, 'actualizar'])
             ->name('configuracion.actualizar');

        // CRUD de cupones (sin show — la lista ya tiene toda la info necesaria)
        Route::resource('cupones', CuponController::class)
             ->except(['show'])
             ->parameters(['cupones' => 'cupon']);

        // CRUD completo de campañas (con show para la vista de análisis/ROI)
        Route::resource('campanas', CampanaController::class)
             ->parameters(['campanas' => 'campana']);

        /*
        |----------------------------------------------------------------------
        | MÓDULO: CATEGORÍAS — CRUD de categorías de productos
        |----------------------------------------------------------------------
        |
        | GET    /categorias              → index   (lista con jerarquía)
        | GET    /categorias/create       → create  (formulario nueva)
        | POST   /categorias              → store   (guardar)
        | GET    /categorias/{id}/edit    → edit    (formulario edición)
        | PUT    /categorias/{id}         → update  (guardar cambios)
        | DELETE /categorias/{id}         → destroy (bloquea si tiene productos/hijos)
        |
        */
        Route::resource('categorias', CategoriaController::class)
             ->except(['show'])
             ->parameters(['categorias' => 'categoria']);

        Route::patch('categorias/{categoria}/toggle', [CategoriaController::class, 'toggle'])
             ->name('categorias.toggle');

    }); // fin grupo admin

}); // fin grupo auth+verified

/*
|--------------------------------------------------------------------------
| PORTAL DE PROVEEDORES — /portal/*
|--------------------------------------------------------------------------
|
| PENSAR — ¿Por qué un grupo separado?
|
|   El portal usa el MISMO login que el admin (/login).
|   Después del login, AuthenticatedSessionController detecta el rol:
|   - proveedor → redirige a /portal/dashboard
|   - admin     → redirige a /dashboard
|
|   Este grupo protege TODAS las rutas del portal de 3 formas:
|   1. 'auth'              → debe estar logueado
|   2. 'verified'          → email verificado (opcional pero buena práctica)
|   3. 'role:proveedor|...'→ solo proveedores y super_admin pueden entrar
|
|   NOTA: 'super_administrador' también tiene acceso para que tú
|   puedas probar el portal sin crear una cuenta de proveedor.
|
*/
Route::middleware(['auth', 'verified', 'role:proveedor|super_administrador'])
     ->prefix('portal')
     ->name('portal.')
     ->group(function () {

    // Dashboard principal del proveedor
    Route::get('dashboard', [PortalController::class, 'dashboard'])
         ->name('dashboard');

    // Sus productos (solo los que tiene asignados en producto_proveedor)
    Route::get('productos', [PortalController::class, 'productos'])
         ->name('productos');

    // Crear producto nuevo desde el portal (nace como inactivo, admin lo activa)
    // IMPORTANTE: esta ruta va ANTES de {producto}/editar para que Laravel
    // no intente resolver 'crear' como un UUID de producto.
    Route::get('productos/crear', [PortalController::class, 'crearProducto'])
         ->name('productos.crear');
    Route::get('productos/verificar-nombre', [PortalController::class, 'verificarNombre'])
         ->name('productos.verificar');
    Route::post('productos', [PortalController::class, 'guardarProducto'])
         ->name('productos.guardar');

    // Editar un producto propio
    Route::get('productos/{producto}/editar', [PortalController::class, 'editarProducto'])
         ->name('productos.editar');
    Route::put('productos/{producto}', [PortalController::class, 'actualizarProducto'])
         ->name('productos.actualizar');

    // Eliminar un producto propio (lo baja de la tienda y lo desvincula del proveedor)
    Route::delete('productos/{producto}', [PortalController::class, 'eliminarProducto'])
         ->name('productos.eliminar');

    // Pedidos que incluyen sus productos
    Route::get('pedidos', [PortalController::class, 'pedidos'])
         ->name('pedidos');
    Route::get('pedidos/{pedido}', [PortalController::class, 'verPedido'])
         ->name('pedidos.ver');

    // Pagos y comisiones
    Route::get('pagos', [PortalController::class, 'pagos'])
         ->name('pagos');

}); // fin grupo portal

/*
|--------------------------------------------------------------------------
| WEBHOOK WOMPI — Ruta PÚBLICA (sin autenticación)
|--------------------------------------------------------------------------
|
| PENSAR — ¿Por qué está fuera del middleware auth?
|
|   Wompi llama a esta URL desde sus servidores, no desde el browser
|   del usuario. No tiene sesión, no tiene token de autenticación.
|   La seguridad la garantiza la verificación de firma (SHA256).
|
|   Si pusiéramos esta ruta dentro del grupo auth, Wompi recibiría
|   un 302 redirect al login y el webhook fallaría silenciosamente.
|
*/
Route::post('wompi/webhook', [TransaccionController::class, 'webhookWompi'])
     ->name('wompi.webhook');

/*
|--------------------------------------------------------------------------
| RUTAS DE AUTENTICACIÓN — Breeze (login, registro, reset contraseña)
|--------------------------------------------------------------------------
|
| Este archivo define las rutas estándar de autenticación generadas
| por Laravel Breeze:
|   GET  /login           → formulario de login
|   POST /login           → procesar login
|   POST /logout          → cerrar sesión
|   GET  /register        → formulario de registro
|   POST /register        → crear cuenta
|   GET  /forgot-password → solicitar reset
|   POST /forgot-password → enviar email de reset
|   GET  /reset-password  → formulario nueva contraseña
|   POST /reset-password  → guardar nueva contraseña
|
| IMPORTANTE: debe cargarse aquí (no en bootstrap/app.php) porque
| este proyecto usa ->withRouting(web: ...) sin callback then:.
|
*/
require __DIR__.'/auth.php';

/*
|--------------------------------------------------------------------------
| RUTAS DE AUTENTICACIÓN SOCIAL — Google OAuth
|--------------------------------------------------------------------------
|
| Define las 2 rutas del flujo OAuth con Google:
|   GET /auth/google          → redirige al login de Google
|   GET /auth/google/callback → Google regresa aquí con el token
|
| El controlador AutenticacionSocialController maneja todo el flujo:
| crea el usuario si es nuevo, o lo loguea si ya existe.
|
*/
require __DIR__.'/auth_social.php';
