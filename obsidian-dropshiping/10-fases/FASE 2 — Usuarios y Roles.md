---
type: fase
tags: [fase, completada, usuarios, roles, spatie, react]
created: 2026-08-04
updated: 2026-08-04
status: evergreen
fase: 2
estado_fase: completada-con-bug
descripcion: "Seeders, middleware, controller CRUD y páginas React de usuarios"
---

# FASE 2 — Usuarios y Roles

**Estado:** ✅ Código completo — ⚠️ BUG-001 pendiente (login)
**Sesión:** 2 — 2026-08-04

---

## ENTENDER — ¿Qué se construyó?

El sistema de identidad completo: 6 roles con 34 permisos granulares, usuario administrador inicial, middleware de Spatie integrado en el router, controller con CRUD completo para gestión de usuarios, y 4 páginas React con filtros, paginación y formularios validados.

---

## Lo que se creó

### Bloque A — Seeders

#### `database/seeders/RolesYPermisosSeeder.php`
- Crea 34 permisos organizados por módulo (usuarios, productos, pedidos, proveedores, finanzas, marketing, reportes, configuración)
- Crea 6 roles: `super_administrador`, `administrador`, `vendedor`, `proveedor`, `soporte`, `cliente`
- Asigna permisos a cada rol con `syncPermissions()`
- Usa transacción DB para atomicidad

#### `database/seeders/UsuarioAdminSeeder.php`
- Crea usuario `selora1988@gmail.com` con contraseña `Admin2024!`
- Usa `updateOrCreate` (idempotente — se puede correr N veces)
- Asigna rol `super_administrador` via Spatie

#### `database/seeders/DatabaseSeeder.php`
- Orquesta el orden: `RolesYPermisosSeeder` → `UsuarioAdminSeeder`
- Orden importa: el admin necesita que los roles existan primero

### Bloque B — Middleware

**`bootstrap/app.php`** — se agregaron alias:
```php
$middleware->alias([
    'role'               => RoleMiddleware::class,
    'permission'         => PermissionMiddleware::class,
    'role_or_permission' => RoleOrPermissionMiddleware::class,
]);
```
**Lección:** En Laravel 13 ya no existe `Kernel.php`. El middleware se registra en `bootstrap/app.php`.

### Bloque C — Rutas y Controller

#### `routes/web.php`
- Grupo `auth + verified` → dashboard + perfil
- Grupo `role:super_administrador|administrador` → rutas de usuarios
- `Route::resource('usuarios', ...)` → genera 7 rutas automáticamente
- Rutas extra: `usuarios/{id}/estado` y `usuarios/{id}/rol`

#### `app/Http/Controllers/Web/UsuarioController.php`
| Método | Ruta | Descripción |
|---|---|---|
| `index()` | GET /usuarios | Lista con filtros, paginación, estadísticas |
| `create()` | GET /usuarios/create | Formulario crear |
| `store()` | POST /usuarios | Guardar + validar + hashear contraseña |
| `show()` | GET /usuarios/{id} | Ver detalle |
| `edit()` | GET /usuarios/{id}/edit | Formulario editar pre-llenado |
| `update()` | PUT /usuarios/{id} | Guardar cambios (contraseña opcional) |
| `destroy()` | DELETE /usuarios/{id} | Soft delete |
| `cambiarEstado()` | PATCH /usuarios/{id}/estado | Toggle activo/inactivo |
| `cambiarRol()` | PATCH /usuarios/{id}/rol | Cambiar rol |

### Bloque D — Páginas React

| Archivo | Descripción |
|---|---|
| `Pages/Dashboard.jsx` | Saludo personalizado, cards de módulos, badge de rol |
| `Pages/Usuarios/Index.jsx` | Tabla con búsqueda, filtros (estado/rol), paginación, flash messages |
| `Pages/Usuarios/Crear.jsx` | `useForm` de Inertia, validación en tiempo real, todos los campos |
| `Pages/Usuarios/Editar.jsx` | Form pre-llenado, contraseña opcional, mismo layout |

---

## Conceptos aprendidos en esta fase

### Laravel
- **Seeder vs Factory:** seeders = datos fijos (roles), factories = datos falsos (testing)
- **`updateOrCreate`:** buscar primero → actualizar si existe → crear si no existe
- **`Route::resource()`:** genera 7 rutas CRUD con un solo comando
- **Route Model Binding:** Laravel busca el modelo automáticamente por ID/UUID
- **Soft Delete:** `$user->delete()` no borra, pone fecha en `eliminado_en`
- **Transacciones DB:** `DB::transaction(fn)` — si algo falla, todo se revierte
- **Validación:** `$request->validate([...])` — si falla, redirige con errores automáticamente

### React + Inertia
- **`usePage().props`:** acceder a datos globales compartidos por Laravel (usuario auth)
- **`useForm()`:** manejo de formularios con estado, errores y processing
- **`router.get()`:** navegar programáticamente sin recargar la página
- **`router.delete()`:** DELETE request desde JavaScript (HTML solo soporta GET/POST)
- **`preserveState: true`:** mantener filtros activos al paginar

---

## ⚠️ Bug pendiente

**BUG-001 — Login `auth.failed`**

**Fix en `app/Models/User.php`:**
```php
public function getAuthPassword(): string
{
    return $this->contrasena;
}
```

**Por qué:** Breeze usa `Auth::attempt(['email' => ..., 'password' => ...])`. Laravel internamente llama `$user->getAuthPassword()` para comparar el hash. Por defecto devuelve `$this->password`, pero nuestra columna se llama `contrasena`.

Ver detalle completo: [[🐛 Bugs y Pendientes#BUG-001]]

---

## Cómo correr los seeders

```powershell
cd D:\proyectos\dropshiping

# Solo sembrar datos (sin borrar tablas)
php artisan db:seed

# Recrear toda la BD + sembrar (BORRA TODOS LOS DATOS)
php artisan migrate:fresh --seed
```

---

*← [[FASE 1 — Proyecto Base]] | Siguiente: [[FASE 3 — Productos y Catálogo]] →*
