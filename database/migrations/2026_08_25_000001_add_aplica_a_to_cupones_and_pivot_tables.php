<?php

/*
|--------------------------------------------------------------------------
| MIGRACIÓN: Restricciones de cupones por categoría o producto
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué agrega esta migración?
|
|   1. Columna `aplica_a` en cupones:
|      - 'todo'       → el cupón aplica a cualquier producto del carrito
|      - 'categorias' → solo a productos de ciertas categorías
|      - 'productos'  → solo a ciertos productos específicos
|
|   2. Tabla pivot `cupon_categoria`:
|      - Relaciona un cupón con las categorías permitidas
|
|   3. Tabla pivot `cupon_producto`:
|      - Relaciona un cupón con los productos permitidos
|
| PENSAR — ¿Por qué tablas pivot y no un campo JSON?
|
|   Las tablas pivot permiten consultas eficientes:
|     - "¿Este producto está en los permitidos del cupón?"
|     - "¿Qué cupones aplican a la categoría X?"
|   Con JSON habría que deserializar en cada validación.
|
*/

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── 1. Agregar aplica_a a cupones ─────────────────────────────────
        Schema::table('cupones', function (Blueprint $table) {
            $table->enum('aplica_a', ['todo', 'categorias', 'productos'])
                  ->default('todo')
                  ->after('activo')
                  ->comment('todo=todos | categorias=por categoría | productos=productos específicos');
        });

        // ── 2. Tabla pivot cupon_categoria ────────────────────────────────
        Schema::create('cupon_categoria', function (Blueprint $table) {
            // Sin UUID — tabla pivot simple con PK compuesta
            $table->uuid('cupon_id');
            $table->uuid('categoria_id');

            $table->primary(['cupon_id', 'categoria_id']);

            // FK a cupones
            $table->foreign('cupon_id')
                  ->references('id')
                  ->on('cupones')
                  ->onDelete('cascade');

            // FK a categorias
            $table->foreign('categoria_id')
                  ->references('id')
                  ->on('categorias')
                  ->onDelete('cascade');
        });

        // ── 3. Tabla pivot cupon_producto ─────────────────────────────────
        Schema::create('cupon_producto', function (Blueprint $table) {
            $table->uuid('cupon_id');
            $table->uuid('producto_id');

            $table->primary(['cupon_id', 'producto_id']);

            $table->foreign('cupon_id')
                  ->references('id')
                  ->on('cupones')
                  ->onDelete('cascade');

            $table->foreign('producto_id')
                  ->references('id')
                  ->on('productos')
                  ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cupon_producto');
        Schema::dropIfExists('cupon_categoria');

        Schema::table('cupones', function (Blueprint $table) {
            $table->dropColumn('aplica_a');
        });
    }
};
