<?php
/*
|--------------------------------------------------------------------------
| Migration: crear tabla configuraciones
|--------------------------------------------------------------------------
| ENTENDER: Necesitamos guardar pares clave→valor para configurar el sistema
|           desde el panel admin sin tocar código.
|
| PENSAR:   Una tabla simple clave-valor es suficiente. La clave es única
|           para que no haya duplicados. El valor siempre es texto (cast
|           al tipo necesario en el Model).
|
| ESCRIBIR: Campos: id, clave (unique), valor (text), descripcion, timestamps
*/

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('configuraciones', function (Blueprint $table) {
            $table->id();
            $table->string('clave')->unique();           // ej: 'disponibilidad_hora_apertura'
            $table->text('valor')->nullable();           // ej: '8'
            $table->string('descripcion')->nullable();   // texto de ayuda en el admin
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('configuraciones');
    }
};
