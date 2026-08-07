<?php

/*
|--------------------------------------------------------------------------
| MIGRACIÓN: Tablas de usuarios, sesiones y recuperación de contraseña
|--------------------------------------------------------------------------
|
| ORDEN: Esta es la primera migración que corre (prefijo 0001_01_01)
|        porque TODAS las demás tablas referencian a 'usuarios'.
|        Las foreign keys necesitan que la tabla padre exista primero.
|
| TABLAS QUE CREA ESTA MIGRACIÓN:
|   1. usuarios                         → todos los actores del sistema
|   2. tokens_recuperacion_contrasena   → para el flujo "olvidé mi contraseña"
|   3. sesiones                         → sesiones activas de usuarios
|
| ¿QUÉ ES UNA FOREIGN KEY?
|   Una restricción que garantiza que un valor en una tabla
|   exista como clave primaria en otra tabla.
|   Ejemplo: pedidos.cliente_id debe existir en usuarios.id
|   Si intentas crear un pedido con un cliente_id que no existe → ERROR
|   Esto protege la integridad de los datos.
|
*/

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Crear las tablas — se ejecuta con: php artisan migrate
     */
    public function up(): void
    {
        /*
        |----------------------------------------------------------------------
        | TABLA: usuarios
        |----------------------------------------------------------------------
        |
        | Tabla base de todos los actores del sistema.
        | IMPORTANTE: En Laravel, el modelo User apunta a esta tabla.
        | Para cambiar el nombre usamos: protected $table = 'usuarios';
        | en el modelo app/Models/User.php
        |
        */
        Schema::create('usuarios', function (Blueprint $table) {

            // UUID como clave primaria en lugar de integer autoincremental
            // ¿Por qué UUID?
            //   - No revela cuántos usuarios tienes (1, 2, 3... revela volumen)
            //   - Puedes generar IDs en el frontend antes de guardar en BD
            //   - Más seguro para URLs: /usuarios/7 vs /usuarios/550e8400-e29b...
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            // Nombre completo del usuario
            $table->string('nombre', 100);

            // Email único en todo el sistema (es el username de login)
            $table->string('email', 100)->unique();

            // Contraseña hasheada con bcrypt (NUNCA se guarda en texto plano)
            // Laravel hace el hash automáticamente con Hash::make($password)
            $table->string('contrasena');

            // Teléfono con código de país (+57 para Colombia)
            $table->string('telefono', 20)->nullable();

            // Dirección como JSONB para máxima flexibilidad
            // Estructura: {"calle": "...", "ciudad": "...", "departamento": "...", "codigo_postal": "..."}
            // ¿Por qué JSONB y no columnas separadas?
            //   Porque la dirección cambia según el país (algunos tienen ZIP, otros no)
            //   y JSONB es indexable y consultable en PostgreSQL
            $table->jsonb('direccion')->nullable();

            // Rol principal del usuario en el sistema
            // Usaremos Spatie para los permisos granulares, pero este campo
            // nos permite hacer queries rápidas sin joins
            // Valores posibles: admin, vendedor, proveedor, cliente, soporte
            $table->string('rol', 20)->default('cliente');

            // Estado de la cuenta
            // activo = puede iniciar sesión
            // inactivo = cuenta deshabilitada temporalmente
            // suspendido = violación de términos
            $table->string('estado', 20)->default('activo');

            // Cuándo verificó su email (null = aún no verificado)
            // Laravel usa este campo en el middleware 'verified'
            $table->timestamp('email_verificado_en')->nullable();

            // Token para recuperación de contraseña (campo legado de Laravel)
            // En nuestro sistema usamos la tabla tokens_recuperacion_contrasena,
            // pero lo mantenemos por compatibilidad con los helpers de Laravel
            $table->rememberToken(); // crea columna 'remember_token'

            // Límite de crédito para clientes mayoristas
            // 0 = sin crédito (pago al contado)
            // 5000000 = puede comprar hasta $5M COP a crédito
            $table->decimal('limite_credito', 12, 2)->default(0);

            // Días de plazo para pagar cuando se les da crédito
            // 0 = pago inmediato, 30 = 30 días, 60 = 60 días
            $table->unsignedInteger('plazos_credito')->default(0);

            // URL del avatar del usuario (guardado en Cloudflare R2)
            $table->string('url_avatar', 500)->nullable();

            // ¿POR QUÉ NO usamos $table->timestamps()?
            //   timestamps() crea 'created_at' y 'updated_at' (nombres en inglés).
            //   Nosotros queremos 'creado_en' y 'actualizado_en'.
            //
            // En el modelo definimos:
            //   const CREATED_AT = 'creado_en';
            //   const UPDATED_AT = 'actualizado_en';
            //
            // Pero esas constantes solo le dicen a Eloquent el NOMBRE que debe buscar.
            // La columna en PostgreSQL DEBE existir con ese nombre exacto.
            // Por eso creamos las columnas manualmente con los nombres en español.
            $table->timestamp('creado_en')->nullable();      // equivale a created_at
            $table->timestamp('actualizado_en')->nullable(); // equivale a updated_at

            // Soft Delete: en lugar de borrar el registro, guarda la fecha de eliminación
            // $user->delete() → pone fecha en eliminado_en, no borra el registro
            // ¿Por qué? Para poder recuperar datos borrados por error
            // y mantener la integridad referencial (pedidos siguen apuntando al usuario)
            $table->softDeletes('eliminado_en'); // crea columna eliminado_en

            // Índices para búsquedas frecuentes
            // Un índice es como el índice de un libro: búsqueda O(log n) en vez de O(n)
            $table->index('rol');    // buscaremos usuarios por rol frecuentemente
            $table->index('estado'); // filtraremos por estado activo/inactivo
        });

        /*
        |----------------------------------------------------------------------
        | TABLA: tokens_recuperacion_contrasena
        |----------------------------------------------------------------------
        |
        | Cuando un usuario dice "olvidé mi contraseña":
        | 1. Laravel genera un token aleatorio y lo guarda aquí
        | 2. Envía un email con un link que incluye el token
        | 3. Usuario hace click → Laravel verifica el token
        | 4. Si es válido → puede cambiar su contraseña
        | 5. Token se borra de esta tabla
        |
        */
        Schema::create('tokens_recuperacion_contrasena', function (Blueprint $table) {
            // Email del usuario que solicitó el reseteo
            $table->string('email')->primary();

            // Token aleatorio (se hashea antes de guardar)
            $table->string('token');

            // Cuándo se creó (los tokens expiran después de 60 minutos por defecto)
            $table->timestamp('creado_en')->nullable();
        });

        /*
        |----------------------------------------------------------------------
        | TABLA: sesiones
        |----------------------------------------------------------------------
        |
        | Cuando SESSION_DRIVER=database en el .env, Laravel guarda
        | las sesiones de usuario en esta tabla.
        |
        | ¿Por qué guardar sesiones en base de datos y no en archivos?
        |   - En un servidor con múltiples procesos PHP, todos leen el mismo store
        |   - Puedes ver qué usuarios están online y cuándo fue su última actividad
        |   - Puedes invalidar sesiones específicas (logout desde admin)
        |
        */
        Schema::create('sesiones', function (Blueprint $table) {
            // ID único de sesión (un string largo y aleatorio)
            $table->string('id')->primary();

            // Usuario al que pertenece la sesión (null = sesión sin autenticar)
            $table->foreignUuid('user_id')
                  ->nullable()
                  ->references('id')
                  ->on('usuarios')
                  ->nullOnDelete(); // Si se borra el usuario, la sesión queda sin user_id

            $table->index('user_id'); // índice para buscar sesiones por usuario

            // IP desde donde se inició la sesión
            $table->string('ip_address', 45)->nullable();

            // Navegador y dispositivo del usuario
            $table->text('user_agent')->nullable();

            // Datos encriptados de la sesión (variables guardadas con session())
            $table->longText('payload');

            // IMPORTANTE: Esta columna se llama 'last_activity' en inglés.
            // Laravel la busca con ese nombre exacto en su código interno.
            // Regla: traducimos el NOMBRE DE LA TABLA, no las columnas de infraestructura.
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Revertir las tablas — se ejecuta con: php artisan migrate:rollback
     *
     * ¡ATENCIÓN! Orden inverso al de creación porque hay foreign keys:
     * No puedes borrar 'usuarios' si 'sesiones' tiene una FK apuntando a ella.
     */
    public function down(): void
    {
        // Borra primero las tablas que dependen de 'usuarios'
        Schema::dropIfExists('sesiones');
        Schema::dropIfExists('tokens_recuperacion_contrasena');

        // Última en borrarse: la tabla principal
        Schema::dropIfExists('usuarios');
    }
};
