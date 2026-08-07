<?php

/*
|--------------------------------------------------------------------------
| MIGRACIÓN: Tabla de categorías
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Para qué sirve esta tabla?
|
|   Las categorías organizan el catálogo de productos en un árbol jerárquico.
|
|   Ejemplo de árbol:
|     Ropa (raíz — sin padre)
|     └── Camisas (hija de Ropa)
|         └── Camisas para hombre (hija de Camisas)
|     └── Pantalones (hija de Ropa)
|     Electrónica (raíz — sin padre)
|     └── Celulares
|
| PENSAR — ¿Cómo modelamos un árbol en una sola tabla?
|
|   Patrón "Adjacency List" (Lista de Adyacencia):
|   Cada categoría tiene una columna 'padre_id' que apunta a su categoría padre.
|   Si 'padre_id' es NULL, es una categoría raíz (nivel 1).
|
|   tabla categorias:
|   | id  | nombre      | padre_id |
|   |-----|-------------|----------|
|   | 1   | Ropa        | NULL     | ← raíz
|   | 2   | Camisas     | 1        | ← hija de Ropa
|   | 3   | Pantalones  | 1        | ← hija de Ropa
|   | 4   | Camisas H.  | 2        | ← hija de Camisas
|
|   Esta técnica se llama "auto-referencial" porque la tabla tiene
|   una foreign key que apunta a sí misma.
|
*/

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        /*
        |----------------------------------------------------------------------
        | PASO 1: Crear la tabla SIN la foreign key auto-referencial
        |----------------------------------------------------------------------
        |
        | LECCIÓN APRENDIDA:
        |   PostgreSQL no puede agregar una FK que apunta a la misma tabla
        |   (auto-referencial) mientras la tabla se está creando.
        |   Error: "no hay restricción unique que coincida..."
        |
        |   SOLUCIÓN: Separar en dos pasos:
        |     1. Schema::create  → crea la tabla con la columna padre_id (sin FK)
        |     2. Schema::table   → agrega la FK después de que la tabla existe
        |
        */
        Schema::create('categorias', function (Blueprint $table) {

            // ─── CLAVE PRIMARIA ───────────────────────────────────────────
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            // ─── DATOS PRINCIPALES ────────────────────────────────────────

            // Nombre visible de la categoría
            $table->string('nombre', 100);

            // Slug: versión URL-amigable del nombre
            // Ejemplo: "camisas-para-hombre" → URL: /categoria/camisas-para-hombre
            $table->string('slug', 120)->unique();

            // Descripción corta de la categoría (opcional)
            $table->text('descripcion')->nullable();

            // URL de la imagen representativa de la categoría
            $table->string('imagen_url', 500)->nullable();

            // ─── COLUMNA padre_id (sin FK por ahora) ─────────────────────
            //
            // Guardamos el UUID del padre aquí.
            // La restricción de FK se agrega en el PASO 2 (abajo).
            // nullable() → las categorías raíz no tienen padre (padre_id = NULL)
            //
            $table->uuid('padre_id')->nullable();

            // ─── ORDENAMIENTO ─────────────────────────────────────────────
            $table->unsignedInteger('orden')->default(0);

            // ─── ESTADO ───────────────────────────────────────────────────
            $table->boolean('activo')->default(true);

            // ─── TIMESTAMPS EN ESPAÑOL ────────────────────────────────────
            $table->timestamp('creado_en')->nullable();
            $table->timestamp('actualizado_en')->nullable();

            // ─── ÍNDICES ──────────────────────────────────────────────────
            $table->index('padre_id');
            $table->index('activo');
            $table->index('orden');
        });

        /*
        |----------------------------------------------------------------------
        | PASO 2: Agregar la FK auto-referencial DESPUÉS de crear la tabla
        |----------------------------------------------------------------------
        |
        | Ahora que la tabla 'categorias' existe y su PRIMARY KEY está creada,
        | PostgreSQL puede establecer la FK que apunta a sí misma.
        |
        | Schema::table() → modifica una tabla existente (ALTER TABLE)
        | Schema::create() → crea una tabla nueva (CREATE TABLE)
        |
        */
        Schema::table('categorias', function (Blueprint $table) {
            $table->foreign('padre_id')
                  ->references('id')
                  ->on('categorias')
                  ->nullOnDelete(); // si se borra el padre, hijos quedan como raíz
        });
    }

    public function down(): void
    {
        // Primero eliminamos la FK para poder borrar la tabla
        Schema::table('categorias', function (Blueprint $table) {
            $table->dropForeign(['padre_id']);
        });

        Schema::dropIfExists('categorias');
    }
};
