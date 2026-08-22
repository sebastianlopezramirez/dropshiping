---
tags: [categorias, catalogo, productos, estructura]
tipo: documentacion
estado: activo
ultima_actualizacion: 2026-08-21
relacionado: "[[👥 Roles y Accesos — GadGet Store]]"
---

# 🗂️ Categorías — GadGet Store

> Estructura del catálogo de productos: 10 categorías padre y 57 subcategorías.
> Gestionadas en `/categorias` (solo super_administrador y administrador).
> Las categorías se crean con `CategoriasSeeder.php` — correr en Railway con:
> ```bash
> php artisan db:seed --class=CategoriasSeeder --force
> ```

---

## 📊 Resumen

| Total categorías padre | Total subcategorías | Total en BD |
|:---:|:---:|:---:|
| 10 | 57 | 67 |

---

## 🗺️ Árbol completo de categorías

### 1. 📱 Tecnología — 9 subcategorías

| Subcategoría | Slug |
|---|---|
| Smartphones y Celulares | `smartphones-y-celulares` |
| Laptops y Computadores | `laptops-y-computadores` |
| Tablets | `tablets` |
| Accesorios para Celulares | `accesorios-para-celulares` |
| Accesorios para PC | `accesorios-para-pc` |
| Cámaras y Fotografía | `camaras-y-fotografia` |
| Smartwatches y Wearables | `smartwatches-y-wearables` |
| Audio (Audífonos y Parlantes) | `audio-audifonos-y-parlantes` |
| Gaming y Consolas | `gaming-y-consolas` |

---

### 2. 🏠 Hogar — 7 subcategorías

| Subcategoría | Slug |
|---|---|
| Decoración y Arte | `decoracion-y-arte` |
| Iluminación | `iluminacion` |
| Almacenamiento y Organización | `almacenamiento-y-organizacion` |
| Textiles del Hogar | `textiles-del-hogar` |
| Cocina y Mesa | `cocina-y-mesa` |
| Baño | `bano` |
| Herramientas y Bricolaje | `herramientas-y-bricolaje` |

---

### 3. ⚡ Electrodomésticos — 5 subcategorías

| Subcategoría | Slug |
|---|---|
| Pequeños Electrodomésticos | `pequenos-electrodomesticos` |
| Climatización | `climatizacion` |
| Línea Blanca | `linea-blanca` |
| Cuidado Personal Eléctrico | `cuidado-personal-electrico` |
| TV y Video | `tv-y-video` |

---

### 4. 👗 Moda — 6 subcategorías

| Subcategoría | Slug |
|---|---|
| Ropa Hombre | `ropa-hombre` |
| Ropa Mujer | `ropa-mujer` |
| Ropa Niños y Bebés | `ropa-ninos-y-bebes` |
| Calzado | `calzado` |
| Accesorios (Bolsos y Billeteras) | `accesorios-bolsos-y-billeteras` |
| Joyería y Bisutería | `joyeria-y-bisuteria` |

---

### 5. 💄 Belleza y Cuidado Personal — 6 subcategorías

| Subcategoría | Slug |
|---|---|
| Skincare y Cuidado Facial | `skincare-y-cuidado-facial` |
| Maquillaje | `maquillaje` |
| Cabello | `cabello` |
| Fragancias y Perfumes | `fragancias-y-perfumes` |
| Afeitado y Cuidado Masculino | `afeitado-y-cuidado-masculino` |
| Salud y Bienestar | `salud-y-bienestar` |

---

### 6. 🏋️ Deportes y Fitness — 6 subcategorías

| Subcategoría | Slug |
|---|---|
| Ropa Deportiva | `ropa-deportiva` |
| Equipos de Gimnasio | `equipos-de-gimnasio` |
| Deportes de Aventura y Aire Libre | `deportes-de-aventura-y-aire-libre` |
| Ciclismo | `ciclismo` |
| Natación y Acuáticos | `natacion-y-acuaticos` |
| Nutrición Deportiva | `nutricion-deportiva` |

---

### 7. 🧸 Juguetes y Bebés — 5 subcategorías

| Subcategoría | Slug |
|---|---|
| Juguetes para Bebés (0–3 años) | `juguetes-para-bebes` |
| Juegos y Juguetes Didácticos | `juegos-y-juguetes-didacticos` |
| Juguetes Electrónicos y RC | `juguetes-electronicos-y-rc` |
| Ropa y Accesorios Bebé | `ropa-y-accesorios-bebe` |
| Carriolas y Seguridad | `carriolas-y-seguridad` |

---

### 8. 🐾 Mascotas — 5 subcategorías

| Subcategoría | Slug |
|---|---|
| Comida y Snacks | `comida-y-snacks` |
| Accesorios y Juguetes | `accesorios-y-juguetes-mascotas` |
| Higiene y Salud | `higiene-y-salud-mascotas` |
| Camas y Descanso | `camas-y-descanso` |
| Transporte y Viajes | `transporte-y-viajes-mascotas` |

---

### 9. 📚 Libros y Entretenimiento — 4 subcategorías

| Subcategoría | Slug |
|---|---|
| Libros y Literatura | `libros-y-literatura` |
| Música e Instrumentos | `musica-e-instrumentos` |
| Películas y Series | `peliculas-y-series` |
| Papelería y Arte | `papeleria-y-arte` |

---

### 10. 🚗 Autos y Motos — 5 subcategorías

| Subcategoría | Slug |
|---|---|
| Accesorios de Exterior | `accesorios-de-exterior` |
| Electrónica Vehicular | `electronica-vehicular` |
| Cuidado y Limpieza del Auto | `cuidado-y-limpieza-del-auto` |
| Repuestos y Herramientas | `repuestos-y-herramientas` |
| Motocicletas y Scooters | `motocicletas-y-scooters` |

---

## 🧭 Cómo funciona en la tienda

```
Usuario ve la tienda → sidebar muestra categorías padre
        ↓
Hace clic en "Tecnología"
        ↓
Se expanden las 9 subcategorías debajo (acordeón)
        ↓
Usuario hace clic en "Gaming y Consolas"
        ↓
La tienda filtra productos con categoria.slug = 'gaming-y-consolas'
```

### En formularios de producto (admin y portal):
```
Selector 1: Categoría padre  →  [Tecnología ▼]
        ↓  (cuando seleccionas padre)
Selector 2: Subcategoría     →  [Gaming y Consolas ▼]
```

---

## 🔧 Cómo agregar o editar categorías

```bash
# Desde la interfaz web
/categorias → botón "Nueva categoría"
# Elegir si es categoría padre (dejar "Categoría padre" en blanco)
# o subcategoría (seleccionar el padre)

# Desde el seeder (Railway)
# 1. Editar: database/seeders/CategoriasSeeder.php
# 2. Correr:
php artisan db:seed --class=CategoriasSeeder --force
```

### Reglas de negocio:
- Una categoría puede ser **padre** (sin `padre_id`) o **subcategoría** (`padre_id` apunta al padre)
- Solo se permite **un nivel de profundidad**: padre → hijo (no hay nietos)
- El `slug` debe ser único en toda la tabla
- Al crear un producto, se selecciona **primero el padre, luego la subcategoría**
- Los productos se asocian siempre a la **subcategoría** (más específica)

---

## 📋 Historial de cambios

| Fecha | Cambio | Quién |
|---|---|---|
| 2026-08-21 | Estructura inicial Option C: 10 padres + 57 subcategorías | Sebastian / Claude |

---

*Notas relacionadas: [[👥 Roles y Accesos — GadGet Store]] · [[🔐 Credenciales — Master]]*
