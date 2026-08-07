---
type: moc
tags: [moc, base-de-datos]
created: 2026-07-27
updated: 2026-07-27
---

# 🗄️ MOC — Base de Datos

PostgreSQL 16. Todos los nombres de tablas y columnas en español.

## Modelos de Datos
- [[Modelo de Datos — Usuarios]]
- [[Modelo de Datos — Productos]]
- [[Modelo de Datos — Pedidos]]
- [[Modelo de Datos — Financiero]]
- [[Modelo de Datos — Marketing]]
- [[Modelo de Datos — Analytics]]

## Convenciones
- Tablas en **plural** y **snake_case** en español: `usuarios`, `pedidos`, `items_pedido`
- PKs: `UUID` generado con `gen_random_uuid()`
- Timestamps: `creado_en`, `actualizado_en`, `eliminado_en` (soft delete)
- Soft delete en entidades principales
- JSONB para datos flexibles (atributos, direcciones, configuraciones)
