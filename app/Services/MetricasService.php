<?php

/*
|--------------------------------------------------------------------------
| SERVICE: MetricasService
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué hace este servicio?
|
|   Centraliza dos responsabilidades:
|   1. Incrementar contadores de uso (emails, WA) — se llama desde
|      cualquier parte del código que envíe un email o WA.
|   2. Calcular el costo proyectado del mes — se llama desde
|      CostosController para construir el dashboard.
|
| PENSAR — ¿Por qué un Service y no métodos en el Model?
|
|   El cálculo de costos involucra lógica de negocio (tarifas,
|   umbrales, porcentajes) que no pertenece al Model.
|   El Service es el lugar correcto para lógica que cruza
|   múltiples modelos o reglas externas.
|
| USO — Cómo incrementar desde otros controllers:
|
|   use App\Services\MetricasService;
|
|   // Al enviar un email:
|   MetricasService::incrementarEmail();
|
|   // Al enviar una notificación WA:
|   MetricasService::incrementarConversacionWA();
|
*/

namespace App\Services;

use App\Models\MetricaUsoMensual;
use App\Models\Producto;
use App\Models\Pedido;
use Illuminate\Support\Facades\DB;

class MetricasService
{
    // ─── TARIFAS (actualizar si cambian los precios del proveedor) ────────

    // WhatsApp Business API — Meta Cloud (Colombia)
    const WA_CONV_GRATIS      = 1000;
    const WA_PRECIO_UTILITY   = 0.0165; // USD por conversación

    // Resend
    const RESEND_EMAILS_GRATIS = 3000;
    const RESEND_PRECIO_PRO    = 20.00; // USD plan Pro (50k emails)

    // Cloudflare R2
    const R2_GB_GRATIS        = 10;
    const R2_PRECIO_POR_GB    = 0.015; // USD por GB adicional
    const R2_KB_POR_PRODUCTO  = 600;   // 3 imágenes × 200 KB

    // Railway (estimado fijo según nivel de uso)
    const RAILWAY_HOBBY       = 10.00;
    const RAILWAY_PRO         = 40.00;

    // Dominio
    const COSTO_DOMINIO       = 2.00;

    /*
    |----------------------------------------------------------------------
    | obtenerOCrearMesActual()
    |----------------------------------------------------------------------
    | Devuelve el registro del mes actual, creándolo si no existe.
    | firstOrCreate es atómico gracias al unique(anio, mes) de la tabla.
    */
    public static function obtenerOCrearMesActual(): MetricaUsoMensual
    {
        return MetricaUsoMensual::firstOrCreate(
            ['anio' => now()->year, 'mes' => now()->month],
            ['emails_enviados' => 0, 'conversaciones_wa' => 0]
        );
    }

    /*
    |----------------------------------------------------------------------
    | incrementarEmail()
    |----------------------------------------------------------------------
    | Llama esto justo después de enviar un email transaccional.
    | Usa increment() que genera UPDATE atómico en PostgreSQL.
    */
    public static function incrementarEmail(int $cantidad = 1): void
    {
        self::obtenerOCrearMesActual();

        DB::table('metricas_uso_mensual')
            ->where('anio', now()->year)
            ->where('mes', now()->month)
            ->increment('emails_enviados', $cantidad);
    }

    /*
    |----------------------------------------------------------------------
    | incrementarConversacionWA()
    |----------------------------------------------------------------------
    | Llama esto cuando envías una notificación de WhatsApp.
    | Cada "conversación" es una ventana de 24h — cuenta 1 por pedido/día.
    */
    public static function incrementarConversacionWA(int $cantidad = 1): void
    {
        self::obtenerOCrearMesActual();

        DB::table('metricas_uso_mensual')
            ->where('anio', now()->year)
            ->where('mes', now()->month)
            ->increment('conversaciones_wa', $cantidad);
    }

