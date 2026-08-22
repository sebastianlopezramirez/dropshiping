---
type: dashboard
tags: [estado, sesiones, historial]
created: 2026-08-04
updated: 2026-08-22
descripcion: "Registro de todas las sesiones de desarrollo"
---

# 📝 Sesiones de Trabajo

> Añade una entrada al cerrar cada sesión con el bloque de la sesión.

---

## Sesión 14 — 2026-08-22

**Duración:** ~3 horas
**Fase:** FASE 3 — Productos (import fix) + FASE 8 — Tienda (UI fixes)

**Completado:**

### Importador masivo (ProductoController.php)
- [x] Fix `categoria_slug`: regenerado Excel con `navidad` (no `Temporada-Navidad`)
- [x] Debug "0 importados / 39 errores" → causa: `stock_minimo` NOT NULL en DB
- [x] Fix: `stock` y `stock_minimo` default `0` (antes devolvía `null` con celda vacía)
- [x] Mejora debug: `catch (\Throwable $e)` + `get_class($e)` + "Primer error →" en banner
- [x] Creado `productos_importar.xlsx` con 39 productos navidad en estado `borrador`

### Admin — Catálogo (Productos/Index.jsx)
- [x] Filtros colapsables: estado `mostrarFiltros` + botón "⚙ Filtros ▼" toggle
- [x] Botón "🗑 Vaciar catálogo" (solo `super_administrador`, solo si hay productos)
- [x] Ruta `DELETE productos/borrar-todos` con middleware `role:super_administrador`
- [x] `borrarTodos()` en ProductoController: borra media Spatie + elimina todos los productos

### Tienda Pública (Tienda/Index.jsx)
- [x] Botón filtros: removido `lg:hidden` (ahora visible en desktop también)
- [x] Botón filtros: fondo `bg-[#2c2c2c]` (carbon) con texto blanco
- [x] Overlay del drawer: removido `lg:hidden`

### Tienda Pública — Descripción en modo luz (Tienda/Producto.jsx)
- [x] Fix: `text-white` movido a `<p>` hijo dentro del `div.bg-gray-900`
- [x] Causa: CSS `:not(.bg-gray-900 *)` se aplicaba al div mismo (no era hijo de sí mismo)

### Documentación (Obsidian)
- [x] Creado [[Proceso — Subir Productos Caroleste]] con workflow de 5 pasos

**⚠️ PENDIENTE PUSH:**
- [ ] `git add -A && git commit -m "fix: stock_minimo default 0 + descripcion texto blanco en modo luz"` 
- [ ] `git push origin main`
- [ ] Si hay lock files: `Remove-Item ".git\*.lock"` en PowerShell primero
- [ ] Luego probar importar los 39 productos de navidad

---

## Sesión 13 — 2026-08-22

**Duración:** ~4 horas
**Fase:** FASE 8 — Tienda Pública (tema claro) + Importador masivo Excel

**Completado:**

### UI — Tema Claro (TiendaLayout.jsx)
- [x] Footer fondo `#FF1493`, títulos `h4` blancos, textos negros
- [x] Logo circular (`/logo.webp` + `rounded-full`) en footer modo luz
- [x] Textos fuera de tarjetas → negro negrilla con `:not(.bg-gray-9xx *)`
- [x] Botón "Filtros" → `text-white` en ambas instancias (móvil + desktop)
- [x] Sidebar categorías → texto blanco en modo luz (selector `.bg-gray-900 button`)
- [x] Título "Recién llegados" → negro en modo luz (`main h2.text-white`)
- [x] Botón flotante llamada → naranja sólido `bg-orange-500`
- [x] Navbar revertido a negro (prueba de rosa `#FF1493` descartada)

### UI — Categorías (Tienda/Index.jsx)
- [x] Sección categorías: grid cards 3col → lista 2 columnas `emoji + nombre`
- [x] Clase `gs-categorias` preservada para targeting CSS específico

### Importador masivo (ProductoController.php)
- [x] `phpoffice/phpspreadsheet` instalado vía Composer
- [x] `importar()` reescrito: detecta `.xlsx/.xls/.ods` vs `.csv` por extensión
- [x] Excel: `IOFactory::createReaderForFile()` + `setReadDataOnly(true)`
- [x] CSV: `fgetcsv` con strip de BOM
- [x] 17 columnas soportadas: sku, nombre, descripcion_corta, descripcion, precio_costo, precio_venta, precio_oferta, stock, stock_minimo, categoria_slug, peso_kg, largo_cm, ancho_cm, alto_cm, meta_titulo, meta_descripcion, estado
- [x] `productos_importar.xlsx` generado: 39 productos del PDF (Árboles/Coronas/Guirnalda/Pies)
- [x] Modal importación acepta `.xlsx,.xls,.csv,.ods`

**Pendiente:**
- [ ] `git push origin main` — commit `a3a8101` listo local (antes borrar HEAD.lock si existe)
- [ ] Verificar Railway desplegó con PhpSpreadsheet
- [ ] Llenar `precio_costo` y `stock` en `productos_importar.xlsx` y subir al admin
- [ ] Confirmar que slug `decoracion` existe en la DB

**Nota:** Antes de push: `Remove-Item D:\proyectos\dropshiping\.git\HEAD.lock`

---

## Sesión 12 — 2026-08-09

**Duración:** ~2 horas
**Fase:** FASE 10 — Deploy en Railway (producción)

