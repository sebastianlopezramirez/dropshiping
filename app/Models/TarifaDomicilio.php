<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TarifaDomicilio extends Model
{
    protected $table = 'tarifas_domicilio';

    protected $fillable = [
        'nombre',
        'tipo',
        'precio',
        'activo',
        'orden',
    ];

    protected $casts = [
        'activo' => 'boolean',
        'precio' => 'integer',
        'orden'  => 'integer',
    ];

    // Solo las activas
    public function scopeActivas($query)
    {
        return $query->where('activo', true)->orderBy('orden')->orderBy('nombre');
    }

    // Área metropolitana de Medellín
    public function scopeAreaMetro($query)
    {
        return $query->where('tipo', 'area_metro');
    }

    // Otras ciudades del país
    public function scopeCiudades($query)
    {
        return $query->where('tipo', 'ciudad');
    }
}
