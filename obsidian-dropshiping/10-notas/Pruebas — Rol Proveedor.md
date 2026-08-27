---
type: note
tags: [pruebas, qa, proveedor, portal]
created: 2026-08-26
updated: 2026-08-26
status: activa
---

# 🧪 Pruebas — Rol Proveedor (Portal)

> Todos los escenarios posibles para validar el portal `/portal/*`.
> Marcar ✅ al probar exitosamente, ❌ si encuentra un bug.

**URL base producción:** `https://courageous-flexibility-production-1a54.up.railway.app`

---

## 1. ACCESO Y AUTENTICACIÓN

| #   | Escenario                                         | Pasos                                             | Resultado esperado                                   | notas de la pureba                                                                          | admin y super admin                                                                                                                           |
| --- | ------------------------------------------------- | ------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1 | Login como proveedor                              | Ir a `/login`, ingresar credenciales de proveedor | Redirige a `/portal/dashboard` (layout verde)        | -necesito que al ingresar aparezca nombre del proveedor y nit (arriba donde dice proveedor) | -al ingresar un proveedor por usuarios se debe pedir la informacion completa del proveedor - (nit- nombre - ubicacion -direccion - cel) dor - |
| 1.2 | Login como admin                                  | Ingresar credenciales de admin                    | Redirige a `/dashboard` (layout navy) — NO al portal |                                                                                             |                                                                                                                                               |
| 1.3 | Proveedor intenta entrar al admin                 | Logueado como proveedor, ir a `/dashboard`        | Redirige o muestra 403 — no puede ver el admin       |                                                                                             |                                                                                                                                               |
| 1.4 | Proveedor intenta ver pedidos del admin           | Ir a `/pedidos`                                   | 403 o redirección — ruta protegida por rol           |                                                                                             |                                                                                                                                               |
| 1.5 | Proveedor intenta ver productos de otro proveedor | Ir a `/portal/productos/{id-ajeno}`               | 403 "No tienes acceso a este producto"               |                                                                                             |                                                                                                                                               |
| 1.6 | Sesión expirada                                   | Dejar inactivo, volver y navegar                  | Redirige a `/login`                                  |                                                                                             |                                                                                                                                               |
| 1.7 | Cerrar sesión                                     | Clic en "Salir" desde el portal                   | Redirige a `/login`, sesión destruida                |                                                                                             |                                                                                                                                               |

---

## 2. DASHBOARD DEL PROVEEDOR (`/portal/dashboard`)

| #   | Escenario                   | Pasos                                                               | Resultado esperado                               | notas de la prueba                                                                                                                                                                                                                                                   | admin y super admin                                                                                                                                                                                                     |
| --- | --------------------------- | ------------------------------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.1 | Ver dashboard básico        | Ingresar al portal                                                  | Muestra nombre del proveedor, accesos rápidos    |                                                                                                                                                                                                                                                                      |                                                                                                                                                                                                                         |
| 2.2 | Tarjeta "Tienda"            | Clic en tarjeta Tienda                                              | Redirige a la tienda pública                     |                                                                                                                                                                                                                                                                      |                                                                                                                                                                                                                         |
| 2.3 | Botón "Mis productos"       | Clic en sub-botón                                                   | Redirige a `/portal/productos`                   | al ingresar a los productos existentes solo deja editar nombre- precio costo - permitir entrega - descripcion e imagenes. - lo ideal es que aparezca la misma interfaz que aparece al agregar producto con los datos del producto pero que se pueda modificar todo - | falta en la interfaz de agregar producto la funcion que conecta con los cupones y campañas - que desde aqui se pueda agregar o modificar si no lo tiene y ya existe el producto un cupon o compaña del modulo marketing |
| 2.4 | Botón "Pedidos"             | Clic en sub-botón                                                   | Redirige a `/portal/pedidos`                     | modificar los kpis debe ir ventas - total cobrado - saldo pendiente - pedidos pendientes sin confirmar (en ese orden)                                                                                                                                                |                                                                                                                                                                                                                         |
| 2.5 | Botón "Mis cobros"          | Clic en sub-botón                                                   | Redirige a `/portal/pagos`                       | modificar los kpis deben ir - ventas totales - lo que me deben - modificar el historial = mostrar lista historial de cada pedido con la informacion completa en fila y al finalizar la fila si el pedido ya se pago por parte de dropshiping o no (al dia ó debe)    |                                                                                                                                                                                                                         |
| 2.6 | Proveedor sin perfil creado | Login con usuario rol=proveedor sin registro en tabla `proveedores` | Error claro — no debe mostrar pantalla en blanco |                                                                                                                                                                                                                                                                      |                                                                                                                                                                                                                         |

