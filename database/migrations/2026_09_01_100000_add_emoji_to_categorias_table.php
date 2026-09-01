<?php

/*
|--------------------------------------------------------------------------
| MIGRACIÓN: Agregar campo emoji a la tabla categorias
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Para qué sirve el emoji?
|
|   El emoji es un ícono visual que identifica la categoría de un vistazo.
|   Ejemplo: ⌚ Relojería, 👗 Moda, 📱 Tecnología
|   Se muestra en menús, selectores y la tienda pública.
|
| PENSAR — ¿Por qué una migración nueva y no editar la original?
|
|   La tabla ya existe en producción. Editar la migración original
|   no tiene efecto en una BD que ya corrió esa migración.
|   La solución correcta es una migración adicional (alter table).
|
*/

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('categorias', function (Blueprint $table) {
            // Columna nullable: no todas las categorías necesitan emoji
            $table->string('emoji', 10)->nullable()->after('nombre');
        });
    }

    public function down(): void
    {
        Schema::table('categorias', function (Blueprint $table) {
            $table->dropColumn('emoji');
        });
    }
};
