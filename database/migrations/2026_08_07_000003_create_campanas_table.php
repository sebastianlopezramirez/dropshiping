<?php

/*
|--------------------------------------------------------------------------
| MIGRACIÓN: Tabla campanas
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué es una campaña de marketing?
|
|   Una campaña es un esfuerzo publicitario en un canal específico
|   durante un período determinado. Ejemplos:
|
|     "Story Instagram agosto" → Canal: instagram, Presupuesto: $200.000
|     "Google Shopping Q3"    → Canal: google, Presupuesto: $500.000
|
|   El objetivo es saber cuánto dinero se invirtió en publicidad
|   y cuánto se recuperó en ventas (ROI).
|
| PENSAR — ¿Qué campos necesita?
|
|   - nombre      → nombre descriptivo de la campaña
|   - canal       → dónde se publica (Instagram, TikTok, Google, etc.)
|   - presupuesto → cuánto se va a invertir
|   - fechas      → período de la campaña
|   - codigo_utm  → valor para utm_campaign en URLs de tracking
|   - estado      → activa / pausada / finalizada
|
| PENSAR — ¿Qué es UTM?
|
|   UTM (Urchin Tracking Module) son parámetros que se agregan a las URLs
|   para identificar la fuente de tráfico en Google Analytics y Meta:
|
|   https://tutienda.com/productos?
|     utm_source=instagram      → de dónde viene (instagram)
|     &utm_medium=story         → qué tipo de contenido (story)
|     &utm_campaign=agosto-vasos → nombre de la campaña
|
|   Cuando alguien hace clic en ese link y compra, sabemos exactamente
|   que esa venta vino de esa campaña de Instagram.
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
        Schema::create('campanas', function (Blueprint $table) {

            // ─── CLAVE PRIMARIA UUID ──────────────────────────────────────
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            // ─── IDENTIFICACIÓN ───────────────────────────────────────────

            $table->string('nombre', 150);

            $table->text('descripcion')->nullable();

            // ─── CANAL ────────────────────────────────────────────────────

            // Canal de publicidad donde se publica la campaña
            $table->enum('canal', [
                'instagram',
                'facebook',
                'tiktok',
                'google',
                'youtube',
                'email',
                'whatsapp',
                'otro',
            ])->default('instagram');

            // ─── PRESUPUESTO ──────────────────────────────────────────────

            // Cuánto dinero se invierte en esta campaña (en COP)
            $table->decimal('presupuesto', 12, 2)->nullable();

            // ─── PERÍODO ─────────────────────────────────────────────────

            $table->date('fecha_inicio')->nullable();
            $table->date('fecha_fin')->nullable();

            // ─── TRACKING ─────────────────────────────────────────────────

            // Valor para utm_campaign en las URLs de la campaña
            // Ej: "agosto-vasos-2026" → usado en el link del anuncio
            // Al crear un pedido desde ese link, se registra este código
            $table->string('codigo_utm', 100)->nullable()->unique();

            // URL de destino de la campaña (con parámetros UTM incluidos)
            // Ej: https://tienda.com/productos?utm_source=instagram&utm_campaign=agosto-vasos
            $table->string('url_destino', 500)->nullable();

            // ─── ESTADO ──────────────────────────────────────────────────

            $table->enum('estado', ['activa', 'pausada', 'finalizada'])->default('activa');

            $table->text('notas')->nullable();

            // ─── TIMESTAMPS EN ESPAÑOL ───────────────────────────────────
            $table->timestamp('creado_en')->nullable();
            $table->timestamp('actualizado_en')->nullable();

            // ─── ÍNDICES ─────────────────────────────────────────────────
            $table->index('canal');
            $table->index('estado');
            $table->index('codigo_utm');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('campanas');
    }
};
