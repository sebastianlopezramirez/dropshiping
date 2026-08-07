<?php

/*
|--------------------------------------------------------------------------
| MIGRACIÓN: Agregar columnas de marketing a la tabla pedidos
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Por qué modificar pedidos?
|
|   Un pedido es el momento donde el marketing se convierte en dinero real.
|   Necesitamos saber:
|
|   1. ¿Este pedido usó un cupón? → cupon_id + cupon_codigo + descuento_aplicado
|   2. ¿De qué campaña vino este cliente? → campana_id
|
|   Con esto podemos calcular:
|   - ROI de la campaña = (ventas generadas) / presupuesto × 100
|   - Usos por cupón = COUNT(pedidos WHERE cupon_id = ?)
|   - Descuentos otorgados = SUM(descuento_aplicado)
|
| PENSAR — ¿Por qué guardar cupon_codigo además de cupon_id?
|
|   Snapshot: si el cupón se borra en el futuro, el pedido debe recordar
|   qué código se usó. Igual que guardamos nombre_producto en items_pedido.
|
*/

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pedidos', function (Blueprint $table) {

            // FK al cupón usado (null si no usó cupón)
            // nullOnDelete: si se borra el cupón, el campo queda null
            // (el snapshot del código sigue en cupon_codigo)
            $table->foreignUuid('cupon_id')
                  ->nullable()
                  ->references('id')
                  ->on('cupones')
                  ->nullOnDelete()
                  ->after('estado');

            // Snapshot del código del cupón (para historial aunque se borre el cupón)
            $table->string('cupon_codigo', 50)->nullable()->after('cupon_id');

            // Monto en pesos que se descontó (calculado al crear el pedido)
            // Ej: cupón 20% sobre $200.000 → descuento_aplicado = 40000
            $table->decimal('descuento_aplicado', 12, 2)->default(0)->after('cupon_codigo');

            // FK a la campaña de marketing que originó este pedido (null si no viene de campaña)
            $table->foreignUuid('campana_id')
                  ->nullable()
                  ->references('id')
                  ->on('campanas')
                  ->nullOnDelete()
                  ->after('descuento_aplicado');

            // Índices para los reportes de marketing
            $table->index('cupon_id');
            $table->index('campana_id');
        });
    }

    public function down(): void
    {
        Schema::table('pedidos', function (Blueprint $table) {
            $table->dropForeign(['cupon_id']);
            $table->dropForeign(['campana_id']);
            $table->dropColumn(['cupon_id', 'cupon_codigo', 'descuento_aplicado', 'campana_id']);
        });
    }
};
