<?php

/*
|--------------------------------------------------------------------------
| MIGRACIÓN: Tabla de productos
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué guarda esta tabla?
|
|   El catálogo de productos que vendemos. Cada fila es un producto con
|   su precio, descripción, imágenes y stock disponible.
|
| PENSAR — Decisiones de diseño importantes:
|
|   1. PRECIO COSTO vs PRECIO VENTA
|      precio_costo → lo que le pagamos al proveedor
|      precio_venta → lo que le cobramos al cliente
|      La diferencia es nuestra ganancia (margen).
|      Ejemplo: compramos a $50.000 COP, vendemos a $89.900 COP → ganamos $39.900
|
|   2. IMÁGENES como JSONB
|      En lugar de tener una tabla separada 'producto_imagenes',
|      guardamos las URLs en un array JSON.
|      Por qué: las imágenes son simples URLs, no necesitan relaciones complejas.
|      Estructura: ["https://r2.../img1.jpg", "https://r2.../img2.jpg"]
|
|   3. ATRIBUTOS como JSONB
|      Para características variables según el tipo de producto.
|      Ropa: {"talla": ["S","M","L","XL"], "color": ["rojo","azul"]}
|      Celular: {"almacenamiento": "128GB", "ram": "8GB"}
|      JSONB permite guardar cualquier estructura sin cambiar la tabla.
|
|   4. SOFT DELETE
|      No borramos productos — los marcamos como eliminados.
|      ¿Por qué? Los pedidos históricos siguen referenciando el producto.
|      Si lo borramos de verdad, los pedidos quedan "huérfanos".
|
*/

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('productos', function (Blueprint $table) {

            // ─── CLAVE PRIMARIA ───────────────────────────────────────────
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            // ─── IDENTIFICACIÓN ───────────────────────────────────────────

            // Nombre del producto visible en la tienda
            $table->string('nombre', 200);

            // Slug para URLs amigables
            // /producto/iphone-15-pro-max-256gb (en lugar de /producto/UUID)
            $table->string('slug', 220)->unique();

            // SKU (Stock Keeping Unit) — código interno único del producto
            // Sirve para identificar el producto en bodegas, facturas e importaciones
            // nullable porque no todos los proveedores lo proveen desde el inicio
            $table->string('sku', 50)->unique()->nullable();

            // ─── DESCRIPCIÓN ──────────────────────────────────────────────

            // Descripción corta (para tarjetas de producto en listados)
            $table->string('descripcion_corta', 300)->nullable();

            // Descripción completa en HTML (para la página de detalle del producto)
            // Usa longText porque puede ser muy larga (incluye imágenes embebidas, tablas, etc.)
            $table->longText('descripcion')->nullable();

            // ─── PRECIOS ──────────────────────────────────────────────────
            //
            // decimal(12, 2) significa:
            //   12 = máximo 12 dígitos en total
            //    2 = máximo 2 decimales
            // Ejemplo: 9999999999.99 (casi 10 billones)
            // Para pesos colombianos (COP) es más que suficiente.
            //

            // Lo que pagamos al proveedor (costo)
            $table->decimal('precio_costo', 12, 2)->default(0);

            // Lo que cobramos al cliente (precio de venta)
            $table->decimal('precio_venta', 12, 2)->default(0);

            // Precio con descuento (null = sin descuento activo)
            // Si precio_oferta tiene valor, se muestra tachado el precio_venta
            $table->decimal('precio_oferta', 12, 2)->nullable();

            // ─── INVENTARIO ───────────────────────────────────────────────

            // Stock disponible para venta
            // 0 = agotado, null = stock ilimitado (productos digitales o bajo pedido)
            $table->unsignedInteger('stock')->default(0)->nullable();

            // Stock mínimo antes de alertar que hay que reabastecer
            $table->unsignedInteger('stock_minimo')->default(5);

            // ─── IMÁGENES (JSONB) ─────────────────────────────────────────
            //
            // Array de URLs de imágenes del producto:
            // ["https://r2.cloudflare.../prod1-a.jpg", "https://r2.../prod1-b.jpg"]
            //
            // La primera URL es la imagen principal.
            // El resto son imágenes adicionales (galería).
            //
            $table->jsonb('imagenes')->nullable();

            // ─── ATRIBUTOS VARIABLES (JSONB) ──────────────────────────────
            //
            // Características específicas del producto que varían por categoría.
            //
            // Para ropa:
            //   {"tallas": ["S","M","L","XL"], "colores": ["negro","blanco"]}
            //
            // Para electrónica:
            //   {"marca": "Samsung", "modelo": "A55", "almacenamiento": "128GB"}
            //
            // Para alimentos:
            //   {"peso": "500g", "ingredientes": "...", "fecha_vencimiento": "2025-12"}
            //
            $table->jsonb('atributos')->nullable();

            // ─── DIMENSIONES Y PESO ───────────────────────────────────────
            // Para calcular el costo de envío con las transportadoras.
            // En Colombia: Servientrega, Coordinadora, etc. cobran por peso/volumen.
            $table->decimal('peso_kg', 8, 3)->nullable();    // peso en kilogramos
            $table->decimal('largo_cm', 8, 2)->nullable();   // largo del empaque
            $table->decimal('ancho_cm', 8, 2)->nullable();   // ancho del empaque
            $table->decimal('alto_cm', 8, 2)->nullable();    // alto del empaque

            // ─── RELACIÓN CON CATEGORÍA ───────────────────────────────────
            //
            // Cada producto pertenece a UNA categoría (la más específica).
            // Ejemplo: el iPhone va en "Celulares" no en "Electrónica".
            //
            // nullable() → un producto puede existir sin categoría asignada aún
            // nullOnDelete() → si se borra la categoría, el producto queda sin categoría
            //                  (en vez de borrarse)
            //
            $table->foreignUuid('categoria_id')
                  ->nullable()
                  ->references('id')
                  ->on('categorias')
                  ->nullOnDelete();

            // ─── ESTADO ───────────────────────────────────────────────────
            //
            // activo    → visible en la tienda y disponible para vender
            // borrador  → en edición, no visible aún en la tienda
            // agotado   → sin stock, visible pero no se puede comprar
            // inactivo  → retirado del catálogo
            //
            $table->string('estado', 20)->default('borrador');

            // ─── SEO ──────────────────────────────────────────────────────
            // Meta tags para posicionamiento en Google
            $table->string('meta_titulo', 60)->nullable();
            $table->string('meta_descripcion', 160)->nullable();

            // ─── TIMESTAMPS EN ESPAÑOL ────────────────────────────────────
            $table->timestamp('creado_en')->nullable();
            $table->timestamp('actualizado_en')->nullable();

            // ─── SOFT DELETE ──────────────────────────────────────────────
            // Cuando se "borra" un producto, solo se llena esta columna.
            // Los queries normales excluyen registros donde eliminado_en != null.
            $table->softDeletes('eliminado_en');

            // ─── ÍNDICES ──────────────────────────────────────────────────
            $table->index('categoria_id');  // para listar productos por categoría
            $table->index('estado');        // para filtrar activos/borradores
            $table->index('precio_venta');  // para ordenar por precio
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('productos');
    }
};
