<?php

/*
|--------------------------------------------------------------------------
| MODELO: Proveedor
|--------------------------------------------------------------------------
|
| Representa a los proveedores del sistema de dropshipping.
| Un Proveedor siempre tiene un Usuario asociado para poder iniciar sesión.
|
| PATRÓN USADO: Perfil extendido
|   Usuario (login, email, contraseña)
|       └── Proveedor (datos de negocio: empresa, NIT, condiciones de pago)
|
| Esto es mejor que poner todos los campos en la tabla 'usuarios'
| porque los campos de proveedor son NULL para el 99% de los usuarios (clientes).
|
*/

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Proveedor extends Model
{
    use HasFactory;

    /*
    |----------------------------------------------------------------------
    | NOMBRE DE LA TABLA
    |----------------------------------------------------------------------
    | 'proveedores' — en español, plural, snake_case
    */
    protected $table = 'proveedores';

    /*
    |----------------------------------------------------------------------
    | CLAVE PRIMARIA
    |----------------------------------------------------------------------
    | Le decimos a Eloquent que la PK es UUID (string), no un integer
    | autoincremental. Esto es necesario porque usamos gen_random_uuid().
    */
    protected $primaryKey = 'id';
    public $incrementing = false;    // UUID no es autoincremental
    protected $keyType = 'string';   // UUID es string, no integer

    /*
    |----------------------------------------------------------------------
    | boot() — Genera UUID en PHP antes de insertar
    |----------------------------------------------------------------------
    | Regla del proyecto: todos los modelos UUID usan este boot().
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
    | NOMBRES DE TIMESTAMPS
    |----------------------------------------------------------------------
    */
    const CREATED_AT = 'creado_en';
    const UPDATED_AT = 'actualizado_en';

    /*
    |----------------------------------------------------------------------
    | FILLABLE — Campos asignables masivamente
    |----------------------------------------------------------------------
    */
    protected $fillable = [
        'usuario_id',
        'nombre_empresa',
        'numero_identificacion',
        'persona_contacto',
        'telefono',
        'email',
        'ciudad',
        'direccion',
        'sitio_web',
        'condiciones_pago',
        'metodos_pago',
        'moneda',
        'metodos_envio',
        'politica_devoluciones',
        'estado',
        'notas_internas',
    ];

    /*
    |----------------------------------------------------------------------
    | CASTS
    |----------------------------------------------------------------------
    |
    | 'metodos_pago' y 'metodos_envio' son JSONB en la BD.
    | Con el cast 'array', Laravel los convierte automáticamente:
    |
    |   BD guarda: '["transferencia_bancaria","paypal"]'
    |   PHP recibe: ['transferencia_bancaria', 'paypal']
    |
    |   Al guardar: $proveedor->metodos_pago = ['transferencia', 'pse']
    |   → Laravel lo convierte a JSON automáticamente
    |
    */
    protected function casts(): array
    {
        return [
            'metodos_pago'   => 'array',   // JSONB → array PHP
            'metodos_envio'  => 'array',   // JSONB → array PHP
            'calificacion'   => 'decimal:2',
        ];
    }

    /*
    |----------------------------------------------------------------------
    | RELACIONES
    |----------------------------------------------------------------------
    */

    /**
     * El usuario que "es" este proveedor.
     *
     * TIPO: belongsTo (el proveedor PERTENECE a un usuario)
     * SQL: SELECT * FROM usuarios WHERE id = proveedores.usuario_id
     *
     * Uso: $proveedor->usuario->email
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function usuario()
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }

    /**
     * Los productos que tiene este proveedor.
     *
     * TIPO: belongsToMany (muchos a muchos con tabla pivot)
     * La tabla pivot 'producto_proveedor' conecta productos con proveedores
     * y tiene datos adicionales: precio del proveedor, stock, es_predeterminado
     *
     * SQL: SELECT productos.* FROM productos
     *      INNER JOIN producto_proveedor ON producto_proveedor.producto_id = productos.id
     *      WHERE producto_proveedor.proveedor_id = ?
     *
     * Uso: $proveedor->productos()->where('estado', 'activo')->get()
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
     */
    public function productos()
    {
        return $this->belongsToMany(
            \App\Models\Producto::class,    // Modelo relacionado
            'producto_proveedor',           // Tabla pivot
            'proveedor_id',                 // FK en la pivot que apunta a Proveedor
            'producto_id'                   // FK en la pivot que apunta a Producto
        )->withPivot([                      // Campos extra de la tabla pivot
            'sku_proveedor',
            'precio',
            'stock',
            'pedido_minimo',
            'tiempo_entrega',
            'costo_envio',
            'es_predeterminado',
        ])->withTimestamps('creado_en', 'actualizado_en');
    }

    /**
     * Pagos que el admin ha hecho a este proveedor.
     * HasMany: 'pagos_proveedor'.proveedor_id → 'proveedores'.id
     */
    public function pagosRecibidos(): HasMany
    {
        return $this->hasMany(PagoProveedor::class, 'proveedor_id');
    }

    /*
    |----------------------------------------------------------------------
    | SCOPES — Filtros reutilizables
    |----------------------------------------------------------------------
    |
    | Un scope es un filtro predefinido que puedes encadenar en queries.
    |
    | SIN scope:
    |   Proveedor::where('estado', 'activo')->where('calificacion', '>=', 4)->get()
    |
    | CON scopes:
    |   Proveedor::activos()->conBuenaCalificacion()->get()
    |
    | Más legible, más reutilizable.
    |
    */

    /**
     * Solo proveedores activos
     * Uso: Proveedor::activos()->get()
     */
    public function scopeActivos($query)
    {
        return $query->where('estado', 'activo');
    }

    /**
     * Proveedores con calificación >= 4.0
     * Uso: Proveedor::conBuenaCalificacion()->get()
     */
    public function scopeConBuenaCalificacion($query, float $minimo = 4.0)
    {
        return $query->where('calificacion', '>=', $minimo);
    }
}
