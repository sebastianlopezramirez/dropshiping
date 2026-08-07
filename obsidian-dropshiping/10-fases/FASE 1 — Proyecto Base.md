---
type: fase
tags: [fase, completada, laravel, postgresql, react]
created: 2026-08-04
updated: 2026-08-04
status: evergreen
fase: 1
estado_fase: completada
descripcion: "Instalación del stack base: Laravel 13, PostgreSQL, React, Inertia"
---

# FASE 1 — Proyecto Base

**Estado:** ✅ Completada
**Sesión:** 1 — 2026-08-04
**Duración:** ~4-5 horas

---

## ENTENDER — ¿Qué se construyó?

El entorno de desarrollo completo: Laravel 13 como backend, PostgreSQL 17 como base de datos, React 18 + Inertia.js como frontend híbrido (SPA sin API separada), y Spatie para roles y permisos. Se establecieron todas las convenciones de nomenclatura que seguirá el proyecto.

---

## Decisiones tomadas en esta fase

| Decisión | Elegido | Razón |
|---|---|---|
| Base de datos | PostgreSQL 17 | UUID nativo, JSONB, mejor concurrencia |
| Frontend | React + Inertia.js | SSR/SPA sin API REST separada |
| Auth | Breeze + Sanctum | Simplicidad con Inertia |
| Roles | Spatie Permission 8.3 | Estándar de Laravel |
| Nombres tablas | Español | Consistencia con el dominio del negocio |
| Nombres columnas internas | Inglés | Laravel las hardcodea (`last_activity`, etc.) |

---

## Stack instalado

| Tecnología | Versión |
|---|---|
| Laravel | 13.24.0 |
| PHP | 8.3.32 |
| PostgreSQL | 17 |
| React | 18 |
| Inertia.js | 2.0.24 |
| Spatie Permission | 8.3 |
| Vite | 8.2.0 |
| Node | 22.22.3 |
| Breeze | 2.4.2 |

---

## Archivos creados / modificados

### Configuración
- `.env` — PostgreSQL, sesiones en BD, colas en BD, locale es_CO
- `.env.example` — plantilla con todos los servicios futuros
- `config/permission.php` — tablas Spatie en español
- `config/auth.php` — tabla de tokens en español
- `config/session.php` — tabla sesiones apunta a `sesiones`
- `bootstrap/app.php` — middleware Spatie registrado

### Migraciones (en orden de ejecución)
1. `0001_01_01_000000` → `usuarios`, `tokens_recuperacion_contrasena`, `sesiones`
2. `0001_01_01_000001` → `cache`, `cache_locks`
3. `0001_01_01_000002` → `trabajos`, `lotes_trabajos`, `trabajos_fallidos`
4. `2026_08_04_210542` → tablas Spatie en español
5. `2026_08_04_220000` → `proveedores`

### Modelos
- `app/Models/User.php` — `$table = 'usuarios'`, UUID, SoftDeletes, HasRoles, timestamps en español
- `app/Models/Proveedor.php` — UUID, JSONB casts, relaciones, scopes

### Frontend
- `resources/js/bootstrap.js` — configuración Axios (CSRF + credentials)

---

## Cómo reproducir esta fase

```powershell
# 1. Crear proyecto
composer create-project laravel/laravel dropshiping
cd dropshiping

# 2. Instalar paquetes PHP
composer require laravel/breeze spatie/laravel-permission

# 3. Instalar Breeze con Inertia + React
php artisan breeze:install react --ssr

# 4. Instalar paquetes npm (con flag legacy para Vite 8)
npm install --legacy-peer-deps
npm install @tanstack/react-table react-hook-form zod @hookform/resolvers zustand recharts lucide-react class-variance-authority clsx tailwind-merge --legacy-peer-deps

# 5. Publicar config de Spatie
php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider"

# 6. Correr migraciones
php artisan migrate:fresh

# 7. Iniciar servidores (DOS terminales)
php artisan serve
npm run dev
```

---

## Errores encontrados y soluciones

### Error 1 — Directorio no vacío
**Síntoma:** `composer create-project` falla
**Causa:** Había un `.env.example` en la carpeta antes de correr composer
**Fix:** Crear en subdirectorio `_laravel-temp` y mover todo al root

### Error 2 — npm ERESOLVE
**Síntoma:** `npm install` falla con conflicto de peer deps
**Causa:** Vite 8.2.0 es más nuevo que lo declarado en `@vitejs/plugin-react@4.7.0`
**Fix:** `npm install --legacy-peer-deps`

### Error 3 — PostgreSQL auth failed
**Síntoma:** `php artisan migrate` falla con "authentication failed for user"
**Fix completo:**
1. Abrir `C:\Program Files\PostgreSQL\17\data\pg_hba.conf` (como admin)
2. Cambiar `scram-sha-256` a `trust` para host local
3. Reiniciar servicio: PowerShell admin → `Restart-Service postgresql-x64-17`
4. `psql -U postgres` → `ALTER USER postgres WITH PASSWORD 'postgres123';`
5. Restaurar `scram-sha-256` y reiniciar de nuevo

### Error 4 — `last_activity` column not found
**Síntoma:** Error SQLSTATE[42703] al acceder a la app
**Causa:** Renombramos la columna a `ultima_actividad` pero Laravel la busca hardcodeada como `last_activity`
**Regla aprendida:**
```
✅ Traducir NOMBRES DE TABLAS:  users → usuarios
❌ NO traducir COLUMNAS INTERNAS: last_activity, payload, remember_token
```

### Error 5 — ViteManifestNotFoundException
**Síntoma:** Error 500 en Laravel
**Fix:** Correr `npm run dev` en una segunda terminal

### Error 6 — `bootstrap.js` not found
**Síntoma:** Error en consola del navegador
**Causa:** Breeze no generó el archivo
**Fix:** Crear manualmente `resources/js/bootstrap.js` con config de Axios

---

*← [[🏠 Inicio]] | Siguiente: [[FASE 2 — Usuarios y Roles]] →*
