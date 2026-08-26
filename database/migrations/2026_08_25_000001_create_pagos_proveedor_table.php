<?php

/*
|--------------------------------------------------------------------------
| MIGRACIÓN: pagos_proveedor
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué resuelve esta tabla?
|
|   Cuando el admin confirma una venta, el sistema sabe que le debe
|   al proveedor: SUM(precio_costo × cantidad) de sus items.
|
|   Esta tabla registra cuándo el admin efectivamente PAGÓ esa deuda.
|   Sin esta tabla, el proveedor nunca sabe si le pagaron o no.
|
| PENSAR — ¿Por qué no ligamos cada pago a pedidos específicos?
|
|   El modelo simplificado es: el admin calcula la deuda acumulada
|   del mes y hace un pago total. Es como una liquidación mensual.
|
|   Más simple, más real para el negocio. No hace falta decir
|   "este pago cubre exactamente el pedido X y el pedido Y".
|
| ESCRIBIR — Campos de la tabla:
|
|   id               → UUID (patrón del proyecto)
|   proveedor_id     → FK a proveedores
|   monto            → cuánto se pagó
|   fecha_pago       → cuándo se pagó
|   metodo_pago      → cómo se pagó (nequi, transferencia, efectivo...)
|   concepto         → descripción del pago (ej: "Liquidación agosto 2026")
|   registrado_por   → FK al user (admin) que registró el pago
|   notas            → info adicional
|
*/

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pagos_proveedor', function (Blueprint $table) {
            // UUID como PK (patrón del proyecto)
            $table->uuid('id')->primary();

            // ¿A qué proveedor se le pagó?
            $table->uuid('proveedor_id');
            $table->foreign('proveedor_id')
                  ->references('id')
                  ->on('proveedores')
                  ->onDelete('restrict'); // No borrar si tiene pagos

            // Cuánto se pagó
            $table->decimal('monto', 12, 2);

            // Cuándo y cómo
            $table->date('fecha_pago');
            $table->string('metodo_pago', 50)->default('transferencia');
            // Valores posibles: transferencia, nequi, efectivo, otro

            // Descripción del pago
            $table->string('concepto', 300)->nullable();
            // Ejemplo: "Liquidación agosto 2026", "Pago parcial semana 1"

            // ¿Quién registró el pago (admin)?
            // PENSAR: No ponemos FK a users porque en este proyecto la tabla
            // de usuarios puede llamarse 'usuarios' o 'users' según la migración
            // original. UUID sin FK es suficiente — los registros financieros
            // son inmutables de todas formas.
            $table->uuid('registrado_por');

            // Información adicional
            $table->text('notas')->nullable();

            // Timestamps en español (patrón del proyecto)
            $table->timestamp('creado_en')->useCurrent();
            $table->timestamp('actualizado_en')->useCurrent()->useCurrentOnUpdate();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pagos_proveedor');
    }
};
