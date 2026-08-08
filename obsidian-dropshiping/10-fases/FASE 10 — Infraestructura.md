---
title: FASE 10 — Infraestructura (GitHub + CI/CD + Tests)
tags: [fase, github, ci-cd, tests, en-progreso]
type: fase
estado: en-progreso
fase_numero: 10
created: 2026-08-07
updated: 2026-08-07
related: ["[[FASE 9 — Analytics]]"]
---

# FASE 10 — Infraestructura (GitHub + CI/CD + Tests)

## ENTENDER — ¿Qué construimos?

La infraestructura que garantiza que el código funciona antes de llegar a producción:

1. **GitHub** — repositorio centralizado del código fuente
2. **CI/CD** — pipeline automático que corre tests en cada push
3. **Tests PHPUnit** — cobertura de las rutas críticas del negocio

## GitHub

- **Repositorio**: `https://github.com/sebastianlopezramirez/dropshiping`
- **Rama principal**: `main`
- **Primer push**: 2026-08-07

## CI/CD — GitHub Actions

**Archivo**: `.github/workflows/ci.yml`

### ¿Qué hace el workflow?

Cada push a cualquier rama dispara automáticamente:

1. Levanta PostgreSQL 17 como servicio (idéntico al local)
2. Instala PHP 8.3 con extensiones `pdo_pgsql`, `bcmath`, etc.
3. Instala dependencias PHP (`composer install`)
4. Instala dependencias JS + build Vite (`npm ci && npm run build`)
5. Crea `.env` + genera `APP_KEY`
6. Corre migraciones en BD de test
7. Ejecuta todos los tests (`php artisan test --stop-on-failure`)

### Configuración clave

```yaml
services:
  postgres:
    image: postgres:17
    env:
      POSTGRES_DB: dropshipping_test
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
```

**`.npmrc`** — necesario para Vite 8:
```
legacy-peer-deps=true
```

**`phpunit.xml`** — PostgreSQL en lugar de SQLite:
```xml
<env name="DB_CONNECTION" value="pgsql"/>
<env name="DB_DATABASE" value="dropshipping_test"/>
```

## Tests (estado actual)

### Tests en verde ✅ (8/8)

| Test | Descripción |
|---|---|
| `ExampleTest` (Unit) | that true is true |
| `ExampleTest` (Feature) | the application returns a successful response |
| `tienda_es_accesible_sin_login` | GET /tienda → no 500 |
| `producto_inexistente_devuelve_404` | slug falso → 404 |
| `producto_activo_es_visible` | producto activo → 200 |
| `dashboard_admin_requiere_login` | GET /dashboard sin auth → redirect /login |
| `usuario_puede_autenticarse` | POST /login credenciales válidas → authenticated |
| `credenciales_invalidas_no_autentican` | POST /login contraseña errónea → guest |

### Factories creadas

- `UserFactory` — corregida: `nombre`, `contrasena`, `email_verificado_en`
- `CategoriaFactory` — nueva: genera categorías con slug único
- `ProductoFactory` — nueva: genera productos con estados `inactivo`, `conOferta`, `sinStock`

### Historial de fixes CI (4 runs)

| Run | Error | Causa | Fix |
|---|---|---|---|
| #1 ❌ | npm ERESOLVE | Vite 8 incompatible con @vitejs/plugin-react | `.npmrc legacy-peer-deps=true` |
| #2 ❌ | column "name" no existe | Tests Breeze usan schema inglés | Eliminar 7 tests Breeze + corregir UserFactory |
| #3 ❌ | column "email_verified_at" no existe | UserFactory aún usaba nombre inglés | `email_verified_at` → `email_verificado_en` + factories |
| #4 ✅ | — | — | 8/8 tests pasan |

## Pendiente en esta fase

- [ ] Tests adicionales: `PedidoController`, `CuponController`, `AnalyticsController`
- [ ] Preparar `.env.production`
- [ ] Documentar proceso de deploy (Railway / Render / VPS)
- [ ] Deploy real en servidor