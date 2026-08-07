---
type: note
tags: [modulo, pedidos, logistica, envios]
created: 2026-07-27
updated: 2026-07-27
status: seedling
related: ["[[Modelo de Datos — Pedidos]]", "[[Módulo — Financiero y Cartera]]"]
---

# 🚚 Módulo — Pedidos y Logística

## ENTENDER
Gestión del ciclo completo de un pedido: desde la recepción hasta la entrega y posibles devoluciones.

## PENSAR
Tablas: `pedidos`, `items_pedido`, `historial_estados_pedido`

## Estados del Pedido
`pendiente` → `confirmado` → `procesando` → `enviado` → `entregado`
`cancelado` | `reembolsado`

## Funcionalidades
- [ ] Recepción automática de pedidos
- [ ] Panel con filtros (estado, fecha, cliente, proveedor)
- [ ] Enrutamiento inteligente a proveedor
- [ ] Notificaciones al cliente (email/SMS)
- [ ] Tracking integrado (17Track/AfterShip)
- [ ] Gestión de devoluciones y reembolsos
- [ ] Historial de estados con auditoría
- [ ] Alertas de pedidos atrasados
- [ ] División de pedidos (múltiples envíos)
- [ ] Captura UTM para atribución de marketing

## Acciones
- Ver lista de pedidos (tabla filtrable)
- Ver detalle del pedido
- Cambiar estado (con notas)
- Asignar/Reasignar proveedor
- Registrar número de guía
- Enviar notificación manual al cliente
- Crear pedido manual desde admin
- Cancelar pedido (con motivo)
- Procesar devolución (parcial/total)
- Reembolsar (parcial/total)

## Estado de desarrollo
- [ ] Migraciones
- [ ] Models: Pedido, ItemPedido, HistorialEstadoPedido
- [ ] Controllers: PedidoController
- [ ] Jobs: NotificarClienteJob, SincronizarTrackingJob
- [ ] Páginas React: Lista pedidos, Detalle pedido
