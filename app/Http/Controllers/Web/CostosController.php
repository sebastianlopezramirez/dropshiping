<?php

/*
|--------------------------------------------------------------------------
| CONTROLLER: CostosController
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué hace?
|
|   Construye el dashboard de costos de infraestructura del mes actual.
|   Lee los contadores acumulados de MetricaUsoMensual, delega
|   el cálculo de costos a MetricasService y retorna todo a React.
|
| RUTA: GET /admin/costos → Admin/Costos
| NOMBRE: admin.costos
| ACCESO: solo super_administrador | administrador
|
*/

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\MetricaUsoMensual;
use App\Services\MetricasService;
use Inertia\Inertia;

class CostosController extends Controller
{
    public function index()
    {
        // Obtener (o crear) el registro del mes actual
        $metrica = MetricasService::obtenerOCrearMesActual();

        // Calcular desglose de costos y semáforos
        $costos = MetricasService::calcularCostos($metrica);

        // Historial de los últimos 6 meses (para ver tendencia)
        $historial = MetricaUsoMensual::query()
            ->orderByDesc('anio')
            ->orderByDesc('mes')
            ->limit(6)
            ->get()
            ->map(fn($m) => [
                'label'           => $this->nombreMes($m->mes) . ' ' . $m->anio,
                'emails'          => $m->emails_enviados,
                'conversaciones'  => $m->conversaciones_wa,
            ])
            ->values();

        return Inertia::render('Admin/Costos', [
            'metrica'  => $metrica,
            'costos'   => $costos,
            'historial' => $historial,
            'periodo'  => [
                'mes'  => now()->month,
                'anio' => now()->year,
                'label' => $this->nombreMes(now()->month) . ' ' . now()->year,
            ],
        ]);
    }

    private function nombreMes(int $mes): string
    {
        $meses = [
            1  => 'Ene', 2  => 'Feb', 3  => 'Mar',
            4  => 'Abr', 5  => 'May', 6  => 'Jun',
            7  => 'Jul', 8  => 'Ago', 9  => 'Sep',
            10 => 'Oct', 11 => 'Nov', 12 => 'Dic',
        ];
        return $meses[$mes] ?? '?';
    }
}
