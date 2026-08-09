---
type: dashboard
tags: [estado, sesiones, historial]
created: 2026-08-04
updated: 2026-08-07
descripcion: "Registro de todas las sesiones de desarrollo"
---

# 📝 Sesiones de Trabajo

> Añade una entrada al cerrar cada sesión con el bloque de la sesión.

---

## Sesión 10 — 2026-08-07

**Duración:** ~3 horas
**Fase:** Backlog — Categorías CRUD + Transacciones/Ver + Perfil Proveedor

**Completado:**
- [x] `CategoriaController.php` — CRUD completo (index/create/store/edit/update/destroy)
  - `destroy()` bloquea si tiene productos o hijos (mensaje explicativo)
  - `store()` auto-genera slug con `Str::slug()` si viene vacío
  - `edit()` excluye la categoría actual de la lista de padres posibles
- [x] `routes/web.php` — import `CategoriaController` + `Route::resource('categorias', ...)`
- [x] `Categorias/Index.jsx` — stats (total/activas/raíces), filtros, tabla jerárquica
- [x] `Categorias/Crear.jsx` — selector de padre, slug opcional, Campo fuera del componente
- [x] `Categorias/Editar.jsx` — mismo patrón
- [x] `Finanzas/Transacciones/Ver.jsx` — detalle de pago (monto/método/estado/pedido/items/Wompi)
- [x] `UsuarioController@edit()` — carga relación `proveedor`
- [x] `UsuarioController@update()` — `Proveedor::updateOrCreate()` dentro de `DB::transaction()`
- [x] `Usuarios/Editar.jsx` — sección "Perfil de Proveedor" condicional (rol === 'proveedor')
- [x] Capitalización automática de primera letra en inputs de texto (9 archivos)
- [x] Confirmado: Categorías ya estaban conectadas a Productos desde FASE 3
- [x] Checkpoint `checkpoint-dropshipping-2026-08-07.md` generado
- [x] Obsidian actualizado (esta sesión)

**Próxima sesión:** Verificar build + FASE 8 — Tienda Pública + SEO

---

## Sesión 9 — 2026-08-07

**Duración:** ~4 horas
**Fase:** FASE 7 — Marketing: Cupones y Campañas (completa)

**Completado:**
- [x] **Bloque A — Migraciones:** tabla `cupones`, tabla `campanas`, columnas en `pedidos` (cupon_id, cupon_codigo, descuento_aplicado, campana_id)
- [x] **Bloque B — Backend:**
  - `CuponController` — CRUD + endpoint AJAX `POST /cupones/validar`
  - `CampanaController` — CRUD + `show()` con análisis ROI
  - Ruta `cupones/validar` ANTES del resource (evita conflicto con UUID)
  - `destroy()` cupón → soft-disable (activo=false), no borrar
  - `destroy()` campaña → bloquea si tiene pedidos
- [x] **Bloque C — Integración en Pedidos:** `PedidoController@store()` valida cupón, calcula descuento, snapshot en `cupon_codigo`, `$cupon->incrementarUso()` dentro del `DB::transaction()`
- [x] **Bloque D — 7 páginas React:** Cupones (Index/Crear/Editar) + Campañas (Index/Crear/Editar/Ver)
- [x] 4 bugs resueltos (blank screen, focus-loss, flag incorrecto en build, NOT NULL violation)
- [x] Dashboard verificado: 6 cards con links reales ✅

**Errores resueltos:**
- `route('finanzas.dashboard')` → Ziggy lanza error si la ruta no existe → blank screen → fix: `route('reportes.financiero')`
- `Campo` definido dentro del componente → React remonta el input en cada render → foco perdido → fix: mover Campo fuera del componente función
- `npm run build -- --legacy-peer-deps` → CACError (ese flag es solo de `npm install`) → fix: correr sin flags
- `minimo_compra` NOT NULL + DEFAULT 0 → Eloquent incluye null explícitamente y omite el default → fix: `$datos['minimo_compra'] = $datos['minimo_compra'] ?? 0`

