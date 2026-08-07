---
type: note
tags: [fase, financiero, wompi, pagos, gastos]
created: 2026-08-06
updated: 2026-08-06
status: evergreen
descripcion: "FASE 5 completada — Transacciones, Gastos Operativos, Dashboard Financiero e integración Wompi"
---

# FASE 5 — Financiero y Wompi

> **Estado:** Completo ✅ — Sesión 6 · 2026-08-06
> **Scope elegido:** Interno + Wompi (pagos manuales + link de pago + webhook)

---

## 1. ENTENDER — ¿Qué creamos y para qué sirve?

El módulo financiero registra **todo el dinero** del negocio en dos dimensiones:

| Dimensión | Tabla | Qué registra |
|-----------|-------|--------------|
| **Ingresos** | `transacciones` | Pagos de clientes por pedidos |
| **Egresos** | `gastos_operativos` | Costos fijos del negocio (ads, hosting, etc.) |

Con esos dos datos calculamos:
- **Ganancia bruta** = Ingresos − Costo de productos vendidos
- **Ganancia neta** = Ganancia bruta − Gastos operativos
- **Margen neto %** = (Ganancia neta / Ingresos) × 100

Wompi es la pasarela de pago colombiana. Flujo:
1. Vendedor genera link de pago → Wompi devuelve URL
2. Cliente paga en página de Wompi
3. Wompi envía webhook → nuestra app actualiza el estado automáticamente

---

## 2. PENSAR — ¿Qué necesita cada archivo?

### Decisiones de diseño

**Transacciones son INMUTABLES** — no tienen SoftDeletes. Un registro financiero nunca se borra; máximo se anula. Esto es auditoría.

**`pagado_en` se auto-llena** — mediante `boot()` en el modelo, cuando el estado cambia a `aprobada`, se registra el timestamp automáticamente. No hay que hacerlo manualmente.

**Snapshot de costos** — el costo de productos se calcula desde `items_pedido.precio_costo` (congelado al momento de venta), no desde el precio actual del producto.

**Webhook fuera de auth** — la ruta `POST /wompi/webhook` debe estar FUERA del middleware `auth`. Wompi no tiene sesión; su seguridad es el SHA256 de la firma.

**Separación COSTOS vs GASTOS:**
- **Costos** = variables, por producto (en `items_pedido.precio_costo`)
- **Gastos** = fijos, operativos (en `gastos_operativos`)

---

## 3. ESCRIBIR — Lo que se construyó

### Bloque A — Migraciones

**`transacciones`**
```
id               UUID PK (gen_random_uuid())
pedido_id        FK → pedidos (cascade delete)
referencia_wompi VARCHAR(100) UNIQUE NULLABLE  ← ID único de Wompi
metodo_pago      ENUM: efectivo|transferencia|nequi|pse|tarjeta_credito|tarjeta_debito|wompi|otro
monto            DECIMAL(12,2)
estado           ENUM: pendiente|aprobada|rechazada|anulada|error  DEFAULT pendiente
datos_wompi      JSONB NULLABLE  ← respuesta cruda de Wompi
pagado_en        TIMESTAMP NULLABLE  ← auto-filled cuando estado → aprobada
creado_en / actualizado_en
```

**`gastos_operativos`**
```
id               UUID PK
categoria        ENUM: publicidad|empaque|hosting|dominio|herramientas|logistica|devolucion|otro
descripcion      VARCHAR(250)
monto            DECIMAL(12,2)
fecha_gasto      DATE  ← DATE no TIMESTAMP (importa el día, no la hora)
notas            TEXT NULLABLE
usuario_id       FK → usuarios (nullOnDelete)
```

> **Regla aprendida:** `DATE` para gastos (día importa), `TIMESTAMP` para eventos (momento exacto importa).

### Bloque B — Modelos

**`Transaccion.php`** — Constantes + boot() auto-fill + scopes + cast JSONB
```php
// boot() — lógica automática al guardar
protected static function boot(): void
{
    parent::boot();
    static::creating(fn($m) => $m->id ??= Str::uuid()->toString());
    static::saving(function ($transaccion) {
        if ($transaccion->isDirty('estado') &&
            $transaccion->estado === self::ESTADO_APROBADA &&
            is_null($transaccion->pagado_en)) {
            $transaccion->pagado_en = now();
        }
    });
}

// Cast automático de JSONB a array PHP
protected $casts = ['datos_wompi' => 'array'];
```

**`GastoOperativo.php`** — `resumenPorCategoria()` hace GROUP BY para el dashboard en una sola query
```php
public static function resumenPorCategoria(int $año, int $mes): array
{
    return static::whereYear('fecha_gasto', $año)
        ->whereMonth('fecha_gasto', $mes)
        ->selectRaw('categoria, SUM(monto) as total')
        ->groupBy('categoria')
        ->pluck('total', 'categoria')
        ->toArray();
}
```

