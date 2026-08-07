---
type: note
tags: [base-de-datos, productos, catalogo]
created: 2026-07-27
updated: 2026-07-27
status: evergreen
related: ["[[Módulo — Productos y Catálogo]]", "[[MOC — Base de Datos]]"]
---

# 🗄️ Modelo de Datos — Productos

## Tablas
- `categorias` — árbol jerárquico con `padre_id`
- `productos` — tabla principal del catálogo
- `producto_proveedor` — pivot con precio y stock por proveedor
- `variantes_producto` — variantes (talla, color, etc.)

## Campos clave: `productos`
| Campo | Tipo | Descripción |
|---|---|---|
| `sku` | VARCHAR(50) UNIQUE | Código interno |
| `precio` | DECIMAL(12,2) | Precio venta al público |
| `precio_proveedor` | DECIMAL(12,2) | Precio del proveedor |
| `precio_costo` | DECIMAL(12,2) | Costo total (incluye envío) |
| `stock` | INT | Stock disponible |
| `umbral_stock_bajo` | INT | Alerta cuando stock <= este valor |
| `estado` | VARCHAR(20) | borrador, activo, inactivo |
| `imagenes` | JSONB | Array de URLs |
| `dimensiones` | JSONB | {largo, ancho, alto, unidad} |

## Relación multi-proveedor: `producto_proveedor`
Un producto puede tener N proveedores. El campo `es_predeterminado` indica cuál se usa por defecto al crear pedidos.

## Variantes: `variantes_producto`
```json
{ "atributos": { "color": "rojo", "talla": "M" } }
```
