<?php

/*
|--------------------------------------------------------------------------
| MODELO: Categoria
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué representa este modelo?
|
|   Cada instancia de Categoria es una fila de la tabla 'categorias'.
|   Eloquent convierte automáticamente entre PHP y PostgreSQL.
|
|   Ejemplo:
|     $categoria = Categoria::find('uuid-aqui');
|     echo $categoria->nombre;     // "Camisas"
|     echo $categoria->padre->nombre; // "Ropa" (categoría padre)
|
| PENSAR — ¿Qué necesita este modelo?
|
|   1. UUID como PK → $keyType + $incrementing + boot()
|   2. Timestamps en español → CREATED_AT, UPDATED_AT
|   3. Relación con sí misma → padre() e hijos()
|   4. Relación con productos → productos()
|   5. Scopes → filtros reutilizables (solo activas, solo raíces)
|
*/

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Categoria extends Model
{
    use HasFactory;

    /*
    |----------------------------------------------------------------------
    | TABLA Y TIMESTAMPS
    |----------------------------------------------------------------------
    */
    protected $table = 'categorias';

    // Regla del proyecto: timestamps en español
    const CREATED_AT = 'creado_en';
    const UPDATED_AT = 'actualizado_en';

    /*
    |----------------------------------------------------------------------
    | CONFIGURACIÓN UUID
    |----------------------------------------------------------------------
    |
    | Igual que en User.php — obligatorio para todos los modelos con UUID.
    | Sin esto, Eloquent asume integer y falla.
    |
    */
    protected $keyType = 'string';
    public $incrementing = false;

    /*
    |----------------------------------------------------------------------
    | boot() — Genera UUID en PHP antes de insertar
    |----------------------------------------------------------------------
    |
    | PATRÓN del proyecto: todos los modelos con UUID usan este boot().
    | Genera el ID en PHP → Laravel lo conoce desde el inicio → no hay null.
    |
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
    | FILLABLE — Campos asignables masivamente
    |----------------------------------------------------------------------
    */
    protected $fillable = [
        'nombre',
        'emoji',
        'slug',
        'descripcion',
        'imagen_url',
        'padre_id',
        'orden',
        'activo',
    ];

    /*
    |----------------------------------------------------------------------
    | CASTS — Conversión automática de tipos
    |----------------------------------------------------------------------
    |
    | 'activo' => 'boolean'
    |   La BD guarda 0/1, PHP lo convierte a true/false.
    |   Sin cast: $categoria->activo === "1" (string)
    |   Con cast:  $categoria->activo === true (boolean)
    |
    */
    protected function casts(): array
    {
        return [
            'activo'      => 'boolean',
            'creado_en'   => 'datetime',
            'actualizado_en' => 'datetime',
        ];
    }

    /*
    |----------------------------------------------------------------------
    | RELACIONES ELOQUENT
    |----------------------------------------------------------------------
    |
    | Las relaciones definen cómo se conectan los modelos.
    | Eloquent las convierte en JOINs automáticamente.
    |
    */

    /**
     * Categoría PADRE de esta categoría.
     *
     * TIPO: BelongsTo (pertenece a)
     * "Camisas" le pertenece a "Ropa"
     *
     * SQL: SELECT * FROM categorias WHERE id = $this->padre_id
     *
     * Uso: $categoria->padre->nombre  →  "Ropa"
     */
    public function padre(): BelongsTo
    {
        return $this->belongsTo(Categoria::class, 'padre_id');
    }

    /**
     * Categorías HIJAS de esta categoría.
     *
     * TIPO: HasMany (tiene muchas)
     * "Ropa" tiene muchos hijos: "Camisas", "Pantalones", etc.
     *
     * SQL: SELECT * FROM categorias WHERE padre_id = $this->id
     *
     * Uso: $categoria->hijos  →  colección de subcategorías
     */
    public function hijos(): HasMany
    {
        return $this->hasMany(Categoria::class, 'padre_id');
    }

    /**
     * Productos que pertenecen a esta categoría.
     *
     * TIPO: HasMany (tiene muchos)
     *
     * SQL: SELECT * FROM productos WHERE categoria_id = $this->id
     *
     * Uso: $categoria->productos->count()  →  cuántos productos tiene
     */
    public function productos(): HasMany
    {
        return $this->hasMany(Producto::class, 'categoria_id');
    }

    /*
    |----------------------------------------------------------------------
    | SCOPES — Filtros reutilizables
    |----------------------------------------------------------------------
    |
    | Un scope es un método que agrega condiciones al query.
    | En lugar de repetir ->where('activo', true) en cada consulta,
    | defines el scope una vez y lo reutilizas.
    |
    | Nomenclatura: el método se llama scope + NombreEnPascalCase
    | Se usa sin el prefijo 'scope': Categoria::activas()->get()
    |
    */

    /**
     * Solo categorías activas (visibles en la tienda).
     *
     * Uso: Categoria::activas()->get()
     * SQL: ... WHERE activo = true
     */
    public function scopeActivas($query)
    {
        return $query->where('activo', true);
    }

    /**
     * Solo categorías raíz (sin padre — nivel 1 del árbol).
     *
     * Uso: Categoria::raices()->get()
     * SQL: ... WHERE padre_id IS NULL
     */
    public function scopeRaices($query)
    {
        return $query->whereNull('padre_id');
    }

    /**
     * Ordenadas por el campo 'orden' y luego por nombre.
     *
     * Uso: Categoria::ordenadas()->get()
     * SQL: ... ORDER BY orden ASC, nombre ASC
     */
    public function scopeOrdenadas($query)
    {
        return $query->orderBy('orden')->orderBy('nombre');
    }

    /*
    |----------------------------------------------------------------------
    | HELPER: ¿Es categoría raíz?
    |----------------------------------------------------------------------
    */
    public function esRaiz(): bool
    {
        return is_null($this->padre_id);
    }
}
