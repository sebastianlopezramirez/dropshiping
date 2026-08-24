<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\ConsentimientoMarketing;
use Illuminate\Http\Request;

class LeadController extends Controller
{
    /**
     * Guarda los datos del cliente que quiere hacer un pedido desde la página de producto.
     * Estos datos alimentan la exportación de marketing (marketing/exportar).
     */
    public function guardar(Request $request)
    {
        $datos = $request->validate([
            'nombre'    => ['required', 'string', 'max:150'],
            'celular'   => ['required', 'string', 'max:20'],
            'email'     => ['nullable', 'email', 'max:150'],
            'municipio' => ['required', 'string', 'max:100'],
            'direccion' => ['nullable', 'string', 'max:300'],
            'producto'  => ['nullable', 'string', 'max:200'],
            'categoria' => ['nullable', 'string', 'max:100'],
        ]);

        // categoria_interes: usamos la categoría del producto, o el nombre del producto como fallback
        $categoriaInteres = filled($datos['categoria'] ?? null)
            ? $datos['categoria']
            : ($datos['producto'] ?? 'Tienda');

        ConsentimientoMarketing::create([
            'nombre'            => $datos['nombre'],
            'celular'           => $datos['celular'],
            'municipio'         => $datos['municipio'],
            'categoria_interes' => $categoriaInteres,
            'consentimiento_en' => now(),
        ]);

        return response()->json(['ok' => true]);
    }
}
