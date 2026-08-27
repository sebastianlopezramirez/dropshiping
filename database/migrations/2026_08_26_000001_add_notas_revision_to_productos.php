<?php

/*
|--------------------------------------------------------------------------
| MIGRACIÓN: agregar notas_revision a productos
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Para qué sirve este campo?
|
|   Cuando un proveedor edita su producto (precio, nombre, etc.) el
|   producto baja a 'inactivo' para que el admin lo revise.
|
|   notas_revision guarda un resumen legible de qué cambió exactamente,
|   para que el admin sepa qué revisar antes de aprobar.
|
|   Se limpia automáticamente cuando el admin guarda el producto.
|
*/

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('productos', function (Blueprint $table) {
            $table->text('notas_revision')->nullable()->after('estado');
        });
    }

    public function down(): void
    {
        Schema::table('productos', function (Blueprint $table) {
            $table->dropColumn('notas_revision');
        });
    }
};
