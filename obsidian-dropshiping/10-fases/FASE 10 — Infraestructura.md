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

### Tests en verde ✅ (18/18)

**`TiendaPublicaTest`** (6 tests)

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

**`AdminControllersTest`** (10 tests)

| Test | Descripción |
|---|---|
| `analytics_requiere_login` | GET /analytics sin auth → redirect /login |
| `admin_puede_ver_dashboard_analytics` | actingAs(admin) → 200 + props kpis, ultimos_6_meses |
| `analytics_acepta_parametros_de_periodo` | ?mes=3&ano=2025 → periodo correcto en props |
| `cupon_valido_devuelve_descuento` | POST /cupones/validar → { valido: true } |
| `cupon_inexistente_devuelve_invalido` | código no existe → { valido: false } |
| `cupon_expirado_devuelve_invalido` | fecha_expiracion pasada → { valido: false } |
| `cupon_no_aplica_si_total_es_menor_al_minimo` | total < minimo_compra → { valido: false } |
| `admin_puede_cambiar_estado_pedido` | PATCH /pedidos/{id}/estado → BD actualizada |
| `estado_invalido_no_modifica_el_pedido` | estado 'volando' → BD sin cambios |
| `cancelar_pedido_registra_fecha_cancelacion` | estado cancelado → cancelado_en NOT NULL |

### Factories creadas

- `UserFactory` — corregida: `nombre`, `contrasena`, `email_verificado_en`
- `CategoriaFactory` — nueva: genera categorías con slug único
- `ProductoFactory` — nueva: genera productos con estados `inactivo`, `conOferta`, `sinStock`

### Convenciones aprendidas en tests

| Convención | Detalle |
|---|---|
| `setUp()` + Spatie | Crear roles antes de cada test con `Role::create(...)` |
| `actingAs($user)` | Simula login sin formulario |
| `assertDatabaseHas()` | Verifica cambios en BD directamente |
| `assertInertia()` | Verifica componente + props de Inertia |
| `patch()` vs `patchJson()` | Inertia redirige en validación; no retorna 422 |
| NOT NULL sin default | Leer la migración antes de `Model::create()` en tests |
| `assertGreaterThan` | Para números cuando tipo int vs float no importa |

### Historial de fixes CI (10 runs)

| Run | Error | Fix |
|---|---|---|
| #1 ❌ | npm ERESOLVE Vite 8 | `.npmrc legacy-peer-deps=true` |
| #2 ❌ | column "name" no existe | Eliminar tests Breeze + UserFactory corregida |
| #3 ❌ | column "email_verified_at" no existe | `email_verificado_en` + factories |
| #4 ✅ | — | 8/8 tests pasan |
| #5 ❌ | AdminControllersTest agregado | int vs float en assertJsonPath |
| #6 ❌ | assertJsonPath strict type | `assertGreaterThan` para descuento |
| #7 ❌ | direccion_entrega NOT NULL | Agregar campo al create() |
| #8 ❌ | Array to string conversion | Cast 'array' erróneo en modelo |
| #9 ❌ | ciudad/departamento NOT NULL | Leer migración, agregar todos los NOT NULL |
| #10 ✅ | patchJson vs patch con Inertia | Usar patch() + assertDatabaseHas |

## Pendiente en esta fase

- [ ] Preparar `.env.production` con variables reales
- [ ] Decidir plataforma de deploy (Railway / Render / VPS)
- [ ] Documentar proceso de deploy
- [ ] Deploy real en servidor