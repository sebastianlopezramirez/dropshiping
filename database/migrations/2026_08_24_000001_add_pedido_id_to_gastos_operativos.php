<?php

/*
|--------------------------------------------------------------------------
| MIGRACIÓN: add_pedido_id_to_gastos_operativos
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Para qué vinculamos un gasto a un pedido?
|
|   Algunos gastos están directamente asociados a un pedido específico:
|   - Pago al domiciliario por ese envío
|   - Empaque especial para ese pedido
|   - Costo de devolución de ese pedido
|
|   Con pedido_id podemos ver en el pedido cuánto costó realmente
|   y calcular ganancia real por pedido (no solo por categoría).
|
| PENSAR — ¿Por qué nullable?
|
|   La mayoría de gastos son generales (publicidad, hosting, etc.).
|   Solo los gastos específicos llevan pedido_id.
|   Si viene null = gasto general del negocio.
|
*/

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('gastos_operativos', function (Blueprint $table) {
            $table->foreignUuid('pedido_id')
                  ->nullable()
                  ->after('usuario_id')
                  ->constrained('pedidos')
                  ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('gastos_operativos', function (Blueprint $table) {
            $table->dropForeign(['pedido_id']);
            $table->dropColumn('pedido_id');
        });
    }
};
