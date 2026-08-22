---
tags: [credenciales, seguridad, accesos]
tipo: credenciales
estado: activo
ultima_actualizacion: 2026-08-21
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

## 🚀 Railway (Producción)

| Campo | Valor |
|---|---|
| URL producción | `https://courageous-flexibility-production-1a54.up.railway.app` |
| Proyecto | `dropshipping` / `production` |
| Servicio app | `courageous-flexibility` |
| Región | EU West (Amsterdam) |
| PHP | 8.3.33 |
| Node | 22.23.2 |
| GitHub repo | `sebastianlopezramirez/dropshiping` (branch: `main`) |
| Deploy | Automático al hacer `git push origin main` |
| Console | Railway → servicio → pestaña Console |

### Comandos Railway (correr desde Console):
```bash
php artisan migrate --force
php artisan db:seed --class=TarifaDomicilioSeeder --force
php artisan cache:clear
```

---

## 👥 Usuarios del Sistema

| Nombre | Email | Contraseña | Rol |
|---|---|---|---|
| Sebastian | `selora1988@gmail.com` | `Admin2024!` | `super_administrador` |

> 🔄 **Pendiente**: Crear usuarios para proveedores y administradores adicionales desde `/usuarios`

---

## 📞 Contacto del Negocio

| Campo | Valor |
|---|---|
| WhatsApp negocio | `3137921336` (formato WA: `573137921336`) |
| Email contacto | `selora1988@gmail.com` |

---

## 🏗️ Infraestructura (Producción)

| Servicio | Estado | Detalle |
|---|---|---|
| Servidor web | ✅ Railway | `courageous-flexibility` |
| Base de datos | ✅ Railway PostgreSQL | `postgres-volume` |
| Imágenes | ✅ Cloudflare R2 | Variables en Railway |
| Dominio | ⏳ Por definir | — |
| SSL | ✅ Railway (automático) | HTTPS incluido |
| Redis | ⏳ Por definir | Upstash / Railway |
| Email transaccional | ⏳ Por definir | Resend / SendGrid |

---

## 📋 Historial de cambios

| Fecha | Cambio | Quién |
|---|---|---|
| 2026-08-04 | Configuración inicial — PostgreSQL + usuario admin | Sebastian / Claude |
| 2026-08-21 | Agregado Railway producción, WhatsApp negocio, tabla usuarios | Sebastian / Claude |

---

*Notas relacionadas: [[MOC — Decisiones Técnicas]] · [[👥 Roles y Accesos — GadGet Store]] · [[🗂️ Categorías — GadGet Store]]*
