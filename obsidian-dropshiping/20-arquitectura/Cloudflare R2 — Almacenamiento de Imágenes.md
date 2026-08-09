---
title: Cloudflare R2 — Almacenamiento de Imágenes
tags: [infraestructura, cloudflare, r2, imagenes, storage]
type: note
estado: activo
created: 2026-08-08
updated: 2026-08-08
related: ["[[FASE 10 — Infraestructura]]"]
---

# Cloudflare R2 — Almacenamiento de Imágenes

## ¿Qué es R2?

Servicio de almacenamiento de objetos (archivos) de Cloudflare.
Compatible con el protocolo S3 de Amazon → usa las mismas librerías de Laravel que S3.
**Ventaja clave**: sin costos de egreso (salida de datos) — en S3 se paga por cada GB que se descarga; en R2 es gratis.

## Cuenta activada

- **Email**: selora1988@gmail.com
- **Account ID**: `2de40e37330f7ab64233df36c2f5ec0c`
- **Bucket**: `dropshipping-media` (pendiente de crear)
- **Activado**: 2026-08-08
- **Costo actual**: $0/mes

## Plan gratuito — Límites incluidos

| Recurso | Límite gratuito | Costo si se supera |
|---|---|---|
| Almacenamiento | **10 GB/mes** | $0.015/GB-mes |
| Operaciones Clase A (escritura/lista) | **1 millón/mes** | $4.50/millón |
| Operaciones Clase B (lectura) | **10 millones/mes** | $0.36/millón |
| Egreso (descarga de datos) | **Ilimitado** | $0 siempre |

> ⚠️ **Decisión de infraestructura**: Se usa R2 sobre S3 de Amazon precisamente por el egreso gratuito. Con imágenes de productos que se ven muchas veces al día, el egreso sería el mayor costo en S3.

## ¿Cuándo se superaría el límite gratuito?

- **10GB de imágenes**: ~5.000 imágenes WebP de 2MB promedio = 10GB. Para un catálogo inicial de 500-1.000 productos es más que suficiente.
- **1M operaciones de escritura**: 1 millón de uploads. Imposible de superar en la etapa inicial.
- **10M operaciones de lectura**: 10 millones de vistas de imágenes al mes. Solo se alcanza con tráfico alto.

**Conclusión**: El plan gratuito cubre el 100% de las necesidades hasta escalar a un catálogo grande con alto tráfico.

## Términos aceptados

- [Términos de servicio Cloudflare](https://www.cloudflare.com/terms)
- [Política de privacidad](https://www.cloudflare.com/privacypolicy/)
- La suscripción se puede cancelar en cualquier momento desde el panel de facturación
- La cancelación es efectiva al final del período de facturación actual
- Cloudflare cobra automáticamente el uso que exceda los límites gratuitos cada mes

## Uso en el proyecto

Las imágenes de productos se suben a R2 en formato WebP mediante:
- **Spatie Media Library** — gestiona uploads y conversiones
- **Intervention Image** — convierte JPG/PNG a WebP en el servidor
- **Flysystem S3** — conecta Laravel con R2 via protocolo S3

### Flujo completo

```
Admin sube imagen (JPG/PNG/WebP)
        ↓
Intervention Image convierte a WebP
Genera versión thumbnail (400x400)
Genera versión medium (800x800)
        ↓
Spatie Media Library sube a Cloudflare R2
        ↓
URL pública: https://[bucket].r2.dev/[ruta]/imagen.webp
        ↓
CDN de Cloudflare sirve la imagen desde el edge más cercano
```

## Credenciales R2 (guardar en .env — NUNCA en el código)

```env
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_BUCKET=dropshipping-media
CLOUDFLARE_R2_ENDPOINT=https://[account-id].r2.cloudflarestorage.com
CLOUDFLARE_R2_URL=https://[bucket].r2.dev
```

> 🔐 Las credenciales se generan en: Cloudflare Dashboard → R2 → Manage R2 API Tokens

---

*Relacionado: [[FASE 10 — Infraestructura]] · [[🏠 Inicio]]*
