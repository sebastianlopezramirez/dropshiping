---
tags: [roles, permisos, accesos, usuarios, seguridad]
tipo: documentacion
estado: activo
ultima_actualizacion: 2026-08-21
relacionado: "[[🔐 Credenciales — Master]]"
---

# 👥 Roles y Accesos — GadGet Store

> Documento de referencia para saber qué puede hacer cada tipo de usuario en el sistema.
> Actualizar este archivo cada vez que se agreguen nuevos módulos o se cambien permisos.

---

## 🗺️ URL de entrada por rol

| Rol | URL de entrada | Layout |
|---|---|---|
| super_administrador | `/dashboard` | Admin (navy + naranja) |
| administrador | `/dashboard` | Admin (navy + naranja) |
| vendedor | `/dashboard` | Admin (navy + naranja) |
| proveedor | `/portal` | Portal Proveedor (navy + naranja) |
| soporte | `/dashboard` | Admin (navy + naranja) |
| cliente | `/tienda` | Tienda pública |

---

## 👑 Super Administrador

**Descripción:** El dueño del sistema. Acceso total sin restricciones.

| Módulo | URL | Acceso |
|---|---|---|
| Dashboard | `/dashboard` | ✅ Panel completo con métricas y pendientes |
| Usuarios | `/usuarios` | ✅ Ver, crear, editar, eliminar, asignar cualquier rol |
| Productos | `/productos` | ✅ CRUD completo + publicar + importar Excel |
| Pedidos | `/pedidos` | ✅ Ver, crear, editar, cancelar, cambiar estado |
| Tarifas domicilio | `/tarifas` | ✅ Crear ciudades, editar precios, activar/desactivar |
| Transacciones | `/transacciones` | ✅ Registrar y consultar pagos |
| Gastos | `/gastos` | ✅ CRUD gastos operativos |
| Reporte financiero | `/reportes/financiero` | ✅ Dashboard KPIs del negocio |
| Analytics | `/analytics` | ✅ Métricas ejecutivas |
| Cupones | `/cupones` | ✅ Crear, editar, desactivar cupones |
| Campañas | `/campanas` | ✅ Crear y gestionar campañas de marketing |
| Exportar clientes | `/marketing/exportar` | ✅ Descargar base de clientes (.csv) |
| Categorías | `/categorias` | ✅ CRUD categorías y subcategorías |
| Portal proveedor | `/portal` | ✅ Puede entrar como proveedor |
| Configuración | (sistema) | ✅ Integraciones, logs, settings críticos |

---

## 🔧 Administrador

**Descripción:** Gestiona el día a día del negocio. Sin acceso a configuración crítica del sistema.

| Módulo | URL | Acceso |
|---|---|---|
| Dashboard | `/dashboard` | ✅ Completo |
| Usuarios | `/usuarios` | ✅ Ver, crear, editar — ❌ no puede eliminar ni asignar rol `super_administrador` |
| Productos | `/productos` | ✅ CRUD completo + publicar + importar |
| Pedidos | `/pedidos` | ✅ Completo |
| Tarifas domicilio | `/tarifas` | ✅ Completo |
| Finanzas | `/transacciones` `/gastos` | ✅ Completo |
| Reporte financiero | `/reportes/financiero` | ✅ Completo |
| Analytics | `/analytics` | ✅ Completo |
| Marketing | `/cupones` `/campanas` | ✅ Completo |
| Exportar clientes | `/marketing/exportar` | ✅ Completo |
| Categorías | `/categorias` | ✅ Completo |
| Configuración sistema | — | ❌ Sin acceso |
| Logs del sistema | — | ❌ Sin acceso |

---

## 🛒 Vendedor

**Descripción:** Enfocado en ventas y relación con clientes. No gestiona catálogo ni finanzas.

| Módulo | URL | Acceso |
|---|---|---|
| Dashboard | `/dashboard` | ✅ Acceso básico |
| Productos | `/productos` | 👁️ Solo ver — no puede crear, editar ni publicar |
| Pedidos | `/pedidos` | ✅ Ver todos + crear + cambiar estado + tracking |
| Clientes | (dentro de pedidos) | ✅ Ver y gestionar información de clientes |
| Reportes | `/reportes` | 👁️ Solo ver — no puede exportar |
| Usuarios | `/usuarios` | ❌ Sin acceso |
| Finanzas | `/transacciones` `/gastos` | ❌ Sin acceso |
| Marketing | `/cupones` `/campanas` | ❌ Sin acceso |
| Tarifas | `/tarifas` | ❌ Sin acceso |

---

## 📦 Proveedor

**Descripción:** Accede exclusivamente al Portal Proveedor. No puede entrar al panel admin.
El proveedor sube productos que quedan **inactivos** hasta que el admin los aprueba.

| Módulo | URL | Acceso |
|---|---|---|
| Dashboard portal | `/portal` | ✅ Sus estadísticas: productos activos, pedidos, ventas del mes |
| Mis productos | `/portal/productos` | ✅ Ver sus productos — crear nuevos (quedan `inactivo`) |
| Editar producto | `/portal/productos/editar` | ✅ Solo puede editar **precio y stock** — no nombre, slug ni estado |
| Mis pedidos | `/portal/pedidos` | 👁️ Ver pedidos que contienen sus productos |
| Mis pagos | `/portal/pagos` | 👁️ Ver lo que el negocio le debe |
| Panel admin `/dashboard` | — | ❌ Bloqueado por middleware de rol |
| Usuarios, finanzas, marketing | — | ❌ Sin acceso |

