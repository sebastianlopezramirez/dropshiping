---
type: note
tags: [fase, portal, proveedores, autenticacion, roles]
created: 2026-08-07
updated: 2026-08-07
status: evergreen
descripcion: "FASE 6 completada — Portal de Proveedores con layout verde, 7 rutas, redirección por rol y auto-creación de perfil"
---

# FASE 6 — Portal de Proveedores

> **Estado:** Completo ✅ — Sesión 7 · 2026-08-07
> **Scope:** Mismo login, redirección por rol, portal verde diferenciado del admin

---

## 1. ENTENDER — ¿Qué creamos y para qué sirve?

Un portal privado donde los proveedores acceden con el mismo `/login` que el admin, pero aterrizan en su propio espacio (`/portal/*`). Desde allí pueden:

- Ver y editar sus productos asignados (precio, stock, descripción)
- Ver los pedidos que contienen sus productos
- Ver el detalle de cada pedido (solo sus ítems)
- Ver sus pagos/comisiones pendientes

El admin sigue accediendo a todo. El proveedor solo ve lo suyo.

---

## 2. PENSAR — Decisiones de diseño

**¿Por qué el mismo `/login`?**
Más simple. El sistema detecta el rol después de autenticar y redirige al área correcta. Separar el login requeriría un guard nuevo, más configuración, sin beneficio real a esta escala.

**¿Por qué layout verde?**
Diferenciación visual inmediata. El proveedor sabe que está en su área. El admin usa índigo/morado.

**`usuarios` vs `proveedores` — dos tablas distintas:**
- `usuarios` → credenciales de login + rol (Spatie)
- `proveedores` → perfil de negocio (NIT, empresa, teléfono, productos)
- Un `User` con rol `proveedor` DEBE tener un registro en `proveedores` para que el portal funcione.

**Seguridad en cada método del controller:**
Antes de mostrar o modificar cualquier dato, se verifica que pertenezca al proveedor logueado. Un proveedor nunca puede ver datos de otro.

---

## 3. ESCRIBIR — Lo que se construyó

### Bloque A — Redirección + Rutas

**`AuthenticatedSessionController@store`** modificado:
```php
if ($request->user()->hasRole('proveedor')) {
    return redirect()->intended(route('portal.dashboard'));
}
return redirect()->intended(route('dashboard', absolute: false));
```

**`routes/web.php`** — grupo portal:
```php
Route::middleware(['auth', 'verified', 'role:proveedor|super_administrador'])
     ->prefix('portal')
     ->name('portal.')
     ->group(function () {
    Route::get('dashboard', [PortalController::class, 'dashboard'])->name('dashboard');
    Route::get('productos', [PortalController::class, 'productos'])->name('productos');
    Route::get('productos/{producto}/editar', ...)->name('productos.editar');
    Route::put('productos/{producto}', ...)->name('productos.actualizar');
    Route::get('pedidos', [PortalController::class, 'pedidos'])->name('pedidos');
    Route::get('pedidos/{pedido}', [PortalController::class, 'verPedido'])->name('pedidos.ver');
    Route::get('pagos', [PortalController::class, 'pagos'])->name('pagos');
});
```

> `super_administrador` también tiene acceso para testing.

### Bloque B — PortalController

**`app/Http/Controllers/Portal/PortalController.php`** — 7 métodos:

| Método | Ruta | Qué hace |
|--------|------|---------|
| `dashboard()` | GET /portal/dashboard | KPIs + últimos pedidos con sus productos |
| `productos()` | GET /portal/productos | Lista con precio/stock del pivot |
| `editarProducto()` | GET /portal/productos/{id}/editar | Formulario precio/stock/descripción |
| `actualizarProducto()` | PUT /portal/productos/{id} | Guarda en `productos` + `producto_proveedor` |
| `pedidos()` | GET /portal/pedidos | Pedidos filtrados por sus productos |
| `verPedido()` | GET /portal/pedidos/{id} | Detalle con solo sus ítems |
| `pagos()` | GET /portal/pagos | Deuda + historial mensual + top productos |

**Helper `obtenerProveedor()`** — centraliza la obtención del perfil:
```php
private function obtenerProveedor() {
    $proveedor = auth()->user()->proveedor;
    // Fallback: si es super_admin probando, toma el primer proveedor activo
    if (!$proveedor && auth()->user()->hasRole('super_administrador')) {
        $proveedor = Proveedor::activos()->first();
    }
    abort_if(!$proveedor, 403, 'No tienes un perfil de proveedor asociado.');
    return $proveedor;
}
```

**Cálculo de deuda al proveedor:**
```php
// Lo que el negocio le debe al proveedor = precio_costo × cantidad en pedidos entregados
$totalDeuda = ItemPedido::whereIn('producto_id', $idsProductos)
    ->whereHas('pedido', fn($q) => $q->where('estado', 'entregado'))
    ->selectRaw('COALESCE(SUM(precio_costo * cantidad), 0) as total')
    ->value('total');
```

