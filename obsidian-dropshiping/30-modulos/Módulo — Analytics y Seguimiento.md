---
type: note
tags: [modulo, analytics, seguimiento, atribucion]
created: 2026-07-27
updated: 2026-07-27
status: seedling
related: ["[[Módulo — Marketing y Publicidad]]", "[[Modelo de Datos — Analytics]]"]
---

# 📊 Módulo — Analytics y Seguimiento

## ENTENDER
Rastreo del comportamiento de usuarios, atribución de ventas a canales y análisis de abandono de carrito.

## PENSAR
Tablas: `eventos_usuario`, `carritos_abandonados`, `atribuciones`

## Funcionalidades
- [ ] Eventos de usuario (vista, carrito, checkout, compra)
- [ ] Abandono de carrito + recuperación (email/SMS)
- [ ] Atribución multi-canal (UTM completo)
- [ ] Integración Google Analytics 4
- [ ] Meta Pixel + Conversions API (server-side)
- [ ] Dashboard de conversiones por canal
- [ ] Funnel de ventas visualizado
- [ ] Cohortes de clientes
- [ ] LTV (Lifetime Value) por cliente

## Eventos Rastreados
| Evento | Descripción |
|---|---|
| `vista_pagina` | Usuario visita cualquier página |
| `vista_producto` | Usuario ve un producto específico |
| `agregar_carrito` | Producto añadido al carrito |
| `iniciar_checkout` | Comienza el proceso de pago |
| `compra` | Pedido completado exitosamente |

## Fuentes de Tráfico
`organico` | `meta` | `google` | `email` | `directo` | `afiliado`
