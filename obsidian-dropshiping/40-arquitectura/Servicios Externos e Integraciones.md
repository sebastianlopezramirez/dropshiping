---
type: note
tags: [arquitectura, integraciones, apis]
created: 2026-07-27
updated: 2026-07-27
status: evergreen
---

# 🔌 Servicios Externos e Integraciones

| Servicio | Proveedor | Propósito |
|---|---|---|
| Pagos | Wompi | PSE, tarjetas, Nequi — Colombia |
| Imágenes | Cloudflare R2 + Optimización | Storage y CDN |
| IA | GPT-4 (OpenAI) | Descripciones automáticas, soporte |
| Email transaccional | Mailgun o SendGrid | Emails de pedidos, notificaciones |
| SMS | Twilio | Notificaciones de pedidos |
| Tracking | 17Track API o AfterShip | Seguimiento de envíos |
| Proveedores | AliExpress / Dropified / Printful | Sincronización de productos |
| Anuncios | Meta Ads API | Campañas Facebook/Instagram |
| Anuncios | Google Ads API | Campañas + Shopping |
| Analítica | Google Analytics 4 | Tráfico y conversiones |
| Píxel | Meta Pixel / CAPI | Atribución de conversiones |

## Pendiente de configurar
- [ ] Credenciales Wompi (producción y sandbox)
- [ ] API Key OpenAI
- [ ] Twilio Account SID + Auth Token
- [ ] Meta App ID + Secret
- [ ] Google Ads Developer Token
