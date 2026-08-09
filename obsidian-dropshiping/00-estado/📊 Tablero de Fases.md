---
type: dashboard
tags: [estado, fases, progreso]
created: 2026-08-04
updated: 2026-08-09
status: evergreen
descripcion: "Tablero central de progreso — 10 fases del proyecto"
---

# 📊 Tablero de Fases

> Progreso general del proyecto Dropshipping Colombia.
> Actualizar este archivo al cerrar cada sesión de trabajo.

---

## 🎯 Resumen

```
Fases completadas:  █████████░  9 / 10  (90%)
Tiempo estimado:    ~3-4 horas restantes
Última sesión:      2026-08-09 (sesión 11)
```

| Indicador     | Valor                               |
| ------------- | ----------------------------------- |
| Fases totales | 10                                  |
| Completadas   | 8 ✅                                 |
| En progreso   | 0                                   |
| Pendientes    | 2 ⬜                                 |
| Bugs activos  | 0 ✅                                 |

---

## ✅ FASE 1 — Proyecto Base
**Estado:** Completo ✅ — Sesión 1 · 2026-08-04

- Laravel 13 + Breeze + Inertia.js + React 18 + PostgreSQL 17
- Spatie Permission 8.3 instalado y configurado
- App corriendo en `http://dropshiping.test`

→ Nota detallada: [[FASE 1 — Proyecto Base]]

---

## ✅ FASE 2 — Usuarios y Roles
**Estado:** Completo ✅ — Sesión 2 · 2026-08-04

- 6 roles + 37 permisos (Spatie)
- CRUD completo de usuarios con login verificado
- Dashboard con saludo por rol

→ Nota detallada: [[FASE 2 — Usuarios y Roles]]

---

## ✅ FASE 3 — Productos y Catálogo
**Estado:** Completo ✅ — Sesiones 3-4 · 2026-08-04/05

- Migraciones: `categorias`, `productos`, `producto_proveedor`
- CRUD completo con subida de imágenes
- Slug automático, SoftDeletes

→ Nota detallada: [[FASE 3 — Productos y Catálogo]]

---

## ✅ FASE 4 — Pedidos y Logística
**Estado:** Completo ✅ — Sesión 5 · 2026-08-06

- Migraciones: `pedidos`, `items_pedido`, `envios`
- Numeración automática `PED-2026-00001`
- Snapshot de precios en items

→ Nota detallada: [[FASE 4 — Pedidos y Logística]]

---

## ✅ FASE 5 — Financiero y Wompi
**Estado:** Completo ✅ — Sesión 6 · 2026-08-06

- Migraciones: `transacciones`, `gastos_operativos`
- Dashboard financiero con Recharts
- Integración Wompi (sandbox) con webhook SHA256

→ Nota detallada: [[FASE 5 — Financiero y Wompi]]

---

## ✅ FASE 6 — Portal de Proveedores
**Estado:** Completo ✅ — Sesiones 7-8 · 2026-08-07

- Login compartido, redirección por rol post-login
- Layout verde diferenciado del admin (emerald)
- 9 métodos: dashboard, productos (lista/crear/editar), pedidos (lista/ver), pagos
- Proveedor crea productos desde el portal (nacen `inactivo`, admin activa)
- Upload de imágenes con preview y badge "Principal"
- Perfil proveedor editable desde admin (NIT, empresa, contacto, sitio web)

→ Nota detallada: [[FASE 6 — Portal de Proveedores]]

---

## ✅ FASE 7 — Marketing: Cupones y Campañas
**Estado:** Completo ✅ — Sesión 9 · 2026-08-07

### Lo que se construyó

**Bloque A — Migraciones**
- Tabla `cupones`: UUID, tipo (porcentaje/valor_fijo), vigencia, límite de usos
- Tabla `campanas`: canal (instagram/facebook/etc.), UTM, presupuesto, ROI
- Columnas en `pedidos`: `cupon_id`, `cupon_codigo` (snapshot), `descuento_aplicado`, `campana_id`

