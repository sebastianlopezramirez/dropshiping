---
type: dashboard
tags: [estado, bugs, pendientes]
created: 2026-08-04
updated: 2026-08-24
status: evergreen
descripcion: "Bugs activos y acciones inmediatas del proyecto"
---

# 🐛 Bugs y Pendientes

> Este archivo se actualiza al inicio y cierre de cada sesión.

---

## 🔴 BUG ACTIVO — Sesión 15 (2026-08-24)

### Dashboard financiero muestra Ingresos $0

**Síntoma:** Ingresos = $0, Costo productos = $2.5M, Ganancia = -$2.5M

**Causa raíz:** El pedido de la Moto Kawasaky fue confirmado ANTES de que el nuevo código (modal de método de pago + auto-creación de Transaccion) fuera desplegado en Railway. No existe ninguna fila en la tabla `transacciones` para ese pedido.

**Código nuevo — ya implementado y en archivos locales:**
```
Admin → clic "→ Confirmado" en Pedidos/Index.jsx
  → Modal pregunta método de pago (efectivo/transferencia/nequi...)
  → router.patch({ estado: 'confirmado', metodo_pago_confirmacion: 'efectivo' })
  → PedidoController@cambiarEstado() crea Transaccion aprobada con pagado_en = now()
  → Dashboard financiero muestra el ingreso
```

**Estado del fix:** ⚠️ Código listo localmente — git push NO confirmado aún

**Pasos para resolver:**

1. **PowerShell — hacer push:**
   ```powershell
   Remove-Item .git\HEAD.lock -Force -ErrorAction SilentlyContinue
   Remove-Item .git\index.lock -Force -ErrorAction SilentlyContinue
   git add -A
   git commit -m "feat: flujo pedido completo + modulo financiero automatico + estados simplificados"
   git push origin main
   ```

2. **Railway — correr migración (nueva columna pedido_id en gastos):**
   ```bash
   php artisan migrate
   ```

3. **Resolver el pedido de la Kawasaki (sin transacción):**
   - Opción A (recomendada): Pedidos → cancelar pedido Kawasaki → nuevo pedido → confirmar con modal → se crea Transaccion automáticamente
   - Opción B (rápida): "Ver transacciones → + Registrar Pago" → seleccionar pedido → monto $3.500.000 → Aprobada

4. **Verificar resultado esperado:**
   - Ingresos: $3.500.000
   - Costo productos: $2.500.000
   - Ganancia bruta: $1.000.000 ✓

---

## 📋 PENDIENTES — Próxima sesión (16)

### Crítico
- [ ] Git push con todos los cambios de sesión 15 (ver comando arriba)
- [ ] `php artisan migrate` en Railway (migración pedido_id en gastos_operativos)
- [ ] Resolver Transaccion faltante del pedido Kawasaki

### Verificación post-deploy
- [ ] Crear pedido de prueba desde tienda → confirmar con modal → verificar que Transaccion se crea
- [ ] Verificar Dashboard financiero muestra Ingresos correctos
- [ ] Verificar filtro por día en Dashboard funciona
- [ ] Verificar "Ver Transacciones" muestra fecha/hora exacta

### Mejoras pendientes identificadas
- [ ] Gastos/Editar.jsx — agregar selector de pedido (solo se hizo en Crear.jsx)
- [ ] Ver si hay pedidos confirmados anteriores sin transacción (query SQL de diagnóstico)

---

## 📊 DIAGNÓSTICO RÁPIDO — SQL

Si en producción hay pedidos confirmados sin transacción, correr en Railway Console:
```sql
SELECT p.numero_pedido, p.cliente_nombre, p.total, p.estado
FROM pedidos p
LEFT JOIN transacciones t ON t.pedido_id = p.id
WHERE p.estado IN ('confirmado', 'entregado')
AND t.id IS NULL
AND p.eliminado_en IS NULL;
```

---

*Actualizado: Sesión 15 — 2026-08-24*
*Relacionado: [[📝 Sesiones de Trabajo]] · [[📊 Tablero de Fases]]*