**`Pedido.php`** — relación agregada:
```php
public function transacciones(): HasMany
{
    return $this->hasMany(Transaccion::class, 'pedido_id', 'id');
}
```

### Bloque C — Controllers

**`TransaccionController`**
- `index()` — 4 filtros + 4 estadísticas (hoy, count hoy, pendientes, mes)
- `create()` — pedidos SIN transacción aprobada (`whereDoesntHave`)
- `store()` — pago manual (efectivo, Nequi, transferencia)
- `show()` — con pedido.items eager load
- `update()` — SOLO permite cambio a `aprobada` o `anulada`
- `generarLinkWompi()` — POST a API Wompi → crea Transaccion pendiente → retorna permalink
- `webhookWompi()` — PÚBLICO · verifica SHA256 · `updateOrCreate` por `referencia_wompi`

**Verificación firma Wompi:**
```php
private function verificarFirmaWompi(array $datos): bool
{
    $propiedades = $datos['signature']['properties'] ?? [];
    $timestamp   = $datos['timestamp'];
    $cadena      = implode('', array_map(fn($p) => data_get($datos, $p), $propiedades));
    $cadena     .= $timestamp . config('services.wompi.integrity_key');
    return hash('sha256', $cadena) === ($datos['signature']['checksum'] ?? '');
}
```

**`GastoController`** — CRUD completo (index/create/store/edit/update/destroy)

**`ReporteFinancieroController`** — `dashboard()`:
- Ingresos = transacciones aprobadas del mes
- Costo productos = suma de `precio_costo × cantidad` en pedidos ENTREGADOS
- Gastos op = suma gastos operativos del mes
- Ganancias = cálculo derivado
- Datos para gráficos: ingresos por día (LineChart), historial 6 meses (BarChart), gastos por categoría, top 5 productos

### Bloque D — Rutas

```php
// Dentro de auth middleware:
Route::resource('transacciones', TransaccionController::class)
     ->only(['index', 'create', 'store', 'show', 'update'])
     ->parameters(['transacciones' => 'transaccion']);  // ← CRÍTICO

Route::post('transacciones/wompi/{pedido}', [...'generarLinkWompi'])
     ->name('transacciones.wompi-link');

Route::resource('gastos', GastoController::class);
Route::get('reportes/financiero', [...'dashboard'])->name('reportes.financiero');

// FUERA de auth — Wompi no tiene sesión:
Route::post('wompi/webhook', [...'webhookWompi'])->name('wompi.webhook');
```

### Bloque E — React (6 páginas)

| Archivo | Característica clave |
|---------|---------------------|
| `Finanzas/Dashboard.jsx` | Recharts LineChart + BarChart, 6 KPIs, top productos |
| `Finanzas/Transacciones/Index.jsx` | 4 stat cards, 4 filtros, tabla paginada |
| `Finanzas/Transacciones/Crear.jsx` | `useEffect` auto-fill monto desde pedido |
| `Finanzas/Gastos/Index.jsx` | Top 2 categorías dinámicas en cards |
| `Finanzas/Gastos/Crear.jsx` | `fecha_gasto` default = hoy (`new Date().toISOString().split('T')[0]`) |
| `Finanzas/Gastos/Editar.jsx` | Formulario pre-llenado con datos del gasto |

---

## 4. VERIFICAR — ¿Funciona?

### URLs probadas ✅

| URL | Resultado |
|-----|-----------|
| `/reportes/financiero` | Dashboard con gráficos Recharts ✅ |
| `/transacciones` | Lista vacía con 4 stats en $0 ✅ |
| `/gastos` | Lista vacía con filtros funcionales ✅ |

### Dato real observado
El dashboard ya muestra **"arbol navidad — 2 unidades — $70.000"** en Top 5 productos (del pedido `PED-2026-00001` de FASE 4). Costo productos = $30K sin ingresos → ganancia neta negativa es correcto.

### Errores resueltos

| Error | Causa | Solución |
|-------|-------|---------|
| `Failed to resolve import "react-is"` | recharts peer dep no instalada | `npm install react-is --legacy-peer-deps` |
| `{transaccione}` en rutas | Laravel no singulariza español | `.parameters(['transacciones' => 'transaccion'])` + `route:clear` |

---

## Variables de entorno Wompi

```env
WOMPI_PUBLIC_KEY=pub_test_xxxxxxxxxxxxxxxxxxxxx
WOMPI_PRIVATE_KEY=prv_test_xxxxxxxxxxxxxxxxxxxxx
WOMPI_INTEGRITY_KEY=test_integrity_xxxxxxxxxxxxx
WOMPI_SANDBOX=true
```

> Reemplazar con credenciales reales del panel Wompi cuando se vaya a producción.

---

*Relacionado: [[FASE 4 — Pedidos y Logística]] · [[FASE 6 — Portal de Proveedores]] · [[📊 Tablero de Fases]]*
