---
type: note
tags: [base-de-datos, financiero, cartera]
created: 2026-07-27
updated: 2026-07-27
status: evergreen
related: ["[[Módulo — Financiero y Cartera]]", "[[MOC — Base de Datos]]"]
---

# 🗄️ Modelo de Datos — Financiero

## Tablas
- `compras_proveedores` — deudas con proveedores
- `pagos_proveedores` — abonos realizados a proveedores
- `notas_credito_clientes` — cartera de clientes
- `pagos_clientes` — abonos de clientes
- `transacciones_financieras` — libro mayor (ledger)
- `cuentas_bancarias` — cuentas propias de la empresa
- `conciliacion_bancaria` — cruce con extractos bancarios

## Lógica de saldos
```
saldo_compra = monto_total - monto_pagado
saldo_credito_cliente = monto_total - monto_pagado
```

## Estados de deuda a proveedor
`pendiente` → `parcial` → `pagado` | `vencido` | `cancelado`

## Estados de cartera cliente
`activa` → `pagada` | `vencida` | `incumplida` | `castigada`
