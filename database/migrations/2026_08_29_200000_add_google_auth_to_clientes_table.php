<?php

/*
|--------------------------------------------------------------------------
| MIGRACIÓN: Agregar Google OAuth a la tabla clientes
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué agrega esta migración?
|
|   1. google_id  → ID único de Google (permite login sin cédula)
|   2. avatar_url → Foto de perfil de Google
|   3. cedula → pasa a nullable (los clientes de Google no tienen cédula)
|
| PENSAR — ¿Por qué hacer cedula nullable?
|
|   El sistema original requiere cédula para identificar al cliente.
|   Pero con Google OAuth, el cliente se identifica con su email/google_id.
|   Forzar a un cliente de Google a ingresar cédula = fricción innecesaria.
|
|   IMPORTANTE: En PostgreSQL, NULL != NULL, así que varios clientes
|   sin cédula (NULL) no violan el UNIQUE constraint. Es seguro.
|
| PENSAR — ¿Afecta el login normal con cédula?
|
|   No. El login normal busca: Cliente::where('cedula', $request->cedula)
|   Los clientes con cédula siguen funcionando exactamente igual.
|   Los clientes de Google simplemente tienen cedula = null.
|
*/

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clientes', function (Blueprint $table) {

            // ID de Google OAuth — null si el cliente se registró con cédula
            $table->string('google_id')->nullable()->unique()->after('email');

            // Foto de perfil de Google
            $table->string('avatar_url', 500)->nullable()->after('google_id');

            // Hacer cedula nullable para clientes que entran con Google
            // (en PostgreSQL, NULL != NULL → no viola el UNIQUE)
            $table->string('cedula', 20)->nullable()->change();

            // Hacer celular nullable también (Google no provee celular)
            $table->string('celular', 20)->nullable()->change();

        });
    }

    public function down(): void
    {
        Schema::table('clientes', function (Blueprint $table) {
            $table->dropColumn(['google_id', 'avatar_url']);
            $table->string('cedula', 20)->nullable(false)->change();
            $table->string('celular', 20)->nullable(false)->change();
        });
    }
};
