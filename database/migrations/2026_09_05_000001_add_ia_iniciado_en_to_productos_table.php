<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('productos', function (Blueprint $table) {
            $table->timestamp('ia_iniciado_en')->nullable()->after('eliminado_en')
                  ->comment('Fecha en que se ejecutó por primera vez "Analizar con IA"');
        });
    }

    public function down(): void
    {
        Schema::table('productos', function (Blueprint $table) {
            $table->dropColumn('ia_iniciado_en');
        });
    }
};
