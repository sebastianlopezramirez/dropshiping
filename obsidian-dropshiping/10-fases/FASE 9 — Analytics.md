---
title: FASE 9 — Analytics
tags: [fase, analytics, dashboard, completada]
type: fase
estado: completada
fase_numero: 9
created: 2026-08-07
updated: 2026-08-07
related: ["[[FASE 8 — Tienda Pública]]", "[[FASE 10 — Infraestructura]]"]
---

# FASE 9 — Analytics

## ENTENDER — ¿Qué construimos?

Un dashboard ejecutivo para el administrador con:
- KPIs del mes: ingresos, gastos, ganancia, pedidos
- Gráfica de barras de últimos 6 meses (ingresos vs gastos)
- Distribución de pedidos por estado
- Top 5 productos más vendidos
- Gastos por categoría
- Alertas de stock bajo
- Selector de período (mes / año)

## Archivos creados

| Archivo | Descripción |
|---|---|
| `app/Http/Controllers/Web/AnalyticsController.php` | 7 bloques de datos |
| `resources/js/Pages/Analytics/Dashboard.jsx` | Dashboard completo CSS puro |

## Ruta (protegida, solo admin)

```php
// Dentro del grupo auth + admin
Route::get('analytics', [AnalyticsController::class, 'dashboard'])
     ->name('analytics.dashboard');
```

## 7 bloques de datos del controlador

| Bloque | Descripción |
|---|---|
| `kpis` | ingresos, gastos, ganancia, total_pedidos_mes |
| `pedidosPorEstado` | groupBy estado con conteo |
| `productosMasVendidos` | TOP 5 por cantidad vendida (excluye cancelados) |
| `ultimos6Meses` | Loop de 6 meses → ingresos + gastos por mes |
| `stockBajo` | Productos donde `stock < stock_minimo` |
| `gastosPorCategoria` | GastoOperativo agrupado por categoría |
| `globales` | total_productos, pedidos_hoy, transac_pendientes |

## Gráfica de barras — CSS puro

**Decisión**: no se usó Recharts ni Chart.js. Barras escaladas con:

```jsx
const maxValor = Math.max(...datos.map(d => d.ingresos));
// Altura de cada barra:
height: `${Math.round((mes.ingresos / maxValor) * 100)}%`
```

**Ventaja**: 0 dependencias adicionales, carga instantánea.

## Componentes definidos FUERA del componente principal

```jsx
// ✅ CORRECTO — KpiCard FUERA de Dashboard
const KpiCard = ({ titulo, valor, icono, color }) => ( ... );

export default function Dashboard({ kpis, ultimos6Meses, ... }) { ... }
```

> Regla del proyecto: helpers siempre fuera del componente principal para evitar remount.

## Selector de período

```jsx
// Cambia mes/año y recarga con router.get
<select onChange={e => router.get(route('analytics.dashboard'), { mes: e.target.value, ano })}>
    {meses.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
</select>
```