**Próxima sesión:** Backlog (Categorías CRUD, Ver Transacción, Perfil Proveedor)

---

## Sesión 8 — 2026-08-07

**Duración:** ~1.5 horas
**Fase:** FASE 6 mejora — Creación de productos desde el portal

**Completado:**
- [x] Rutas `GET /portal/productos/crear` y `POST /portal/productos`
- [x] `PortalController@crearProducto` + `guardarProducto` (con upload de imágenes)
- [x] `Portal/CrearProducto.jsx` — formulario completo con preview imágenes e indicador de margen
- [x] Botón "+ Agregar Producto" en `Portal/Productos.jsx`
- [x] Migración `2026_08_07_000001` — corrige columnas pivot (`precio`, `stock`, `sku_proveedor`, etc.)
- [x] `Dashboard.jsx` actualizado — 6 cards con links reales, "Fase 6/10"
- [x] 3 bugs resueltos (pivot columna precio, $request en closure, categoría requerida)

**Errores resueltos:**
- Pivot `precio` no existía → migración correctiva
- `$request` no disponible dentro del closure `DB::transaction` → agregar al `use()`
- `categoria_id` requerido bloqueaba el form si no hay categorías → cambiar a nullable

---

## Sesión 7 — 2026-08-07

**Duración:** ~3 horas
**Fase:** FASE 6 — Portal de Proveedores (completa)

