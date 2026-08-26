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
|   esValido($total)         → verifica si el cupón puede usarse ahora mismo
|   aplicaAItems($ids, $cats)→ verifica si el cupón aplica a los ítems del carrito
|   calcularDescuento($total, $subtotalElegible) → calcula el descuento real
|   incrementarUso()         → suma 1 al contador de usos
|
*/

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
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
        'aplica_a',
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

    /** Pedidos que usaron este cupón. */
    public function pedidos(): HasMany
    {
        return $this->hasMany(Pedido::class, 'cupon_id');
    }

    /** Categorías donde aplica (cuando aplica_a = 'categorias'). */
    public function categorias(): BelongsToMany
    {
        return $this->belongsToMany(Categoria::class, 'cupon_categoria', 'cupon_id', 'categoria_id');
    }

    /** Productos donde aplica (cuando aplica_a = 'productos'). */
    public function productos(): BelongsToMany
    {
        return $this->belongsToMany(Producto::class, 'cupon_producto', 'cupon_id', 'producto_id');
    }

    /*
    |----------------------------------------------------------------------
    | MÉTODOS DE NEGOCIO
    |----------------------------------------------------------------------
    |
    | Centralizamos la lógica del cupón aquí para no repetirla en
    | el controller.
    |
    */

    /**
     * ¿El cupón puede usarse ahora mismo?
     *
     * Verifica 5 condiciones:
     *   1. activo = true
     *   2. Ha comenzado (fecha_inicio)
     *   3. No ha expirado (fecha_expiracion)
     *   4. Aún no llegó a su límite de usos
     *   5. El monto del pedido supera el mínimo de compra
     *
     * @param float $totalPedido — monto total del pedido ANTES del descuento
     * @return array ['valido' => bool, 'mensaje' => string]
     */
    public function esValido(float $totalPedido): array
    {
        if (!$this->activo) {
            return ['valido' => false, 'mensaje' => 'Este cupón no está activo.'];
        }

        if ($this->fecha_inicio && now()->startOfDay()->lt($this->fecha_inicio)) {
            return ['valido' => false, 'mensaje' => 'Este cupón aún no está vigente.'];
        }

        if ($this->fecha_expiracion && now()->startOfDay()->gt($this->fecha_expiracion)) {
            return ['valido' => false, 'mensaje' => 'Este cupón ya expiró.'];
        }

        if ($this->limite_usos !== null && $this->usos_actuales >= $this->limite_usos) {
            return ['valido' => false, 'mensaje' => 'Este cupón ya fue usado el máximo de veces.'];
        }

        if ($totalPedido < $this->minimo_compra) {
            $minimo = number_format($this->minimo_compra, 0, ',', '.');
            return ['valido' => false, 'mensaje' => "Este cupón requiere una compra mínima de \${$minimo}."];
        }

        return ['valido' => true, 'mensaje' => 'Cupón válido.'];
    }

    /**
     * ¿Este cupón aplica a los ítems del carrito?
     *
     * Retorna el subtotal elegible (la parte del carrito sobre la que aplica
     * el descuento). Si no aplica a ningún ítem, devuelve 0.
     *
     * @param array $items   Array de ['producto_id' => string, 'subtotal' => float, 'categoria_id' => string|null]
     * @return float         Subtotal elegible para descuento (0 si no aplica)
     */
    public function subtotalElegible(array $items): float
    {
        // 'todo' → aplica a todos los ítems
        if ($this->aplica_a === 'todo') {
            return (float) collect($items)->sum('subtotal');
        }

        // 'categorias' → solo ítems cuya categoría esté en la lista
        if ($this->aplica_a === 'categorias') {
            $catIds = $this->categorias()->pluck('categorias.id')->toArray();
            if (empty($catIds)) return 0;

            return (float) collect($items)
                ->filter(fn($i) => in_array($i['categoria_id'] ?? null, $catIds))
                ->sum('subtotal');
        }

        // 'productos' → solo ítems cuyo producto_id esté en la lista
        if ($this->aplica_a === 'productos') {
            $prodIds = $this->productos()->pluck('productos.id')->toArray();
            if (empty($prodIds)) return 0;

            return (float) collect($items)
                ->filter(fn($i) => in_array($i['producto_id'] ?? null, $prodIds))
                ->sum('subtotal');
        }

        return 0;
    }

    /**
     * Calcula el descuento en pesos sobre el subtotal elegible.
     *
     * @param float $subtotalElegible — monto elegible para descuento
     * @return float                  — descuento en pesos a restar
     */
    public function calcularDescuento(float $subtotalElegible): float
    {
        if ($subtotalElegible <= 0) return 0;

        if ($this->tipo === 'porcentaje') {
            $descuento = $subtotalElegible * ($this->valor / 100);

            // Aplicar tope si existe
            if ($this->maximo_descuento !== null) {
                $descuento = min($descuento, $this->maximo_descuento);
            }
        } else {
            // valor_fijo
            $descuento = $this->valor;
        }

        // El descuento no puede superar el subtotal elegible
        return min($descuento, $subtotalElegible);
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