**Bloque B — Backend**
- `CuponController`: CRUD + endpoint AJAX `POST /cupones/validar`
- `CampanaController`: CRUD con ROI calculado en `index()`
- `destroy()` cupón → soft-disable (activo=false), no borrar — preserva historial
- `destroy()` campaña → bloquea si tiene pedidos asociados
- Ruta `cupones/validar` registrada ANTES del resource (evitar conflicto con UUID)

**Bloque C — Integración en Pedidos**
- `PedidoController@store()`: valida cupón → calcula descuento → total final → `DB::transaction()` que incluye `$cupon->incrementarUso()`
- Snapshot pattern: guarda `cupon_codigo` (string) además de `cupon_id` FK

**Bloque D — 7 páginas React**
- `Marketing/Cupones/Index.jsx` — lista con stats, filtros, botón desactivar
- `Marketing/Cupones/Crear.jsx` — tipo porcentaje/valor_fijo, tope máximo
- `Marketing/Cupones/Editar.jsx` — barra de uso visual
- `Marketing/Campanas/Index.jsx` — ROI color-coded (verde/azul/rojo)
- `Marketing/Campanas/Crear.jsx` — selector de canal en grid
- `Marketing/Campanas/Editar.jsx`
- `Marketing/Campanas/Ver.jsx` — KPIs + tabla de pedidos asociados

### Bugs resueltos en esta fase
- `route('finanzas.dashboard')` → causaba blank screen (Ziggy lanza error si ruta no existe) → fix: `route('reportes.financiero')`
- `Campo` definido DENTRO del componente → focus-loss en cada tecla → fix: mover FUERA del componente
- `--legacy-peer-deps` en `npm run build` → CACError (es flag de npm, no de Vite) → fix: correr sin ese flag
- `minimo_compra` NOT NULL violation → normalizar `null → 0` en controller antes de `create()`

→ Nota detallada: [[FASE 7 — Marketing]]

---

## ✅ BACKLOG — Completado · Sesión 10 · 2026-08-07

Ítems que faltaban de fases anteriores, ahora todos resueltos:

| Ítem | Estado |
|---|---|
| Categorías CRUD (CategoriaController + 3 páginas React) | ✅ Completo |
| `Finanzas/Transacciones/Ver.jsx` — vista detalle de pago | ✅ Completo |
| Editar perfil proveedor desde admin (NIT, empresa, contacto, web) | ✅ Completo |
| Capitalización automática en todos los inputs de texto | ✅ Completo |
| Categorías conectadas a formulario de Productos | ✅ Confirmado (ya estaba) |

**Detalles de Categorías CRUD:**
- `CategoriaController` con destroy bloqueante (si tiene productos/hijos)
- Slug auto-generado desde nombre (`Str::slug()`)
- `padre_id` excluye self en edición
- `Categorias/Index.jsx`: stats total/activas/raíces, filtros, tabla jerárquica
- `Categorias/Crear.jsx` + `Editar.jsx`: Campo helper fuera del componente ✓

**Detalles de Ver Transacción:**
- `Finanzas/Transacciones/Ver.jsx`: monto, método, estado con colores, pedido asociado con items y totales, datos Wompi en JSON, botón Anular (solo si aprobada)

**Detalles de Perfil Proveedor:**
- `UsuarioController@edit()`: carga relación `proveedor`
- `UsuarioController@update()`: `Proveedor::updateOrCreate()` dentro del `DB::transaction()`
- `Usuarios/Editar.jsx`: sección de proveedor visible dinámicamente cuando `rol === 'proveedor'`

---

## ✅ FASE 8 — SEO y Tienda Pública
**Estado:** Completo ✅ — Sesión 11 · 2026-08-09