---

## 3. MIS PRODUCTOS (`/portal/productos`)

| #   | Escenario               | Pasos                                     | Resultado esperado                                                           |                                                                                                                                                                                                                                                                      |                                                                                                                                                                                                                         |
| --- | ----------------------- | ----------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3.1 | Ver lista de productos  | Ir a Mis productos                        | Solo aparecen sus propios productos (los asignados al proveedor en la pivot) |                                                                                                                                                                                                                                                                      |                                                                                                                                                                                                                         |
| 3.2 | Proveedor sin productos | Usuario proveedor sin productos asignados | Muestra estado vacío — mensaje "No tenés productos asignados"                |                                                                                                                                                                                                                                                                      |                                                                                                                                                                                                                         |
| 3.3 | Producto activo         | Ver estado de producto activo             | Badge verde "Activo"                                                         |                                                                                                                                                                                                                                                                      |                                                                                                                                                                                                                         |
| 3.4 | Producto inactivo       | Ver estado de producto inactivo           | Badge gris/rojo "Inactivo"                                                   |                                                                                                                                                                                                                                                                      |                                                                                                                                                                                                                         |
| 3.5 | Botón "Editar"          | Clic en Editar de cualquier producto      | Redirige a `/portal/productos/{id}/editar`                                   | al ingresar a los productos existentes solo deja editar nombre- precio costo - permitir entrega - descripcion e imagenes. - lo ideal es que aparezca la misma interfaz que aparece al agregar producto con los datos del producto pero que se pueda modificar todo - | falta en la interfaz de agregar producto la funcion que conecta con los cupones y campañas - que desde aqui se pueda agregar o modificar si no lo tiene y ya existe el producto un cupon o compaña del modulo marketing |
| 3.6 | Botón "Crear producto"  | Clic en botón crear                       | Redirige a `/portal/productos/crear`                                         |                                                                                                                                                                                                                                                                      |                                                                                                                                                                                                                         |
| 3.7 | Ver imágenes miniatura  | Productos con imágenes                    | Muestra imagen principal en miniatura                                        |                                                                                                                                                                                                                                                                      |                                                                                                                                                                                                                         |
| 3.8 | Producto sin imagen     | Producto sin imágenes cargadas            | Muestra placeholder — no rompe la UI                                         |                                                                                                                                                                                                                                                                      |                                                                                                                                                                                                                         |

---

## 4. CREAR PRODUCTO (`/portal/productos/crear`)

