<?php

/*
|--------------------------------------------------------------------------
| MIGRATION: create_metricas_uso_mensual_table
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué hace esta tabla?
|
|   Acumula contadores de uso mensual de servicios externos:
|   - emails enviados (Resend)
|   - conversaciones de WhatsApp (Meta Cloud API)
|   - pedidos del mes (calculado desde pedidos)
|
|   Con estos datos el admin puede ver en tiempo real cuándo
|   se acerca a los límites free de cada plataforma, y el
|   costo proyectado del mes actual.
|
| PENSAR — ¿Por qué una fila por mes en lugar de eventos individuales?
|
|   Los eventos individuales (cada email, cada WA) serían demasiados
|   registros. Un acumulador mensual es suficiente para el dashboard
|   de costos — no necesitamos historial granular por mensaje.
|
|   Se usa un unique(anio, mes) para garantizar una sola fila por mes.
|   Los incrementos se hacen con DB::increment() que es atómico en PostgreSQL.
|
*/

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('metricas_uso_mensual', function (Blueprint $table) {
            $table->id();

            // Período: un registro por mes/año
            $table->smallInteger('anio');
            $table->tinyInteger('mes'); // 1 = enero, 12 = diciembre

            // Contadores acumulados del mes
            $table->integer('emails_enviados')->default(0);
            $table->integer('conversaciones_wa')->default(0);

            $table->timestamps();

            // Garantiza una sola fila por mes
            $table->unique(['anio', 'mes']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('metricas_uso_mensual');
    }
};
