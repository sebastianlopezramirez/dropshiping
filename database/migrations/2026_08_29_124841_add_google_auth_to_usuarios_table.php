<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /*
    |--------------------------------------------------------------------------
    | Agrega campos de Google OAuth a la tabla usuarios
    |--------------------------------------------------------------------------
    |
    | google_id  → ID único que Google asigna al usuario (sub del token)
    | avatar_url → URL de la foto de perfil de Google
    |
    | Ambos son nullable porque los usuarios que se registran con email
    | y contraseña no tendrán estos campos.
    |
    */

    public function up(): void
    {
        Schema::table('usuarios', function (Blueprint $table) {
            $table->string('google_id')->nullable()->unique()->after('email');
            $table->string('avatar_url')->nullable()->after('google_id');
        });
    }

    public function down(): void
    {
        Schema::table('usuarios', function (Blueprint $table) {
            $table->dropColumn(['google_id', 'avatar_url']);
        });
    }
};