---
tags: [credenciales, seguridad, accesos]
tipo: credenciales
estado: activo
ultima_actualizacion: 2026-08-04
advertencia: "NO subir este archivo a GitHub ni compartir públicamente"
---

# 🔐 Credenciales — Master

> ⚠️ **ADVERTENCIA DE SEGURIDAD**
> Este archivo contiene credenciales de desarrollo local.
> En producción, estas credenciales DEBEN cambiarse.
> Este archivo está en `.gitignore` — nunca debe llegar a un repositorio.

---

## 🖥️ Aplicación

| Campo | Valor |
|---|---|
| URL local | `http://localhost:8000` |
| Ambiente | `local` (desarrollo) |
| Carpeta proyecto | `D:\proyectos\dropshiping` |

---

## 👤 Usuario Admin del Sistema

| Campo              | Valor                  |
| ------------------ | ---------------------- |
| Email              | `selora1988@gmail.com` |
| Contraseña inicial | `Admin2024!`           |
| Rol                | `super_administrador`  |
| Estado             | `activo`               |
| Tabla BD           | `usuarios`             |
| digital ocean -    |                        |

> 🔄 **Acción pendiente**: Cambiar la contraseña después del primer login exitoso.

---

## 🐘 PostgreSQL (Base de Datos)

| Campo | Valor |
|---|---|
| Host | `127.0.0.1` |
| Puerto | `5432` |
| Base de datos | `dropshipping_db` |
| Usuario | `postgres` |
| Contraseña | `postgres123` |
| Versión | `PostgreSQL 17` |

**Conectar desde terminal:**
```bash
psql -U postgres -d dropshipping_db
```

**Conectar desde pgAdmin 4:**
- Host: `localhost`
- Port: `5432`
- Username: `postgres`
- Password: `postgres123`

**Archivo de configuración de autenticación:**
```
C:\Program Files\PostgreSQL\17\data\pg_hba.conf
C:\Program Files\PostgreSQL\17\data\pg_hba.conf.backup  ← copia de seguridad original
```

---

## 🚀 Comandos para iniciar el proyecto

```powershell
# Terminal 1 — Backend Laravel
cd D:\proyectos\dropshiping
php artisan serve
# → Disponible en http://localhost:8000

# Terminal 2 — Frontend Vite/React
cd D:\proyectos\dropshiping
npm run dev
# → Compila React/JSX en tiempo real
```

---

## 📦 Comandos útiles de base de datos

```powershell
# Sembrar datos iniciales (roles + usuario admin)
php artisan db:seed

# Recrear toda la BD + correr todos los seeders
php artisan migrate:fresh --seed

# Ver el estado de las migraciones
php artisan migrate:status
```

---

## 🔑 Variables de entorno (.env) — Servicios futuros

| Servicio | Variable | Estado |
|---|---|---|
| Wompi (pagos Colombia) | `WOMPI_PUBLIC_KEY_SANDBOX` | ⏳ Pendiente |
| OpenAI (descripciones IA) | `OPENAI_API_KEY` | ⏳ Pendiente |
| Cloudflare R2 (imágenes) | `AWS_ACCESS_KEY_ID` | ⏳ Pendiente |
| Twilio (SMS) | Definir en FASE 7 | ⏳ Pendiente |
| Meta Ads | Definir en FASE 7 | ⏳ Pendiente |
| Google Ads | Definir en FASE 7 | ⏳ Pendiente |

---

## 🏗️ Infraestructura (Producción — a definir)

| Servicio | Estado |
|---|---|
| Servidor web | ⏳ Por definir (VPS / Railway / Fly.io) |
| Dominio | ⏳ Por definir |
| SSL | ⏳ Por definir (Cloudflare / Let's Encrypt) |
| Redis | ⏳ Por definir (Upstash / Railway) |
| Email transaccional | ⏳ Por definir (Resend / SendGrid) |

---

## 📋 Historial de cambios

| Fecha | Cambio | Quién |
|---|---|---|
| 2026-08-04 | Configuración inicial — PostgreSQL + usuario admin | Sebastian / Claude |

---

*Nota relacionada: [[MOC — Decisiones Técnicas]]*
