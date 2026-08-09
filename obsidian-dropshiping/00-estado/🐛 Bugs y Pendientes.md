---
type: dashboard
tags: [estado, bugs, pendientes]
created: 2026-08-04
updated: 2026-08-07 (sesión 12)
status: evergreen
descripcion: "Bugs activos y acciones inmediatas del proyecto"
---

# 🐛 Bugs y Pendientes

> Este archivo se actualiza al inicio y cierre de cada sesión.
> Los bugs resueltos se mueven a la sección "Historial".

---

## ⚠️ BUGS ACTIVOS

✅ **Ningún bug activo** al cierre de la sesión 12. CI verde 8/8 tests.

---

## 📋 PENDIENTES — Próxima sesión (14)

### Paso 1 — Deploy prep (FASE 10 Bloque B)
- [ ] Preparar `.env.production` con variables reales
- [ ] Decidir plataforma: Railway / Render / VPS
- [ ] Documentar proceso de deploy paso a paso
- [ ] Deploy real en servidor

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

---

## 📌 Reglas aprendidas — Convenciones fijas

| Regla | Descripción |
|---|---|
| `--legacy-peer-deps` solo en `npm install` | Nunca en `npm run build` — eso es un flag de Vite y lanza CACError |
| `Campo` siempre FUERA del componente React | Si se define dentro, React remonta el input en cada tecla → foco perdido |
| Ruta explícita ANTES del `resource()` | `POST /cupones/validar` antes de `Route::resource('cupones', ...)` |
| `DB::transaction()` → variables en `use()` | Todas las variables externas deben incluirse explícitamente |
| Columnas NOT NULL con DEFAULT → normalizar en PHP | `$datos['campo'] = $datos['campo'] ?? 0` antes de `create()` |
| `route()` de Ziggy lanza error en render si no existe | Verificar nombres exactos con `php artisan route:list` |
| Tablas en español, columnas internas en inglés | `last_activity`, `payload`, `remember_token` = mantener en inglés |
| URL local correcta | `http://dropshiping.test` (Herd) — NO `http://localhost` sin puerto |
| Proveedor se auto-crea en `UsuarioController@store()` | Sin esto, el portal lanza 403 |
| Snapshot de cupón en pedido | Guardar `cupon_codigo` (string) además de `cupon_id` FK |

---

## ✅ BUGS RESUELTOS — Historial completo

| # | Bug | Sesión | Solución |
|---|-----|--------|---------|
| H001 | `composer create-project` falla (dir no vacío) | 1 | Proyecto en `_laravel-temp` → mover |
| H002 | `npm ERESOLVE` Vite 8 incompatible | 1 | `--legacy-peer-deps` en `npm install` |
| H003 | PostgreSQL auth failed | 1 | `pg_hba.conf` trust → `ALTER USER` |
| H004 | `last_activity` column not found | 1 | No traducir columnas internas de Laravel |
| H005 | ViteManifestNotFoundException | 1 | Siempre correr `npm run dev` en paralelo |
| H006 | `bootstrap.js` not found | 1 | Crear manualmente con config Axios |
| H007 | UUID auth password doble hash | 2 | Pasar texto plano al seeder |
| H008 | `{transaccione}` ruta inválida | 6 | `.parameters()` + `route:clear` |
| H009 | `react-is` peer dep faltante | 6 | `npm install react-is --legacy-peer-deps` |
| H010 | Cookie `remember_me` email en lugar de UUID | 7 | Truncar `sesiones` + nuevo login |
| H011 | `403 No tienes perfil de proveedor` | 7 | Auto-crear en `UsuarioController@store` |
| H012 | Pivot columna `precio` no existe | 8 | Migración correctiva `2026_08_07_000001` |
| H013 | `Undefined variable $request` en closure | 8 | Agregar al `use()` del closure |
| H014 | `categoria_id required` bloquea form | 8 | Cambiar a `nullable` en validación |
| H015 | `route('finanzas.dashboard')` → blank screen | 9 | Fix: `route('reportes.financiero')` |
| H016 | `Campo` dentro del componente → foco perdido | 9 | Mover Campo FUERA del componente función |
| H017 | `npm run build -- --legacy-peer-deps` CACError | 9 | Ese flag es solo para `npm install` |
| H018 | `minimo_compra` NOT NULL violation | 9 | Normalizar `null → 0` antes de `create()` |
| H019 | CI Run #1: `npm ERESOLVE` Vite 8 peer dep | 12 | `.npmrc` → `legacy-peer-deps=true` |
| H020 | CI Run #2: column "name" no existe | 12 | Eliminar 7 tests Breeze + `UserFactory` corregida |
| H021 | CI Run #3: `Categoria/Producto::factory()` no existe | 12 | Crear `CategoriaFactory`, `ProductoFactory`, agregar `HasFactory` |
| H022 | CI Run #4: column "email_verified_at" no existe | 12 | `UserFactory` → `email_verificado_en` ✅ CI VERDE |
| H023 | CI Run #5: assertJsonPath int vs float strict | 13 | `assertGreaterThan(0, ...)` en vez de `assertJsonPath` |
| H024 | CI Run #7: direccion_entrega NOT NULL | 13 | Agregar campo al `Pedido::create()` en tests |
| H025 | CI Run #8: Array to string en direccion_entrega | 13 | Revertir cast 'array' — es VARCHAR no JSONB |
| H026 | CI Run #9: ciudad/departamento NOT NULL | 13 | Leer migración antes de crear modelos en tests |
| H027 | CI Run #10: patchJson devuelve error con Inertia | 13 | Usar `patch()` + `assertDatabaseHas()` ✅ 18/18 |

---

*Relacionado: [[🏠 Inicio]] · [[📊 Tablero de Fases]] · [[🔐 Credenciales — Master]]*
