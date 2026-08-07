<?php

/*
|--------------------------------------------------------------------------
| MIGRACIÓN: Agregar columnas faltantes a producto_proveedor
|--------------------------------------------------------------------------
|
| PROBLEMA: La migración original creó columnas con nombres distintos
| a los que usa el modelo Proveedor en withPivot().
|
| Migración original creó:
|   - precio_proveedor
|   - referencia_proveedor
|   - es_principal
|   - tiempo_entrega_dias
|
| El modelo Proveedor::productos() usa withPivot():
|   - precio          ← NO EXISTE → agregar
|   - stock           ← NO EXISTE → agregar
|   - sku_proveedor   ← NO EXISTE → agregar
|   - pedido_minimo   ← NO EXISTE → agregar
|   - tiempo_entrega  ← NO EXISTE → agregar
|   - costo_envio     ← NO EXISTE → agregar
|   - es_predeterminado ← NO EXISTE → agregar
|
| SOLUCIÓN: Agregar las columnas que faltan. Las originales se dejan
| para no romper nada que ya pudiera estar usando la tabla.
|
*/

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('producto_proveedor', function (Blueprint $table) {

            // Precio del proveedor (alias de precio_proveedor, más corto)
            $table->decimal('precio', 12, 2)->default(0)->after('proveedor_id');

            // Stock disponible del proveedor para este producto
            $table->integer('stock')->default(0)->after('precio');

            // SKU del proveedor (su código interno para este producto)
            $table->string('sku_proveedor', 100)->nullable()->after('stock');

            // Pedido mínimo que exige el proveedor
            $table->integer('pedido_minimo')->default(1)->after('sku_proveedor');

            // Días de entrega (nombre corto, el modelo usa 'tiempo_entrega')
            $table->integer('tiempo_entrega')->nullable()->after('pedido_minimo');

            // Costo de envío que cobra el proveedor
            $table->decimal('costo_envio', 10, 2)->nullable()->after('tiempo_entrega');

            // ¿Es el proveedor predeterminado para este producto?
            // (el modelo usa 'es_predeterminado', la migración original tenía 'es_principal')
            $table->boolean('es_predeterminado')->default(false)->after('costo_envio');

            // ¿Está activo este vínculo?
            $table->boolean('activo')->default(true)->after('es_predeterminado');
        });
    }

    public function down(): void
    {
        Schema::table('producto_proveedor', function (Blueprint $table) {
            $table->dropColumn([
                'precio',
                'stock',
                'sku_proveedor',
                'pedido_minimo',
                'tiempo_entrega',
                'costo_envio',
                'es_predeterminado',
                'activo',
            ]);
        });
    }
};
