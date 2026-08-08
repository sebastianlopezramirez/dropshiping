---
title: FASE 8 — Tienda Pública + SEO
tags: [fase, tienda, seo, completada]
type: fase
estado: completada
fase_numero: 8
created: 2026-08-07
updated: 2026-08-07
related: ["[[FASE 7 — Marketing]]", "[[FASE 9 — Analytics]]"]
---

# FASE 8 — Tienda Pública + SEO

## ENTENDER — ¿Qué construimos?

Un catálogo público accesible sin login. Cualquier visitante puede:
- Explorar el catálogo con filtros (categoría, precio, búsqueda)
- Ver el detalle de cada producto con galería de imágenes
- Compartir productos por WhatsApp
- Que Google indexe el contenido (SEO completo)

## Archivos creados

| Archivo | Descripción |
|---|---|
| `app/Http/Controllers/Web/TiendaController.php` | 3 métodos públicos |
| `resources/js/Layouts/TiendaLayout.jsx` | Navbar + Footer sin auth |
| `resources/js/Pages/Tienda/Index.jsx` | Catálogo con filtros y grid |
| `resources/js/Pages/Tienda/Producto.jsx` | Detalle con SEO completo |

## Rutas públicas (sin middleware auth)

```php
Route::prefix('tienda')->name('tienda.')->group(function () {
    Route::get('/', [TiendaController::class, 'index'])->name('index');
    Route::get('categoria/{slug}', [TiendaController::class, 'categoria'])->name('categoria');
    Route::get('{slug}', [TiendaController::class, 'show'])->name('show');
});
```

> ⚠️ **Regla crítica de orden**: `/tienda/categoria/{slug}` DEBE ir ANTES de `/tienda/{slug}`.
> Sin ese orden, Laravel resuelve "categoria" como un slug de producto.

## SEO con Inertia `<Head>`

```jsx
<Head>
    <title>{seo.titulo}</title>
    <meta name="description" content={seo.descripcion} />
    <meta property="og:title" content={seo.titulo} />
    <meta property="og:image" content={seo.imagen} />
    <meta property="og:url" content={seo.url} />
    <meta name="twitter:card" content="summary_large_image" />
</Head>
```

Se usa `<Head>` de Inertia (no raw HTML) para que las meta tags se gestionen correctamente en el ciclo de vida SPA.

## Decisiones de diseño

- **`TarjetaProducto` definida FUERA del componente principal**: evita remount en cada render y pérdida de estado
- **Búsqueda**: `ilike` en PostgreSQL (case-insensitive), pasada como query param `?q=`
- **Grid**: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`
- **Badge de descuento**: cálculo `(precio_venta - precio_oferta) / precio_venta * 100`
- **Botón WhatsApp**: `https://wa.me/?text=` con nombre + URL del producto

## Bugs resueltos en esta fase

- **Vite manifest no encontrado**: el build no se había corrido después de crear los nuevos archivos JSX → `npm run build` en PowerShell