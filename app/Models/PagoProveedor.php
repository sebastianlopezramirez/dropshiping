<?php

/*
|--------------------------------------------------------------------------
| MODELO: PagoProveedor
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué representa este modelo?
|
|   Un registro de pago que el admin hace a un proveedor.
|   Cuando el admin liquida la deuda acumulada (ej: $500K del mes de agosto),
|   crea un PagoProveedor. El proveedor lo ve en su historial de cobros.
|
| PENSAR — ¿Cómo se calcula lo que falta pagar?
|
|   deuda_total     = SUM(items.precio_costo × items.cantidad)
|                     WHERE pedido.estado IN (confirmado, entregado)
|                     AND item.producto.proveedores.id = proveedor_id
|
|   total_pagado    = SUM(pagos_proveedor.monto) WHERE proveedor_id = ?
|
|   saldo_pendiente = deuda_total - total_pagado
|
*/

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class PagoProveedor extends Model
{
    protected $table = 'pagos_proveedor';

    // UUID como PK
    protected $primaryKey = 'id';
    public $incrementing  = false;
    protected $keyType    = 'string';

    // Timestamps en español
    const CREATED_AT = 'creado_en';
    const UPDATED_AT = 'actualizado_en';

    protected $fillable = [
        'id',
        'proveedor_id',
        'monto',
        'fecha_pago',
        'metodo_pago',
        'concepto',
        'registrado_por',
        'notas',
    ];

    protected $casts = [
        'monto'      => 'decimal:2',
        'fecha_pago' => 'date',
    ];

    // Métodos de pago disponibles
    const METODOS = [
        'transferencia' => 'Transferencia bancaria',
        'nequi'         => 'Nequi',
        'efectivo'      => 'Efectivo',
        'otro'          => 'Otro',
    ];

    // ─── BOOT — UUID automático ───────────────────────────────────────────
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

    /**
     * El proveedor al que se le pagó.
     */
    public function proveedor(): BelongsTo
    {
        return $this->belongsTo(Proveedor::class, 'proveedor_id');
    }

    /**
     * El admin que registró el pago.
     */
    public function registradoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'registrado_por');
    }
}
