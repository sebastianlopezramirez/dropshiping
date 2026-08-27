<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pedidos', function (Blueprint $table) {
            // nullable: los pedidos viejos no tienen cliente registrado
            $table->uuid('cliente_id')->nullable()->after('id');

            $table->foreign('cliente_id')
                  ->references('id')
                  ->on('clientes')
                  ->nullOnDelete();
            // nullOnDelete: si se elimina un cliente, el pedido no desaparece
            // (se mantiene el historial de ventas aunque el cliente se elimine)

            $table->index('cliente_id');
        });
    }

    public function down(): void
    {
        Schema::table('pedidos', function (Blueprint $table) {
            $table->dropForeign(['cliente_id']);
            $table->dropColumn('cliente_id');
        });
    }
};
