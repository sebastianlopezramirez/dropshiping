<?php

/*
|--------------------------------------------------------------------------
| CONTROLADOR: GastoController
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué hace este controller?
|
|   CRUD completo de gastos operativos del negocio.
|   Permite registrar, editar y eliminar gastos como:
|   publicidad, empaque, hosting, etc.
|
*/

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\GastoOperativo;
use App\Models\Pedido;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class GastoController extends Controller
{
    /*
    |----------------------------------------------------------------------
    | index() — Lista de gastos operativos
    |----------------------------------------------------------------------
    */
    public function index(Request $request): Response
    {
        $query = GastoOperativo::with('usuario')
                               ->orderBy('fecha_gasto', 'desc');

        if ($request->filled('categoria')) {
            $query->where('categoria', $request->categoria);
        }

        if ($request->filled('periodo')) {
            [$año, $mes] = match ($request->periodo) {
                'mes_actual'  => [now()->year, now()->month],
                'mes_pasado'  => [now()->subMonth()->year, now()->subMonth()->month],
                default       => [now()->year, now()->month],
            };
            $query->delPeriodo($año, $mes);
        }

        $gastos = $query->paginate(20)->withQueryString();

        // Totales por categoría del mes actual
        $resumenMes = GastoOperativo::resumenPorCategoria(now()->year, now()->month);

        $estadisticas = [
            'total_mes'     => array_sum($resumenMes),
            'total_hoy'     => GastoOperativo::whereDate('fecha_gasto', today())->sum('monto'),
            'por_categoria' => $resumenMes,
        ];

        return Inertia::render('Finanzas/Gastos/Index', [
            'gastos'       => $gastos,
            'estadisticas' => $estadisticas,
            'categorias'   => GastoOperativo::categoriasConEtiqueta(),
            'filtros'      => $request->only(['categoria', 'periodo']),
            'flash'        => ['exito' => session('exito'), 'error' => session('error')],
        ]);
    }

    /*
    |----------------------------------------------------------------------
    | create() — Formulario de nuevo gasto
    |----------------------------------------------------------------------
    */
    public function create(): Response
    {
        // Pedidos recientes para el selector opcional (últimos 60 días, activos)
        $pedidos = Pedido::whereIn('estado', [Pedido::ESTADO_PENDIENTE, Pedido::ESTADO_CONFIRMADO])
            ->where('creado_en', '>=', now()->subDays(60))
            ->orderBy('creado_en', 'desc')
            ->get(['id', 'numero_pedido', 'cliente_nombre', 'total']);

        return Inertia::render('Finanzas/Gastos/Crear', [
            'categorias' => GastoOperativo::categoriasConEtiqueta(),
            'pedidos'    => $pedidos,
        ]);
    }

    /*
    |----------------------------------------------------------------------
    | store() — Guarda un gasto operativo
    |----------------------------------------------------------------------
    */
    public function store(Request $request)
    {
        $datos = $request->validate([
            'categoria'   => ['required', Rule::in(GastoOperativo::todasLasCategorias())],
            'descripcion' => 'required|string|max:250',
            'monto'       => 'required|numeric|min:1',
            'fecha_gasto' => 'required|date',
            'notas'       => 'nullable|string',
            'pedido_id'   => 'nullable|uuid|exists:pedidos,id',
        ]);

        GastoOperativo::create([
            ...$datos,
            'usuario_id' => auth()->id(),
        ]);

        return redirect()
            ->route('gastos.index')
            ->with('exito', 'Gasto registrado correctamente.');
    }

    /*
    |----------------------------------------------------------------------
    | edit() — Formulario de edición
    |----------------------------------------------------------------------
    */
    public function edit(GastoOperativo $gasto): Response
    {
        return Inertia::render('Finanzas/Gastos/Editar', [
            'gasto'      => $gasto,
            'categorias' => GastoOperativo::categoriasConEtiqueta(),
        ]);
    }

    /*
    |----------------------------------------------------------------------
    | update() — Actualiza un gasto
    |----------------------------------------------------------------------
    */
    public function update(Request $request, GastoOperativo $gasto)
    {
        $datos = $request->validate([
            'categoria'   => ['required', Rule::in(GastoOperativo::todasLasCategorias())],
            'descripcion' => 'required|string|max:250',
            'monto'       => 'required|numeric|min:1',
            'fecha_gasto' => 'required|date',
            'notas'       => 'nullable|string',
            'pedido_id'   => 'nullable|uuid|exists:pedidos,id',
        ]);

        $gasto->update($datos);

        return redirect()
            ->route('gastos.index')
            ->with('exito', 'Gasto actualizado correctamente.');
    }

    /*
    |----------------------------------------------------------------------
    | destroy() — Elimina un gasto
    |----------------------------------------------------------------------
    */
    public function destroy(GastoOperativo $gasto)
    {
        $gasto->delete();

        return back()->with('exito', 'Gasto eliminado.');
    }
}
