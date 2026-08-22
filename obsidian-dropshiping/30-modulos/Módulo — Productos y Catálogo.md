---
type: note
tags: [modulo, productos, catalogo, inventario]
created: 2026-07-27
updated: 2026-08-22
status: evergreen
related: ["[[Modelo de Datos — Productos]]", "[[Módulo — Portal de Proveedores]]"]
---

# 📦 Módulo — Productos y Catálogo

## ENTENDER
Gestión completa del catálogo: productos, variantes, categorías, precios, stock e integración con proveedores.

## PENSAR
Tablas: `productos`, `variantes_producto`, `categorias`, `producto_proveedor`, `feed_google_shopping`

## Funcionalidades
- [x] CRUD completo de productos
- [x] Importación masiva CSV/Excel ← **sesión 13**
- [ ] Exportación CSV, Excel, PDF
- [ ] Sincronización con proveedores (precios, stock)
- [x] Múltiples imágenes con Spatie Media Library + R2
- [ ] Variantes (talla, color, material)
- [x] Categorías jerárquicas (árbol infinito)
- [ ] Filtros y búsqueda avanzada (Meilisearch)
- [x] Descuentos (%, fijo, por categoría)
- [x] Control de inventario + alertas stock bajo
- [ ] Sistema de reseñas (verificado por compra)
- [x] Relación multi-proveedor por producto
- [ ] Feed Google Shopping

## Importador masivo — Sesión 13

### Dependencia
```bash
composer require phpoffice/phpspreadsheet
```

### Lógica en `ProductoController@importar()`
- Detecta extensión: `.xlsx/.xls/.ods` → PhpSpreadsheet | `.csv` → fgetcsv
- Excel: `IOFactory::createReaderForFile()` + `setReadDataOnly(true)`
- CSV: strip BOM + `array_combine($encabezados, ...)`
- Mapeo categoría: `Categoria::pluck('id', 'slug')`

### Columnas aceptadas
| Columna | Obligatoria |
|---|---|
| sku | No |
| nombre | **Sí** |
| descripcion_corta | No |
| descripcion | No |
| precio_costo | No |
| precio_venta | No |
| precio_oferta | No |
| stock | No (default 0) |
| stock_minimo | No (default 0) |
| categoria_slug | No |
| peso_kg | No |
| largo_cm / ancho_cm / alto_cm | No |
| meta_titulo / meta_descripcion | No |
| estado | No (default activo) |

### Archivo de ejemplo
`productos_importar.xlsx` en raíz del proyecto — 39 productos navideños del proveedor PDF.

## Acciones
- Crear/Editar/Eliminar/Duplicar productos
- Importar desde Excel o CSV
- Sincronizar con proveedores (manual/programado)
- Activar/Desactivar producto
- Ajustes de inventario
- Exportar catálogo a Google Shopping
- Importar desde AliExpress via API
- Enlazar/Desenlazar proveedores
