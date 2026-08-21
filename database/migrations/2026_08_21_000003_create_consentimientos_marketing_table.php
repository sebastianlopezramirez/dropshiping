<?php

/*
|--------------------------------------------------------------------------
| MIGRACIÓN: create_consentimientos_marketing_table
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Para qué sirve esta tabla?
|
|   Guarda los datos de clientes que aceptaron el tratamiento de datos
|   personales durante el proceso de compra (Ley 1581 de 2012 Colombia).
|
|   Solo se registra si el cliente marcó el checkbox de consentimiento.
|   Si no acepta, el pedido sigue normalmente pero NO se guarda aquí.
|
|   Campos para marketing:
|     - nombre, cedula, celular, municipio, categoria_interes
|
*/

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('consentimientos_marketing', function (Blueprint $table) {
            $table->id();

            // Datos personales del cliente
            $table->string('nombre', 150);
            $table->string('cedula', 20)->nullable();
            $table->string('celular', 20);
            $table->string('municipio', 100);
            $table->string('categoria_interes', 100)->nullable();

            // Referencia al pedido (para trazabilidad)
            $table->string('numero_pedido', 30)->nullable();

            // Registro del momento del consentimiento
            $table->timestamp('consentimiento_en')->useCurrent();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('consentimientos_marketing');
    }
};
