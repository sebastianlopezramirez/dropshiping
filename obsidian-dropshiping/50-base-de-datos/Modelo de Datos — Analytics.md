---
type: note
tags: [base-de-datos, analytics, seguimiento]
created: 2026-07-27
updated: 2026-07-27
status: evergreen
related: ["[[Módulo — Analytics y Seguimiento]]", "[[MOC — Base de Datos]]"]
---

# 🗄️ Modelo de Datos — Analytics

## Tablas
- `eventos_usuario` — comportamiento de navegación
- `carritos_abandonados` — carritos no finalizados
- `atribuciones` — crédito de conversión por canal/punto de contacto

## Tipos de evento
`vista_pagina` | `vista_producto` | `agregar_carrito` | `iniciar_checkout` | `compra`

## Modelo de atribución en `atribuciones`
Soporta múltiples puntos de contacto antes de la conversión. El campo `peso_atribucion` distribuye el crédito (ej: último clic = 100%, lineal = 25% por contacto).
