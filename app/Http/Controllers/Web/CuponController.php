<?php

/*
|--------------------------------------------------------------------------
| CONTROLLER: CuponController
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué hace este controller?
|
|   Gestiona el CRUD de cupones de descuento desde el panel admin.
|   Además expone un endpoint AJAX para que el formulario del carrito
|   pueda validar un código de cupón en tiempo real.
|
| MÉTODOS:
|   index()    → lista de cupones con estadísticas de uso
|   create()   → formulario de creación (pasa categorías + productos)
|   store()    → guardar cupón nuevo + sincronizar pivot categorías/productos
|   edit()     → formulario de edición (pasa categorías + productos seleccionados)
|   update()   → guardar cambios + re-sincronizar pivot
|   destroy()  → desactivar (soft disable — no borrar para mantener historial)
|   validar()  → AJAX: valida código + ítems del carrito → devuelve descuento
|
*/

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Categoria;
use App\Models\Cupon;
use App\Models\Producto;
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
    |
    | Pasamos categorías y productos para que el admin pueda
    | seleccionar las restricciones del cupón.
    |
    */
    public function create(): Response
    {
        return Inertia::render('Marketing/Cupones/Crear', [
            'categorias' => Categoria::where('activo', true)
                ->orderBy('nombre')
                ->select('id', 'nombre')
                ->get(),
            'productos' => Producto::where('estado', 'activo')
                ->orderBy('nombre')
                ->select('id', 'nombre', 'precio_venta')
                ->get(),
        ]);
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
            'aplica_a'         => ['required', 'in:todo,categorias,productos'],
            'categoria_ids'    => ['nullable', 'array'],
            'categoria_ids.*'  => ['uuid', 'exists:categorias,id'],
            'producto_ids'     => ['nullable', 'array'],
            'producto_ids.*'   => ['uuid', 'exists:productos,id'],
        ]);

        $datos['minimo_compra'] = $datos['minimo_compra'] ?? 0;

        $cupon = Cupon::create($datos);

        // Sincronizar pivot según restricción
        $this->sincronizarPivot($cupon, $datos);

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
            'cupon'          => $cupon,
            'categoriaIds'   => $cupon->categorias()->pluck('categorias.id'),
            'productoIds'    => $cupon->productos()->pluck('productos.id'),
            'categorias'     => Categoria::where('activo', true)
                ->orderBy('nombre')
                ->select('id', 'nombre')
                ->get(),
            'productos'      => Producto::where('estado', 'activo')
                ->orderBy('nombre')
                ->select('id', 'nombre', 'precio_venta')
                ->get(),
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
            'aplica_a'         => ['required', 'in:todo,categorias,productos'],
            'categoria_ids'    => ['nullable', 'array'],
            'categoria_ids.*'  => ['uuid', 'exists:categorias,id'],
            'producto_ids'     => ['nullable', 'array'],
            'producto_ids.*'   => ['uuid', 'exists:productos,id'],
        ]);

        $datos['codigo']        = strtoupper($datos['codigo']);
        $datos['minimo_compra'] = $datos['minimo_compra'] ?? 0;

        $cupon->update($datos);

        // Re-sincronizar pivot
        $this->sincronizarPivot($cupon, $datos);

        return redirect()
            ->route('cupones.index')
            ->with('exito', 'Cupón actualizado correctamente.');
    }

    /*
    |----------------------------------------------------------------------
    | destroy() — Desactivar cupón (no borrar — se mantiene el historial)
    |----------------------------------------------------------------------
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
    | validar() — AJAX: valida código + ítems del carrito
    |----------------------------------------------------------------------
    |
    | ENTENDER — ¿Qué recibe y qué devuelve?
    |
    |   POST /cupones/validar
    |   Body: {
    |     codigo: "VERANO20",
    |     items: [
    |       { producto_id: "uuid", categoria_id: "uuid", subtotal: 150000 },
    |       ...
    |     ]
    |   }
    |
    |   Respuesta exitosa:
    |   { valido: true, descuento: 30000, cupon_id: "uuid", mensaje: "20% aplicado" }
    |
    |   Respuesta fallida:
    |   { valido: false, mensaje: "Este cupón ya expiró." }
    |
    | PENSAR — ¿Por qué recibimos items en lugar de solo el total?
    |
    |   Porque el cupón puede estar restringido a categorías o productos
    |   específicos. Necesitamos saber qué hay en el carrito para calcular
    |   el subtotal elegible (la parte a la que aplica el descuento).
    |
    */
    public function validar(Request $request): JsonResponse
    {
        $request->validate([
            'codigo'                => ['required', 'string'],
            'items'                 => ['required', 'array', 'min:1'],
            'items.*.producto_id'   => ['required', 'string'],
            'items.*.categoria_id'  => ['nullable', 'string'],
            'items.*.subtotal'      => ['required', 'numeric', 'min:0'],
        ]);

        $cupon = Cupon::where('codigo', strtoupper($request->codigo))->first();

        if (!$cupon) {
            return response()->json([
                'valido'  => false,
                'mensaje' => 'Código de cupón no encontrado.',
            ]);
        }

        // Total del carrito completo (para verificar mínimo de compra)
        $totalCarrito = collect($request->items)->sum('subtotal');

        // Validar condiciones generales (activo, fechas, límite usos, mínimo compra)
        $resultado = $cupon->esValido((float) $totalCarrito);
        if (!$resultado['valido']) {
            return response()->json([
                'valido'  => false,
                'mensaje' => $resultado['mensaje'],
            ]);
        }

        // Calcular subtotal elegible según restricciones
        $cupon->loadMissing(['categorias', 'productos']);
        $subtotalElegible = $cupon->subtotalElegible($request->items);

        if ($subtotalElegible <= 0) {
            $msg = match($cupon->aplica_a) {
                'categorias' => 'Este cupón no aplica a los productos de tu carrito (restricción por categoría).',
                'productos'  => 'Este cupón no aplica a los productos de tu carrito.',
                default      => 'Este cupón no aplica a tu carrito.',
            };
            return response()->json(['valido' => false, 'mensaje' => $msg]);
        }

        $descuento = $cupon->calcularDescuento($subtotalElegible);

        // Construir mensaje descriptivo
        if ($cupon->tipo === 'porcentaje') {
            $pct     = rtrim(rtrim(number_format($cupon->valor, 2), '0'), '.');
            $mensaje = "{$pct}% de descuento aplicado";
        } else {
            $mensaje = '$' . number_format($descuento, 0, ',', '.') . ' de descuento aplicado';
        }

        if ($cupon->aplica_a !== 'todo') {
            $mensaje .= ' (sobre productos elegibles)';
        }

        return response()->json([
            'valido'             => true,
            'descuento'          => round($descuento, 2),
            'subtotal_elegible'  => round($subtotalElegible, 2),
            'cupon_id'           => $cupon->id,
            'aplica_a'           => $cupon->aplica_a,
            'mensaje'            => $mensaje,
        ]);
    }

    /*
    |----------------------------------------------------------------------
    | sincronizarPivot() — Helper privado
    |----------------------------------------------------------------------
    |
    | Sincroniza las tablas pivot cupon_categoria y cupon_producto
    | según el valor de aplica_a. Si aplica_a es 'todo', limpia ambas tablas.
    |
    */
    private function sincronizarPivot(Cupon $cupon, array $datos): void
    {
        $aplica = $datos['aplica_a'] ?? 'todo';

        if ($aplica === 'categorias') {
            $cupon->categorias()->sync($datos['categoria_ids'] ?? []);
            $cupon->productos()->sync([]);
        } elseif ($aplica === 'productos') {
            $cupon->productos()->sync($datos['producto_ids'] ?? []);
            $cupon->categorias()->sync([]);
        } else {
            // 'todo' → limpiar ambas
            $cupon->categorias()->sync([]);
            $cupon->productos()->sync([]);
        }
    }
}
