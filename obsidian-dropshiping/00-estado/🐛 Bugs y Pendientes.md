---
type: dashboard
tags: [estado, bugs, pendientes]
created: 2026-08-04
updated: 2026-08-27
status: evergreen
descripcion: "Bugs activos y acciones inmediatas del proyecto"
---

# 🐛 Bugs y Pendientes

> Este archivo se actualiza al inicio y cierre de cada sesión.

---

## 🔴 ACCIÓN REQUERIDA — Sesión 18 (2026-08-27)

### Migrar base de datos en Railway
- [ ] En Railway Console: `php artisan migrate`
- Crea tabla `clientes` + columna `cliente_id` en `pedidos`
- Sin esto el login de clientes da error 500

### Probar flujo completo
- [ ] Hacer pedido con cédula en tienda → verificar que crea cliente en BD
- [ ] Ir a "Mi cuenta" → identificarse → ver pedidos
- [ ] Segundo pedido → verificar que aparece "¿Misma dirección?"
- [ ] Admin → `/clientes/exportar` → descargar CSV

---

## ✅ RESUELTO — Sesión 18 (2026-08-27)

### Sistema completo de cuenta cliente
- [x] Tabla `clientes` + FK `cliente_id` en pedidos
- [x] Login por cédula + últimos 4 dígitos del celular (sin contraseña)
- [x] Rate limiting: 5 intentos / 15 min por IP
- [x] Navbar: muestra nombre del cliente en naranja si está identificado
- [x] Carrito: pre-llena automáticamente + "¿Misma dirección?" en segunda compra
- [x] Dashboard `/tienda/cuenta/mis-pedidos`: pedidos con estados coloreados
- [x] Exportar CSV clientes para admin

---

## ✅ RESUELTO — Sesión 17 (2026-08-26)

### notas_revision mostraba "sin cambios" cuando sí había cambios
- **Era:** Usaba `exists()` (sin datos del pivot), comparación float directa, faltaban stock y contraentrega
- **Fix:** Cambiado a `first()` para leer `$pivot->precio` y `$pivot->stock`; `(int) round((float))` para precios; `trim((string)($val ?? ''))` para nullables; comparación de 7 campos completos

### precio_costo no actualizaba al editar desde el portal
- **Era:** Solo se actualizaba el pivot, no el campo `productos.precio_costo`
- **Fix:** `$producto->update([..., 'precio_costo' => $datos['precio'], ...])` en actualizarProducto()

### Badge pedidos pendientes no aparecía
- **Era:** No había shared prop, solo el de Productos existía
- **Fix:** `pedidosPendientes` lazy closure en `HandleInertiaRequests.php`, badge en navbar y card en Dashboard

---

## ✅ RESUELTO — Sesión 16 (2026-08-25)

### Cupones no conectados al carrito
- **Era:** `descuento` hardcodeado en 0, campo cupón inexistente en `Carrito.jsx`
- **Fix:** `CarritoController::store()` acepta `cupon_codigo`, valida, descuenta y llama `incrementarUso()`
- **Fix:** `Carrito.jsx` tiene campo AJAX, muestra descuento en resumen y envía `cupon_codigo` al servidor

---

## 📋 PENDIENTES — Próxima sesión (18)

### 🔴 Alta prioridad — Verificar deploy sesión 17
- [ ] Abrir Railway y confirmar que el deploy de sesión 17 completó sin errores
- [ ] Probar: editar producto como proveedor → cambiar nombre/precio/stock → ver banner ámbar en admin
- [ ] Probar: crear pedido desde tienda → ver badge en navbar + tarjeta amarilla en Pedidos
- [ ] Confirmar que "Historial" solo muestra confirmados/entregados/cancelados

### 🔴 Alta prioridad — Módulo financiero (bug sin reproducir)
**Reporte del usuario:** "no actualiza lo que se debe pagar, actualiza la cadena completa hasta el final"

**PENDIENTE CLARIFICACIÓN:** ¿Se refiere a...?
- A) **Sección Proveedores** → lo que se le debe pagar al proveedor (`pagos_proveedor`)
- B) **Dashboard financiero general** → ingresos/ganancias no se actualizan

👉 Preguntar al inicio de la sesión 18 antes de tocar código

### 🟡 Media prioridad — Verificación post-deploy cupones (sesión 16)
- [ ] Crear cupón "TODO" en admin → aplicar en carrito → confirmar descuento y `cupon_id` en pedido
- [ ] Cupón con restricción "Categorías" → verificar que solo descuenta ítems elegibles
- [ ] Verificar que `usos_actuales` sube al completar pedido con cupón
- [ ] Cupón con `limite_usos = 1` → segundo uso debe bloquearse

### 🟢 Baja prioridad — Mejoras futuras
- [ ] `Gastos/Editar.jsx` — agregar selector de pedido (Crear.jsx ya lo tiene)
- [ ] `Pedidos/Ver.jsx` — mostrar si el pedido usó cupón y cuál
- [ ] Notificación push real en celular para pedidos nuevos (requiere PWA o Firebase)
- [ ] WhatsApp de confirmación incluir código de cupón y descuento

---

## 📊 SQL útiles — Diagnóstico rápido

### Pedidos confirmados sin transacción
```sql
SELECT p.numero_pedido, p.cliente_nombre, p.total, p.estado
FROM pedidos p
LEFT JOIN transacciones t ON t.pedido_id = p.id
WHERE p.estado IN ('confirmado', 'entregado')
AND t.id IS NULL
AND p.eliminado_en IS NULL;
```

### Cupones usados con descuento
```sql
SELECT p.numero_pedido, p.descuento, c.codigo, c.usos_actuales
FROM pedidos p
JOIN cupones c ON c.id = p.cupon_id
ORDER BY p.creado_en DESC
LIMIT 10;
```

### notas_revision pendientes de revisión admin
```sql
SELECT id, nombre, notas_revision, precio_costo
FROM productos
WHERE notas_revision IS NOT NULL
AND eliminado_en IS NULL;
```

---

## ⚠️ Recordatorio Git — index.lock

Si `git add` falla con "index.lock" o "HEAD.lock":
```powershell
Remove-Item "D:\proyectos\dropshiping\.git\index.lock" -Force -ErrorAction SilentlyContinue
Remove-Item "D:\proyectos\dropshiping\.git\HEAD.lock" -Force -ErrorAction SilentlyContinue
```

---

*Actualizado: Sesión 17 — 2026-08-26*
*Relacionado: [[📝 Sesiones de Trabajo]] · [[📊 Tablero de Fases]]*
