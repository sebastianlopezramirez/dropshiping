---
type: dashboard
tags: [estado, bugs, pendientes]
created: 2026-08-04
updated: 2026-08-22
status: evergreen
descripcion: "Bugs activos y acciones inmediatas del proyecto"
---

# 🐛 Bugs y Pendientes

> Este archivo se actualiza al inicio y cierre de cada sesión.

---

## ⚠️ BUGS ACTIVOS

✅ **Ningún bug activo** al cierre de la sesión 13.

---

## 📋 PENDIENTES — Próxima sesión (14)

### Paso 1 — Git push
- [ ] Ejecutar `Remove-Item D:\proyectos\dropshiping\.git\HEAD.lock` si existe
- [ ] `git push origin main` (commit `a3a8101` — Excel importer con PhpSpreadsheet)

### Paso 2 — Importación masiva
- [ ] Verificar que Railway desplegó con PhpSpreadsheet activo
- [ ] Abrir `productos_importar.xlsx`, completar `precio_costo` y `stock`
- [ ] Verificar que slug `decoracion` existe en la DB (admin → Categorías)
- [ ] Subir el Excel en admin → Productos → Importar

### Paso 3 — Deploy prep (FASE 10 Bloque B)
- [ ] Dominio custom en Railway
- [ ] Wompi producción (credenciales reales)
- [ ] Sitemap XML automático

---

## 📌 BACKLOG — Pendientes de baja prioridad

| Item | Módulo | Prioridad |
|---|---|---|
| Capitalización en `Pedidos/Crear.jsx` (cliente_nombre, ciudad) | FASE 4 | Baja |
| Capitalización en `Usuarios/Crear.jsx` (campo nombre) | FASE 2 | Baja |
| Perfil proveedor: campos adicionales (condiciones_pago, metodos_pago) | FASE 6 | Baja |
| Notificaciones por email al cambiar estado de pedido | FASE 4 | Media |
| Exportar lista de pedidos a Excel/CSV | FASE 4 | Media |
| Sitemap XML automático | FASE 8 | Media |
| Importar imágenes al importar productos masivamente | FASE 3 | Media |

---

## 📌 Reglas aprendidas — Convenciones fijas

| Regla | Descripción |
|---|---|
| `--legacy-peer-deps` solo en `npm install` | Nunca en `npm run build` — CACError |
| `HEAD.lock` en git | Borrar con `Remove-Item` antes de push si git falla |
| Theme claro: `[data-tema="claro"]` | Todas las reglas CSS de modo luz usan este selector |
| Importar Excel | `IOFactory::createReaderForFile()` + `setReadDataOnly(true)` |
| `categoria_slug` en importación | El slug debe existir en DB o el producto queda sin categoría |

---

*Relacionado: [[📝 Sesiones de Trabajo]] · [[📊 Tablero de Fases]]*
