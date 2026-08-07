<?php

/*
|--------------------------------------------------------------------------
| MODELO: Transaccion
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué representa este modelo?
|
|   Cada pago recibido por un pedido es una Transaccion.
|   Puede crearse manualmente (el vendedor la registra) o automáticamente
|   cuando Wompi envía un webhook confirmando el pago.
|
| PENSAR — ¿Por qué NO usamos SoftDeletes aquí?
|
|   Los registros financieros son inmutables. En contabilidad, nunca se
|   "elimina" un pago — se anula. Por eso el flujo correcto es:
|     estado: pendiente → aprobada (pago exitoso)
|     estado: pendiente → rechazada (banco rechazó)
|     estado: aprobada → anulada (vendedor la revierte)
|   El historial financiero siempre debe quedar completo.
|
*/

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Transaccion extends Model
{
    // ── CONFIGURACIÓN UUID ────────────────────────────────────────────────
    protected $table      = 'transacciones';
    protected $keyType    = 'string';
    public    $incrementing = false;

    // ── FECHAS EN ESPAÑOL ─────────────────────────────────────────────────
    const CREATED_AT = 'creado_en';
    const UPDATED_AT = 'actualizado_en';

    // ── ESTADOS ───────────────────────────────────────────────────────────
    const ESTADO_PENDIENTE  = 'pendiente';
    const ESTADO_APROBADA   = 'aprobada';
    const ESTADO_RECHAZADA  = 'rechazada';
    const ESTADO_ANULADA    = 'anulada';
    const ESTADO_ERROR      = 'error';

    // ── MÉTODOS DE PAGO ───────────────────────────────────────────────────
    const METODO_EFECTIVO         = 'efectivo';
    const METODO_TRANSFERENCIA    = 'transferencia';
    const METODO_NEQUI            = 'nequi';
    const METODO_PSE              = 'pse';
    const METODO_TARJETA_CREDITO  = 'tarjeta_credito';
    const METODO_TARJETA_DEBITO   = 'tarjeta_debito';
    const METODO_WOMPI            = 'wompi';
    const METODO_OTRO             = 'otro';

    // ── FILLABLE ──────────────────────────────────────────────────────────
    protected $fillable = [
        'pedido_id',
        'referencia_wompi',
        'referencia_pago',
        'metodo_pago',
        'monto',
        'estado',
        'descripcion',
        'datos_wompi',
        'pagado_en',
    ];

    // ── CASTS ─────────────────────────────────────────────────────────────
    // Laravel convierte automáticamente el tipo al leer/escribir
    protected $casts = [
        'monto'       => 'decimal:2',
        'datos_wompi' => 'array',     // JSONB → array PHP automáticamente
        'pagado_en'   => 'datetime',
        'creado_en'   => 'datetime',
    ];

    // ── BOOT: UUID automático ─────────────────────────────────────────────
    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (self $transaccion) {
            if (empty($transaccion->id)) {
                $transaccion->id = (string) Str::uuid();
            }
        });

        // Al aprobar, registrar fecha de pago
        static::updating(function (self $transaccion) {
            if (
                $transaccion->isDirty('estado') &&
                $transaccion->estado === self::ESTADO_APROBADA &&
                is_null($transaccion->pagado_en)
            ) {
                $transaccion->pagado_en = now();
            }
        });
    }

    // ── RELACIONES ────────────────────────────────────────────────────────

    /**
     * El pedido al que pertenece esta transacción.
     */
    public function pedido(): BelongsTo
    {
        return $this->belongsTo(Pedido::class, 'pedido_id');
    }

    // ── SCOPES ────────────────────────────────────────────────────────────

    /**
     * Solo transacciones aprobadas.
     * Uso: Transaccion::aprobadas()->sum('monto')
     */
    public function scopeAprobadas($query)
    {
        return $query->where('estado', self::ESTADO_APROBADA);
    }

    /**
     * Transacciones del mes actual.
     */
    public function scopeDelMes($query)
    {
        return $query->whereMonth('creado_en', now()->month)
                     ->whereYear('creado_en', now()->year);
    }

    /**
     * Transacciones de hoy.
     */
    public function scopeDeHoy($query)
    {
        return $query->whereDate('creado_en', today());
    }

    // ── HELPERS ───────────────────────────────────────────────────────────

    /**
     * ¿La transacción está aprobada?
     */
    public function estaAprobada(): bool
    {
        return $this->estado === self::ESTADO_APROBADA;
    }

    /**
     * ¿La transacción está pendiente?
     */
    public function estaPendiente(): bool
    {
        return $this->estado === self::ESTADO_PENDIENTE;
    }

    /**
     * ¿La transacción vino de Wompi?
     */
    public function esDeWompi(): bool
    {
        return $this->metodo_pago === self::METODO_WOMPI &&
               !is_null($this->referencia_wompi);
    }

    /**
     * Color del badge según estado (para React).
     */
    public function colorEstado(): string
    {
        return match($this->estado) {
            self::ESTADO_APROBADA  => 'bg-green-100 text-green-800',
            self::ESTADO_PENDIENTE => 'bg-yellow-100 text-yellow-800',
            self::ESTADO_RECHAZADA => 'bg-red-100 text-red-800',
            self::ESTADO_ANULADA   => 'bg-gray-100 text-gray-600',
            self::ESTADO_ERROR     => 'bg-orange-100 text-orange-800',
            default                => 'bg-gray-100 text-gray-500',
        };
    }

    /**
     * Etiqueta legible del método de pago.
     */
    public function etiquetaMetodo(): string
    {
        return match($this->metodo_pago) {
            self::METODO_EFECTIVO        => 'Efectivo',
            self::METODO_TRANSFERENCIA   => 'Transferencia',
            self::METODO_NEQUI           => 'Nequi',
            self::METODO_PSE             => 'PSE',
            self::METODO_TARJETA_CREDITO => 'Tarjeta Crédito',
            self::METODO_TARJETA_DEBITO  => 'Tarjeta Débito',
            self::METODO_WOMPI           => 'Wompi',
            default                      => 'Otro',
        };
    }

    // ── ESTÁTICOS ─────────────────────────────────────────────────────────

    /**
     * Array de todos los estados (para selects y validaciones).
     */
    public static function todosLosEstados(): array
    {
        return [
            self::ESTADO_PENDIENTE,
            self::ESTADO_APROBADA,
            self::ESTADO_RECHAZADA,
            self::ESTADO_ANULADA,
            self::ESTADO_ERROR,
        ];
    }

    /**
     * Array de todos los métodos de pago.
     */
    public static function todosLosMetodos(): array
    {
        return [
            self::METODO_EFECTIVO,
            self::METODO_TRANSFERENCIA,
            self::METODO_NEQUI,
            self::METODO_PSE,
            self::METODO_TARJETA_CREDITO,
            self::METODO_TARJETA_DEBITO,
            self::METODO_WOMPI,
            self::METODO_OTRO,
        ];
    }

    /**
     * Array de métodos con etiqueta legible (para selects React).
     * Retorna: [['value' => 'nequi', 'label' => 'Nequi'], ...]
     */
    public static function metodosConEtiqueta(): array
    {
        $etiquetas = [
            self::METODO_EFECTIVO        => 'Efectivo',
            self::METODO_TRANSFERENCIA   => 'Transferencia bancaria',
            self::METODO_NEQUI           => 'Nequi',
            self::METODO_PSE             => 'PSE',
            self::METODO_TARJETA_CREDITO => 'Tarjeta de crédito',
            self::METODO_TARJETA_DEBITO  => 'Tarjeta débito',
            self::METODO_WOMPI           => 'Wompi (link de pago)',
            self::METODO_OTRO            => 'Otro',
        ];

        return collect($etiquetas)
            ->map(fn ($label, $value) => compact('value', 'label'))
            ->values()
            ->toArray();
    }
}
