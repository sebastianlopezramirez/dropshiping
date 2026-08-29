<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        /*
        |----------------------------------------------------------------------
        | MIDDLEWARE WEB — Se aplica automáticamente a todas las rutas web
        |----------------------------------------------------------------------
        |
        | append: agrega al FINAL de la cadena de middleware existente.
        | HandleInertiaRequests: intercepta peticiones de Inertia.js y
        |   comparte datos globales (usuario autenticado, etc.) con React.
        | AddLinkHeadersForPreloadedAssets: optimización HTTP/2 push.
        |
        */
        // Confiar en el proxy de Railway (HTTPS termina en el edge, llega HTTP al container)
        $middleware->trustProxies(at: '*');

        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);

        /*
        |----------------------------------------------------------------------
        | ALIAS DE MIDDLEWARE — Spatie Laravel Permission
        |----------------------------------------------------------------------
        |
        | Un alias es un nombre corto para referenciar un middleware largo.
        | Sin alias: Route::middleware([\Spatie\Permission\Middleware\RoleMiddleware::class])
        | Con alias:  Route::middleware(['role:administrador'])
        |
        | Los 3 middleware de Spatie:
        |
        | 'role'              → verifica que el usuario tenga UN rol específico
        |   Uso: ->middleware('role:administrador')
        |   Múltiples roles: ->middleware('role:admin|vendedor')
        |
        | 'permission'        → verifica que el usuario tenga UN permiso específico
        |   Uso: ->middleware('permission:ver-usuarios')
        |
        | 'role_or_permission' → verifica rol O permiso (más flexible)
        |   Uso: ->middleware('role_or_permission:administrador|ver-reportes')
        |
        */
        // Excluir rutas externas del CSRF (webhooks de terceros que no envían token)
        $middleware->validateCsrfTokens(except: [
            'wompi/webhook', // Wompi llama este endpoint desde sus servidores, sin CSRF
        ]);

        $middleware->alias([
            'role'               => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'permission'         => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );
    })->create();
