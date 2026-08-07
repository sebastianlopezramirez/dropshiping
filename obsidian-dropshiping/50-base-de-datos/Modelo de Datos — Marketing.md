---
type: note
tags: [base-de-datos, marketing, publicidad]
created: 2026-07-27
updated: 2026-07-27
status: evergreen
related: ["[[Módulo — Marketing y Publicidad]]", "[[MOC — Base de Datos]]"]
---

# 🗄️ Modelo de Datos — Marketing

## Tablas
- `campanas_publicitarias` — Meta, Google, TikTok
- `conjuntos_anuncios` — grupos de anuncios dentro de campaña
- `anuncios` — creativos individuales
- `rendimiento_anuncios` — métricas diarias por anuncio
- `palabras_clave_anuncios` — keywords para Google Ads
- `feed_google_shopping` — datos para Google Merchant Center

## Jerarquía Meta/Google Ads
```
campana_publicitaria
  └── conjunto_anuncio (ad set)
        └── anuncio (ad)
              └── rendimiento_anuncio (por día)
```

## Métricas en `rendimiento_anuncios`
`impresiones`, `clics`, `ctr`, `costo`, `conversiones`, `valor_conversion`, `roas`, `alcance`, `frecuencia`
