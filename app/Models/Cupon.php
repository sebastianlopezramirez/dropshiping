<?php

/*
|--------------------------------------------------------------------------
| MODELO: Cupon
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué representa este modelo?
|
|   Cada instancia es un cupón de descuento que el negocio crea
|   para incentivar ventas. Los cupones se validan al crear un pedido.
|
| PENSAR — Métodos importantes de este modelo:
|
|   esValido()   → verifica si el cupón puede usarse ahora mismo
|   calcularDescuento($total) → calcula cuánto descuenta sobre un monto
|   incrementarUso() → suma 1 al contador de usos
|
*/

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Cupon extends Model
{
    protected $table = 'cupones';

    const CREATED_AT  = 'creado_en';
    const UPDATED_AT  = 'actualizado_en';

    protected $keyType    = 'string';
    public $incrementing  = false;

    protected static function boot(): void
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
            // El código siempre en mayúsculas
            if (!empty($model->codigo)) {
                $model->codigo = strtoupper($model->codigo);
            }
        });
    }

    protected $fillable = [
        'codigo',
        'descripcion',
        'tipo',
        'valor',
        'minimo_compra',
        'maximo_descuento',
        'limite_usos',
        'usos_actuales',
        'fecha_inicio',
        'fecha_expiracion',
        'activo',
    ];

    protected function casts(): array
    {
        return [
            'activo'           => 'boolean',
            'valor'            => 'decimal:2',
            'minimo_compra'    => 'decimal:2',
            'maximo_descuento' => 'decimal:2',
            'fecha_inicio'     => 'date',
            'fecha_expiracion' => 'date',
            'creado_en'        => 'datetime',
            'actualizado_en'   => 'datetime',
        ];
    }

    /*
    |----------------------------------------------------------------------
    | RELACIONES
    |----------------------------------------------------------------------
    */

    /**
     * Pedidos que usaron este cupón.
     */
    public function pedidos(): HasMany
    {
        return $this->hasMany(Pedido::class, 'cupon_id');
    }

    /*
    |----------------------------------------------------------------------
    | MÉTODOS DE NEGOCIO
    |----------------------------------------------------------------------
    |
    | Centralizamos la lógica del cupón aquí para no repetirla en
    | el controller. El controller solo llama: $cupon->esValido($total)
    |
    */

    /**
     * ¿El cupón puede usarse ahora mismo?
     *
     * Verifica 4 condiciones:
     *   1. activo = true
     *   2. No ha expirado (fecha_expiracion)
     *   3. Aún no llegó a su límite de usos
     *   4. El monto del pedido supera el mínimo de compra
     *
     * @param float $totalPedido — monto total del pedido ANTES del descuento
     * @return array ['valido' => bool, 'mensaje' => string]
     */
    public function esValido(float $totalPedido): array
    {
        // 1. ¿Está activo?
        if (!$this->activo) {
            return ['valido' => false, 'mensaje' => 'Este cupón no está activo.'];
        }

        // 2. ¿Ha comenzado? (fecha_inicio)
        if ($this->fecha_inicio && now()->startOfDay()->lt($this->fecha_inicio)) {
            return ['valido' => false, 'mensaje' => 'Este cupón aún no está vigente.'];
        }

        // 3. ¿Ha expirado?
        if ($this->fecha_expiracion && now()->startOfDay()->gt($this->fecha_expiracion)) {
            return ['valido' => false, 'mensaje' => 'Este cupón ya expiró.'];
        }

        // 4. ¿Tiene usos disponibles?
        if ($this->limite_usos !== null && $this->usos_actuales >= $this->limite_usos) {
            return ['valido' => false, 'mensaje' => 'Este cupón ya fue usado el máximo de veces.'];
        }

        // 5. ¿Supera el mínimo de compra?
        if ($totalPedido < $this->minimo_compra) {
            $minimo = number_format($this->minimo_compra, 0, ',', '.');
            return ['valido' => false, 'mensaje' => "Este cupón requiere una compra mínima de $\${$minimo}."];
        }

        return ['valido' => true, 'mensaje' => 'Cupón válido.'];
    }

    /**
     * Calcula el descuento en pesos sobre un monto dado.
     *
     * Ejemplos:
     *   tipo=porcentaje, valor=20, total=200.000 → descuento = 40.000
     *   tipo=porcentaje, valor=20, total=200.000, maximo_descuento=30.000 → descuento = 30.000 (tope)
     *   tipo=valor_fijo, valor=50.000, total=200.000 → descuento = 50.000
     *   tipo=valor_fijo, valor=50.000, total=30.000  → descuento = 30.000 (no puede superar el total)
     *
     * @param float $total — monto del pedido ANTES del descuento
     * @return float — descuento en pesos a restar
     */
    public function calcularDescuento(float $total): float
    {
        if ($this->tipo === 'porcentaje') {
            $descuento = $total * ($this->valor / 100);

            // Aplicar tope si existe
            if ($this->maximo_descuento !== null) {
                $descuento = min($descuento, $this->maximo_descuento);
            }
        } else {
            // valor_fijo
            $descuento = $this->valor;
        }

        // El descuento no puede superar el total del pedido
        return min($descuento, $total);
    }

    /**
     * Incrementa el contador de usos en 1.
     * Se llama cuando un pedido confirma el uso del cupón.
     */
    public function incrementarUso(): void
    {
        $this->increment('usos_actuales');
    }

    /*
    |----------------------------------------------------------------------
    | SCOPES
    |----------------------------------------------------------------------
    */

    public function scopeActivos($query)
    {
        return $query->where('activo', true);
    }

    public function scopeVigentes($query)
    {
        return $query->where('activo', true)
                     ->where(fn($q) => $q->whereNull('fecha_expiracion')
                                         ->orWhere('fecha_expiracion', '>=', now()->toDateString()));
    }
}
