---
type: fase
tags: [fase, completada, pedidos, logistica, envios]
created: 2026-08-06
updated: 2026-08-06
status: evergreen
fase: 4
estado_fase: completada
descripcion: "Gestión de pedidos, ítems con snapshot de precios, envíos y cambio de estado"
---

# FASE 4 — Pedidos y Logística

**Estado:** ✅ Completada — 2026-08-06
**Prerrequisito:** [[FASE 3 — Productos y Catálogo]] ✅

---

## ENTENDER — ¿Qué construimos?

Un sistema completo de gestión de pedidos para dropshipping colombiano:

- Registro de pedidos con datos del cliente y dirección de entrega
- Lista de productos comprados con **snapshot de precios** al momento de la venta
- Flujo de estados: pendiente → confirmado → en preparación → enviado → entregado
- Vista de detalle con ganancia estimada por pedido
- Cambio de estado rápido desde la lista (sin abrir el pedido)
- Registro de información de envío (operador, guía, fechas)

---

## PENSAR — Decisiones de diseño clave

### 1. Snapshot de precios en los ítems
Cuando se crea un pedido, se copian `nombre`, `sku`, `precio_venta`, `precio_costo` e `imagen` del producto al ítem. Esto garantiza que el historial de ventas sea inmutable aunque el precio del producto cambie después.

```
productos → precio_venta: $50.000 (puede cambiar mañana)
items_pedido → precio_unitario: $50.000 (congelado al momento de la venta)
```

### 2. Numeración automática de pedidos
Formato: `PED-YYYY-NNNNN`, reinicia cada año.
```php
// boot() de Pedido.php
$año = now()->year;
$conteo = Pedido::withTrashed()->whereYear('creado_en', $año)->count() + 1;
return 'PED-' . $año . '-' . str_pad($conteo, 5, '0', STR_PAD_LEFT);
```

### 3. Regla Inertia `useForm` + arrays locales
Cuando el formulario tiene un array manejado con `useState` (como `items`), hay que sincronizarlo con `setData()` en CADA mutación. No se puede pasar en el segundo argumento de `post()`.

```js
// ❌ INCORRECTO — Inertia ignora `data` como opción de post()
post(route('pedidos.store'), { data: { ...data, items } });

// ✅ CORRECTO — sincronizar con setData en cada cambio
const syncItems = (nuevos) => {
    setItems(nuevos);
    setData('items', nuevos); // ← esto es lo que post() envía
};
```

### 4. Transacción de base de datos en store()
El pedido y sus ítems se crean dentro de `DB::transaction()`. Si falla algún ítem, el pedido también se revierte — nunca queda un pedido sin productos.

---

## ESCRIBIR — Archivos creados

### Bloque A — Migraciones

| Archivo | Tabla | Notas |
|---|---|---|
| `2026_08_06_000001_create_pedidos_table.php` | `pedidos` | UUID PK, enum estado, snapshots cliente |
| `2026_08_06_000002_create_items_pedido_table.php` | `items_pedido` | UUID PK, snapshot nombre/precio/imagen |
| `2026_08_06_000003_create_envios_table.php` | `envios` | UUID PK, operador, guía, fechas entrega |

### Bloque B — Modelos

**`app/Models/Pedido.php`**
- Constants: `ESTADO_PENDIENTE`, `ESTADO_CONFIRMADO`, `ESTADO_EN_PREPARACION`, `ESTADO_ENVIADO`, `ESTADO_ENTREGADO`, `ESTADO_DEVUELTO`, `ESTADO_CANCELADO`
- boot(): UUID + `generarNumeroPedido()` → `PED-2026-00001`
- Relations: `items()` HasMany, `envio()` HasOne, `usuario()` BelongsTo
- Scopes: `pendientes()`, `enviados()`, `delMes()`
- Helpers: `colorEstado()`, `puedeEnviarse()`, `puedeCancelarse()`

**`app/Models/ItemPedido.php`**
- boot(): UUID + auto-calcular `subtotal = (precio_unitario × cantidad) - descuento`
- Relations: `pedido()` BelongsTo, `producto()` BelongsTo `withTrashed()`
- Helpers: `ganancia()`, `margenPorcentaje()`
- Static: `crearDesdeProducto($pedidoId, $producto, $cantidad, $descuento)`

