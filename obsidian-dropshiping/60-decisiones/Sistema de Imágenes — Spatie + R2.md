---
type: decision
tags: [imágenes, spatie, r2, cloudflare, storage, webp]
created: 2026-08-09
updated: 2026-08-09
status: evergreen
descripcion: "Arquitectura completa del sistema de imágenes: Spatie Media Library + Intervention Image + Cloudflare R2"
relacionado: ["[[FASE 3 — Productos y Catálogo]]", "[[📊 Tablero de Fases]]"]
---

# Sistema de Imágenes — Spatie Media Library + Cloudflare R2

## ENTENDER — ¿Qué resuelve este sistema?

El sistema de imágenes reemplaza el campo JSONB `imagenes[]` (URLs manuales) por un pipeline profesional:

1. **Subida** — Admin sube imagen desde formulario de producto
2. **Conversión** — Intervention Image genera WebP en tamaños thumbnail (400×400) y medium (800×800)
3. **Almacenamiento** — Los archivos se guardan en Cloudflare R2 (S3-compatible, zero egress)
4. **Acceso público** — URL pública via `pub-xxxx.r2.dev` o dominio custom en producción

---

## Paquetes instalados

```bash
composer require spatie/laravel-medialibrary
composer require intervention/image-laravel
```

---

## Arquitectura

```
Form React (Editar.jsx)
  ↓ POST multipart/form-data + _method=put
ProductoController@update()
  ↓ $producto->addMedia($archivo)->toMediaCollection('imagenes')
Spatie Media Library
  ↓ genera conversiones WebP (nonQueued = sincrónico)
Cloudflare R2 (disco 'r2')
  ↓ almacena original + conversiones/thumbnail + conversiones/medium
tabla media (PostgreSQL)
  ↓ registra metadatos (url, colección, conversiones_generadas)
```

---

## Archivos modificados

### `config/media-library.php`
```php
'disk_name' => env('MEDIA_DISK', 'r2'),
```

### `app/Models/Producto.php`
```php
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class Producto extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia;

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('imagenes')->useDisk('r2');
    }

    public function registerMediaConversions(?Media $media = null): void
    {
        $this->addMediaConversion('thumbnail')
             ->width(400)->height(400)->format('webp')
             ->performOnCollections('imagenes')->nonQueued();

        $this->addMediaConversion('medium')
             ->width(800)->height(800)->format('webp')
             ->performOnCollections('imagenes')->nonQueued();
    }

    // Compatibilidad con campo legacy imagenes[]
    public function imagenPrincipal(): ?string
    {
        $media = $this->getFirstMedia('imagenes');
        if ($media) return $media->getUrl('thumbnail');
        if (empty($this->imagenes)) return null;
        return $this->imagenes[0];
    }
}
```

### `database/migrations/2026_08_09_155336_create_media_table.php`
```php
// CRÍTICO: usar uuidMorphs en lugar de morphs
// morphs() → model_id como bigint → incompatible con UUIDs
// uuidMorphs() → model_id como char(36) → compatible con UUIDs
$table->uuidMorphs('model');
```

### `config/filesystems.php` — disco r2
```php
'r2' => [
    'driver'                  => 's3',
    'key'                     => env('CLOUDFLARE_R2_ACCESS_KEY_ID'),
    'secret'                  => env('CLOUDFLARE_R2_SECRET_ACCESS_KEY'),
    'region'                  => 'auto',
    'bucket'                  => env('CLOUDFLARE_R2_BUCKET'),
    'url'                     => env('CLOUDFLARE_R2_URL'),      // URL pública r2.dev
    'endpoint'                => env('CLOUDFLARE_R2_ENDPOINT'), // URL privada de escritura
    'use_path_style_endpoint' => true,   // OBLIGATORIO para R2
    'visibility'              => 'public',
],
```

### `.env` — variables R2
```env
CLOUDFLARE_R2_ACCESS_KEY_ID=...
CLOUDFLARE_R2_SECRET_ACCESS_KEY=...
CLOUDFLARE_R2_BUCKET=dropshipping-media
CLOUDFLARE_R2_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
CLOUDFLARE_R2_URL=https://pub-<hash>.r2.dev   # ← URL del Public Development URL
MEDIA_DISK=r2
```

---

## React — Formulario de edición (Editar.jsx)

### El problema: PHP no parsea multipart en PUT
```js
// ❌ INCORRECTO — PHP ignora el body de PUT multipart → all: []
put(route('productos.update', id), { forceFormData: true });

// ✅ CORRECTO — method spoofing: POST + _method=put
// PHP parsea el body POST, Laravel lo enruta a update()
const { data, setData, post } = useForm({
    _method: 'put',          // ← campo clave
    nombre: producto.nombre,
    precio_costo: producto.precio_costo,
    // ...resto de campos
    imagenes_nuevas: [],
});

const handleSubmit = (e) => {
    e.preventDefault();
    post(route('productos.update', producto.id), { forceFormData: true });
};
```

### Mostrar imágenes actuales
```jsx
{producto.media?.length > 0 && (
    <div>
        {producto.media.map((img, i) => (
            <div key={img.id} className="relative group">
                <img src={img.original_url} />
                <button onClick={() => eliminarImagen(img.id)}>×</button>
            </div>
        ))}
    </div>
)}
```

### Fallback legacy
```jsx
// Index.jsx / TarjetaProducto
const imagen = producto.media?.[0]?.original_url || producto.imagenes?.[0] || null;
```

---

## Cloudflare R2 — Configuración

| Parámetro | Valor |
|---|---|
| Bucket | `dropshipping-media` |
| Public Dev URL | `https://pub-<hash>.r2.dev` |
| use_path_style_endpoint | `true` (obligatorio) |
| Egress | $0 (zero egress fees) |
| Recomendación producción | Conectar dominio custom en lugar de r2.dev |

**⚠️ IMPORTANTE:** La URL en `.env` debe coincidir exactamente con la URL que muestra el dashboard de Cloudflare en R2 → Settings → Public Development URL. Son diferentes a la URL del endpoint de escritura.

---

## Lecciones aprendidas (H028–H030)

| ID | Lección |
|----|---------|
| H028 | `vendor:publish` genera archivos que deben commitearse en git por separado |
| H029 | Siempre usar `uuidMorphs()` para relaciones polimórficas en proyectos con UUID como PK |
| H030 | PHP no parsea `multipart/form-data` en PUT. Para subir archivos con PUT en Laravel+Inertia: usar `post()` + `_method: 'put'` en el form |

---

## Estado en producción

Para producción, reemplazar el `r2.dev` por un dominio custom:
1. R2 Dashboard → bucket → Settings → Custom Domains → Add domain
2. Actualizar `CLOUDFLARE_R2_URL` con el dominio custom
3. El `r2.dev` está rate-limited y no soporta Cloudflare Cache

---

*Relacionado: [[FASE 3 — Productos y Catálogo]] · [[📊 Tablero de Fases]]*
