<?php

/*
|--------------------------------------------------------------------------
| CONTROLADOR: MarketingExportController
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué hace este controlador?
|
|   Genera y descarga un archivo Excel (.csv) con todos los clientes
|   que aceptaron el tratamiento de datos personales durante la compra.
|
|   GET /marketing/exportar → descarga Excel directo al navegador
|
*/

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\ConsentimientoMarketing;
use Illuminate\Http\Request;

class MarketingExportController extends Controller
{
    public function exportar(Request $request)
    {
        $registros = ConsentimientoMarketing::orderBy('consentimiento_en', 'desc')->get();

        // Nombre del archivo con fecha
        $nombre = 'clientes_marketing_' . now()->format('Y-m-d') . '.csv';

        // Cabeceras del CSV
        $columnas = ['Nombre', 'Cédula', 'Celular', 'Municipio', 'Categoría de interés', 'Número de pedido', 'Fecha consentimiento'];

        $callback = function () use ($registros, $columnas) {
            $file = fopen('php://output', 'w');

            // BOM para que Excel abra bien caracteres especiales (tildes, ñ)
            fprintf($file, chr(0xEF) . chr(0xBB) . chr(0xBF));

            // Encabezados
            fputcsv($file, $columnas, ';');

            // Filas
            foreach ($registros as $r) {
                fputcsv($file, [
                    $r->nombre,
                    $r->cedula             ?? '',
                    $r->celular,
                    $r->municipio,
                    $r->categoria_interes  ?? '',
                    $r->numero_pedido      ?? '',
                    $r->consentimiento_en?->format('d/m/Y H:i') ?? '',
                ], ';');
            }

            fclose($file);
        };

        return response()->streamDownload($callback, $nombre, [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$nombre}\"",
        ]);
    }
}
