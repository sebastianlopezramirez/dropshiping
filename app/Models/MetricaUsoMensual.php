<?php

/*
|--------------------------------------------------------------------------
| MODEL: MetricaUsoMensual
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué representa?
|
|   Un registro por mes con los contadores acumulados de uso de
|   servicios externos (emails Resend, conversaciones WhatsApp).
|
| PENSAR — ¿Por qué fillable y no guarded?
|
|   Solo anio, mes y los contadores son asignables masivamente.
|   Los incrementos se hacen directamente con DB::table() o
|   el método estático del Service — no via fill().
|
*/

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MetricaUsoMensual extends Model
{
    protected $table = 'metricas_uso_mensual';

    protected $fillable = [
        'anio',
        'mes',
        'emails_enviados',
        'conversaciones_wa',
    ];

    protected $casts = [
        'anio'               => 'integer',
        'mes'                => 'integer',
        'emails_enviados'    => 'integer',
        'conversaciones_wa'  => 'integer',
    ];

    /*
    |----------------------------------------------------------------------
    | SCOPE: mesActual()
    |----------------------------------------------------------------------
    | Filtra por el mes y año actuales.
    | Uso: MetricaUsoMensual::mesActual()->first()
    */
    public function scopeMesActual($query)
    {
        return $query
            ->where('anio', now()->year)
            ->where('mes', now()->month);
    }
}
