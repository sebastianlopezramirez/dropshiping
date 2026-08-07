<?php

/*
|--------------------------------------------------------------------------
| MODELO: ItemPedido
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué es un ítem del pedido?
|
|   Es una línea dentro del pedido. Guarda el snapshot del producto
|   al momento de la venta: nombre, precio, costo, imagen.
|
|   Relación: Pedido (1) → tiene muchos → ItemPedido (N)
|
*/

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class ItemPedido extends Model
{
    protected $table      = 'items_pedido';
    protected $keyType    = 'string';
    public    $incrementing = false;

    const CREATED_AT = 'creado_en';
    const UPDATED_AT = 'actualizado_en';

    protected $fillable = [
        'id',
        'pedido_id',
        'producto_id',
        'nombre_producto',
        'sku',
        'imagen_url',
        'cantidad',
        'precio_unitario',
        'precio_costo',
        'descuento',
        'subtotal',
    ];

    protected $casts = [
        'cantidad'        => 'integer',
        'precio_unitario' => 'decimal:2',
        'precio_costo'    => 'decimal:2',
        'descuento'       => 'decimal:2',
        'subtotal'        => 'decimal:2',
    ];

    // ─── BOOT ─────────────────────────────────────────────────────────────
    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }

            // Calculamos el subtotal automáticamente al crear el ítem
            // subtotal = (precio × cantidad) - descuento
            $model->subtotal = ($model->precio_unitario * $model->cantidad) - $model->descuento;
        });
    }

    // ─── RELACIONES ───────────────────────────────────────────────────────

    /*
    | pedido() — El ítem pertenece a un pedido
    */
    public function pedido(): BelongsTo
    {
        return $this->belongsTo(Pedido::class, 'pedido_id', 'id');
    }

    /*
    | producto() — El producto original (puede ser null si fue eliminado)
    |
    | Aunque el producto se elimine (soft delete), el ítem sigue
    | existiendo con su snapshot de nombre y precio.
    */
    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class, 'producto_id', 'id')
                    ->withTrashed(); // Incluye productos soft-deleted
    }

    // ─── HELPERS ──────────────────────────────────────────────────────────

    /*
    | ganancia() — Ganancia de este ítem específico
    | = (precio_venta - precio_costo) × cantidad
    */
    public function ganancia(): float
    {
        return ($this->precio_unitario - $this->precio_costo) * $this->cantidad;
    }

    /*
    | margenPorcentaje() — Margen de ganancia en porcentaje
    */
    public function margenPorcentaje(): float
    {
        if ($this->precio_unitario <= 0) return 0;
        return round(($this->ganancia() / ($this->precio_unitario * $this->cantidad)) * 100, 1);
    }

    // ─── MÉTODO ESTÁTICO: crearDesdeProducto ──────────────────────────────
    /*
    | Crea un ítem a partir de un modelo Producto.
    | Hace el snapshot automáticamente.
    |
    | Uso en el controller:
    |   ItemPedido::crearDesdeProducto($pedido->id, $producto, $cantidad)
    */
    public static function crearDesdeProducto(
        string   $pedidoId,
        Producto $producto,
        int      $cantidad = 1,
        float    $descuento = 0
    ): self {
        return self::create([
            'pedido_id'       => $pedidoId,
            'producto_id'     => $producto->id,
            // Snapshot del producto al momento de la venta
            'nombre_producto' => $producto->nombre,
            'sku'             => $producto->sku,
            'imagen_url'      => $producto->imagenPrincipal(),
            'cantidad'        => $cantidad,
            'precio_unitario' => $producto->precioFinal(), // precio_oferta si existe, si no precio_venta
            'precio_costo'    => $producto->precio_costo,
            'descuento'       => $descuento,
            // subtotal se calcula en boot()
        ]);
    }
}
