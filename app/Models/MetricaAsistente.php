<?php

/*
|--------------------------------------------------------------------------
| MODEL: MetricaAsistente
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué representa?
|
|   Guarda las métricas REALES que el super_administrador ingresa
|   manualmente después de revisar Meta Ads / Instagram Insights.
|   Por cada producto y por cada fase de optimización.
|
|   ⚠️ Las respuestas de la IA (Groq) NO se guardan aquí.
|      Se regeneran bajo demanda para evitar bloat en la BD.
|
| TABLA: metricas_asistente
| RELACIÓN: Muchas métricas → un Producto (BelongsTo)
|
*/

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class MetricaAsistente extends Model
{
    protected $table = 'metricas_asistente';

    const CREATED_AT  = 'creado_en';
    const UPDATED_AT  = 'actualizado_en';

    protected $keyType   = 'string';
    public    $incrementing = false;

    protected static function boot(): void
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    protected $fillable = [
        'producto_id',
        'fase',
        'ctr',
        'roas',
        'cpa',
        'ventas',
        'gasto',
        'ingresos',
        'notas',
        'creado_por',
    ];

    protected function casts(): array
    {
        return [
            'fase'          => 'integer',
            'ctr'           => 'decimal:2',
            'roas'          => 'decimal:2',
            'cpa'           => 'decimal:2',
            'ventas'        => 'integer',
            'gasto'         => 'decimal:2',
            'ingresos'      => 'decimal:2',
            'creado_en'     => 'datetime',
            'actualizado_en' => 'datetime',
        ];
    }

    // ──────────────────────────────────────────────
    // RELACIONES
    // ──────────────────────────────────────────────

    /** Producto al que pertenecen estas métricas */
    public function producto()
    {
        return $this->belongsTo(Producto::class, 'producto_id');
    }

    /** Usuario que registró las métricas */
    public function creadoPor()
    {
        return $this->belongsTo(Usuario::class, 'creado_por');
    }

    // ──────────────────────────────────────────────
    // SCOPES ÚTILES
    // ──────────────────────────────────────────────

    /** Filtrar por producto */
    public function scopeDeProducto($query, string $productoId)
    {
        return $query->where('producto_id', $productoId);
    }

    /** Filtrar por fase */
    public function scopeDeFase($query, int $fase)
    {
        return $query->where('fase', $fase);
    }
}
