---
type: proceso
tags: [proceso, productos, importacion, caroleste, proveedor]
created: 2026-08-22
updated: 2026-08-22
status: activo
related: ["[[Módulo — Productos y Catálogo]]"]
---

# 📋 Proceso — Subir Productos de Caroleste

## ENTENDER
Workflow paso a paso para cargar productos del catálogo PDF de Caroleste al sistema de dropshipping. El objetivo es importar productos en estado borrador, luego enriquecer con precio y descripción desde la web del proveedor.

## PENSAR
- Los productos llegan como PDF del proveedor.
- Se suben en estado `borrador` porque aún no tienen imágenes.
- El precio oficial se consulta por SKU en la tienda de Caroleste.
- La descripción también se actualiza desde ahí.

---

## Paso 1 — Pasar el PDF a Excel

1. Abrir el catálogo PDF de Caroleste.
2. Tomar como base el archivo `productos_importar.xlsx` (muestra del proyecto) ubicado en la carpeta de salida.
3. Completar columnas obligatorias:
   - `nombre` — nombre del producto
   - `sku` — código único del proveedor
   - `categoria_slug` — slug EXACTO de la categoría en la DB (ej: `navidad`, `decoracion`)
   - `estado` — siempre `borrador` si no tiene imagen aún

> ⚠️ El `categoria_slug` debe ser el slug hijo, tal como lo genera Laravel con `Str::slug()`. Consultar la DB o el admin para verificar.

---

## Paso 2 — Organizar los valores

Campos a completar en el Excel antes de importar:

| Columna | Valor por defecto |
|---|---|
| `estado` | `borrador` |
| `stock` | `0` (se actualiza después) |
| `stock_minimo` | `0` |
| `precio_costo` | dejar vacío hasta consultar |
| `precio_venta` | dejar vacío hasta consultar |

> No dejar `stock` o `stock_minimo` en blanco — la DB tiene `NOT NULL` en esas columnas.

---

## Paso 3 — Subir al sistema

1. Ir a **Admin → Productos → Importar** (botón en la parte superior).
2. Seleccionar el archivo `.xlsx`.
3. Usar el botón **"Vista previa"** para revisar que no haya errores de categoría.
4. Si la preview muestra `X filas válidas` sin errores → confirmar importación.
5. Los productos quedan en estado `borrador` (visibles solo en el admin, no en la tienda).

---

## Paso 4 — Consultar precio y descripción por SKU

1. Ir a la tienda de Caroleste: https://caroleste.com (o la URL del proveedor).
2. Buscar cada producto por su **SKU**.
3. Anotar:
   - Precio de venta del proveedor → calcular margen y actualizar `precio_costo` y `precio_venta`.
   - Descripción completa del producto.

---

## Paso 5 — Actualizar precio y descripción en el admin

1. Admin → Productos → editar cada producto.
2. Completar:
   - `precio_costo`
   - `precio_venta`
   - `descripcion` (copiar desde Caroleste)
   - `descripcion_corta`
3. Cuando el producto tenga imagen → cambiar `estado` a `activo`.

---

## Errores comunes

| Error | Causa | Solución |
|---|---|---|
| `Categoría 'X' no existe` | `categoria_slug` incorrecto | Verificar slug exacto en DB (minúsculas, sin espacios) |
| `0 importados, N errores` | `stock_minimo` null → NOT NULL violation | Poner `0` en columnas stock vacías |
| Preview OK pero import falla | Error silencioso en PHP | Revisar banner "Primer error →" en el flash |

---

## Archivos relacionados

- `productos_importar.xlsx` — plantilla con 39 productos de la colección Navidad (borrador)
- [[Módulo — Productos y Catálogo]] — documentación del importador
