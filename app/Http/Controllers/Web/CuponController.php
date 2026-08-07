<?php

/*
|--------------------------------------------------------------------------
| CONTROLLER: CuponController
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué hace este controller?
|
|   Gestiona el CRUD de cupones de descuento desde el panel admin.
|   Además expone un endpoint AJAX para que el formulario de pedidos
|   pueda validar un código de cupón en tiempo real.
|
| MÉTODOS:
|   index()    → lista de cupones con estadísticas de uso
|   create()   → formulario de creación
|   store()    → guardar cupón nuevo
|   edit()     → formulario de edición
|   update()   → guardar cambios
|   destroy()  → desactivar (soft disable — no borrar para mantener historial)
|   validar()  → AJAX: valida un código y retorna el descuento calculado
|
*/

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Cupon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CuponController extends Controller
{
    /*
    |----------------------------------------------------------------------
    | index() — Lista todos los cupones
    |----------------------------------------------------------------------
    */
    public function index(Request $request): Response
    {
        $query = Cupon::query()->orderByDesc('creado_en');

        if ($request->filled('buscar')) {
            $query->where(function ($q) use ($request) {
                $q->where('codigo', 'ilike', "%{$request->buscar}%")
                  ->orWhere('descripcion', 'ilike', "%{$request->buscar}%");
            });
        }

        if ($request->filled('tipo')) {
            $query->where('tipo', $request->tipo);
        }

        if ($request->filled('activo')) {
            $query->where('activo', $request->activo === 'true');
        }

        $cupones = $query->withCount('pedidos')->paginate(15)->withQueryString();

        return Inertia::render('Marketing/Cupones/Index', [
            'cupones'      => $cupones,
            'filtros'      => $request->only(['buscar', 'tipo', 'activo']),
            'estadisticas' => [
                'total'    => Cupon::count(),
                'activos'  => Cupon::where('activo', true)->count(),
                'vigentes' => Cupon::vigentes()->count(),
            ],
        ]);
    }

    /*
    |----------------------------------------------------------------------
    | create() — Formulario de creación
    |----------------------------------------------------------------------
    */
    public function create(): Response
    {
        return Inertia::render('Marketing/Cupones/Crear');
    }

    /*
    |----------------------------------------------------------------------
    | store() — Guardar cupón nuevo
    |----------------------------------------------------------------------
    */
    public function store(Request $request): RedirectResponse
    {
        $datos = $request->validate([
            'codigo'           => ['required', 'string', 'max:50', 'unique:cupones,codigo'],
            'descripcion'      => ['nullable', 'string', 'max:200'],
            'tipo'             => ['required', 'in:porcentaje,valor_fijo'],
            'valor'            => ['required', 'numeric', 'min:0.01'],
            'minimo_compra'    => ['nullable', 'numeric', 'min:0'],
            'maximo_descuento' => ['nullable', 'numeric', 'min:0'],
            'limite_usos'      => ['nullable', 'integer', 'min:1'],
            'fecha_inicio'     => ['nullable', 'date'],
            'fecha_expiracion' => ['nullable', 'date', 'after_or_equal:fecha_inicio'],
            'activo'           => ['boolean'],
        ]);

        // minimo_compra es NOT NULL en BD con default 0.
        // Si el usuario lo deja vacío, normalize a 0 en lugar de null.
        $datos['minimo_compra'] = $datos['minimo_compra'] ?? 0;

        // El modelo ya convierte el código a mayúsculas en boot()
        Cupon::create($datos);

        return redirect()
            ->route('cupones.index')
            ->with('exito', 'Cupón creado correctamente.');
    }

    /*
    |----------------------------------------------------------------------
    | edit() — Formulario de edición
    |----------------------------------------------------------------------
    */
    public function edit(Cupon $cupon): Response
    {
        return Inertia::render('Marketing/Cupones/Editar', [
            'cupon' => $cupon,
        ]);
    }

    /*
    |----------------------------------------------------------------------
    | update() — Guardar cambios
    |----------------------------------------------------------------------
    */
    public function update(Request $request, Cupon $cupon): RedirectResponse
    {
        $datos = $request->validate([
            'codigo'           => ['required', 'string', 'max:50', 'unique:cupones,codigo,' . $cupon->id],
            'descripcion'      => ['nullable', 'string', 'max:200'],
            'tipo'             => ['required', 'in:porcentaje,valor_fijo'],
            'valor'            => ['required', 'numeric', 'min:0.01'],
            'minimo_compra'    => ['nullable', 'numeric', 'min:0'],
            'maximo_descuento' => ['nullable', 'numeric', 'min:0'],
            'limite_usos'      => ['nullable', 'integer', 'min:1'],
            'fecha_inicio'     => ['nullable', 'date'],
            'fecha_expiracion' => ['nullable', 'date', 'after_or_equal:fecha_inicio'],
            'activo'           => ['boolean'],
        ]);

        $datos['codigo']        = strtoupper($datos['codigo']);
        $datos['minimo_compra'] = $datos['minimo_compra'] ?? 0;
        $cupon->update($datos);

        return redirect()
            ->route('cupones.index')
            ->with('exito', 'Cupón actualizado correctamente.');
    }

    /*
    |----------------------------------------------------------------------
    | destroy() — Desactivar cupón (no borrar — se mantiene el historial)
    |----------------------------------------------------------------------
    |
    | PENSAR — ¿Por qué no borramos?
    |
    |   Si borramos un cupón, los pedidos que lo usaron quedan sin referencia.
    |   En su lugar, lo desactivamos: activo = false.
    |   Sigue apareciendo en el historial pero ya no puede usarse.
    |
    */
    public function destroy(Cupon $cupon): RedirectResponse
    {
        $cupon->update(['activo' => false]);

        return redirect()
            ->route('cupones.index')
            ->with('exito', 'Cupón desactivado. El historial de uso se mantiene.');
    }

    /*
    |----------------------------------------------------------------------
    | validar() — AJAX: valida un código y retorna el descuento
    |----------------------------------------------------------------------
    |
    | ENTENDER — ¿Para qué sirve este endpoint?
    |
    |   El formulario de creación de pedidos tiene un campo "Código de cupón".
    |   Cuando el vendedor escribe el código, React llama a este endpoint
    |   para mostrar en tiempo real cuánto descuento se va a aplicar.
    |
    |   POST /cupones/validar
    |   Body: { codigo: "VERANO20", total: 200000 }
    |
    |   Respuesta exitosa:
    |   { valido: true, descuento: 40000, mensaje: "20% de descuento aplicado" }
    |
    |   Respuesta fallida:
    |   { valido: false, mensaje: "Este cupón ya expiró." }
    |
    */
    public function validar(Request $request): JsonResponse
    {
        $request->validate([
            'codigo' => ['required', 'string'],
            'total'  => ['required', 'numeric', 'min:0'],
        ]);

        $cupon = Cupon::where('codigo', strtoupper($request->codigo))->first();

        if (!$cupon) {
            return response()->json([
                'valido'   => false,
                'mensaje'  => 'Código de cupón no encontrado.',
            ]);
        }

        $resultado = $cupon->esValido((float) $request->total);

        if (!$resultado['valido']) {
            return response()->json([
                'valido'  => false,
                'mensaje' => $resultado['mensaje'],
            ]);
        }

        $descuento = $cupon->calcularDescuento((float) $request->total);

        // Construir mensaje descriptivo
        if ($cupon->tipo === 'porcentaje') {
            $mensaje = "{$cupon->valor}% de descuento aplicado";
        } else {
            $mensaje = '$' . number_format($descuento, 0, ',', '.') . ' de descuento aplicado';
        }

        return response()->json([
            'valido'    => true,
            'descuento' => $descuento,
            'cupon_id'  => $cupon->id,
            'mensaje'   => $mensaje,
        ]);
    }
}
