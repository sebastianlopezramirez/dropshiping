<?php

/*
|--------------------------------------------------------------------------
| MIGRACIÓN: create_tarifas_domicilio_table
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Para qué sirve esta tabla?
|
|   Guarda el precio de domicilio por cada municipio/ciudad.
|   El admin puede actualizar estos precios desde el panel cuando cambien.
|
|   Tipos:
|     'area_metro'  = municipios del área metropolitana de Medellín
|     'ciudad'      = ciudades principales del resto del país
|
*/

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tarifas_domicilio', function (Blueprint $table) {
            $table->id();

            // Nombre del municipio o ciudad
            $table->string('nombre', 100)->unique();

            // Tipo de localidad
            $table->enum('tipo', ['area_metro', 'ciudad'])->default('ciudad');

            // Precio del domicilio en COP
            $table->integer('precio')->default(0);

            // Si está activo aparece en el selector del checkout
            $table->boolean('activo')->default(true);

            // Orden de aparición en el selector
            $table->integer('orden')->default(0);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tarifas_domicilio');
    }
};
