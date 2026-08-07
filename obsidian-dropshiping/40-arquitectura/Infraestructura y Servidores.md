---
type: note
tags: [arquitectura, infraestructura, devops]
created: 2026-07-27
updated: 2026-07-27
status: evergreen
related: ["[[Stack Tecnológico]]", "[[Servicios Externos e Integraciones]]"]
---

# 🖥️ Infraestructura y Servidores

## Servidor Principal
- **VPS**: Hostinger o DigitalOcean
- **OS**: Ubuntu 22.04 LTS
- **Web Server**: Nginx + PHP-FPM
- **SSL**: Let's Encrypt (automatizado con Certbot)

## Almacenamiento
- **Archivos estáticos**: Cloudflare R2 (sin costo de egress)
- **CDN**: Cloudflare (caché global, optimización de imágenes)

## CI/CD
- **Pipeline**: GitHub Actions o GitLab CI
- **Flujo**: push → tests → deploy automático

## Monitoreo
- **Desarrollo**: Laravel Telescope
- **Producción**: Sentry (errores) + Laravel Horizon (colas)

## Seguridad
- Firewall UFW
- Fail2ban (bloqueo de IPs maliciosas)
- Backups automáticos diarios
- Variables de entorno en `.env` (nunca en repositorio)
