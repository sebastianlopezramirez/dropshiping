<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /*
    |--------------------------------------------------------------------------
    | MIGRACIÓN: Añadir columnas de Meta Ads a metricas_asistente
    |--------------------------------------------------------------------------
    |
    | ENTENDER — ¿Para qué sirve esta migración?
    |
    |   Amplía la tabla metricas_asistente con datos reales de Meta Ads Manager
    |   (Facebook e Instagram). El administrador los copia desde el panel de Meta
    |   y los ingresa manualmente. Groq los recibe como DATOS_META y decide
    |   con información real en lugar de estimaciones.
    |
    | PENSAR — ¿Por qué nullable()?
    |
    |   Los registros existentes no tienen estos campos. Si los hacemos NOT NULL,
    |   la migración falla al intentar asignar un valor por defecto en registros
    |   ya creados. Nullable = los registros anteriores siguen funcionando.
    |
    | ORGANIZACIÓN de los nuevos campos (3 grupos):
    |
    |   Alcance y visibilidad:
    |     alcance       → "Alcance" en Meta (personas únicas que vieron el anuncio)
    |     impresiones   → "Impresiones" (total de veces que se mostró)
    |     frecuencia    → "Frecuencia" (impresiones / alcance)
    |     cpm           → "CPM" (costo por mil impresiones en COP)
    |
    |   Clics y tráfico:
    |     clics_enlace  → "Clics en el enlace" (no confundir con clics totales)
    |     cpc_enlace    → "CPC (coste por clic en el enlace)" en COP
    |
    |   Conversiones:
    |     agregar_carrito → "Artículos añadidos al carrito"
    |     inicios_pago    → "Pagos iniciados" (checkout iniciado)
    |
    |   Nota: CTR, ROAS, CPA, ventas, gasto, ingresos ya existían en la tabla.
    |
    */
    public function up(): void
    {
        Schema::table('metricas_asistente', function (Blueprint $table) {

            // ── Grupo 1: Alcance y visibilidad ──────────────────────────────
            $table->unsignedInteger('alcance')
                  ->nullable()
                  ->comment('Personas únicas que vieron el anuncio (Meta: "Alcance")')
                  ->after('notas');

            $table->unsignedInteger('impresiones')
                  ->nullable()
                  ->comment('Total de veces que se mostró el anuncio (Meta: "Impresiones")')
                  ->after('alcance');

            $table->decimal('frecuencia', 5, 2)
                  ->nullable()
                  ->comment('Impresiones / Alcance (Meta: "Frecuencia")')
                  ->after('impresiones');

            $table->decimal('cpm', 12, 2)
                  ->nullable()
                  ->comment('Costo por mil impresiones en COP (Meta: "CPM")')
                  ->after('frecuencia');

            // ── Grupo 2: Clics y tráfico ────────────────────────────────────
            $table->unsignedInteger('clics_enlace')
                  ->nullable()
                  ->comment('Clics en el enlace (Meta: "Clics en el enlace")')
                  ->after('cpm');

            $table->decimal('cpc_enlace', 12, 2)
                  ->nullable()
                  ->comment('Costo por clic en el enlace en COP (Meta: "CPC del enlace")')
                  ->after('clics_enlace');

            // ── Grupo 3: Conversiones ────────────────────────────────────────
            $table->unsignedInteger('agregar_carrito')
                  ->nullable()
                  ->comment('Artículos añadidos al carrito (Meta: "Artículos añadidos al carrito")')
                  ->after('cpc_enlace');

            $table->unsignedInteger('inicios_pago')
                  ->nullable()
                  ->comment('Pagos iniciados / checkout iniciado (Meta: "Pagos iniciados")')
                  ->after('agregar_carrito');
        });
    }

    /*
    |--------------------------------------------------------------------------
    | REVERTIR — Elimina exactamente las columnas que añadimos
    |--------------------------------------------------------------------------
    */
    public function down(): void
    {
        Schema::table('metricas_asistente', function (Blueprint $table) {
            $table->dropColumn([
                'alcance',
                'impresiones',
                'frecuencia',
                'cpm',
                'clics_enlace',
                'cpc_enlace',
                'agregar_carrito',
                'inicios_pago',
            ]);
        });
    }
};
