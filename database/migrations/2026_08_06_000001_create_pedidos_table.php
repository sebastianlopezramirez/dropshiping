<?php

/*
|--------------------------------------------------------------------------
| MIGRACIÓN: create_pedidos_table
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué es la tabla 'pedidos'?
|
|   Es la cabecera de cada venta. Guarda:
|   - ¿Quién compró? (datos del cliente)
|   - ¿A dónde se envía? (dirección de entrega)
|   - ¿Cuánto pagó? (subtotal, envío, descuento, total)
|   - ¿En qué estado está? (pendiente → entregado)
|
|   Los PRODUCTOS del pedido van en 'items_pedido' (tabla separada).
|   Así un pedido puede tener varios productos.
|
| PENSAR — ¿Por qué guardar datos del cliente aquí?
|
|   En el futuro habrá una tabla 'clientes', pero hoy guardamos los datos
|   directamente en el pedido. Ventajas:
|   - El pedido es autocontenido (no depende de que el cliente exista)
|   - Si el cliente cambia su nombre, el pedido histórico no se altera
|   - Es el patrón estándar de e-commerce (snapshot pattern)
|
| ESTADOS DEL PEDIDO (flujo Colombia):
|
|   pendiente → confirmado → en_preparacion → enviado → entregado
|                                                     ↘ devuelto
|   (cualquier estado) → cancelado
|
*/

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pedidos', function (Blueprint $table) {

            // ─── IDENTIFICACIÓN ───────────────────────────────────────────
            // UUID generado por PostgreSQL (gen_random_uuid())
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            // Número de pedido legible para humanos
            // Ej: PED-2026-00001 (generado en el modelo, no en la BD)
            $table->string('numero_pedido', 30)->unique();

            // ─── DATOS DEL CLIENTE ────────────────────────────────────────
            // Snapshot: guardamos los datos del cliente al momento del pedido.
            // Así si el cliente cambia datos, el pedido histórico queda igual.
            $table->string('cliente_nombre', 150);
            $table->string('cliente_email', 150);
            $table->string('cliente_telefono', 20)->nullable();
            // Cédula de ciudadanía o NIT — importante para la guía de envío
            $table->string('cliente_documento', 20)->nullable();

            // ─── DIRECCIÓN DE ENTREGA ─────────────────────────────────────
            $table->string('direccion_entrega', 250);
            $table->string('ciudad', 100);
            $table->string('departamento', 100);
            $table->string('codigo_postal', 10)->nullable();
            // Barrio/localidad — importante en ciudades colombianas grandes
            $table->string('barrio', 100)->nullable();

            // ─── ESTADO ───────────────────────────────────────────────────
            // pendiente     = recibido, sin confirmar pago
            // confirmado    = pago verificado, listo para preparar
            // en_preparacion= el proveedor está alistando el producto
            // enviado       = ya tiene guía de envío
            // entregado     = cliente recibió el paquete
            // devuelto      = cliente devolvió el producto
            // cancelado     = pedido cancelado (antes de enviarse)
            $table->enum('estado', [
                'pendiente',
                'confirmado',
                'en_preparacion',
                'enviado',
                'entregado',
                'devuelto',
                'cancelado',
            ])->default('pendiente');

            // ─── VALORES ECONÓMICOS ───────────────────────────────────────
            // subtotal = suma de (precio × cantidad) de todos los items
            $table->decimal('subtotal', 12, 2)->default(0);
            // descuento aplicado al total (cupón, negociación, etc.)
            $table->decimal('descuento', 12, 2)->default(0);
            // costo del envío cobrado al cliente
            $table->decimal('costo_envio', 12, 2)->default(0);
            // total = subtotal - descuento + costo_envio
            $table->decimal('total', 12, 2)->default(0);

            // ─── RELACIONES ───────────────────────────────────────────────
            // ¿Quién registró el pedido? (usuario del sistema)
            $table->uuid('usuario_id')->nullable();
            $table->foreign('usuario_id')
                  ->references('id')
                  ->on('usuarios')
                  ->nullOnDelete();

            // ─── NOTAS ────────────────────────────────────────────────────
            // Instrucciones del cliente para el envío
            $table->text('notas')->nullable();
            // Notas internas del equipo (no visibles al cliente)
            $table->text('notas_internas')->nullable();

            // ─── TIMESTAMPS EN ESPAÑOL ────────────────────────────────────
            // Fecha en que se canceló el pedido (si aplica)
            $table->timestamp('cancelado_en')->nullable();
            $table->timestamp('creado_en')->nullable();
            $table->timestamp('actualizado_en')->nullable();
            // SoftDelete — no borrar pedidos, solo marcarlos como eliminados
            $table->timestamp('eliminado_en')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pedidos');
    }
};