| # | Escenario | Pasos | Resultado esperado |
|---|---|---|---|
| 4.1 | Crear producto completo | Llenar todos los campos: nombre, descripción, precio, stock, categoría, imágenes → Guardar | Producto creado en estado `inactivo`, asignado al proveedor en la pivot, aparece en Mis productos |
| 4.2 | Crear sin nombre | Dejar nombre vacío → Guardar | Error de validación "El nombre es requerido" |
| 4.3 | Crear sin precio | Dejar precio en 0 o vacío → Guardar | Error de validación |
| 4.4 | Precio negativo | Ingresar precio = -1000 | Error de validación |
| 4.5 | Stock negativo | Ingresar stock = -5 | Error de validación |
| 4.6 | Subir 3 imágenes | Agregar exactamente 3 imágenes → Guardar | Las 3 imágenes quedan guardadas en R2/Spatie |
| 4.7 | Subir más de 3 imágenes | Intentar agregar 4ª imagen | No permite — límite máximo 3 |
| 4.8 | Imagen muy pesada | Subir imagen > 5MB | Error "La imagen no debe superar X MB" |
| 4.9 | Imagen formato incorrecto | Subir un PDF como imagen | Error de validación de tipo de archivo |
| 4.10 | Crear con permite_contraentrega ON | Activar toggle contraentrega → Guardar | Producto queda con `permite_contraentrega = true` |
| 4.11 | Crear sin categoría | Dejar categoría vacía | Error de validación |
| 4.12 | Cancelar creación | Clic en "Cancelar" | Vuelve a Mis productos sin crear nada |
| 4.13 | El producto nuevo aparece como inactivo en admin | Crear producto → ir al admin (con otra cuenta) | Admin ve el producto en estado `inactivo`, listo para revisar y activar |

---

## 5. EDITAR PRODUCTO (`/portal/productos/{id}/editar`)

### 5A — Campos básicos

| #   | Escenario                | Pasos                                                                                | Resultado esperado                                                                                                                   |     |     |
| --- | ------------------------ | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ | --- | --- |
| 5.1 | Editar nombre            | Cambiar nombre → Guardar                                                             | Nombre actualizado en DB, `notas_revision` incluye el cambio                                                                         |     |     |
| 5.2 | Editar precio            | Cambiar precio (ej. de $100.000 a $120.000) → Guardar                                | `producto_proveedor.precio` y `productos.precio_costo` actualizados, `notas_revision` muestra "Precio de costo: $100.000 → $120.000" |     |     |
| 5.3 | Editar stock             | Cambiar stock (ej. de 10 a 25 unidades) → Guardar                                    | `producto_proveedor.stock` actualizado, `notas_revision` muestra "Stock: 10 → 25 unidades"                                           |     |     |
| 5.4 | Editar descripción       | Cambiar texto de descripción → Guardar                                               | `productos.descripcion` actualizada, `notas_revision` muestra "Descripción: actualizada."                                            |     |     |
| 5.5 | Activar contraentrega    | Toggle OFF → ON → Guardar                                                            | `permite_contraentrega = true`, `notas_revision` muestra "Contraentrega: No → Sí"                                                    |     |     |
| 5.6 | Desactivar contraentrega | Toggle ON → OFF → Guardar                                                            | `permite_contraentrega = false`, `notas_revision` muestra "Contraentrega: Sí → No"                                                   |     |     |
| 5.7 | Guardar sin cambios      | Abrir edición, no cambiar nada → Guardar                                             | `notas_revision` = "El proveedor guardó el producto sin cambios detectados."                                                         |     |     |
| 5.8 | Cambiar todos los campos | Modificar nombre + precio + stock + descripción + contraentrega + imágenes → Guardar | `notas_revision` lista TODOS los cambios en bullets `•`                                                                              |     |     |

### 5B — Imágenes

| # | Escenario | Pasos | Resultado esperado |
|---|---|---|---|
| 5.9 | Agregar 1 imagen nueva | Producto con 0 imágenes → subir 1 → Guardar | Imagen guardada, miniatura visible, `notas_revision` = "Agregó 1 imagen(es) nueva(s)." |
| 5.10 | Agregar hasta 3 imágenes | Subir 3 imágenes → Guardar | Las 3 se guardan. Convertidas a WebP por Cloudflare R2 / Spatie |
| 5.11 | Eliminar imagen existente | Marcar X sobre imagen → Guardar | Imagen eliminada de R2, `notas_revision` = "Eliminó 1 imagen(es)." |
| 5.12 | Eliminar + agregar en mismo guardado | Marcar 1 para eliminar + agregar 1 nueva → Guardar | Ambos cambios en `notas_revision`: "Eliminó 1 imagen(es). Agregó 1 imagen(es) nueva(s)." |
| 5.13 | Intentar subir 4ª imagen con producto que ya tiene 3 | Con 3 imágenes activas → intentar agregar otra | No permite — contador de slots bloqueado |
| 5.14 | Imagen en cel (formato HEIC) | Desde celular subir foto en formato .heic | Debe aceptar o mostrar error claro |

