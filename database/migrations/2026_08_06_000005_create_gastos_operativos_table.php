<?php

/*
|--------------------------------------------------------------------------
| MIGRACIÓN: create_gastos_operativos_table
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué es un gasto operativo?
|
|   Son los costos del negocio que NO están vinculados a un pedido
|   específico. Ejemplos:
|   - Publicidad en Facebook/Google: $200.000/mes
|   - Hosting del servidor: $50.000/mes
|   - Empaque (bolsas, cajas): $30.000/mes
|   - Dominio web: $50.000/año
|
|   Registrarlos permite calcular la GANANCIA NETA real:
|   Ganancia neta = Ventas - Costo productos - Gastos operativos
|
| PENSAR — ¿Por qué tener categorías?
|
|   Las categorías permiten agrupar gastos en el dashboard:
|   "¿Cuánto gasté en publicidad este mes?"
|   "¿Cuánto me costó el empaque en el trimestre?"
|   Sin categorías, solo tenemos un número total sin contexto.
|
*/

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    const CREATED_AT = 'creado_en';
    const UPDATED_AT = 'actualizado_en';

    public function up(): void
    {
        Schema::create('gastos_operativos', function (Blueprint $table) {

            // ── IDENTIFICACIÓN ────────────────────────────────────────────
            $table->uuid('id')->primary()->default(\DB::raw('gen_random_uuid()'));

            // ── CATEGORÍA ─────────────────────────────────────────────────
            // publicidad   → Meta Ads, Google Ads, TikTok Ads
            // empaque      → cajas, bolsas, cinta, relleno
            // hosting      → VPS, Railway, AWS
            // dominio      → registro y renovación de dominio
            // herramientas → software, suscripciones (Canva, ChatGPT, etc.)
            // logistica    → costo de envío no cubierto por el cliente
            // devolucion   → costo de procesar una devolución
            // otro         → cualquier otro gasto operativo
            $table->enum('categoria', [
                'publicidad',
                'empaque',
                'hosting',
                'dominio',
                'herramientas',
                'logistica',
                'devolucion',
                'otro',
            ]);

            // ── DESCRIPCIÓN ───────────────────────────────────────────────
            // Texto libre: "Meta Ads — campaña Black Friday nov 2026"
            $table->string('descripcion', 250);

            // ── MONTO ─────────────────────────────────────────────────────
            $table->decimal('monto', 12, 2);

            // ── FECHA DEL GASTO ───────────────────────────────────────────
            // Fecha real en que ocurrió el gasto (no necesariamente hoy).
            // Permite reportes por período correcto.
            $table->date('fecha_gasto');

            // ── NOTAS ─────────────────────────────────────────────────────
            $table->text('notas')->nullable();

            // ── QUIÉN REGISTRÓ EL GASTO ───────────────────────────────────
            $table->foreignUuid('usuario_id')
                  ->nullable()
                  ->constrained('usuarios')
                  ->nullOnDelete();

            // ── AUDITORÍA ─────────────────────────────────────────────────
            $table->timestamp('creado_en')->useCurrent();
            $table->timestamp('actualizado_en')->useCurrentOnUpdate()->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gastos_operativos');
    }
};
