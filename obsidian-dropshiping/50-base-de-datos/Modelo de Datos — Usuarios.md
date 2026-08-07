---
type: note
tags: [base-de-datos, usuarios, roles]
created: 2026-07-27
updated: 2026-07-27
status: evergreen
related: ["[[Módulo — Usuarios y Roles]]", "[[MOC — Base de Datos]]"]
---

# 🗄️ Modelo de Datos — Usuarios

## Tablas
- `usuarios` — tabla base de todos los actores
- `proveedores` — datos extendidos del proveedor
- `roles` — roles del sistema
- `permisos` — permisos granulares
- `modelo_tiene_roles` — pivot polimórfico

## Campos clave: `usuarios`
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK generada automáticamente |
| `nombre` | VARCHAR(100) | Nombre completo |
| `email` | VARCHAR(100) UNIQUE | Email único |
| `contrasena` | VARCHAR(255) | Hash bcrypt |
| `rol` | VARCHAR(20) | admin, vendedor, proveedor, cliente, soporte |
| `estado` | VARCHAR(20) | activo, inactivo, suspendido |
| `limite_credito` | DECIMAL(12,2) | Para clientes mayoristas |
| `plazos_credito` | INT | Días de crédito |
| `eliminado_en` | TIMESTAMP | Soft delete |

## Campos clave: `proveedores`
| Campo | Tipo | Descripción |
|---|---|---|
| `usuario_id` | UUID FK | Referencia a usuarios |
| `nombre_empresa` | VARCHAR(200) | Razón social |
| `condiciones_pago` | INT | Días para pagar (default 15) |
| `metodos_pago` | JSONB | Array de métodos aceptados |
| `calificacion` | DECIMAL(3,2) | Rating 0-5 |

## Migración Laravel
```
php artisan make:migration crear_tabla_usuarios
php artisan make:migration crear_tabla_proveedores
php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider"
```
