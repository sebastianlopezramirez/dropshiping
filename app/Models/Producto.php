<?php

/*
|--------------------------------------------------------------------------
| MODELO: Producto
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué representa este modelo?
|
|   Cada fila de la tabla 'productos' es un producto del catálogo.
|   Este modelo da acceso a precios, stock, imágenes, categoría y proveedores.
|
|   Ejemplo de uso:
|     $producto = Producto::find($id);
|     echo $producto->nombre;              // "iPhone 15 Pro"
|     echo $producto->precio_venta;        // 4500000.00
|     echo $producto->categoria->nombre;   // "Celulares"
|     $producto->proveedores->each(fn($p) => echo $p->nombre_empresa);
|
| PENSAR — ¿Qué necesita este modelo?
|
|   1. UUID como PK
|   2. SoftDeletes → borrado lógico (los pedidos siguen referenciando el producto)
|   3. Timestamps en español
|   4. Relación con Categoria → belongsTo
|   5. Relación con Proveedor → belongsToMany (a través de producto_proveedor)
|   6. Casts → imagenes y atributos son JSONB → convertir a array PHP
|   7. Scopes → activos, con stock, por categoría
|
*/

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Str;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class Producto extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia;

    /*
    |----------------------------------------------------------------------
    | TABLA, SOFT DELETE Y TIMESTAMPS
    |----------------------------------------------------------------------
    */
    protected $table = 'productos';

    // SoftDeletes: $producto->delete() → llena 'eliminado_en', no borra el registro
    use SoftDeletes;
    protected const DELETED_AT = 'eliminado_en';

    const CREATED_AT = 'creado_en';
    const UPDATED_AT = 'actualizado_en';

    /*
    |----------------------------------------------------------------------
    | CONFIGURACIÓN UUID
    |----------------------------------------------------------------------
    */
    protected $keyType = 'string';
    public $incrementing = false;

    /*
    |----------------------------------------------------------------------
    | boot() — Genera UUID en PHP antes de insertar
    |----------------------------------------------------------------------
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
    | FILLABLE
    |----------------------------------------------------------------------
    */
    protected $fillable = [
        'nombre',
        'slug',
        'sku',
        'descripcion_corta',
        'descripcion',
        'precio_costo',
        'precio_venta',
        'precio_oferta',
        'stock',
        'stock_minimo',
        'imagenes',
        'atributos',
        'peso_kg',
        'largo_cm',
        'ancho_cm',
        'alto_cm',
        'categoria_id',
        'estado',
        'meta_titulo',
        'meta_descripcion',
    ];

    /*
    |----------------------------------------------------------------------
    | CASTS — Conversión automática de tipos
    |----------------------------------------------------------------------
    |
    | 'imagenes' => 'array'
    |   BD guarda: '["url1.jpg","url2.jpg"]'  (JSON string)
    |   PHP recibe: ["url1.jpg", "url2.jpg"]  (array PHP)
    |
    | 'atributos' => 'array'
    |   BD guarda: '{"talla":"M","color":"rojo"}' (JSON string)
    |   PHP recibe: ["talla" => "M", "color" => "rojo"] (array PHP)
    |
    | 'precio_venta' => 'decimal:2'
    |   Siempre con 2 decimales: 4500000.00
    |
    */
    protected function casts(): array
    {
        return [
            'imagenes'        => 'array',    // JSONB → array PHP
            'atributos'       => 'array',    // JSONB → array PHP
            'precio_costo'    => 'decimal:2',
            'precio_venta'    => 'decimal:2',
            'precio_oferta'   => 'decimal:2',
            'peso_kg'         => 'decimal:3',
            'creado_en'       => 'datetime',
            'actualizado_en'  => 'datetime',
            'eliminado_en'    => 'datetime',
        ];
    }

    /*
    |----------------------------------------------------------------------
    | RELACIONES ELOQUENT
    |----------------------------------------------------------------------
    */

    /**
     * Categoría a la que pertenece este producto.
     *
     * TIPO: BelongsTo (muchos productos → una categoría)
     *
     * SQL: SELECT * FROM categorias WHERE id = $this->categoria_id
     *
     * Uso: $producto->categoria->nombre  →  "Celulares"
     */
    public function categoria(): BelongsTo
    {
        return $this->belongsTo(Categoria::class, 'categoria_id');
    }

    /**
     * Proveedores que venden este producto.
     *
     * TIPO: BelongsToMany (muchos a muchos)
     *
     * ¿Qué es BelongsToMany?
     *   Un producto puede tener MUCHOS proveedores.
     *   Un proveedor puede tener MUCHOS productos.
     |   La tabla pivot 'producto_proveedor' conecta los dos.
     *
     * SQL equivalente:
     *   SELECT proveedores.*
     *   FROM proveedores
     *   INNER JOIN producto_proveedor ON proveedores.id = producto_proveedor.proveedor_id
     *   WHERE producto_proveedor.producto_id = $this->id
     *
     * ->withPivot(...) → trae también las columnas extras de la tabla pivot
     * ->withTimestamps() → activa creado_en/actualizado_en en la tabla pivot
     *
     * Uso:
     *   $producto->proveedores                       // todos los proveedores
     *   $producto->proveedores->first()->pivot->precio_proveedor  // precio de ese proveedor
     */
    public function proveedores(): BelongsToMany
    {
        return $this->belongsToMany(
            Proveedor::class,       // modelo del otro lado
            'producto_proveedor',   // tabla pivot
            'producto_id',          // FK de este modelo en la pivot
            'proveedor_id'          // FK del otro modelo en la pivot
        )
        ->withPivot([               // columnas extras de la tabla pivot
            'precio_proveedor',
            'tiempo_entrega_dias',
            'url_producto',
            'referencia_proveedor',
            'es_principal',
            'notas',
        ])
        ->using(ProductoProveedor::class); // modelo pivot personalizado
    }

    /**
     * Proveedor PRINCIPAL de este producto.
     *
     * Es el mismo belongsToMany pero filtrado por es_principal = true.
     *
     * Uso: $producto->proveedorPrincipal  →  un solo proveedor
     */
    public function proveedorPrincipal(): BelongsToMany
    {
        return $this->proveedores()->wherePivot('es_principal', true);
    }

    /*
    |----------------------------------------------------------------------
    | SCOPES — Filtros reutilizables
    |----------------------------------------------------------------------
    */

    /**
     * Solo productos activos (visibles en la tienda).
     *
     * Uso: Producto::activos()->get()
     */
    public function scopeActivos($query)
    {
        return $query->where('estado', 'activo');
    }

    /**
     * Solo productos con stock disponible.
     *
     * Uso: Producto::conStock()->get()
     */
    public function scopeConStock($query)
    {
        return $query->where(function ($q) {
            $q->whereNull('stock')          // stock null = ilimitado
              ->orWhere('stock', '>', 0);   // o tiene stock > 0
        });
    }

    /**
     * Productos de una categoría específica.
     *
     * Uso: Producto::deCategoria($categoriaId)->get()
     */
    public function scopeDeCategoria($query, string $categoriaId)
    {
        return $query->where('categoria_id', $categoriaId);
    }

    /**
     * Productos con precio entre dos valores.
     *
     * Uso: Producto::entrePrecio(100000, 500000)->get()
     */
    public function scopeEntrePrecio($query, float $min, float $max)
    {
        return $query->whereBetween('precio_venta', [$min, $max]);
    }

    /*
    |----------------------------------------------------------------------
    | HELPERS — Métodos utilitarios
    |----------------------------------------------------------------------
    */

    /**
     * ¿Tiene descuento activo?
     * Retorna true si precio_oferta está definido y es menor que precio_venta.
     */
    public function tieneOferta(): bool
    {
        return !is_null($this->precio_oferta)
            && $this->precio_oferta < $this->precio_venta;
    }

    /**
     * Precio final al cliente (oferta si existe, sino precio normal).
     */
    public function precioFinal(): float
    {
        return $this->tieneOferta()
            ? (float) $this->precio_oferta
            : (float) $this->precio_venta;
    }

    /**
     * Porcentaje de descuento (si hay oferta).
     * Ejemplo: precio 100.000 → oferta 80.000 → retorna 20 (%)
     */
    public function porcentajeDescuento(): int
    {
        if (!$this->tieneOferta()) return 0;

        return (int) round(
            (($this->precio_venta - $this->precio_oferta) / $this->precio_venta) * 100
        );
    }

    /*
    |----------------------------------------------------------------------
    | SPATIE MEDIA LIBRARY — Colecciones y conversiones
    |----------------------------------------------------------------------
    |
    | registerMediaCollections() → define las colecciones y en qué disco guardar
    | registerMediaConversions() → define las variantes que se generan al subir
    |
    | Flujo cuando se sube una imagen:
    |   1. Admin sube JPG/PNG/WebP
    |   2. Spatie guarda el original en R2
    |   3. Intervention Image genera 'thumbnail' (400×400 WebP) → R2
    |   4. Intervention Image genera 'medium' (800×800 WebP) → R2
    |   5. URLs públicas: $producto->getFirstMediaUrl('imagenes', 'thumbnail')
    |
    */

    /**
     * Define la colección 'imagenes' y qué disco usa.
     *
     * Uso: $producto->addMediaFromRequest('imagen')->toMediaCollection('imagenes')
     */
    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('imagenes')
             ->useDisk('r2');
    }

    /**
     * Define las conversiones WebP que se generan automáticamente.
     *
     * 'thumbnail' → 400×400 WebP (para listados, cards)
     * 'medium'    → 800×800 WebP (para página de detalle del producto)
     *
     * width/height aplican un fit inteligente (no deforma la imagen).
     * format('webp') convierte JPG/PNG a WebP vía Intervention Image.
     */
    public function registerMediaConversions(?Media $media = null): void
    {
        $this->addMediaConversion('thumbnail')
             ->width(400)
             ->height(400)
             ->format('webp')
             ->performOnCollections('imagenes')
             ->nonQueued(); // Síncrono para no depender de colas en desarrollo

        $this->addMediaConversion('medium')
             ->width(800)
             ->height(800)
             ->format('webp')
             ->performOnCollections('imagenes')
             ->nonQueued();
    }

    /**
     * URL de la imagen principal.
     *
     * Prioridad:
     *   1. Spatie Media Library → imagen subida via R2 (nuevo sistema)
     *   2. Campo 'imagenes' → array legacy de URLs (sistema anterior)
     *
     * Uso: $producto->imagenPrincipal()  →  "https://pub-xxx.r2.dev/..."
     */
    public function imagenPrincipal(): ?string
    {
        // Nuevo sistema: Spatie Media Library en R2
        $media = $this->getFirstMedia('imagenes');
        if ($media) {
            return $media->getUrl('thumbnail');
        }

        // Fallback: campo legacy 'imagenes' (JSONB array de URLs)
        if (empty($this->imagenes)) return null;
        return $this->imagenes[0];
    }

    /**
     * ¿Está por debajo del stock mínimo?
     * Sirve para mostrar alertas de reabastecimiento.
     */
    public function stockBajo(): bool
    {
        return !is_null($this->stock) && $this->stock <= $this->stock_minimo;
    }
}
