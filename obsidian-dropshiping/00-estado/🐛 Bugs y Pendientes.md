---
type: dashboard
tags: [estado, bugs, pendientes]
created: 2026-08-04
updated: 2026-08-25
status: evergreen
descripcion: "Bugs activos y acciones inmediatas del proyecto"
---

# 🐛 Bugs y Pendientes

> Este archivo se actualiza al inicio y cierre de cada sesión.

---

## ✅ RESUELTO — Sesión 16 (2026-08-25)

### Cupones no conectados al carrito
- **Era:** `descuento` hardcodeado en 0, campo cupón inexistente en `Carrito.jsx`
- **Fix:** `CarritoController::store()` acepta `cupon_codigo`, valida, descuenta y llama `incrementarUso()`
- **Fix:** `Carrito.jsx` tiene campo AJAX, muestra descuento en resumen y envía `cupon_codigo` al servidor

---

## 📋 PENDIENTES — Próxima sesión (17)

### 🔴 Crítico — Hacer push
```powershell
cd D:\proyectos\dropshiping
git add .
git commit -m "feat: portal dashboard simplificado + cupones conectados al carrito con restricciones por categoria/producto"
git push origin main
```
Railway corre `php artisan migrate` automáticamente (migración nuevas tablas pivot de cupones).

### 🟡 Verificación post-deploy
- [ ] Crear cupón "TODO" en admin → aplicar en carrito → confirmar que descuento aparece y pedido guarda `cupon_id`
- [ ] Crear cupón con restricción "Categorías" → aplicar con productos de esa categoría → verificar que solo descuenta lo elegible
- [ ] Crear cupón con restricción "Productos específicos" → verificar igual
- [ ] Verificar que `usos_actuales` sube al completar un pedido con cupón
- [ ] Verificar que cupón con `limite_usos = 1` bloquea el segundo uso

### 🟢 Mejoras identificadas (futuro)
- [ ] `Gastos/Editar.jsx` — agregar selector de pedido (solo se hizo en Crear.jsx — sesión 15)
- [ ] Ver si hay pedidos confirmados anteriores sin transacción (query SQL diagnóstico en sesión 15)
- [ ] Mostrar en `Pedidos/Ver.jsx` o admin si el pedido usó cupón y cuál
- [ ] En el email/WhatsApp de confirmación: incluir el código de cupón aplicado y el descuento

---

## 📊 DIAGNÓSTICO RÁPIDO — SQL útiles

### Pedidos confirmados sin transacción (sesión 15)
```sql
SELECT p.numero_pedido, p.cliente_nombre, p.total, p.estado
FROM pedidos p
LEFT JOIN transacciones t ON t.pedido_id = p.id
WHERE p.estado IN ('confirmado', 'entregado')
AND t.id IS NULL
AND p.eliminado_en IS NULL;
```

### Cupones usados con descuento (verificación sesión 16)
```sql
SELECT p.numero_pedido, p.descuento, c.codigo, c.usos_actuales
FROM pedidos p
JOIN cupones c ON c.id = p.cupon_id
ORDER BY p.creado_en DESC
LIMIT 10;
```

---

*Actualizado: Sesión 16 — 2026-08-25*
*Relacionado: [[📝 Sesiones de Trabajo]] · [[📊 Tablero de Fases]]*