**`app/Models/Envio.php`**
- Constants: `OPERADORES` = ['Servientrega', 'Envia.com', 'Interrapidísimo', 'TCC', 'Coordinadora', 'Deprisa', 'Otro']
- boot(): UUID
- Helpers: `estaEnTransito()`, `diasEnTransito()`, `tieneGuia()`

### Bloque C — Controller

**`app/Http/Controllers/Web/PedidoController.php`** — 8 métodos:

| Método | Ruta | Descripción |
|---|---|---|
| `index()` | GET /pedidos | Lista + filtros + estadísticas |
| `create()` | GET /pedidos/create | Formulario nuevo pedido |
| `store()` | POST /pedidos | Guarda en transacción |
| `show()` | GET /pedidos/{id} | Detalle completo |
| `edit()` | GET /pedidos/{id}/edit | Formulario edición |
| `update()` | PUT /pedidos/{id} | Solo cliente/dirección/notas |
| `destroy()` | DELETE /pedidos/{id} | Soft delete |
| `cambiarEstado()` | PATCH /pedidos/{id}/estado | Cambio de estado rápido |

### Bloque D — Páginas React

| Archivo | Qué hace |
|---|---|
| `resources/js/Pages/Pedidos/Index.jsx` | Lista con stats, filtros, avance rápido de estado |
| `resources/js/Pages/Pedidos/Crear.jsx` | Selector dinámico de productos, totales en tiempo real |
| `resources/js/Pages/Pedidos/Ver.jsx` | Detalle completo + selector de estado en sidebar |
| `resources/js/Pages/Pedidos/Editar.jsx` | Edición de cliente/dirección/costos (ítems solo lectura) |

---

## VERIFICAR — Pruebas realizadas

- [x] `php artisan migrate` — 3 migraciones en PostgreSQL ✅
- [x] `php artisan tinker` — `Pedido::generarNumeroPedido()` devuelve `PED-2026-00001` ✅
- [x] `php artisan route:list --name=pedidos` — 8 rutas listadas ✅
- [x] Formulario de creación — totales calculados en tiempo real ✅
- [x] Primer pedido creado: `PED-2026-00001` — sebastian lopez, $70.000 ✅
- [x] Lista de pedidos — estadísticas: 1 hoy, 1 pendiente, $70.000 ventas del mes ✅
- [x] Botón avance rápido "→ Confirmado" visible en la tabla ✅

---

## Bugs resueltos

### BUG-FASE4-01: `validation.required` en lugar de mensaje traducido
- **Causa:** Inertia `post()` recibe `{ data: ... }` como opción de configuración, no como datos del formulario. Los `items` nunca llegaban al backend.
- **Fix:** Crear función `syncItems()` que actualiza `useState` Y `useForm.setData()` en paralelo.
- **Regla establecida:** Con `useForm` de Inertia, todo array que se maneje con `useState` separado debe sincronizarse a `data` en cada mutación.

---

## Columnas importantes de la base de datos

```sql
-- pedidos
numero_pedido    TEXT UNIQUE          -- PED-2026-00001
cliente_nombre   VARCHAR(150)         -- snapshot
cliente_email    VARCHAR(150)         -- snapshot
direccion_entrega TEXT
estado           ENUM (7 valores)
subtotal         DECIMAL(12,2)
total            DECIMAL(12,2)
cancelado_en     TIMESTAMP NULL       -- se llena si estado = cancelado

-- items_pedido
nombre_producto  VARCHAR(250)         -- snapshot del nombre
precio_unitario  DECIMAL(10,2)        -- snapshot del precio de venta
precio_costo     DECIMAL(10,2)        -- snapshot del costo
imagen_url       TEXT NULL            -- snapshot de la imagen principal
subtotal         DECIMAL(10,2)        -- calculado automáticamente en boot()

-- envios
operador         VARCHAR(100)         -- Servientrega, Envia.com, etc.
numero_guia      VARCHAR(100) NULL
fecha_estimada_entrega DATE NULL
fecha_entrega_real     DATE NULL
```

---

*Relacionado: [[FASE 3 — Productos y Catálogo]] · [[FASE 5 — Financiero y Cartera]] · [[MOC — Módulos]]*
