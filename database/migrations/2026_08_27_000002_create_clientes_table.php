<?php

/*
|--------------------------------------------------------------------------
| MIGRACIÓN: Tabla clientes
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Por qué tabla separada y no usar 'usuarios'?
|
|   Los usuarios son admins/vendedores/proveedores — tienen roles Spatie,
|   acceso al panel, contraseñas fuertes.
|
|   Los clientes son compradores de la tienda — solo necesitan:
|     - Identificarse para ver sus pedidos
|     - Pre-llenar su dirección en compras futuras
|
|   Mezclarlos en la misma tabla complica la seguridad y los permisos.
|   Separarlos mantiene el sistema limpio y cada entidad con su propio
|   propósito.
|
| SEGURIDAD:
|
|   La cédula se guarda como string normal (no es dato crítico en sí).
|   El celular se usa para verificación de 4 dígitos.
|   NO guardamos contraseñas — la cédula + últimos 4 del cel = identificación.
|
*/

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clientes', function (Blueprint $table) {
            // UUID como PK — consistente con el resto del sistema
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            // ── IDENTIFICACIÓN ─────────────────────────────────────────────
            $table->string('cedula', 20)->unique();
            // unique: dos clientes no pueden tener la misma cédula
            // Esto también es el identificador de login

            // ── DATOS PERSONALES ────────────────────────────────────────────
            $table->string('nombre', 150);
            $table->string('celular', 20);
            // Los últimos 4 dígitos del celular actúan como "PIN" de verificación

            $table->string('email', 200)->nullable();
            // nullable: muchos clientes no dan email

            // ── DIRECCIÓN (para pre-llenar el carrito) ──────────────────────
            $table->string('ciudad', 100)->nullable();
            $table->string('direccion', 300)->nullable();
            $table->string('municipio', 100)->nullable();
            // municipio = nombre exacto de la tarifa de domicilio

            // ── TIMESTAMPS ─────────────────────────────────────────────────
            $table->timestamp('creado_en')->useCurrent();
            $table->timestamp('actualizado_en')->useCurrent()->useCurrentOnUpdate();

            // ── ÍNDICES ────────────────────────────────────────────────────
            $table->index('cedula');     // búsqueda rápida por cédula en login
            $table->index('celular');    // búsqueda por celular en admin
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clientes');
    }
};
