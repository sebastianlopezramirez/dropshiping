<?php

namespace App\Http\Middleware;

use App\Models\Producto;
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
            // Productos pendientes de aprobación — disponible en toda la app
            'productosPendientes' => fn () => $request->user()
                ? Producto::where('estado', 'inactivo')->count()
                : 0,

            // Flash messages compartidos con todas las páginas React
            'flash' => [
                'exito'                => $request->session()->get('exito'),
                'error'                => $request->session()->get('error'),
                'errores_importacion'  => $request->session()->get('errores_importacion', []),
            ],
        ];
    }
}
