<?php

/*
|--------------------------------------------------------------------------
| MODELO PIVOT: ProductoProveedor
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué es un modelo pivot?
|
|   Cuando una tabla pivot tiene columnas propias (precio_proveedor,
|   tiempo_entrega_dias, etc.), Laravel nos permite crear un modelo
|   específico para ella.
|
|   Esto nos permite hacer cosas como:
|     $relacion = ProductoProveedor::where('es_principal', true)->first();
|     echo $relacion->precio_proveedor;
|
|   Sin este modelo, solo podríamos acceder a los datos pivot a través
|   de $producto->proveedores->first()->pivot->precio_proveedor
|
| PENSAR — ¿Qué hereda?
|
|   En lugar de extender Model, extiende Pivot.
|   Pivot es una versión especial de Model para tablas intermedias.
|   La diferencia principal: Pivot NO tiene $incrementing por defecto.
|
*/

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;
use Illuminate\Support\Str;

class ProductoProveedor extends Pivot
{
    /*
    |----------------------------------------------------------------------
    | TABLA Y TIMESTAMPS
    |----------------------------------------------------------------------
    */
    protected $table = 'producto_proveedor';

    const CREATED_AT = 'creado_en';
    const UPDATED_AT = 'actualizado_en';

    // Esta tabla SÍ tiene su propio UUID como PK
    public $incrementing = false;
    protected $keyType = 'string';

    /*
    |----------------------------------------------------------------------
    | boot() — UUID en PHP
    |----------------------------------------------------------------------
    */
    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    /*
    |----------------------------------------------------------------------
    | FILLABLE
    |----------------------------------------------------------------------
    */
    protected $fillable = [
        'producto_id',
        'proveedor_id',
        'precio_proveedor',
        'tiempo_entrega_dias',
        'url_producto',
        'referencia_proveedor',
        'es_principal',
        'notas',
    ];

    /*
    |----------------------------------------------------------------------
    | CASTS
    |----------------------------------------------------------------------
    */
    protected function casts(): array
    {
        return [
            'precio_proveedor'    => 'decimal:2',
            'es_principal'        => 'boolean',
            'creado_en'           => 'datetime',
            'actualizado_en'      => 'datetime',
        ];
    }
}