- Rutas públicas: `GET /tienda`, `GET /tienda/{slug}`, `GET /tienda/categoria/{slug}`
- `TiendaController`: catálogo paginado, filtros por categoría/precio/búsqueda
- Layout público `TiendaLayout` (sin login) con header y footer
- `Tienda/Index.jsx`: grid de tarjetas, sidebar de filtros, paginación
- `Tienda/Producto.jsx`: galería, precio con oferta, breadcrumb, relacionados, WhatsApp CTA
- Meta tags SEO dinámicos: `og:title`, `og:description`, `og:image`, Twitter Cards

**Sistema de imágenes (sesión 11):**
- Spatie Media Library + Intervention Image + Cloudflare R2
- Conversiones WebP automáticas: thumbnail 400×400, medium 800×800
- Upload desde form de editar, eliminación individual, fallback a campo legacy
- Fix crítico: PHP no parsea multipart en PUT → method spoofing `post() + _method:put`

→ Nota detallada: [[Sistema de Imágenes — Spatie + R2]]

---

## ⬜ FASE 9 — Analytics y Seguimiento
**Estado:** Pendiente ⬜
**Estimado:** 1 sesión

- Dashboard de métricas (visitas, productos más vistos, conversión)
- Integración Google Analytics 4
- Reportes de ventas por período mejorados

---

## ⬜ FASE 10 — Tests + CI/CD + Producción
**Estado:** Pendiente ⬜
**Estimado:** 2-3 sesiones

- PHPUnit para controllers críticos
- Tests de componentes React (Vitest)
- GitHub Actions CI/CD
- Deploy en VPS / Railway
- SSL + Cloudflare
- Wompi con credenciales reales (producción)

---

## 🐛 BUGS RESUELTOS — Historial completo

| Bug | Sesión | Solución |
|-----|--------|---------|
| `composer create-project` falla (dir no vacío) | 1 | Proyecto en `_laravel-temp` → mover |
| `npm ERESOLVE` Vite 8 + @vitejs/plugin-react | 1 | `--legacy-peer-deps` siempre en `npm install` |
| PostgreSQL auth failed | 1 | `pg_hba.conf` trust → contraseña |
| `last_activity` column not found | 1 | No traducir columnas internas de Laravel |
| ViteManifestNotFoundException | 1 | Siempre correr `npm run dev` en paralelo |
| `bootstrap.js` not found | 1 | Crear manualmente con config Axios |
| UUID auth password doble hash | 2 | Pasar texto plano al seeder |
| `{transaccione}` ruta inválida | 6 | `.parameters()` + `route:clear` |
| `react-is` peer dep faltante | 6 | `npm install react-is --legacy-peer-deps` |
| Cookie `remember_me` email en lugar de UUID | 7 | Truncar `sesiones` + nuevo login |
| `403 No tienes perfil de proveedor` | 7 | Auto-crear proveedor en `UsuarioController@store` |
| Pivot columna `precio` no existe | 8 | Migración correctiva `2026_08_07_000001` |
| `Undefined variable $request` en closure | 8 | Agregar al `use()` del closure |
| `categoria_id required` bloquea form sin categorías | 8 | Cambiar a `nullable` |
| `route('finanzas.dashboard')` → blank screen | 9 | Fix: `route('reportes.financiero')` |
| `Campo` dentro del componente → foco perdido | 9 | Mover Campo FUERA del componente función |
| `--legacy-peer-deps` en `npm run build` | 9 | Ese flag es solo para `npm install`, no para build |
| `minimo_compra` NOT NULL violation | 9 | Normalizar `null → 0` antes de `Cupon::create()` |
| `vendor:publish` migración no commiteada | 11 | Commitear migration de media por separado (H028) |
| `morphs()` incompatible con UUID | 11 | Usar `uuidMorphs()` para relaciones polimórficas con UUID (H029) |
| PHP ignora body de PUT multipart | 11 | `post() + _method:'put'` en Inertia para subir archivos (H030) |
| URL R2 incorrecta en `.env` | 11 | URL del Public Dev URL ≠ URL del endpoint. Copiar del dashboard R2 |

---

*Relacionado: [[🏠 Inicio]] · [[🐛 Bugs y Pendientes]] · [[MOC — Módulos]]*
