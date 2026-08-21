<?php

/*
|--------------------------------------------------------------------------
| MIGRACIÓN: add_metodo_pago_to_pedidos
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Para qué sirve metodo_pago?
|
|   Registra cómo el cliente eligió pagar al hacer el pedido:
|
|   'contra_entrega' = el cliente paga cuando recibe el producto.
|                      Solo disponible en el área metropolitana de Medellín.
|
|   'transferencia'  = el cliente hace una transferencia bancaria antes.
|                      Se le envía un link de WhatsApp para coordinar.
|
|   El admin verifica el pago por sus medios y luego cambia el
|   estado del pedido de 'pendiente' → 'confirmado' desde el panel.
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
            $table->enum('metodo_pago', ['contra_entrega', 'transferencia'])
                  ->default('contra_entrega')
                  ->after('estado');
        });
    }

    public function down(): void
    {
        Schema::table('pedidos', function (Blueprint $table) {
            $table->dropColumn('metodo_pago');
        });
    }
};
