---
type: note
tags: [arquitectura, stack, backend, frontend]
created: 2026-07-27
updated: 2026-07-27
status: evergreen
related: ["[[Infraestructura y Servidores]]", "[[Servicios Externos e Integraciones]]"]
---

# ⚙️ Stack Tecnológico

## Backend
| Componente | Tecnología | Versión |
|---|---|---|
| Framework | Laravel | 13 |
| Lenguaje | PHP | 8.3+ |
| Base de datos | PostgreSQL | 16 |
| Caché | Redis | Latest |
| Colas | Laravel Horizon + Redis | — |
| WebSockets | Laravel Reverb | — |
| Autenticación | Laravel Sanctum + Breeze | — |
| Roles/Permisos | Spatie Laravel Permission | — |
| API | RESTful versionada (v1, v2) | — |

## Frontend
| Componente | Tecnología | Versión |
|---|---|---|
| Framework | React | 18 |
| Integración | Inertia.js (SSR/SPA) | — |
| Estilos | Tailwind CSS | 3 |
| Componentes | Shadcn/ui | — |
| Estado global | Zustand | — |
| Formularios | React Hook Form + Zod | — |
| Tablas | TanStack React Table | — |
| Gráficos | Recharts | — |

## Decisiones relacionadas
- [[MOC — Decisiones Técnicas]]
