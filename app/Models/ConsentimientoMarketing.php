<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ConsentimientoMarketing extends Model
{
    protected $table = 'consentimientos_marketing';

    protected $fillable = [
        'nombre',
        'cedula',
        'celular',
        'municipio',
        'categoria_interes',
        'numero_pedido',
        'consentimiento_en',
    ];

    protected $casts = [
        'consentimiento_en' => 'datetime',
    ];
}
