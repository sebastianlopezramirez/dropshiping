---
type: note
tags: [modulo, financiero, cartera, contabilidad]
created: 2026-07-27
updated: 2026-07-27
status: seedling
related: ["[[Modelo de Datos — Financiero]]", "[[Módulo — Pedidos y Logística]]"]
---

# 💰 Módulo — Financiero y Cartera

## ENTENDER
Control total del dinero: deudas con proveedores, cartera de clientes, flujo de caja y reportes financieros.

## PENSAR
Tablas: `compras_proveedores`, `pagos_proveedores`, `notas_credito_clientes`, `pagos_clientes`, `transacciones_financieras`, `cuentas_bancarias`, `conciliacion_bancaria`

## Métricas del Dashboard
- Ventas totales (día / semana / mes)
- Deuda con proveedores (total + por vencimiento)
- Cartera clientes (total + por antigüedad)
- Flujo de caja (ingresos vs gastos)
- Márgenes de ganancia por producto/proveedor
- ROAS (Return on Ad Spend)

## Funcionalidades
- [ ] Captura automática de compras al recibir pedido
- [ ] Registro de abonos a proveedores (múltiples métodos)
- [ ] Conciliación bancaria (carga extractos CSV/PDF)
- [ ] Gestión de cartera de clientes (límites, plazos, intereses)
- [ ] Libro mayor (ledger) completo
- [ ] Reporte P&L, Balance, Flujo de caja
- [ ] Reporte de impuestos (IVA, Retefuente)
- [ ] Antigüedad de saldos (30/60/90 días)

## Métodos de Pago Soportados
- Transferencia bancaria
- PSE
- Nequi
- Tarjeta crédito/débito
- Efectivo
- PayPal

## Estado de desarrollo
- [ ] Migraciones financieras
- [ ] Models: CompraProveedor, PagoProveedor, NotaCreditoCliente, PagoCliente
- [ ] Dashboard financiero (React + Recharts)
- [ ] Módulo de conciliación bancaria
- [ ] Generador de reportes (exportar Excel/PDF)
