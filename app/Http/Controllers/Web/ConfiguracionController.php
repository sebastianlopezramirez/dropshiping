<?php
/*
|--------------------------------------------------------------------------
| Controller: ConfiguracionController (Admin)
|--------------------------------------------------------------------------
| ENTENDER: Permite al super admin ver y editar la configuración del sistema.
|
| PENSAR:   Solo dos acciones:
|           - index()      → muestra el formulario con los valores actuales
|           - actualizar() → guarda los nuevos valores y redirige con mensaje
|
| ESCRIBIR: Valida cada campo, guarda con Configuracion::establecer()
|           que además borra la caché automáticamente.
*/

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Configuracion;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ConfiguracionController extends Controller
{
    /*
    |----------------------------------------------------------------------
    | index() — muestra formulario de configuración
    |----------------------------------------------------------------------
    */
    public function index()
    {
        return Inertia::render('Admin/Configuracion/Index', [
            'configuracion' => [
                'hora_apertura'   => (int) Configuracion::obtener('disponibilidad_hora_apertura', 8),
                'hora_cierre'     => (int) Configuracion::obtener('disponibilidad_hora_cierre', 21),
                'mensaje_cerrado' => Configuracion::obtener('disponibilidad_mensaje_cerrado', 'Volvemos a las 8am'),
                'mensaje_abierto' => Configuracion::obtener('disponibilidad_mensaje_abierto', 'Disponibles'),
            ],
        ]);
    }

    /*
    |----------------------------------------------------------------------
    | actualizar() — guarda los cambios de configuración
    |----------------------------------------------------------------------
    */
    public function actualizar(Request $request)
    {
        $datos = $request->validate([
            'hora_apertura'   => ['required', 'integer', 'min:0', 'max:23'],
            'hora_cierre'     => ['required', 'integer', 'min:0', 'max:23'],
            'mensaje_cerrado' => ['required', 'string', 'max:60'],
            'mensaje_abierto' => ['required', 'string', 'max:40'],
        ], [
            'hora_apertura.min'   => 'La hora debe ser entre 0 y 23.',
            'hora_apertura.max'   => 'La hora debe ser entre 0 y 23.',
            'hora_cierre.min'     => 'La hora debe ser entre 0 y 23.',
            'hora_cierre.max'     => 'La hora debe ser entre 0 y 23.',
            'mensaje_cerrado.max' => 'El mensaje cerrado no puede superar 60 caracteres.',
            'mensaje_abierto.max' => 'El mensaje abierto no puede superar 40 caracteres.',
        ]);

        Configuracion::establecer('disponibilidad_hora_apertura',   $datos['hora_apertura']);
        Configuracion::establecer('disponibilidad_hora_cierre',     $datos['hora_cierre']);
        Configuracion::establecer('disponibilidad_mensaje_cerrado', $datos['mensaje_cerrado']);
        Configuracion::establecer('disponibilidad_mensaje_abierto', $datos['mensaje_abierto']);

        return redirect()->back()->with('exito', '✅ Configuración guardada correctamente.');
    }
}