### Flujo de aprobación de productos (Proveedor → Admin)
```
Proveedor sube producto
        ↓
estado = 'inactivo'  ← no aparece en la tienda
        ↓
Badge naranja aparece en navbar y dashboard del admin
        ↓
Admin revisa en /productos?estado=inactivo
        ↓
Admin activa → estado = 'activo'  ← aparece en la tienda
```

---

## 🎧 Soporte

**Descripción:** Atiende clientes y resuelve problemas de pedidos. Sin acceso a finanzas ni catálogo.

| Módulo | URL | Acceso |
|---|---|---|
| Dashboard | `/dashboard` | ✅ Acceso básico |
| Usuarios | `/usuarios` | 👁️ Solo ver — no puede crear, editar ni eliminar |
| Pedidos | `/pedidos` | ✅ Ver, editar, cancelar, tracking |
| Clientes | (dentro de pedidos) | ✅ Ver y gestionar |
| Productos | `/productos` | ❌ Sin acceso |
| Finanzas | `/transacciones` `/gastos` | ❌ Sin acceso |
| Marketing | `/cupones` `/campanas` | ❌ Sin acceso |

---

## 🛍️ Cliente

**Descripción:** Solo accede a la tienda pública. No tiene panel administrativo.

| Módulo | URL | Acceso |
|---|---|---|
| Tienda | `/tienda` | ✅ Ver catálogo, buscar, filtrar por categoría |
| Producto | `/tienda/producto/{slug}` | ✅ Ver detalle + agregar al carrito |
| Carrito | `/carrito` | ✅ Ver, modificar cantidades, aplicar cupones |
| Pago | `/checkout` | ✅ Completar pedido |
| Mis pedidos | (perfil) | 👁️ Ver solo sus propios pedidos y tracking |
| Panel admin | `/dashboard` | ❌ Bloqueado |

---

## 📊 Tabla resumen

| Módulo | Super Admin | Admin | Vendedor | Proveedor | Soporte | Cliente |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Dashboard admin | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Gestionar usuarios | ✅ | ✅ | ❌ | ❌ | 👁️ | ❌ |
| Crear/editar productos | ✅ | ✅ | ❌ | ✅* | ❌ | ❌ |
| Publicar productos | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Gestionar pedidos | ✅ | ✅ | ✅ | 👁️ | ✅ | 👁️ |
| Finanzas | ✅ | ✅ | ❌ | 👁️* | ❌ | ❌ |
| Marketing / cupones | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Analytics | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Tarifas domicilio | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Categorías | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Portal proveedor | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Tienda pública | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Configuración sistema | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

> *El proveedor crea productos que quedan `inactivos` (pendientes de aprobación).
> En finanzas solo ve sus propios pagos dentro del portal, no el módulo de finanzas del admin.

---

## 🔑 Permisos técnicos (Spatie)

Los permisos se definen en `database/seeders/RolesYPermisosSeeder.php`.

| Permiso | Super Admin | Admin | Vendedor | Proveedor | Soporte |
|---|:---:|:---:|:---:|:---:|:---:|
| ver-usuarios | ✅ | ✅ | ❌ | ❌ | ✅ |
| crear-usuarios | ✅ | ✅ | ❌ | ❌ | ❌ |
| editar-usuarios | ✅ | ✅ | ❌ | ❌ | ❌ |
| eliminar-usuarios | ✅ | ❌ | ❌ | ❌ | ❌ |
| asignar-roles | ✅ | ❌ | ❌ | ❌ | ❌ |
| ver-productos | ✅ | ✅ | ✅ | ✅ | ❌ |
| crear-productos | ✅ | ✅ | ❌ | ✅ | ❌ |
| editar-productos | ✅ | ✅ | ❌ | ✅ | ❌ |
| eliminar-productos | ✅ | ✅ | ❌ | ❌ | ❌ |
| publicar-productos | ✅ | ✅ | ❌ | ❌ | ❌ |
| importar-productos | ✅ | ✅ | ❌ | ✅ | ❌ |
| ver-pedidos | ✅ | ✅ | ✅ | ❌ | ✅ |
| ver-mis-pedidos | ✅ | ✅ | ✅ | ✅ | ❌ |
| crear-pedidos | ✅ | ✅ | ✅ | ❌ | ❌ |
| editar-pedidos | ✅ | ✅ | ❌ | ❌ | ✅ |
| cancelar-pedidos | ✅ | ✅ | ❌ | ❌ | ✅ |
| procesar-pedidos | ✅ | ✅ | ✅ | ❌ | ❌ |
| ver-tracking | ✅ | ✅ | ✅ | ✅ | ✅ |
| ver-finanzas | ✅ | ✅ | ❌ | ❌ | ❌ |
| gestionar-finanzas | ✅ | ✅ | ❌ | ❌ | ❌ |
| ver-marketing | ✅ | ✅ | ❌ | ❌ | ❌ |
| gestionar-campanas | ✅ | ✅ | ❌ | ❌ | ❌ |
| ver-clientes | ✅ | ✅ | ✅ | ❌ | ✅ |
| ver-reportes | ✅ | ✅ | ✅ | ❌ | ❌ |
| exportar-reportes | ✅ | ✅ | ❌ | ❌ | ❌ |
| gestionar-configuracion | ✅ | ❌ | ❌ | ❌ | ❌ |
| ver-logs | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 🛠️ Cómo agregar o modificar permisos

```bash
# 1. Editar el seeder
# Archivo: database/seeders/RolesYPermisosSeeder.php

# 2. Correr el seeder en Railway
php artisan db:seed --class=RolesYPermisosSeeder --force

# 3. Limpiar caché de permisos
php artisan permission:cache-reset
```

---

*Nota relacionada: [[🔐 Credenciales — Master]]*
