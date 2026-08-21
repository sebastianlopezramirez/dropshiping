<?php

/*
|--------------------------------------------------------------------------
| CONTROLADOR: TarifaController (Admin)
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué hace este controlador?
|
|   Permite al admin y superadmin gestionar los precios de domicilio.
|   Los precios se actualizan constantemente con la mensajería.
|
|   GET    /tarifas           → index()   Lista de tarifas
|   POST   /tarifas           → store()   Crear nueva tarifa
|   PUT    /tarifas/{id}      → update()  Editar precio/nombre
|   DELETE /tarifas/{id}      → destroy() Eliminar tarifa
|   PATCH  /tarifas/{id}/toggle → toggle() Activar/desactivar
|
*/

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\TarifaDomicilio;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TarifaController extends Controller
{
    public function index(): Response
    {
        $tarifas = TarifaDomicilio::orderBy('tipo')
                                   ->orderBy('orden')
                                   ->orderBy('nombre')
                                   ->get();

        return Inertia::render('Admin/Tarifas/Index', [
            'tarifas' => $tarifas,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nombre' => 'required|string|max:100|unique:tarifas_domicilio,nombre',
            'tipo'   => 'required|in:area_metro,ciudad',
            'precio' => 'required|integer|min:0|max:500000',
            'orden'  => 'nullable|integer|min:0',
        ]);

        TarifaDomicilio::create([
            'nombre' => $data['nombre'],
            'tipo'   => $data['tipo'],
            'precio' => $data['precio'],
            'orden'  => $data['orden'] ?? 99,
            'activo' => true,
        ]);

        return back()->with('success', "Tarifa para {$data['nombre']} creada.");
    }

    public function update(Request $request, TarifaDomicilio $tarifa)
    {
        $data = $request->validate([
            'nombre' => "required|string|max:100|unique:tarifas_domicilio,nombre,{$tarifa->id}",
            'tipo'   => 'required|in:area_metro,ciudad',
            'precio' => 'required|integer|min:0|max:500000',
            'orden'  => 'nullable|integer|min:0',
        ]);

        $tarifa->update($data);

        return back()->with('success', "Tarifa actualizada.");
    }

    public function destroy(TarifaDomicilio $tarifa)
    {
        $tarifa->delete();
        return back()->with('success', "Tarifa eliminada.");
    }

    public function toggle(TarifaDomicilio $tarifa)
    {
        $tarifa->update(['activo' => !$tarifa->activo]);
        $estado = $tarifa->activo ? 'activada' : 'desactivada';
        return back()->with('success', "{$tarifa->nombre} {$estado}.");
    }
}
