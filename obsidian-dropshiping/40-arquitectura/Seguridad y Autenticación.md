---
type: note
tags: [arquitectura, seguridad, autenticacion]
created: 2026-07-27
updated: 2026-07-27
status: evergreen
---

# 🔐 Seguridad y Autenticación

## Autenticación
- **Driver**: Laravel Sanctum (tokens de API para SPA con Inertia)
- **Scaffolding**: Laravel Breeze (vistas de login, registro, recuperación)
- **OAuth**: Google + Facebook (social login)
- **OTP**: Verificación de email con código de 6 dígitos
- **2FA**: Para roles administrativos (TOTP via Google Authenticator)

## Autorización
- **Paquete**: Spatie Laravel Permission
- **Roles**: super_administrador, administrador, vendedor, proveedor, soporte, cliente
- **Permisos**: Granulares por módulo y acción

## Protecciones
- Bloqueo automático tras 5 intentos fallidos (Laravel Throttle)
- Tokens con expiración configurable
- CSRF protection (nativo Laravel)
- Rate limiting en endpoints de API
- Sanitización de inputs
- Validación server-side con Form Requests de Laravel

## Auditoría
- Log de actividad por usuario (tabla `actividad_usuarios`)
- Registro de IPs y User Agents en pedidos y pagos

## Variables sensibles
- Nunca en repositorio — siempre en `.env`
- En producción: variables de entorno del servidor
