<?php

/*
|--------------------------------------------------------------------------
| MIGRACIÓN: create_envios_table
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué es un envío?
|
|   Cuando el pedido está "confirmado", se genera un envío.
|   El envío tiene:
|   - Operador logístico (Servientrega, Envia.com, Interrapidísimo, etc.)
|   - Número de guía (para rastrear el paquete)
|   - URL de rastreo (enlace directo al tracking del operador)
|   - Fechas clave (cuándo se envió, cuándo se estimó, cuándo llegó)
|
| PENSAR — ¿Por qué tabla separada y no columnas en 'pedidos'?
|
|   Separación de responsabilidades:
|   - 'pedidos' maneja la venta (quién, qué, cuánto)
|   - 'envios' maneja la logística (cómo, cuándo, quién transporta)
|
|   Además, en el futuro un pedido podría tener MÚLTIPLES envíos
|   (ej: un producto viene del proveedor A y otro del proveedor B).
|   Por ahora: 1 pedido = 1 envío (relación hasOne).
|
| OPERADORES EN COLOMBIA (los más comunes):
|   - Servientrega  → el más usado
|   - Envia.com     → plataforma que agrega varios operadores
|   - Interrapidísimo
|   - TCC
|   - Coordinadora
|   - Deprisa (Avianca)
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
        Schema::create('envios', function (Blueprint $table) {

            // ─── IDENTIFICACIÓN ───────────────────────────────────────────
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            // ─── RELACIÓN CON PEDIDO ──────────────────────────────────────
            // unique() → 1 pedido máximo 1 envío (por ahora)
            $table->uuid('pedido_id')->unique();
            $table->foreign('pedido_id')
                  ->references('id')
                  ->on('pedidos')
                  ->cascadeOnDelete();

            // ─── OPERADOR LOGÍSTICO ───────────────────────────────────────
            $table->string('operador', 100); // 'Servientrega', 'Envia.com', etc.

            // ─── GUÍA DE RASTREO ──────────────────────────────────────────
            // El número de guía lo asigna el operador al recoger el paquete
            $table->string('numero_guia', 100)->nullable();
            // URL directa para que el cliente rastree su paquete
            $table->string('url_rastreo', 500)->nullable();

            // ─── ESTADO DEL ENVÍO ─────────────────────────────────────────
            // Estado independiente del estado del pedido
            // pendiente  = pedido confirmado, esperando recolección
            // recogido   = el operador recogió en el punto de origen
            // en_transito= en camino al destino
            // entregado  = el cliente recibió
            // devuelto   = no se pudo entregar, vuelve al origen
            $table->enum('estado', [
                'pendiente',
                'recogido',
                'en_transito',
                'entregado',
                'devuelto',
            ])->default('pendiente');

            // ─── FECHAS LOGÍSTICAS ────────────────────────────────────────
            // Cuándo se le entregó el paquete al operador
            $table->date('fecha_envio')->nullable();
            // Cuándo promete llegar el operador
            $table->date('fecha_estimada_entrega')->nullable();
            // Cuándo llegó realmente
            $table->date('fecha_entrega_real')->nullable();

            // ─── COSTOS ───────────────────────────────────────────────────
            // Costo real cobrado por el operador (puede diferir del costo_envio del pedido)
            $table->decimal('costo', 10, 2)->default(0);

            // ─── NOTAS ────────────────────────────────────────────────────
            $table->text('notas')->nullable();

            // ─── TIMESTAMPS EN ESPAÑOL ────────────────────────────────────
            $table->timestamp('creado_en')->nullable();
            $table->timestamp('actualizado_en')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('envios');
    }
};