### 5C — Seguridad y estados

| #    | Escenario                                  | Pasos                                                         | Resultado esperado                                                    |     |
| ---- | ------------------------------------------ | ------------------------------------------------------------- | --------------------------------------------------------------------- | --- |
| 5.15 | El producto pasa a inactivo al editar      | Guardar cualquier cambio                                      | `productos.estado = 'inactivo'` — admin debe revisar antes de activar |     |
| 5.16 | notas_revision visible en admin            | Editar producto como proveedor → ir al admin con otro usuario | Admin ve banner ámbar con los cambios detallados                      |     |
| 5.17 | notas_revision desaparece al guardar admin | Admin guarda el producto después de revisar                   | Banner ámbar desaparece — `notas_revision = null`                     |     |
| 5.18 | Proveedor edita producto de otro           | Ir directamente a `/portal/productos/{id-ajeno}/editar`       | 403 "No tienes acceso a este producto"                                |     |
| 5.19 | Nombre con capitalización                  | Ingresar nombre en minúsculas "camiseta azul"                 | Se guarda como "Camiseta Azul" (Str::title)                           |     |

---

## 6. MIS PEDIDOS (`/portal/pedidos`)

| # | Escenario | Pasos | Resultado esperado |
|---|---|---|---|
| 6.1 | Ver lista de pedidos | Ir a Mis pedidos | Solo pedidos que contienen productos DEL proveedor logueado |
| 6.2 | Proveedor sin pedidos | Portal de proveedor sin pedidos activos | Estado vacío — mensaje claro, sin error |
| 6.3 | Ver estado de pedido | Ver columna estado | Muestra: Pendiente / Confirmado / Entregado / Cancelado con colores |
| 6.4 | Pedido con varios ítems (de este proveedor) | Pedido con 2 productos del proveedor | Muestra los 2 ítems correspondientes |
| 6.5 | Pedido mixto (productos de distintos proveedores) | Pedido con ítem del proveedor A y del proveedor B | Proveedor A solo ve su ítem — no ve el ítem del proveedor B |
| 6.6 | Clic en "Ver detalle" | Clic en pedido | Redirige a `/portal/pedidos/{id}` |
| 6.7 | Pedido cancelado visible | Pedido en estado `cancelado` | Aparece en la lista con badge rojo |

---

## 7. VER PEDIDO (`/portal/pedidos/{id}`)

| # | Escenario | Pasos | Resultado esperado |
|---|---|---|---|
| 7.1 | Ver detalle de pedido propio | Clic en pedido de su lista | Muestra: número pedido, cliente (nombre + ciudad), fecha, estado, sus ítems con cantidad y precio |
| 7.2 | Proveedor ve solo SUS ítems | Pedido mixto (2 proveedores) → ver detalle | Solo aparecen los ítems de este proveedor — no ve los del otro |
| 7.3 | Ver pedido ajeno directamente | Ir a `/portal/pedidos/{id-ajeno}` | 403 — no puede ver el pedido |
| 7.4 | Datos del cliente visibles | Ver detalle | Muestra nombre y ciudad (no necesariamente email/teléfono completo — depende del diseño) |
| 7.5 | Botón volver | Clic en "Volver" | Regresa a `/portal/pedidos` |

---

## 8. MIS COBROS / PAGOS (`/portal/pagos`)

