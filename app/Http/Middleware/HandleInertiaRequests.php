<?php

namespace App\Http\Middleware;

use App\Models\Pedido;
use App\Models\Producto;
use App\Models\Proveedor;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
                'roles' => $request->user()?->getRoleNames() ?? [],
            ],
            'ziggy' => fn () => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            // Productos pendientes de aprobación — solo para admins que pueden activarlos
            'productosPendientes' => fn () => $request->user()
                && $request->user()->hasAnyRole(['super_administrador', 'administrador'])
                ? Producto::where('estado', 'inactivo')->count()
                : 0,

            // Pedidos pendientes de gestión — badge rojo en el nav
            'pedidosPendientes' => fn () => $request->user()
                && $request->user()->hasAnyRole(['super_administrador', 'administrador'])
                ? Pedido::where('estado', 'pendiente')->count()
                : 0,

            // Datos del proveedor para el PortalLayout (nombre + NIT en navbar)
            'proveedorPortal' => fn () => $request->user()
                && $request->user()->hasRole('proveedor')
                ? (function() use ($request) {
                    $p = $request->user()->proveedor;
                    return $p ? [
                        'nombre_empresa'       => $p->nombre_empresa,
                        'numero_identificacion' => $p->numero_identificacion,
                    ] : null;
                })()
                : null,

            // Flash messages compartidos con todas las páginas React
            'flash' => [
                'exito'                => $request->session()->get('exito'),
                'error'                => $request->session()->get('error'),
                'errores_importacion'  => $request->session()->get('errores_importacion', []),
            ],
        ];
    }
}
