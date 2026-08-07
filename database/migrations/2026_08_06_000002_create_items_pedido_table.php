<?php

/*
|--------------------------------------------------------------------------
| MIGRACIÓN: create_items_pedido_table
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué es un "item" del pedido?
|
|   Es una línea del pedido. Si el cliente compra:
|     - 2 baterías a $150.000 c/u
|     - 1 cargador a $50.000
|
|   Se crean 2 registros en esta tabla:
|     item 1: producto=bateria,  cantidad=2, precio_unitario=150000, subtotal=300000
|     item 2: producto=cargador, cantidad=1, precio_unitario=50000,  subtotal=50000
|
| PENSAR — ¿Por qué guardar nombre_producto y precio_unitario si ya están en 'productos'?
|
|   SNAPSHOT PATTERN — Congela los valores al momento de la venta.
|
|   Ejemplo sin snapshot (MAL):
|     - Pedido del 1 enero: "iPhone 15" a $4.500.000
|     - El 15 enero cambias el precio a $5.000.000
|     - El reporte del pedido de enero ahora muestra $5.000.000 ← INCORRECTO
|
|   Con snapshot (BIEN):
|     - El item guarda nombre_producto="iPhone 15" y precio_unitario=4500000
|     - Aunque el producto cambie, el item histórico queda intacto ✓
|
|   También guardamos precio_costo para calcular la ganancia real de cada venta.
|
*/

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('items_pedido', function (Blueprint $table) {

            // ─── IDENTIFICACIÓN ───────────────────────────────────────────
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            // ─── RELACIÓN CON PEDIDO ──────────────────────────────────────
            $table->uuid('pedido_id');
            $table->foreign('pedido_id')
                  ->references('id')
                  ->on('pedidos')
                  ->cascadeOnDelete(); // Si se elimina el pedido, se eliminan sus items

            // ─── RELACIÓN CON PRODUCTO ────────────────────────────────────
            // nullable porque si el producto se elimina (soft delete real),
            // el item sigue existiendo con el snapshot de datos
            $table->uuid('producto_id')->nullable();
            $table->foreign('producto_id')
                  ->references('id')
                  ->on('productos')
                  ->nullOnDelete();

            // ─── SNAPSHOT DEL PRODUCTO ────────────────────────────────────
            // Estos datos se copian del producto al crear el pedido.
            // No cambiarán aunque el producto se edite después.
            $table->string('nombre_producto', 200); // snapshot de productos.nombre
            $table->string('sku', 50)->nullable();  // snapshot de productos.sku
            // URL de la primera imagen al momento del pedido
            $table->string('imagen_url', 500)->nullable();

            // ─── CANTIDADES Y PRECIOS ─────────────────────────────────────
            $table->integer('cantidad')->default(1);
            // Precio al que se vendió (puede diferir del precio actual del producto)
            $table->decimal('precio_unitario', 12, 2);
            // Precio de costo al momento del pedido (para calcular ganancia)
            $table->decimal('precio_costo', 12, 2)->default(0);
            // Descuento aplicado a este ítem (cupón por producto, negociación)
            $table->decimal('descuento', 12, 2)->default(0);
            // subtotal = (precio_unitario × cantidad) - descuento
            $table->decimal('subtotal', 12, 2);

            // ─── TIMESTAMPS EN ESPAÑOL ────────────────────────────────────
            $table->timestamp('creado_en')->nullable();
            $table->timestamp('actualizado_en')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('items_pedido');
    }
};
