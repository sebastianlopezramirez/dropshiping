<?php

/*
|--------------------------------------------------------------------------
| MIGRACIÓN: Tabla de proveedores
|--------------------------------------------------------------------------
|
| ORDEN EN EL SISTEMA:
|   usuarios → proveedores (un proveedor ES un usuario con datos extendidos)
|
| PATRÓN: "Extensión de perfil"
|   En lugar de poner todos los campos del proveedor en la tabla usuarios
|   (que quedarían en NULL para clientes y admins), creamos una tabla separada.
|
|   Ventajas:
|   - La tabla 'usuarios' no tiene columnas vacías para el 99% de los usuarios
|   - Los datos del proveedor están organizados en su propia tabla
|   - Relación: $proveedor->usuario → obtiene el usuario del proveedor
|               $usuario->proveedor → obtiene los datos del proveedor
|
| CUÁNDO CORRE:
|   Después de la migración de usuarios (necesita que 'usuarios' exista
|   para la foreign key usuario_id)
|
*/

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('proveedores', function (Blueprint $table) {

            // UUID como clave primaria (igual que en 'usuarios')
            // Consistencia: todas las tablas de negocio usan UUID
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            // Foreign key: el proveedor es un usuario del sistema
            // Un proveedor SIEMPRE tiene un usuario asociado para poder iniciar sesión
            // onDelete('cascade'): si se borra el usuario, se borra su perfil de proveedor también
            $table->foreignUuid('usuario_id')
                  ->unique() // Un usuario solo puede ser proveedor una vez
                  ->references('id')
                  ->on('usuarios')
                  ->cascadeOnDelete();

            // Nombre legal de la empresa del proveedor
            $table->string('nombre_empresa', 200);

            // NIT o número de identificación tributaria
            $table->string('numero_identificacion', 50)->nullable();

            // Persona de contacto principal en la empresa
            $table->string('persona_contacto', 100)->nullable();

            // Teléfono directo del proveedor (puede ser diferente al del usuario)
            $table->string('telefono', 20)->nullable();

            // Email de negocios del proveedor
            $table->string('email', 100)->nullable();

            // Sitio web del proveedor
            $table->string('sitio_web', 255)->nullable();

            // Días que el proveedor nos da para pagarle
            // 15 = tenemos 15 días desde que recibimos la mercancía para pagar
            $table->unsignedInteger('condiciones_pago')->default(15);

            // Métodos de pago que acepta el proveedor
            // JSONB permite guardar un array: ['transferencia_bancaria', 'paypal', 'wise']
            // ¿Por qué JSONB y no tabla separada?
            //   Los métodos de pago son simples strings, no necesitan su propia tabla
            //   JSONB es más eficiente para listas simples
            $table->jsonb('metodos_pago')->nullable();

            // Moneda principal en que factura el proveedor
            // USD = dólares (AliExpress, Amazon), COP = pesos colombianos
            $table->string('moneda', 3)->default('USD');

            // Métodos de envío disponibles con este proveedor
            // Ejemplo: ['DHL', 'FedEx', 'Correos_China', 'ePacket']
            $table->jsonb('metodos_envio')->nullable();

            // Política de devoluciones en texto libre
            // "Acepta devoluciones en 30 días, el comprador paga el envío de retorno"
            $table->text('politica_devoluciones')->nullable();

            // Estado del proveedor en nuestro sistema
            // activo = trabajamos activamente con él
            // inactivo = pausado temporalmente
            // bloqueado = dejamos de trabajar con él
            $table->string('estado', 20)->default('activo');

            // Calificación promedio basada en: puntualidad, calidad, comunicación
            // Rango: 0.00 a 5.00
            $table->decimal('calificacion', 3, 2)->default(0);

            // Notas internas sobre el proveedor (solo visibles para el admin)
            $table->text('notas_internas')->nullable();

            // Timestamps en español (igual que en 'usuarios')
            // El modelo Proveedor.php tiene: const CREATED_AT = 'creado_en';
            // Por eso creamos las columnas con esos nombres exactos.
            $table->timestamp('creado_en')->nullable();
            $table->timestamp('actualizado_en')->nullable();

            // Índice para filtrar proveedores por estado rápidamente
            $table->index('estado');
        });
    }

    /**
     * Revertir: borra la tabla de proveedores
     * No necesitamos borrar 'usuarios' aquí porque es una migración separada
     */
    public function down(): void
    {
        Schema::dropIfExists('proveedores');
    }
};