**Seguridad en actualizarProducto:**
El proveedor edita dos tablas distintas:
- `descripcion` → en `productos`
- `precio` y `stock` → en `producto_proveedor` (la pivot)

```php
// Actualizar pivot directamente con DB facade
DB::table('producto_proveedor')
    ->where('producto_id', $producto->id)
    ->where('proveedor_id', $proveedor->id)
    ->update(['precio' => $datos['precio'], 'stock' => $datos['stock']]);
```

### Bloque C — React (7 archivos)

| Archivo | Característica clave |
|---------|---------------------|
| `PortalLayout.jsx` | Verde (emerald), link ← Admin para super_admin, hamburger mobile |
| `Portal/Dashboard.jsx` | 4 KPIs verdes + 4 accesos rápidos + tabla últimos pedidos |
| `Portal/Productos.jsx` | Lista con `producto.pivot.precio` y `producto.pivot.stock` |
| `Portal/EditarProducto.jsx` | Formulario split: mis condiciones + descripción + campos readonly |
| `Portal/Pedidos.jsx` | 3 stats + filtros + solo ítems del proveedor |
| `Portal/VerPedido.jsx` | Tabla de solo sus ítems + total a cobrar en footer |
| `Portal/Pagos.jsx` | KPI deuda + historial 6 meses + top 5 productos |

### Mejora agregada — Auto-crear perfil proveedor

**`UsuarioController@store`** modificado:
```php
if ($datos['rol'] === 'proveedor') {
    Proveedor::create([
        'usuario_id'            => $usuario->id,
        'nombre_empresa'        => $datos['nombre'],
        'numero_identificacion' => '000000000', // placeholder
        'persona_contacto'      => $datos['nombre'],
        'email'                 => $datos['email'],
        'estado'                => 'activo',
    ]);
}
```
Dentro de la misma `DB::transaction()` → si falla, nada queda a medias.

---

## 4. VERIFICAR — ¿Funciona?

### URLs probadas ✅

| URL | Resultado |
|-----|-----------|
| `/portal/dashboard` | Carga con layout verde, "Bienvenido Mi Empresa" ✅ |
| `/portal/productos` | Lista vacía (sin productos asignados) ✅ |
| `/portal/pagos` | Carga con $0 (sin ventas aún) ✅ |

### Errores resueltos

| Error | Causa | Solución |
|-------|-------|---------|
| `ERR_CONNECTION_REFUSED` | Herd caído | `php artisan serve` como alternativa |
| `Invalid text representation: uuid «selora1988@gmail.com»` | Cookie `remember_me` guardada con email en lugar de UUID | `DB::table('sesiones')->truncate()` + nuevo login |
| `403 No tienes perfil de proveedor` | Tabla `proveedores` vacía | Crear registro via tinker |

---

## Estructura de archivos FASE 6

```
app/Http/Controllers/
├── Auth/AuthenticatedSessionController.php  ← redirección por rol
├── Portal/
│   └── PortalController.php                 ← 9 métodos del portal
└── Web/
    └── UsuarioController.php                ← auto-crear proveedor

database/migrations/
└── 2026_08_07_000001_add_missing_columns_to_producto_proveedor.php

resources/js/
├── Layouts/
│   └── PortalLayout.jsx                     ← layout verde
└── Pages/
    ├── Dashboard.jsx                         ← actualizado fase 6
    └── Portal/
        ├── Dashboard.jsx
        ├── Productos.jsx                     ← botón Agregar Producto
        ├── CrearProducto.jsx                 ← nuevo (sesión 8)
        ├── EditarProducto.jsx
        ├── Pedidos.jsx
        ├── VerPedido.jsx
        └── Pagos.jsx
```

---

## Mejora sesión 8 — Creación de productos desde el portal

**Qué se agregó:**
- Proveedor puede crear producto nuevo desde `/portal/productos/crear`
- Producto nace con `estado = inactivo` — el admin lo activa desde `/productos`
- SKU auto-generado como placeholder (`PROV-XXXXXXXX-timestamp`)
- Categoría opcional (el admin la asigna al activar)
- Upload de imágenes con preview en tiempo real
- Indicador de margen (precio_venta - precio_costo) calculado en vivo

**Rutas agregadas:**
```php
Route::get('productos/crear', [PortalController::class, 'crearProducto'])->name('productos.crear');
Route::post('productos', [PortalController::class, 'guardarProducto'])->name('productos.guardar');
```

**Bug resuelto — Pivot table desfasada:**
La migración original creó `precio_proveedor` pero el modelo usaba `precio`.
Solución: migración `2026_08_07_000001` agrega las columnas correctas (`precio`, `stock`, `sku_proveedor`, `pedido_minimo`, `tiempo_entrega`, `costo_envio`, `es_predeterminado`, `activo`).

---

*Relacionado: [[FASE 5 — Financiero y Wompi]] · [[FASE 7 — Marketing y Publicidad]] · [[📊 Tablero de Fases]]*
