---
type: note
tags: [fase, marketing, completada]
created: 2026-08-07
updated: 2026-08-07
status: evergreen
descripcion: "Módulo de Marketing: Cupones de descuento y Campañas. COMPLETADA en Sesión 9."
related: ["[[📊 Tablero de Fases]]", "[[📝 Sesiones de Trabajo]]"]
---

# FASE 7 — Marketing (Cupones + Campañas)

**Estado:** ✅ Completa · **Sesión:** 9 · **Fecha:** 2026-08-07

---

## 1. ENTENDER — ¿Qué construimos?

Dos módulos de marketing para el panel de administración:

**Cupones de descuento** — Permiten crear códigos promocionales que los clientes aplican al hacer un pedido. El sistema valida automáticamente que el cupón esté activo, no haya vencido, no haya superado su límite de usos y que el pedido alcance el monto mínimo requerido.

**Campañas** — Registro y seguimiento de campañas de marketing (Instagram, Facebook, TikTok, email, etc.) con fechas, presupuesto, estado y códigos UTM para medir tráfico.

---

## 2. PENSAR — Arquitectura

### Modelos involucrados

**`Cupon`** (tabla `cupones`)
- Campos clave: `codigo` (único), `tipo` (porcentaje/fijo), `valor`, `minimo_compra`, `maximo_usos`, `usos_actuales`, `activo`, `valido_desde`, `valido_hasta`
- Relación: `hasMany(Pedido)` — un cupón puede estar en muchos pedidos
- Lógica especial: `minimo_compra` tiene default `0` en validación PHP (no en DB)

**`Campana`** (tabla `campanas`)
- Campos clave: `nombre`, `canal` (instagram/facebook/tiktok/email/google/otro), `presupuesto`, `fecha_inicio`, `fecha_fin`, `codigo_utm`, `url_destino`, `estado`, `notas`

### Ruta especial (anti-conflicto UUID)
```php
// PRIMERO la ruta explícita
Route::post('cupones/validar', [CuponController::class, 'validar'])->name('cupones.validar');
// LUEGO el resource
Route::resource('cupones', CuponController::class)->except(['show']);
```
Sin este orden, `/cupones/validar` colisiona con `/cupones/{cupon}` (Laravel lo interpreta como UUID).

---

## 3. ESCRIBIR — Archivos creados

### Backend Laravel

| Archivo | Descripción |
|---|---|
| `app/Http/Controllers/Web/CuponController.php` | CRUD completo + `validar()` para aplicar cupón en pedidos |
| `app/Http/Controllers/Web/CampanaController.php` | CRUD completo + `show()` para detalle con métricas |
| `routes/web.php` | Rutas de cupones y campañas bajo middleware `role:super_administrador\|administrador` |

**`CuponController@validar()`** — Valida en este orden:
1. El código existe → 404 si no
2. `activo === true`
3. `valido_desde` ≤ hoy ≤ `valido_hasta`
4. `usos_actuales < maximo_usos` (si maximo_usos > 0)
5. `pedido_total >= minimo_compra`

Si todo pasa: retorna `{valido: true, tipo, valor, codigo}` como JSON.

### Frontend React

| Archivo | Descripción |
|---|---|
| `resources/js/Pages/Marketing/Cupones/Index.jsx` | Lista con filtros, stats (total/activos/vencidos), tabla con badges |
| `resources/js/Pages/Marketing/Cupones/Crear.jsx` | Form con Campo helper FUERA del componente |
| `resources/js/Pages/Marketing/Cupones/Editar.jsx` | Igual pero pre-llenado con `put()` |
| `resources/js/Pages/Marketing/Campanas/Index.jsx` | Lista con filtros por canal y estado, stats |
| `resources/js/Pages/Marketing/Campanas/Crear.jsx` | Selector visual de canal (botones con íconos), Campo helper |
| `resources/js/Pages/Marketing/Campanas/Editar.jsx` | Pre-llenado con `put()` |
| `resources/js/Pages/Marketing/Campanas/Ver.jsx` | Detalle con estadísticas UTM y métricas de campaña |

---

## 4. BUGS ENCONTRADOS Y RESUELTOS

### BUG-015 — `route('finanzas.dashboard')` blank screen
- **Causa:** La ruta correcta era `route('reportes.financiero')`, no `finanzas.dashboard`
- **Fix:** Corrección del nombre de ruta en el sidebar

### BUG-016 — `Campo` dentro del componente → foco perdido al escribir
- **Causa:** Definir `function Campo()` dentro de `export default function Crear()` hace que React la trate como un componente nuevo en cada render → remonta el `<input>` → pierde el foco
- **Fix:** Mover `function Campo()` FUERA del componente principal (patrón definitivo para todo el proyecto)
- **Impacto:** Retroactivamente aplicado en Categorías y Usuarios

### BUG-017 — `npm run build -- --legacy-peer-deps` CACError
- **Causa:** `--legacy-peer-deps` es un flag de `npm install`, no de Vite. Al pasarlo como argumento de Vite, lanza un error de argumento no reconocido
- **Fix:** Solo usar `npm run build` sin flags extra

### BUG-018 — `minimo_compra` NOT NULL violation al crear cupón
- **Causa:** Campo `minimo_compra` es NOT NULL en la BD pero puede venir vacío del form
- **Fix:** Normalizar en PHP antes de `create()`: `$datos['minimo_compra'] = $datos['minimo_compra'] ?? 0`

---

## 5. DECISIONES DE DISEÑO

- **Snapshot de cupón en pedido:** Se guarda `cupon_codigo` (string) además de la FK `cupon_id`. Si el cupón se elimina en el futuro, el historial del pedido no pierde la referencia
- **Maximo_usos = 0:** Significa ilimitado (convención del proyecto)
- **Campañas sin integración externa:** Solo registro manual; no conecta con Meta Ads API ni Google Analytics (scope futuro)
- **UTM como texto libre:** El campo `codigo_utm` es un string que el usuario gestiona manualmente y pega en sus URLs

---

## 6. VERIFICAR — Estado al cierre

- [x] Cupones CRUD funcional (crear, listar, editar, eliminar)
- [x] Validación de cupón desde pedidos (endpoint `/cupones/validar`)
- [x] Campañas CRUD funcional con vista detalle
- [x] Capitalización de inputs (`Campo` con `onChange` capitalize)
- [x] Ruta explícita validar antes del resource
- [x] Bug de foco resuelto definitivamente con patrón Campo fuera de componente

---

## Conectado con

- [[📊 Tablero de Fases]] — Estado global del proyecto
- [[🐛 Bugs y Pendientes]] — Historial de bugs H015–H018
- [[FASE 6 — Portal Proveedor]] — Fase anterior
- [[FASE 8 — Tienda Pública]] — Fase siguiente (pendiente)
