<?php

/*
|--------------------------------------------------------------------------
| MODELO: Envio
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué es un envío?
|
|   Cuando el pedido se confirma, se crea un Envio con los datos
|   de la guía: operador logístico, número de rastreo, fechas.
|
|   Relación: Pedido (1) → tiene uno → Envio (1)
|
*/

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Envio extends Model
{
    protected $table      = 'envios';
    protected $keyType    = 'string';
    public    $incrementing = false;

    const CREATED_AT = 'creado_en';
    const UPDATED_AT = 'actualizado_en';

    // Operadores logísticos disponibles en Colombia
    const OPERADORES = [
        'Servientrega',
        'Envia.com',
        'Interrapidísimo',
        'TCC',
        'Coordinadora',
        'Deprisa',
        'Otro',
    ];

    protected $fillable = [
        'id',
        'pedido_id',
        'operador',
        'numero_guia',
        'url_rastreo',
        'estado',
        'fecha_envio',
        'fecha_estimada_entrega',
        'fecha_entrega_real',
        'costo',
        'notas',
    ];

    protected $casts = [
        'costo'                  => 'decimal:2',
        'fecha_envio'            => 'date',
        'fecha_estimada_entrega' => 'date',
        'fecha_entrega_real'     => 'date',
    ];

    // ─── BOOT ─────────────────────────────────────────────────────────────
    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    // ─── RELACIONES ───────────────────────────────────────────────────────

    public function pedido(): BelongsTo
    {
        return $this->belongsTo(Pedido::class, 'pedido_id', 'id');
    }

    // ─── HELPERS ──────────────────────────────────────────────────────────

    /*
    | estaEnTransito() — ¿Está el paquete en camino?
    */
    public function estaEnTransito(): bool
    {
        return in_array($this->estado, ['recogido', 'en_transito']);
    }

    /*
    | diasEnTransito() — ¿Cuántos días lleva en tránsito?
    */
    public function diasEnTransito(): int
    {
        if (!$this->fecha_envio) return 0;
        $fin = $this->fecha_entrega_real ?? now();
        return $this->fecha_envio->diffInDays($fin);
    }

    /*
    | tieneGuia() — ¿Ya tiene número de guía asignado?
    */
    public function tieneGuia(): bool
    {
        return !empty($this->numero_guia);
    }
}