    /*
    |----------------------------------------------------------------------
    | calcularCostos()
    |----------------------------------------------------------------------
    | Recibe la métrica del mes y devuelve el desglose completo de costos
    | con semáforos (verde / amarillo / rojo) para el dashboard.
    */
    public static function calcularCostos(MetricaUsoMensual $metrica): array
    {
        // ── WhatsApp ──────────────────────────────────────────────────────
        $convWA       = $metrica->conversaciones_wa;
        $convPagadas  = max(0, $convWA - self::WA_CONV_GRATIS);
        $costoWA      = round($convPagadas * self::WA_PRECIO_UTILITY, 2);
        $pctWA        = min(100, (int) ($convWA / self::WA_CONV_GRATIS * 100));

        // ── Resend ────────────────────────────────────────────────────────
        $emails       = $metrica->emails_enviados;
        $costoResend  = $emails > self::RESEND_EMAILS_GRATIS
                            ? self::RESEND_PRECIO_PRO
                            : 0;
        $pctResend    = min(100, (int) ($emails / self::RESEND_EMAILS_GRATIS * 100));

        // ── R2 Storage (estimado desde catálogo real) ─────────────────────
        $totalProductos = Producto::count();
        $storageKB      = $totalProductos * self::R2_KB_POR_PRODUCTO;
        $storageGB      = round($storageKB / (1024 * 1024), 2);
        $gbPagados      = max(0, $storageGB - self::R2_GB_GRATIS);
        $costoR2        = round($gbPagados * self::R2_PRECIO_POR_GB, 2);
        $pctR2          = min(100, (int) ($storageGB / self::R2_GB_GRATIS * 100));

        // ── Railway (estimado por carga) ──────────────────────────────────
        $pedidosMes    = Pedido::whereMonth('creado_en', $metrica->mes)
                               ->whereYear('creado_en', $metrica->anio)
                               ->count();
        $costoRailway  = $pedidosMes > 2000
                            ? self::RAILWAY_PRO
                            : self::RAILWAY_HOBBY;

        // ── Total ─────────────────────────────────────────────────────────
        $total = $costoWA + $costoResend + $costoR2 + $costoRailway + self::COSTO_DOMINIO;

        return [
            'whatsapp' => [
                'conversaciones'   => $convWA,
                'limite_gratis'    => self::WA_CONV_GRATIS,
                'conv_pagadas'     => $convPagadas,
                'costo'            => $costoWA,
                'porcentaje'       => $pctWA,
                'semaforo'         => self::semaforo($pctWA, 70, 90),
            ],
            'resend' => [
                'emails'           => $emails,
                'limite_gratis'    => self::RESEND_EMAILS_GRATIS,
                'costo'            => $costoResend,
                'porcentaje'       => $pctResend,
                'semaforo'         => self::semaforo($pctResend, 67, 90),
            ],
            'r2' => [
                'productos'        => $totalProductos,
                'storage_gb'       => $storageGB,
                'limite_gratis_gb' => self::R2_GB_GRATIS,
                'gb_pagados'       => $gbPagados,
                'costo'            => $costoR2,
                'porcentaje'       => $pctR2,
                'semaforo'         => self::semaforo($pctR2, 80, 95),
            ],
            'railway' => [
                'pedidos_mes'      => $pedidosMes,
                'costo'            => $costoRailway,
                'plan'             => $pedidosMes > 2000 ? 'Pro' : 'Hobby',
                'semaforo'         => 'verde',
            ],
            'dominio' => [
                'costo'            => self::COSTO_DOMINIO,
                'semaforo'         => 'verde',
            ],
            'total'              => round($total, 2),
            'pedidos_mes'        => $pedidosMes,
        ];
    }

    /*
    |----------------------------------------------------------------------
    | semaforo() — privado
    |----------------------------------------------------------------------
    | Devuelve 'verde', 'amarillo' o 'rojo' según el porcentaje de uso.
    */
    private static function semaforo(int $pct, int $umbralAmarillo, int $umbralRojo): string
    {
        if ($pct >= $umbralRojo)    return 'rojo';
        if ($pct >= $umbralAmarillo) return 'amarillo';
        return 'verde';
    }
}
