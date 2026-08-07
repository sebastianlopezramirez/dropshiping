<?php

/*
|--------------------------------------------------------------------------
| MIGRACIÓN: Tablas de infraestructura — caché y candados
|--------------------------------------------------------------------------
|
| IMPORTANTE: Estas tablas se llaman 'cache' y 'cache_locks' en inglés.
| Las dejamos así intencionalmente porque Laravel las referencia
| internamente por estos nombres. Cambiarlas rompería el sistema.
|
| REGLA DEL PROYECTO:
|   - Tablas de NEGOCIO → español (usuarios, pedidos, productos)
|   - Tablas de INFRAESTRUCTURA → inglés original (cache, jobs, sessions*)
|   (*) 'sessions' la renombramos a 'sesiones' porque la controlamos nosotros
|
*/

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Caché principal: guarda pares clave-valor con tiempo de expiración
        // Ejemplo: cache()->put('productos_destacados', $productos, 3600)
        Schema::create('cache', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->mediumText('value');
            $table->bigInteger('expiration')->index();
        });

        Schema::create('cache_locks', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->string('owner');
            $table->bigInteger('expiration')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cache');
        Schema::dropIfExists('cache_locks');
    }
};
