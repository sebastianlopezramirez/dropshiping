---
type: note
tags: [base-de-datos, pedidos, logistica]
created: 2026-07-27
updated: 2026-07-27
status: evergreen
related: ["[[Módulo — Pedidos y Logística]]", "[[MOC — Base de Datos]]"]
---

# 🗄️ Modelo de Datos — Pedidos

## Tablas
- `pedidos` — pedido principal del cliente
- `items_pedido` — líneas del pedido
- `historial_estados_pedido` — auditoría de cambios de estado

## Campos UTM en `pedidos`
Cada pedido captura la fuente de tráfico para atribución:
```
utm_fuente | utm_medio | utm_campana | utm_contenido | fuente
```

## Margen por item: `items_pedido`
```
ganancia = (precio_unitario - precio_unitario_proveedor) * cantidad
```

## Estados posibles
```
pendiente → confirmado → procesando → enviado → entregado
                                              ↓
                                         cancelado / reembolsado
```
