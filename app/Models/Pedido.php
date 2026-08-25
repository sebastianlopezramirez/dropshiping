<?php

/*
|--------------------------------------------------------------------------
| MODELO: Pedido
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué hace un Modelo Eloquent?
|
|   El modelo es el puente entre PHP y la tabla de la BD.
|   Cada instancia de Pedido = una fila de la tabla 'pedidos'.
|
|   Pedido::all()         → SELECT * FROM pedidos
|   Pedido::find($id)     → SELECT * FROM pedidos WHERE id = $id
|   $pedido->items        → SELECT * FROM items_pedido WHERE pedido_id = $id
|   $pedido->save()       → UPDATE pedidos SET ... WHERE id = $id
|
| PENSAR — ¿Qué necesita este modelo?
|
|   1. UUID como PK (patrón establecido en el proyecto)
|   2. SoftDeletes en español ('eliminado_en')
|   3. Timestamps en español ('creado_en', 'actualizado_en')
|   4. Relaciones: items(), envio(), usuario()
|   5. Scopes para filtrar por estado
|   6. Helpers: generarNumero(), gananciaTotal(), puedeEnviarse()
|   7. Generación automática del número de pedido (PED-2026-00001)
|
*/

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Pedido extends Model
{
    // ─── CONFIGURACIÓN DE LA TABLA ────────────────────────────────────────

    use SoftDeletes;

    protected $table      = 'pedidos';
    protected $keyType    = 'string';  // UUID = string, no integer
    public    $incrementing = false;   // UUID no es auto-increment

    // Nombres de columnas de timestamps en español
    const CREATED_AT = 'creado_en';
    const UPDATED_AT = 'actualizado_en';
    const DELETED_AT = 'eliminado_en';

    // ─── CAMPOS PERMITIDOS PARA ASIGNACIÓN MASIVA ─────────────────────────
    protected $fillable = [
        'id',
        'numero_pedido',
        'cliente_nombre',
        'cliente_email',
        'cliente_telefono',
        'cliente_documento',
        'direccion_entrega',
        'ciudad',
        'departamento',
        'codigo_postal',
        'barrio',
        'estado',
        'metodo_pago',
        'subtotal',
        'descuento',
        'costo_envio',
        'total',
        'usuario_id',
        'notas',
        'notas_internas',
        'cancelado_en',
        // FASE 7 — Marketing
        'cupon_id',
        'cupon_codigo',
        'descuento_aplicado',
        'campana_id',
    ];

    // ─── CASTS ────────────────────────────────────────────────────────────
    // Eloquent convierte automáticamente estos tipos al leer de la BD
    protected $casts = [
        'subtotal'            => 'decimal:2',
        'descuento'           => 'decimal:2',
        'costo_envio'         => 'decimal:2',
        'total'               => 'decimal:2',
        'descuento_aplicado'  => 'decimal:2',
        'cancelado_en'        => 'datetime',
        'creado_en'           => 'datetime',
        'actualizado_en'      => 'datetime',
        'eliminado_en'        => 'datetime',
    ];

    // ─── ESTADOS DISPONIBLES ──────────────────────────────────────────────
    // PENSAR — 4 estados claros para el flujo del negocio:
    //   pendiente  → pedido creado, stock reservado, esperando pago
    //   confirmado → admin confirmó pago → se crea Transaccion automáticamente
    //   entregado  → producto recibido por el cliente
    //   cancelado  → pedido anulado → stock restaurado
    const ESTADO_PENDIENTE  = 'pendiente';
    const ESTADO_CONFIRMADO = 'confirmado';
    const ESTADO_ENTREGADO  = 'entregado';
    const ESTADO_CANCELADO  = 'cancelado';

    // ─── BOOT — UUID + NÚMERO DE PEDIDO AUTO-GENERADO ─────────────────────
    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($model) {
            // UUID generado en PHP (consistente con el resto de modelos)
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }

            // Número de pedido legible: PED-2026-00001
            // Se genera aquí para garantizar unicidad antes de guardar en BD
            if (empty($model->numero_pedido)) {
                $model->numero_pedido = self::generarNumeroPedido();
            }
        });
    }

    // ─── RELACIONES ───────────────────────────────────────────────────────

    /*
    | items() — Un pedido tiene muchos ítems (productos comprados)
    | HasMany: 'items_pedido'.pedido_id → 'pedidos'.id
    */
    public function items(): HasMany
    {
        return $this->hasMany(ItemPedido::class, 'pedido_id', 'id');
    }

    /*
    | envio() — Un pedido tiene un envío (o ninguno, si aún no se ha enviado)
    | HasOne: 'envios'.pedido_id → 'pedidos'.id
    */
    public function envio(): HasOne
    {
        return $this->hasOne(Envio::class, 'pedido_id', 'id');
    }

    /**
     * transacciones() — Un pedido puede tener varios pagos.
     * HasMany: 'transacciones'.pedido_id → 'pedidos'.id
     */
    public function transacciones(): HasMany
    {
        return $this->hasMany(Transaccion::class, 'pedido_id', 'id');
    }

    /*
    | usuario() — El usuario del sistema que registró/gestionó el pedido
    */
    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_id', 'id');
    }

    /*
    | cupon() — El cupón de descuento aplicado (null si no usó cupón)
    */
    public function cupon(): BelongsTo
    {
        return $this->belongsTo(Cupon::class, 'cupon_id', 'id');
    }

    /*
    | campana() — La campaña de marketing que originó este pedido (null si no aplica)
    */
    public function campana(): BelongsTo
    {
        return $this->belongsTo(Campana::class, 'campana_id', 'id');
    }

    // ─── SCOPES ───────────────────────────────────────────────────────────
    // Un scope es un filtro reutilizable que se encadena al query builder.
    // Uso: Pedido::pendientes()->get() → WHERE estado = 'pendiente'

    public function scopePendientes($query)
    {
        return $query->where('estado', self::ESTADO_PENDIENTE);
    }

    public function scopeConfirmados($query)
    {
        return $query->where('estado', self::ESTADO_CONFIRMADO);
    }

    public function scopeEntregados($query)
    {
        return $query->where('estado', self::ESTADO_ENTREGADO);
    }

    public function scopeActivos($query)
    {
        // Pedidos que NO están cancelados
        return $query->where('estado', '!=', self::ESTADO_CANCELADO);
    }

    public function scopeDelMes($query)
    {
        return $query->whereMonth('creado_en', now()->month)
                     ->whereYear('creado_en', now()->year);
    }

    // ─── HELPERS DE NEGOCIO ───────────────────────────────────────────────

    /*
    | gananciaTotal() — Calcula la ganancia del pedido
    |
    | ganancia = suma de (precio_venta - precio_costo) × cantidad de cada ítem
    |
    | Se carga con eager loading:
    |   $pedido->load('items') antes de llamar este método.
    */
    public function gananciaTotal(): float
    {
        return $this->items->sum(function ($item) {
            return ($item->precio_unitario - $item->precio_costo) * $item->cantidad;
        });
    }

    /*
    | puedeEnviarse() — ¿El pedido está listo para generar guía?
    */
    public function puedeEnviarse(): bool
    {
        return $this->estado === self::ESTADO_CONFIRMADO;
    }

    /*
    | puedeCancelarse() — ¿Aún se puede cancelar?
    | Solo pedidos entregados y ya cancelados no se pueden cancelar.
    */
    public function puedeCancelarse(): bool
    {
        return !in_array($this->estado, [
            self::ESTADO_ENTREGADO,
            self::ESTADO_CANCELADO,
        ]);
    }

    /*
    | colorEstado() — Color del badge según el estado (para la vista React)
    |
    | Retorna clases Tailwind CSS para el badge de estado.
    */
    public function colorEstado(): string
    {
        return match($this->estado) {
            'pendiente'  => 'bg-yellow-100 text-yellow-800',
            'confirmado' => 'bg-blue-100 text-blue-800',
            'entregado'  => 'bg-green-100 text-green-800',
            'cancelado'  => 'bg-red-100 text-red-800',
            default      => 'bg-gray-100 text-gray-600',
        };
    }

    // ─── HELPERS ESTÁTICOS ────────────────────────────────────────────────

    /*
    | generarNumeroPedido() — Genera el próximo número de pedido
    |
    | Formato: PED-YYYY-NNNNN
    | Ejemplos: PED-2026-00001, PED-2026-00002, PED-2027-00001
    |
    | El contador reinicia cada año.
    */
    public static function generarNumeroPedido(): string
    {
        $año = now()->year;

        // Cuenta cuántos pedidos hay este año para el correlativo
        $correlativo = self::whereYear('creado_en', $año)->withTrashed()->count() + 1;

        // Formatea con ceros a la izquierda: 1 → '00001'
        return 'PED-' . $año . '-' . str_pad($correlativo, 5, '0', STR_PAD_LEFT);
    }

    /*
    | todosLosEstados() — Lista de estados para selectores en formularios React
    */
    public static function todosLosEstados(): array
    {
        return [
            self::ESTADO_PENDIENTE,
            self::ESTADO_CONFIRMADO,
            self::ESTADO_ENTREGADO,
            self::ESTADO_CANCELADO,
        ];
    }
}