**Completado:**
- [x] Proyecto Railway creado con servicio GitHub + PostgreSQL
- [x] Variables de entorno configuradas (22 variables + 5 de R2)
- [x] `ext-exif` y `ext-gd` en composer.json → Railway los instala automáticamente
- [x] `trustProxies(at: '*')` en bootstrap/app.php → HTTPS correcto
- [x] Seeders corridos en Railway Console → 37 permisos, 6 roles, admin creado
- [x] Tienda pública verificada en producción ✅

**Errores resueltos:**
- Railway usa Railpack (no Nixpacks) → nixpacks.toml ignorado
- Mixed Content (http/https) → TrustProxies + ASSET_URL

**URL de producción:** `https://courageous-flexibility-production-1a54.up.railway.app`

---

## Sesión 11 — 2026-08-09

**Duración:** ~3 horas
**Fase:** Sistema de Imágenes (mejora FASE 3) + Tienda Pública completada

**Completado:**
- [x] Spatie Media Library + Intervention Image + Cloudflare R2
- [x] Conversiones WebP automáticas (thumbnail 400×400, medium 800×800)
- [x] ProductoController: upload/eliminación vía Spatie
- [x] Tienda pública: imágenes Spatie con fallback a campo legacy
- [x] Fix method spoofing: `post() + _method:put` para uploads en Inertia

**Errores resueltos:**
- `uuidMorphs()` necesario (no `morphs()`) para PKs UUID
- PHP no parsea multipart en PUT → fix `post() + _method:put`

---

## Sesión 10 — 2026-08-07

**Duración:** ~3 horas
**Fase:** Backlog — Categorías CRUD + Transacciones/Ver + Perfil Proveedor

**Completado:**
- [x] `CategoriaController` CRUD completo (slug auto, bloqueo si tiene hijos/productos)
- [x] `Categorias/Index.jsx`, `Crear.jsx`, `Editar.jsx`
- [x] `Finanzas/Transacciones/Ver.jsx` — detalle de pago
- [x] `UsuarioController@update()` — `Proveedor::updateOrCreate()` en transacción
- [x] Capitalización automática en inputs (9 archivos)

---

## Sesión 9 — 2026-08-07

**Duración:** ~4 horas  
**Fase:** FASE 7 — Marketing: Cupones y Campañas

**Completado:**
- [x] Tablas `cupones` y `campanas`, columnas en `pedidos`
- [x] `CuponController` CRUD + validar AJAX, `CampanaController` CRUD + ROI
- [x] Integración cupones en `PedidoController@store()`
- [x] 7 páginas React: Cupones (Index/Crear/Editar) + Campañas (Index/Crear/Editar/Ver)
- [x] 4 bugs resueltos

---

## Sesión 8 — 2026-08-07

**Duración:** ~1.5 horas  
**Fase:** FASE 6 mejora — Creación de productos desde el portal

**Completado:**
- [x] Rutas + `PortalController@crearProducto/guardarProducto`
- [x] `Portal/CrearProducto.jsx` con preview imágenes e indicador margen
- [x] Migración correctiva columnas pivot

---

## Sesión 7 — 2026-08-07

**Duración:** ~3 horas  
**Fase:** FASE 6 — Portal de Proveedores

**Completado:**
- [x] Rutas /portal/* con middleware `role:proveedor|super_administrador`
- [x] `PortalController` 7 métodos, `PortalLayout.jsx` verde
- [x] 6 páginas React: Dashboard, Productos, EditarProducto, Pedidos, VerPedido, Pagos

---

## Sesión 6 — 2026-08-06

**Duración:** ~4 horas  
**Fase:** FASE 5 — Financiero y Wompi

**Completado:**
- [x] Transacciones (UUID + JSONB + ENUM) y GastosOperativos
- [x] TransaccionController (Wompi SHA256) + GastoController + ReporteFinancieroController
- [x] 6 páginas React con Recharts

---

## Sesión 5 — 2026-08-06

**Duración:** ~3 horas  
**Fase:** FASE 4 — Pedidos y Logística

**Completado:**
- [x] Tablas pedidos, items_pedido, envios
- [x] PedidoController 8 métodos, numeración PED-2026-00001
- [x] 4 páginas React: Index, Crear, Ver, Editar

---

## Sesión 4 — 2026-08-05

**Duración:** ~2 horas  
**Fase:** FASE 3 — fix imagen upload

**Completado:**
- [x] Fix `upload_tmp_dir` en php.ini de Herd
- [x] Fix `Path cannot be empty` → `Storage::move()`
- [x] Imagen upload verificada ✅

---

## Sesión 3 — 2026-08-04/05

**Duración:** ~4 horas  
**Fase:** FASE 3 — Productos y Catálogo

**Completado:**
- [x] Migraciones: categorias, productos, producto_proveedor
- [x] Modelos + ProductoController CRUD
- [x] 3 páginas React: Index, Crear, Editar

---

## Sesión 2 — 2026-08-04

**Duración:** ~3 horas  
**Fase:** FASE 2 — Usuarios y Roles

**Completado:**
- [x] Seeders: 6 roles, 34 permisos, usuario admin
- [x] UsuarioController CRUD + 4 páginas React

---

## Sesión 1 — 2026-08-04

**Duración:** ~4-5 horas  
**Fase:** FASE 1 — Proyecto Base

**Completado:**
- [x] Vault Obsidian creado
- [x] Laravel 13 + PostgreSQL 17 configurados
- [x] App corriendo en localhost:8000

---

## Plantilla

```markdown
## Sesión N — YYYY-MM-DD
**Duración:**
**Fase:**
**Completado:**
- [x]
**Próxima sesión:**
```

---

*Relacionado: [[📊 Tablero de Fases]] · [[🐛 Bugs y Pendientes]]*
