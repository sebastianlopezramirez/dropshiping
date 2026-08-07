---
type: note
tags: [modulo, productos, catalogo, inventario]
created: 2026-07-27
updated: 2026-07-27
status: seedling
related: ["[[Modelo de Datos — Productos]]", "[[Módulo — Portal de Proveedores]]"]
---

# 📦 Módulo — Productos y Catálogo

## ENTENDER
Gestión completa del catálogo: productos, variantes, categorías, precios, stock e integración con proveedores.

## PENSAR
Tablas: `productos`, `variantes_producto`, `categorias`, `producto_proveedor`, `feed_google_shopping`

## Funcionalidades
- [ ] CRUD completo de productos
- [ ] Importación masiva CSV/Excel
- [ ] Exportación CSV, Excel, PDF
- [ ] Sincronización con proveedores (precios, stock)
- [ ] Múltiples imágenes con lazy loading
- [ ] Variantes (talla, color, material)
- [ ] Categorías jerárquicas (árbol infinito)
- [ ] Filtros y búsqueda avanzada (Meilisearch)
- [ ] Descuentos (%, fijo, por categoría)
- [ ] Control de inventario + alertas stock bajo
- [ ] Sistema de reseñas (verificado por compra)
- [ ] Relación multi-proveedor por producto
- [ ] Feed Google Shopping

## Acciones
- Crear/Editar/Eliminar/Duplicar productos
- Sincronizar con proveedores (manual/programado)
- Activar/Desactivar producto
- Ajustes de inventario
- Exportar catálogo a Google Shopping
- Importar desde AliExpress via API
- Enlazar/Desenlazar proveedores

## Estado de desarrollo
- [ ] Migraciones
- [ ] Models: Producto, Variante, Categoria, ProductoProveedor
- [ ] Controllers y Resources API
- [ ] Páginas React: Listado, Detalle, Formulario
- [ ] Componente de importación masiva
- [ ] Job de sincronización con proveedor
