<?php

/*
|--------------------------------------------------------------------------
| MIGRACIÓN: create_transacciones_table
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué es una transacción en este sistema?
|
|   Cada vez que un cliente paga un pedido, se registra una transacción.
|   Puede ser:
|   - Manual: el vendedor la registra (efectivo, transferencia, Nequi)
|   - Automática: Wompi envía un webhook y el sistema la crea solo
|
|   Una transacción siempre está vinculada a un pedido.
|   Un pedido puede tener varias transacciones (ej: pago parcial, segunda
|   transferencia si la primera fue rechazada).
|
| PENSAR — ¿Por qué guardar datos_wompi en JSONB?
|
|   Wompi envía un objeto JSON con decenas de campos (banco, ciudad,
|   número de cuotas, tipo de tarjeta, etc.). En lugar de crear columnas
|   para cada campo (que pueden cambiar en futuras versiones de la API),
|   guardamos el objeto completo. Así nunca perdemos datos.
|
*/

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // ── NOMBRES EN ESPAÑOL (convención de este proyecto) ─────────────────
    const CREATED_AT  = 'creado_en';
    const UPDATED_AT  = 'actualizado_en';

    public function up(): void
    {
        Schema::create('transacciones', function (Blueprint $table) {

            // ── IDENTIFICACIÓN ────────────────────────────────────────────
            // UUID generado por PostgreSQL — más seguro que auto-increment
            $table->uuid('id')->primary()->default(\DB::raw('gen_random_uuid()'));

            // ── RELACIÓN CON PEDIDO ───────────────────────────────────────
            // Si el pedido se elimina (soft delete) la transacción permanece.
            // Por eso usemos nullOnDelete en lugar de cascadeOnDelete.
            $table->foreignUuid('pedido_id')
                  ->constrained('pedidos')
                  ->cascadeOnDelete();

            // ── REFERENCIA WOMPI ──────────────────────────────────────────
            // ID único que Wompi asigna a cada transacción. Nullable porque
            // los pagos manuales no tienen referencia Wompi.
            $table->string('referencia_wompi', 100)->nullable()->unique();

            // ── REFERENCIA MANUAL ─────────────────────────────────────────
            // Número de confirmación de transferencia, comprobante, etc.
            $table->string('referencia_pago', 100)->nullable();

            // ── MÉTODO DE PAGO ────────────────────────────────────────────
            // Lista de métodos aceptados en Colombia:
            //   efectivo     → pago en efectivo contra entrega o en punto
            //   transferencia → transferencia bancaria
            //   nequi        → billetera digital Nequi (Bancolombia)
            //   pse          → Pago Seguro en Línea (débito bancario)
            //   tarjeta_credito / tarjeta_debito → plástico
            //   wompi        → link de pago generado por Wompi (incluye PSE/tarjeta)
            //   otro         → cualquier otro método
            $table->enum('metodo_pago', [
                'efectivo',
                'transferencia',
                'nequi',
                'pse',
                'tarjeta_credito',
                'tarjeta_debito',
                'wompi',
                'otro',
            ]);

            // ── MONTO ─────────────────────────────────────────────────────
            // 12 dígitos totales, 2 decimales → máximo $9,999,999,999.99 COP
            $table->decimal('monto', 12, 2);

            // ── ESTADO ───────────────────────────────────────────────────
            // pendiente  → registrada, esperando confirmación
            // aprobada   → pago confirmado (Wompi o manual)
            // rechazada  → Wompi rechazó el pago (fondos insuficientes, etc.)
            // anulada    → el vendedor la anuló manualmente
            // error      → error técnico en la comunicación con Wompi
            $table->enum('estado', [
                'pendiente',
                'aprobada',
                'rechazada',
                'anulada',
                'error',
            ])->default('pendiente');

            // ── DESCRIPCIÓN ───────────────────────────────────────────────
            $table->string('descripcion', 250)->nullable();

            // ── DATOS WOMPI (JSONB) ───────────────────────────────────────
            // Guardamos el payload completo del webhook para no perder datos.
            // JSONB permite consultas como: datos_wompi->>'payment_method_type'
            $table->jsonb('datos_wompi')->nullable();

            // ── FECHA DE PAGO ─────────────────────────────────────────────
            // Momento exacto en que se confirmó el pago.
            // Null si aún está pendiente.
            $table->timestamp('pagado_en')->nullable();

            // ── AUDITORÍA ─────────────────────────────────────────────────
            $table->timestamp('creado_en')->useCurrent();
            $table->timestamp('actualizado_en')->useCurrentOnUpdate()->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transacciones');
    }
};
