---
type: fase
tags: [fase, completada, productos, catalogo]
created: 2026-08-04
updated: 2026-08-05
status: evergreen
fase: 3
estado_fase: completada
descripcion: "Catálogo de productos, categorías, imágenes y relación con proveedores"
---

# FASE 3 — Productos y Catálogo

**Estado:** ✅ Completada — 2026-08-05
**Prerrequisito:** [[FASE 2 — Usuarios y Roles]] ✅

---

## ENTENDER — ¿Qué construimos?

El catálogo de productos es el corazón del dropshipping: categorías jerárquicas, productos con múltiples imágenes, precios de costo/venta/oferta, stock, slugs SEO-friendly y soft delete para no romper pedidos existentes.

---

## ✅ Checklist de desarrollo — COMPLETO

### Migraciones ✅
- [x] `2026_08_05_000001_create_categorias_table` — UUID, nombre, slug, padre_id (self-referential en 2 pasos), activo
- [x] `2026_08_05_000002_create_productos_table` — UUID, precios, imagenes JSONB, atributos JSONB, SoftDeletes en español
- [x] `2026_08_05_000003_create_producto_proveedor_table` — pivot UUID, precio_proveedor, es_principal

### Modelos ✅
- [x] `app/Models/Categoria.php` — árbol auto-referencial, scopes: `activas()`, `raices()`, `ordenadas()`
- [x] `app/Models/Producto.php` — SoftDeletes, casts JSONB, relaciones, helpers: `tieneOferta()`, `precioFinal()`, `imagenPrincipal()`
- [x] `app/Models/ProductoProveedor.php` — Pivot con UUID y timestamps en español

### Controller ✅
- [x] `app/Http/Controllers/Web/ProductoController.php`
  - [x] `index()` — lista con filtros (buscar, categoría, estado, precio) + paginación
  - [x] `create()` — formulario vacío con categorías
  - [x] `store()` — valida, `Str::title()` para capitalizar, slug único, imágenes con `move()`
  - [x] `show()` — detalle con relaciones
  - [x] `edit()` — formulario pre-llenado
  - [x] `update()` — actualiza + agrega nuevas imágenes a las existentes
  - [x] `destroy()` — soft delete (llena `eliminado_en`)
  - [x] `generarSlugUnico()` — helper privado para slugs únicos incrementales

### Páginas React ✅
- [x] `resources/js/Pages/Productos/Index.jsx` — tabla con imagen, nombre, SKU, categoría, precio COP, stock, estado badge, acciones
- [x] `resources/js/Pages/Productos/Crear.jsx` — form con `forceFormData: true`, preview de imágenes, margen calculado en tiempo real
- [x] `resources/js/Pages/Productos/Editar.jsx` — pre-llenado, imágenes actuales + nuevas

### Rutas ✅
- [x] `Route::resource('productos', ProductoController::class)` en grupo admin

---

## Decisiones técnicas tomadas

### ⚠️ Imágenes en Windows — usar `move()` NO `Storage::store()`
```php
// ✅ CORRECTO en Windows (evita Path cannot be empty en Flysystem 3)
$archivo->move(storage_path('app/public/productos'), $nombreArchivo);
$urls[] = '/storage/productos/' . $nombreArchivo;

// ❌ FALLA en Windows con Flysystem 3
$ruta = $archivo->store('productos', 'public'); // → Path cannot be empty
```

### PHP temp dir en Herd — fix permanente
- Agregar `upload_tmp_dir = "C:\Windows\Temp"` en `C:\Users\Usuario\.config\herd\bin\php83\php.ini`
- Script documentado: `fix-php-upload.ps1` en la raíz del proyecto

### Self-referential FK en PostgreSQL — siempre en 2 pasos
```php
// Paso 1: crear tabla sin FK
Schema::create('categorias', fn($t) => $t->uuid('padre_id')->nullable());
// Paso 2: agregar FK después que la tabla existe
Schema::table('categorias', fn($t) => $t->foreign('padre_id')->references('id')->on('categorias')->nullOnDelete());
```

### Auto-capitalización
```php
$datos['nombre'] = Str::title($datos['nombre']); // 'bateria carro' → 'Bateria Carro'
```

### Inertia + archivos
```js
// forceFormData: true es OBLIGATORIO cuando el form puede tener archivos
post(route('productos.store'), { forceFormData: true });
```

---

## Bugs resueltos en esta fase

| Bug | Error | Fix |
|-----|-------|-----|
| Self-referential FK | `no hay restricción unique que coincida` | Split Schema::create + Schema::table |
| Spatie model_id | `Invalid text representation: bigint` | Cambiar `unsignedBigInteger` a `uuid()` en migración Spatie |
| PHP temp dir | `unable to create a temporary file` | `upload_tmp_dir = "C:\Windows\Temp"` en php.ini |
| Flysystem path | `Path cannot be empty` | Reemplazar `store()` por `move()` directamente |

---

## Notas técnicas

**¿Por qué JSONB para imágenes?**
Las imágenes son un array de URLs. JSONB permite guardar el array sin crear una tabla separada `imagenes_producto`. Para el MVP es suficiente.

**¿Por qué `move()` en lugar de `Storage::store()`?**
Flysystem 3 (incluido en Laravel 13) tiene problemas al normalizar rutas en Windows cuando el separador de directorios es `\` en lugar de `/`. El método `move()` de Symfony's `UploadedFile` usa las funciones nativas de PHP y no pasa por Flysystem, evitando el bug.

---

*← [[FASE 2 — Usuarios y Roles]] | Siguiente: [[FASE 4 — Pedidos y Logística]] →*
*Ver en tablero: [[📊 Tablero de Fases]]*
