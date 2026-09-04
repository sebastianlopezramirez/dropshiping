<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ejecutar la migración.
     * Tabla liviana para guardar métricas reales por producto/fase.
     * Las respuestas de la IA NO se guardan — se regeneran bajo demanda.
     */
    public function up(): void
    {
        Schema::create('metricas_asistente', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(\DB::raw('gen_random_uuid()'));
            $table->uuid('producto_id');
            $table->unsignedTinyInteger('fase')->default(1)->comment('Fase de optimización: 1=Lanzamiento, 2=Optimización, 3=Escala');
            $table->decimal('ctr', 5, 2)->nullable()->comment('Click Through Rate (%)');
            $table->decimal('roas', 6, 2)->nullable()->comment('Return on Ad Spend');
            $table->decimal('cpa', 12, 2)->nullable()->comment('Costo por Adquisición en COP');
            $table->unsignedInteger('ventas')->nullable()->comment('Cantidad de ventas en el período');
            $table->decimal('gasto', 12, 2)->nullable()->comment('Gasto publicitario en COP');
            $table->decimal('ingresos', 12, 2)->nullable()->comment('Ingresos generados en COP');
            $table->text('notas')->nullable()->comment('Observaciones manuales del administrador');
            $table->uuid('creado_por')->nullable()->comment('Usuario que registró las métricas');
            $table->timestamp('creado_en')->useCurrent();
            $table->timestamp('actualizado_en')->useCurrent()->useCurrentOnUpdate();

            $table->foreign('producto_id')
                  ->references('id')
                  ->on('productos')
                  ->onDelete('cascade');

            $table->foreign('creado_por')
                  ->references('id')
                  ->on('usuarios')
                  ->onDelete('set null');

            $table->index(['producto_id', 'fase']);
            $table->index('creado_en');
        });
    }

    /**
     * Revertir la migración.
     */
    public function down(): void
    {
        Schema::dropIfExists('metricas_asistente');
    }
};
