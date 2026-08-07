---
type: moc
tags: [moc, decisiones, arquitectura]
created: 2026-08-04
updated: 2026-08-04
descripcion: "Registro de todas las decisiones técnicas del proyecto y su justificación"
---

# 🧠 MOC — Decisiones Técnicas

Registro inmutable de decisiones. Cada vez que elegimos algo importante, lo documentamos aquí con el razonamiento. Esto evita volver a debatir lo mismo en el futuro.

---

## ✅ Decisiones tomadas y justificadas

| Decisión | Elegido | Alternativa descartada | Razón |
|---|---|---|---|
| Backend | Laravel 13 | Node.js / Django | Ecosistema maduro, ORM Eloquent, paquetes listos |
| Base de datos | PostgreSQL 17 | MySQL 8 | UUID nativo (`gen_random_uuid()`), JSONB indexable, mejor concurrencia |
| Frontend | React 18 + Inertia.js | Vue 3 / Next.js | SSR/SPA híbrido sin necesitar API REST separada |
| Estilos | Tailwind CSS 3 + Shadcn/ui | Bootstrap / Material UI | Utility-first, componentes copiables sin dependencia npm |
| Autenticación | Breeze + Sanctum | Passport / JWT | Simplicidad con Inertia, sin tokens manuales |
| Roles y permisos | Spatie Permission 8.3 | ACL manual | Estándar de Laravel, granular, bien documentado |
| Pagos Colombia | Wompi | PayU / MercadoPago | Nativo Colombia, PSE + Nequi + tarjetas |
| Storage archivos | Cloudflare R2 | AWS S3 / DigitalOcean | Sin costo de egress (salida de datos) |
| Colas | Database (dev) → Redis (prod) | SQS / RabbitMQ | Simple en dev, veloz en producción con Horizon |
| WebSockets | Laravel Reverb | Pusher / Soketi | Self-hosted, sin costo externo |
| Monitoreo | Telescope (dev) + Sentry (prod) | Datadog / New Relic | Dev local gratis + errores producción a bajo costo |

---

## 🔧 Decisiones de nomenclatura (reglas del proyecto)

| Regla | Correcto | Incorrecto |
|---|---|---|
| Nombres de tablas | `usuarios`, `pedidos`, `sesiones` | `users`, `orders`, `sessions` |
| Columnas internas de Laravel | `last_activity`, `payload`, `remember_token` | `ultima_actividad` ❌ |
| Clave primaria | UUID con `gen_random_uuid()` | `id` autoincremental |
| Timestamps | `creado_en` / `actualizado_en` / `eliminado_en` | `created_at` / `updated_at` |
| Comentarios en código | Español educativo en todas las líneas | Sin comentarios |
| Idioma de código | Español (variables, métodos, rutas) | Inglés |

---

## 📦 Versiones del stack (fijadas en FASE 1)

| Tecnología | Versión | Notas |
|---|---|---|
| Laravel | 13.24.0 | |
| PHP | 8.3.32 | |
| PostgreSQL | 17 | |
| React | 18 | |
| Inertia.js | 2.0.24 | |
| Spatie Permission | 8.3 | |
| Vite | 8.2.0 | Requiere `--legacy-peer-deps` al instalar npm |
| Node | 22.22.3 | |
| Breeze | 2.4.2 | |

---

## ⏳ Decisiones pendientes

- [ ] Motor de búsqueda: **Meilisearch** vs Algolia (para FASE 3 — búsqueda de productos)
- [ ] Email transaccional: **Resend** vs SendGrid vs Mailgun
- [ ] Tracking de envíos: **17Track** vs AfterShip
- [ ] Servidor de producción: Railway vs Fly.io vs VPS propio
- [ ] Dominio y SSL: Cloudflare + Let's Encrypt

---

## 🎓 Lecciones técnicas aprendidas

### FASE 1
- `pg_hba.conf trust` → permite cambiar contraseña de PostgreSQL sin saber la actual
- `--legacy-peer-deps` → soluciona conflictos de versiones en npm con Vite 8
- Diferencia entre `last_activity` (columna de Laravel) vs `ultima_actividad` (error nuestro)
- Inertia necesita `bootstrap.js` con Axios configurado (Breeze no lo genera siempre)

### FASE 2
- `getAuthPassword()` → override necesario cuando la columna de contraseña no se llama `password`
- `Route::resource()` → genera 7 rutas con un solo comando
- Laravel 13 ya no tiene `Kernel.php` → middleware en `bootstrap/app.php`
- `updateOrCreate()` → idempotente (seeder que se puede correr N veces sin errores)

---

*Relacionado: [[MOC — Arquitectura]] · [[Stack Tecnológico]] · [[🏠 Inicio]]*