**Completado:**
- [x] Redirección post-login por rol (proveedor → /portal/dashboard, admin → /dashboard)
- [x] Grupo rutas /portal/* con middleware `role:proveedor|super_administrador`
- [x] `PortalController` — 7 métodos con seguridad por proveedor
- [x] `PortalLayout.jsx` — navbar verde (emerald), link ← Admin para super_admin
- [x] 6 páginas React: Dashboard, Productos, EditarProducto, Pedidos, VerPedido, Pagos
- [x] Auto-crear perfil `proveedores` al crear usuario con rol proveedor
- [x] Portal verificado: layout verde, "Bienvenido Mi Empresa" ✅

**Errores resueltos:**
- Cookie `remember_me` con email en lugar de UUID → truncar `sesiones`
- `403 No tienes perfil de proveedor` → tabla `proveedores` vacía → auto-crear en `UsuarioController@store`

---

## Sesión 6 — 2026-08-06

**Duración:** ~4 horas
**Fase:** FASE 5 — Financiero y Wompi (completa)

**Completado:**
- [x] 2 migraciones: transacciones (UUID + JSONB + ENUM) y gastos_operativos (DATE)
- [x] 2 modelos: Transaccion (boot auto-fill, inmutable) y GastoOperativo
- [x] TransaccionController — pagos manuales + generarLinkWompi + webhookWompi SHA256
- [x] GastoController — CRUD completo con SoftDeletes
- [x] ReporteFinancieroController — 6 KPIs + datos para LineChart y BarChart
- [x] 6 páginas React: Dashboard (Recharts), Transacciones/Index+Crear, Gastos/Index+Crear+Editar
- [x] Wompi config en .env y config/services.php
- [x] Dashboard verificado: datos reales de PED-2026-00001 visibles ✅

**Errores resueltos:**
- `react-is` peer dep → `npm install react-is --legacy-peer-deps`
- `{transaccione}` en rutas → `.parameters()` + `route:clear`

---

## Sesión 5 — 2026-08-06

**Duración:** ~3 horas
**Fase:** FASE 4 — Pedidos y Logística (completa)

**Completado:**
- [x] 3 migraciones: pedidos, items_pedido, envios
- [x] 3 modelos: Pedido, ItemPedido, Envio (UUID + SoftDeletes + relaciones)
- [x] PedidoController — 8 métodos con transacción DB en store()
- [x] Numeración auto PED-2026-00001 verificada
- [x] 4 páginas React: Index, Crear, Ver, Editar
- [x] Primer pedido PED-2026-00001 creado exitosamente ✅

---

## Sesión 4 — 2026-08-05

**Duración:** ~2 horas
**Fase:** FASE 3 — fix imagen upload + cierre completo

**Completado:**
- [x] Fix `upload_tmp_dir` en php.ini de Herd — script `fix-php-upload.ps1`
- [x] Fix `Path cannot be empty` — `Storage::store()` → `move()` en ProductoController
- [x] Imagen upload verificada: producto "Bateria" con imagen funcional ✅
- [x] FASE 3 declarada 100% completa

---

## Sesión 3 — 2026-08-04/05

**Duración:** ~4 horas
**Fase:** FASE 3 — Productos y Catálogo

**Completado:**
- [x] 3 migraciones: categorias, productos, producto_proveedor
- [x] 3 modelos: Categoria, Producto, ProductoProveedor
- [x] ProductoController CRUD completo
- [x] 3 páginas React: Index, Crear, Editar
- [x] Primer producto creado en BD ✅

---

## Sesión 2 — 2026-08-04

**Duración:** ~3 horas
**Fase:** FASE 2 — Usuarios y Roles

**Completado:**
- [x] Seeders: 6 roles, 34 permisos, usuario admin
- [x] Middleware Spatie en bootstrap/app.php
- [x] UsuarioController CRUD completo (9 métodos)
- [x] 4 páginas React: Dashboard, Index, Crear, Editar
- [x] Vault Obsidian reestructurado

---

## Sesión 1 — 2026-08-04

**Duración:** ~4-5 horas
**Fase:** FASE 1 — Proyecto Base

**Completado:**
- [x] Vault Obsidian creado
- [x] Laravel 13 instalado
- [x] PostgreSQL 17 configurado
- [x] 5 migraciones en español corriendo
- [x] Modelos User.php y Proveedor.php
- [x] App corriendo en localhost:8000

---

## Sesión 11 — 2026-08-09

**Duración:** ~3 horas
**Fase:** Sistema de Imágenes (mejora FASE 3) + Tienda Pública completada

**Completado:**
- [x] Spatie Media Library + Intervention Image instalados y configurados
- [x] Cloudflare R2 como disco de almacenamiento
- [x] Conversiones WebP automáticas (thumbnail 400×400, medium 800×800)
- [x] Migración `create_media_table` con `uuidMorphs` (compatible con UUID PKs)
- [x] ProductoController: upload y eliminación de imágenes vía Spatie
- [x] Editar.jsx: mostrar imágenes actuales con botón borrar, preview de nuevas
- [x] Tienda pública: imágenes de Spatie con fallback a campo legacy
- [x] R2 Public Development URL habilitado y URL correcta en .env
- [x] Fix method spoofing: `post() + _method:put` para uploads en Inertia

**Errores resueltos:**
- H028: migración de vendor:publish no estaba commiteada → CI fallaba
- H029: `morphs()` crea `model_id` como bigint → incompatible con UUID → fix `uuidMorphs()`
- H030: PHP no parsea multipart/form-data en PUT → body llegaba vacío → fix `post() + _method:put`
- URL R2 en .env no coincidía con la URL del Public Development URL del dashboard

**Próxima sesión:**
- Deploy al VPS (Digital Ocean)
- Configurar dominio custom en R2 (reemplazar r2.dev por dominio real)
- FASE 9: Analytics o FASE 10: CI/CD + Producción

---

## Plantilla para próximas sesiones

```markdown
## Sesión N — YYYY-MM-DD

**Duración:**
**Fase:**

**Completado:**
- [x] 

**Errores resueltos:**
-

**Próxima sesión:**
```

---

*Relacionado: [[📊 Tablero de Fases]] · [[🐛 Bugs y Pendientes]]*
