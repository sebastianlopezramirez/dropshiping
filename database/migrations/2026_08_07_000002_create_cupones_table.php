<?php

/*
|--------------------------------------------------------------------------
| MIGRACIÓN: Tabla cupones
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué es un cupón de descuento?
|
|   Un cupón es un código que el cliente (o el vendedor al crear el pedido)
|   ingresa para obtener un descuento. Ejemplos:
|
|     VERANO20   → 20% de descuento en toda la compra
|     BIENVENIDA → $50.000 de descuento en la primera compra
|     FLETE0     → Descuento del costo de envío
|
| PENSAR — ¿Qué campos necesita?
|
|   - codigo       → el texto que escribe el usuario (único, mayúsculas)
|   - tipo         → "porcentaje" o "valor_fijo"
|   - valor        → 20 (si es porcentaje) o 50000 (si es pesos)
|   - minimo_compra→ solo aplica si el pedido supera este monto
|   - limite_usos  → cuántas veces puede usarse (null = ilimitado)
|   - usos_actuales→ contador que se incrementa con cada uso
|   - fecha_expiracion → después de esta fecha el cupón ya no sirve
|   - activo       → el admin puede desactivarlo manualmente
|
| PENSAR — ¿Por qué guardar usos_actuales?
|
|   Necesitamos verificar rápidamente si un cupón aún tiene usos disponibles:
|   usos_actuales < limite_usos → puede usarse
|   usos_actuales >= limite_usos → agotado
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
        Schema::create('cupones', function (Blueprint $table) {

            // ─── CLAVE PRIMARIA UUID ──────────────────────────────────────
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            // ─── IDENTIFICACIÓN ───────────────────────────────────────────

            // Código que escribe el usuario: "VERANO20", "PROMO50K"
            // unique: dos cupones no pueden tener el mismo código
            $table->string('codigo', 50)->unique();

            // Descripción interna para el admin: "Campaña de agosto 2026"
            $table->string('descripcion', 200)->nullable();

            // ─── TIPO Y VALOR ─────────────────────────────────────────────

            // porcentaje → descuento del X% sobre el total
            // valor_fijo → descuento de $X.000 sobre el total
            $table->enum('tipo', ['porcentaje', 'valor_fijo'])->default('porcentaje');

            // El valor del descuento:
            // Si tipo = 'porcentaje' → 20 significa 20%
            // Si tipo = 'valor_fijo' → 50000 significa $50.000
            $table->decimal('valor', 12, 2);

            // ─── CONDICIONES DE APLICACIÓN ────────────────────────────────

            // Compra mínima para que el cupón aplique
            // Ej: solo si el pedido supera $100.000
            $table->decimal('minimo_compra', 12, 2)->default(0);

            // Tope máximo de descuento (útil para cupones de porcentaje)
            // Ej: 20% pero máximo $30.000 de descuento
            // null = sin tope
            $table->decimal('maximo_descuento', 12, 2)->nullable();

            // ─── CONTROL DE USOS ─────────────────────────────────────────

            // Cuántas veces puede usarse en total (null = ilimitado)
            $table->unsignedInteger('limite_usos')->nullable();

            // Contador de usos actuales (se incrementa con cada pedido)
            // Con esto podemos verificar: usos_actuales < limite_usos
            $table->unsignedInteger('usos_actuales')->default(0);

            // ─── VALIDEZ TEMPORAL ────────────────────────────────────────

            // Desde cuándo es válido (null = desde ya)
            $table->date('fecha_inicio')->nullable();

            // Hasta cuándo es válido (null = sin expiración)
            $table->date('fecha_expiracion')->nullable();

            // ─── ESTADO ──────────────────────────────────────────────────

            // El admin puede desactivar un cupón sin borrarlo
            $table->boolean('activo')->default(true);

            // ─── TIMESTAMPS EN ESPAÑOL ───────────────────────────────────
            $table->timestamp('creado_en')->nullable();
            $table->timestamp('actualizado_en')->nullable();

            // ─── ÍNDICES ─────────────────────────────────────────────────
            $table->index('codigo');     // búsqueda rápida al validar
            $table->index('activo');     // filtrar activos en el admin
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cupones');
    }
};
