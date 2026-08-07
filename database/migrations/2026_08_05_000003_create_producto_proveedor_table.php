<?php

/*
|--------------------------------------------------------------------------
| MIGRACIÓN: Tabla pivot producto_proveedor
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué es una tabla pivot?
|
|   Una tabla pivot (o tabla intermedia) conecta dos tablas en una relación
|   muchos-a-muchos (many-to-many).
|
|   En nuestro caso:
|     - Un PRODUCTO puede venir de MUCHOS proveedores
|       (el mismo celular lo vende AliExpress Y un proveedor local)
|     - Un PROVEEDOR puede tener MUCHOS productos en su catálogo
|
|   Sin tabla pivot tendríamos que repetir datos:
|     productos: { proveedor_1: "AliExpress", precio_1: $40, proveedor_2: "Local"... }
|     → esto no escala, es muy difícil de mantener
|
|   Con tabla pivot:
|     productos:          { id, nombre, precio_venta }
|     proveedores:        { id, nombre_empresa }
|     producto_proveedor: { producto_id, proveedor_id, precio_proveedor, url }
|     → limpio, escalable, cada proveedor con su propio precio
|
| PENSAR — ¿Qué información va EN la tabla pivot?
|
|   No solo los IDs de los dos lados, sino también datos propios
|   de esa RELACIÓN específica:
|
|   - precio_proveedor → cada proveedor cobra distinto por el mismo producto
|   - tiempo_entrega_dias → AliExpress tarda 30 días, proveedor local 3 días
|   - url_producto → link directo al producto en la tienda del proveedor
|   - es_principal → indica cuál proveedor es el preferido para este producto
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
        Schema::create('producto_proveedor', function (Blueprint $table) {

            // ─── CLAVE PRIMARIA ───────────────────────────────────────────
            // Las tablas pivot también usan UUID en este proyecto
            // para consistencia y para poder referenciar una relación específica.
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            // ─── LOS DOS LADOS DE LA RELACIÓN ────────────────────────────

            // ID del producto
            // cascadeOnDelete() → si se borra el producto, se borran sus entradas
            //                     en esta tabla (tiene sentido: si el producto ya
            //                     no existe, tampoco tiene sentido saber quién lo provee)
            $table->foreignUuid('producto_id')
                  ->references('id')
                  ->on('productos')
                  ->cascadeOnDelete();

            // ID del proveedor
            $table->foreignUuid('proveedor_id')
                  ->references('id')
                  ->on('proveedores')
                  ->cascadeOnDelete();

            // ─── DATOS PROPIOS DE LA RELACIÓN ────────────────────────────

            // Precio que nos cobra ESTE proveedor por ESTE producto
            // (puede ser distinto al precio_costo del producto, que es el precio
            //  del proveedor principal)
            $table->decimal('precio_proveedor', 12, 2)->default(0);

            // Cuántos días tarda en despachar este proveedor
            // AliExpress estándar: 30 días
            // Proveedor Bogotá: 1-2 días
            // null = tiempo no definido aún
            $table->unsignedInteger('tiempo_entrega_dias')->nullable();

            // Link directo al producto en la plataforma del proveedor
            // Para hacer reorden rápido o verificar stock
            // Ejemplo: "https://es.aliexpress.com/item/123456789.html"
            $table->string('url_producto', 500)->nullable();

            // Código del producto en el sistema del proveedor (su SKU)
            // Útil para comunicarse con el proveedor y hacer seguimiento de pedidos
            $table->string('referencia_proveedor', 100)->nullable();

            // ¿Es este el proveedor principal para este producto?
            // Solo UNO puede ser principal por producto.
            // El proveedor principal es el que usamos por defecto al crear un pedido.
            $table->boolean('es_principal')->default(false);

            // Notas sobre este proveedor para este producto
            // Ejemplo: "Pedir mínimo 5 unidades", "Tiene stock hasta diciembre"
            $table->text('notas')->nullable();

            // ─── TIMESTAMPS EN ESPAÑOL ────────────────────────────────────
            $table->timestamp('creado_en')->nullable();
            $table->timestamp('actualizado_en')->nullable();

            // ─── RESTRICCIÓN UNIQUE ───────────────────────────────────────
            //
            // Un proveedor no puede aparecer DOS veces para el mismo producto.
            // unique(['producto_id', 'proveedor_id']) crea un índice compuesto
            // que garantiza que la combinación sea única.
            //
            // Sin esto: podrías tener:
            //   AliExpress - iPhone - $40
            //   AliExpress - iPhone - $35  ← duplicado, ¿cuál precio usar?
            //
            $table->unique(['producto_id', 'proveedor_id']);

            // ─── ÍNDICES ──────────────────────────────────────────────────
            $table->index('producto_id');   // para buscar proveedores de un producto
            $table->index('proveedor_id');  // para ver qué productos tiene un proveedor
            $table->index('es_principal');  // para obtener rápido el proveedor principal
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('producto_proveedor');
    }
};