| #   | Escenario              | Pasos                       | Resultado esperado                                                                                    | notas                                                                                                                                                                                                                                                                                                                                                                                                     |     |
| --- | ---------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| 8.1 | Ver deuda actual       | Ir a Mis cobros             | Muestra monto que se le debe al proveedor (suma de pedidos confirmados/entregados pendientes de pago) | mostrar en lista,  cada producto vendido en fila y al finalizar la fila estado al dia (si admin ya pago a proveedor / debe si admin debe ) poder filtrar por aldia primero o deben primero y que se organice por fecha - ademas el sistema debe tomar el dia de compra e ir calculando los dias en mora que seria otro campo al finalizar par apoder filtrar primero los mas vencidos para cobrar a admin |     |
| 8.2 | Ver historial de pagos | Ir a Mis cobros             | Lista pagos anteriores con fecha, monto, referencia                                                   |                                                                                                                                                                                                                                                                                                                                                                                                           |     |
| 8.3 | Sin pagos registrados  | Proveedor nuevo sin pagos   | Estado vacío — "Aún no hay pagos registrados"                                                         |                                                                                                                                                                                                                                                                                                                                                                                                           |     |
| 8.4 | Top productos          | Ver sección de productos    | Muestra sus productos más vendidos                                                                    |                                                                                                                                                                                                                                                                                                                                                                                                           |     |
| 8.5 | Deuda en $0            | Cuando admin ha pagado todo | Muestra "Sin deuda pendiente" o $0                                                                    |                                                                                                                                                                                                                                                                                                                                                                                                           |     |

---

## 9. FLUJO COMPLETO — Escenarios de punta a punta

| # | Escenario completo | Pasos | Verificar |
|---|---|---|---|
| 9.1 | Proveedor crea producto → admin activa → aparece en tienda | 1) Crear producto en portal → 2) Admin activa en `/productos` → 3) Ir a tienda pública | Producto visible en catálogo |
| 9.2 | Proveedor edita precio → admin ve alerta → admin revisa y guarda | 1) Editar precio en portal → 2) Admin entra a editar el producto → 3) Admin ve banner ámbar con cambios → 4) Admin guarda | Banner desaparece, `precio_costo` actualizado |
| 9.3 | Cliente hace pedido → proveedor lo ve | 1) Hacer pedido desde tienda → 2) Entrar al portal del proveedor → 3) Ir a Mis pedidos | El pedido aparece en la lista |
| 9.4 | Admin confirma pedido → proveedor ve cobro pendiente | 1) Admin confirma pedido → 2) Portal proveedor → Mis cobros | Monto aparece como deuda pendiente |
| 9.5 | Admin registra pago a proveedor → deuda baja | 1) Admin en Finanzas → Proveedores → Registrar pago → 2) Portal proveedor → Mis cobros | Historial muestra el pago, deuda actualizada |

---

## 10. PRUEBAS DESDE CELULAR

| # | Escenario | Verificar |
|---|---|---|
| 10.1 | Login desde celular | Formulario usable en pantalla pequeña |
| 10.2 | Mis productos en móvil | Cards legibles, botones accesibles |
| 10.3 | Editar producto desde cel | Formulario scroll correcto, teclado no tapa inputs |
| 10.4 | Subir imagen desde galería del cel | Hasta 3 imágenes desde la galería |
| 10.5 | Subir foto recién tomada | Usar cámara directamente (formato JPEG/HEIC) |
| 10.6 | Ver pedidos en móvil | Lista legible, clic en detalle funciona |

---

## Checklist de regresión rápida

Antes de dar por válida cada sesión, verificar mínimamente:

- [ ] Login proveedor → llega al portal (no al admin)
- [ ] Mis productos → solo los propios
- [ ] Editar precio → `notas_revision` aparece en admin con el cambio
- [ ] Admin guarda → `notas_revision` desaparece
- [ ] Crear pedido en tienda → aparece en Mis pedidos del proveedor
- [ ] El proveedor NO puede ver datos de otro proveedor

---

*Relacionado: [[FASE 6 — Portal de Proveedores]] · [[📝 Sesiones de Trabajo]] · [[🐛 Bugs y Pendientes]]*
