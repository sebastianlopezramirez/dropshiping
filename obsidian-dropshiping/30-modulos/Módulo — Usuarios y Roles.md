---
type: note
tags: [modulo, usuarios, roles, autenticacion, completado]
created: 2026-08-04
updated: 2026-08-04
status: evergreen
fase: 2
estado_modulo: completo-con-bug
related: ["[[Seguridad y Autenticación]]", "[[Modelo de Datos — Usuarios]]", "[[FASE 2 — Usuarios y Roles]]"]
descripcion: "Gestión de usuarios, roles y permisos — FASE 2 completada"
---

# 👥 Módulo — Usuarios y Roles

**Estado:** ✅ Completo (código) — ⚠️ BUG-001: fix de login pendiente
**Fase:** [[FASE 2 — Usuarios y Roles]]

---

## ENTENDER

Gestiona todos los actores del sistema: administradores, vendedores, proveedores, clientes y soporte. Define quién puede hacer qué en cada módulo del sistema.

---

## Lo que está en producción (código listo)

### Base de datos
- [x] Tabla `usuarios` con UUID, soft delete, timestamps en español
- [x] Tabla `sesiones` con FK a `usuarios`
- [x] Tablas Spatie: `roles`, `permisos`, `modelo_tiene_roles`, etc.

### Roles del sistema (seeders corriendo)
| Rol | Permisos |
|---|---|
| `super_administrador` | Todos (34 permisos) |
| `administrador` | Usuarios, productos, pedidos, proveedores, finanzas, marketing, reportes |
| `vendedor` | Ver productos, crear/procesar pedidos, gestionar clientes |
| `proveedor` | Sus productos, sus pedidos |
| `soporte` | Ver usuarios, editar/cancelar pedidos, gestionar clientes |
| `cliente` | Sus pedidos, tracking, ver productos |

### Backend
- [x] `RolesYPermisosSeeder.php` — 6 roles + 34 permisos
- [x] `UsuarioAdminSeeder.php` — `selora1988@gmail.com` / `Admin2024!`
- [x] `DatabaseSeeder.php` — orquesta el orden de seeders
- [x] `bootstrap/app.php` — alias middleware Spatie registrados
- [x] `routes/web.php` — rutas protegidas con `role:super_administrador|administrador`
- [x] `UsuarioController.php` — CRUD + cambiarEstado + cambiarRol (9 métodos)

### Frontend React
- [x] `Dashboard.jsx` — panel con saludo por rol, cards de módulos
- [x] `Usuarios/Index.jsx` — tabla con filtros, paginación, estadísticas
- [x] `Usuarios/Crear.jsx` — formulario completo con validación Inertia
- [x] `Usuarios/Editar.jsx` — form pre-llenado, contraseña opcional

---

## ⚠️ Pendiente

- [ ] **BUG-001:** Agregar `getAuthPassword()` en `app/Models/User.php` → [[🐛 Bugs y Pendientes]]
- [ ] Verificar login funciona en navegador
- [ ] Página de perfil personalizada (la de Breeze está en inglés)
- [ ] 2FA para roles administrativos (fase futura)
- [ ] Bloqueo tras 5 intentos fallidos (fase futura)

---

## Archivos del módulo

```
database/seeders/
  ├── RolesYPermisosSeeder.php
  ├── UsuarioAdminSeeder.php
  └── DatabaseSeeder.php

app/Models/
  ├── User.php            ← ⚠️ falta getAuthPassword()
  └── Proveedor.php

app/Http/Controllers/Web/
  └── UsuarioController.php

resources/js/Pages/
  ├── Dashboard.jsx
  └── Usuarios/
      ├── Index.jsx
      ├── Crear.jsx
      └── Editar.jsx

routes/web.php            ← rutas protegidas por rol
bootstrap/app.php         ← middleware Spatie registrado
```

---

*Relacionado: [[Modelo de Datos — Usuarios]] · [[Seguridad y Autenticación]] · [[FASE 2 — Usuarios y Roles]]*
