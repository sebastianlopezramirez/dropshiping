<?php

/*
|--------------------------------------------------------------------------
| MIGRACIÓN: Tablas de colas y trabajos asíncronos
|--------------------------------------------------------------------------
|
| ¿QUÉ ES UNA COLA (QUEUE) EN LARAVEL?
|
|   Imagina que un cliente compra un producto. Después de la compra necesitas:
|     1. Enviar email de confirmación al cliente
|     2. Enviar SMS de notificación
|     3. Notificar al proveedor
|     4. Actualizar el stock
|     5. Registrar en Google Analytics
|
|   Si haces todo eso de forma síncrona (uno tras otro), el cliente
|   espera 3-5 segundos antes de ver "¡Pedido confirmado!". Mala experiencia.
|
|   Con colas:
|     → El pedido se confirma en < 200ms
|     → Las tareas se encolan en la tabla 'trabajos'
|     → Un proceso en background (php artisan queue:work) las ejecuta
|     → Si fallan, se reintentan automáticamente y se guardan en 'trabajos_fallidos'
|
| TABLAS:
|   - trabajos          → cola principal de tareas pendientes
|   - lotes_trabajos    → para procesar múltiples jobs en grupo (batch)
|   - trabajos_fallidos → trabajos que fallaron después de N reintentos
|
| NOTA: Estas tablas son de infraestructura. En producción usaremos Redis
|       como driver de colas (más rápido). Pero la tabla 'trabajos_fallidos'
|       siempre se guarda en base de datos para poder revisarla.
|
*/

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        /*
        |----------------------------------------------------------------------
        | TABLA: trabajos (jobs)
        |----------------------------------------------------------------------
        | Cada fila = un trabajo pendiente de ejecutarse.
        | Ejemplo: {job: "EnviarEmailPedido", pedido_id: "uuid-123"}
        |
        | Con QUEUE_CONNECTION=database en el .env, todos los jobs van aquí.
        | En producción con Redis, esta tabla no se usa (Redis es más rápido).
        */
        Schema::create('trabajos', function (Blueprint $table) {
            // ID autoincremental (los jobs de colas no necesitan UUID)
            $table->id();

            // Nombre de la cola: 'default', 'emails', 'notificaciones', 'pagos'
            // Permite priorizar: los workers de 'pagos' son más urgentes
            $table->string('queue')->index();

            // El job serializado (clase PHP + datos) como JSON
            // Contiene todo lo necesario para ejecutar el trabajo
            $table->longText('payload');

            // Cuántas veces se ha intentado ejecutar (empieza en 0)
            $table->unsignedSmallInteger('intentos');

            // Timestamp de cuándo fue reservado por un worker (para evitar duplicados)
            $table->unsignedInteger('reservado_en')->nullable();

            // Timestamp de cuándo el job estará disponible para ejecutarse
            // (permite programar jobs con delay: "ejecutar en 5 minutos")
            $table->unsignedInteger('disponible_en');

            // Timestamp de cuándo fue creado el job
            $table->unsignedInteger('creado_en');
        });

        /*
        |----------------------------------------------------------------------
        | TABLA: lotes_trabajos (job_batches)
        |----------------------------------------------------------------------
        | Para procesar múltiples jobs como grupo y rastrear su progreso.
        | Ejemplo: "Sincronizar 500 productos con proveedor" — un batch
        | de 500 jobs con progreso visible: 250/500 completados.
        */
        Schema::create('lotes_trabajos', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('nombre');
            $table->integer('total_trabajos');
            $table->integer('trabajos_pendientes');
            $table->integer('trabajos_fallidos');
            $table->longText('ids_trabajos_fallidos');
            $table->mediumText('opciones')->nullable();
            $table->integer('cancelado_en')->nullable();
            $table->integer('creado_en');
            $table->integer('finalizado_en')->nullable();
        });

        /*
        |----------------------------------------------------------------------
        | TABLA: trabajos_fallidos (failed_jobs)
        |----------------------------------------------------------------------
        | Los jobs que fallaron después de todos sus reintentos llegan aquí.
        | Desde el dashboard de Horizon puedes ver el error y re-ejecutarlos.
        |
        | Ejemplo de fallo: "Error al enviar email — credenciales de Mailgun inválidas"
        | → El job se guarda aquí con el stack trace completo
        | → El admin lo ve, corrige las credenciales, y re-ejecuta el job
        */
        Schema::create('trabajos_fallidos', function (Blueprint $table) {
            $table->id();

            // UUID único para identificar este fallo específico
            $table->string('uuid')->unique();

            // Driver de conexión que usó el job (database, redis, etc.)
            $table->string('conexion');

            // Nombre de la cola donde estaba el job
            $table->string('cola');

            // El job serializado (para poder re-ejecutarlo)
            $table->longText('payload');

            // El error completo con stack trace — para debugging
            $table->longText('excepcion');

            // Cuándo falló (useCurrent = se llena automáticamente)
            $table->timestamp('fallado_en')->useCurrent();

            // Índice compuesto para búsquedas en el dashboard de Horizon
            $table->index(['conexion', 'cola', 'fallado_en']);
        });
    }

    /**
     * Borrar las tablas de colas
     * Orden: primero las dependientes, luego las principales
     */
    public function down(): void
    {
        Schema::dropIfExists('trabajos_fallidos');
        Schema::dropIfExists('lotes_trabajos');
        Schema::dropIfExists('trabajos');
    }
};
