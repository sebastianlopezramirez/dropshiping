<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

/*
|--------------------------------------------------------------------------
| HEALTH CONTROLLER — Monitor de servicios críticos
|--------------------------------------------------------------------------
| ENTENDER:
|   Endpoint público /health que verifica en tiempo real si los
|   servicios externos (Gemini, BD) están operativos.
|   Sin autenticación — se puede llamar desde cualquier bot externo.
|
| PENSAR:
|   - Gemini: enviamos un prompt mínimo y medimos si responde en <10s
|   - BD: hacemos un SELECT 1 para confirmar conexión activa
|   - Retorna JSON con estado, latencia y mensaje de diagnóstico
|
| ESCRIBIR / VERIFICAR:
|   GET /health          → resumen general
|   GET /health/gemini   → solo Gemini
|   GET /health/db       → solo base de datos
*/
class HealthController extends Controller
{
    public function index(): \Illuminate\Http\JsonResponse
    {
        $gemini = $this->verificarGemini();
        $bd     = $this->verificarBD();

        $todo_ok = $gemini['ok'] && $bd['ok'];

        $codigo = $todo_ok ? 200 : 503;

        return response()->json([
            'estado'    => $todo_ok ? '✅ Todos los servicios operativos' : '❌ Hay servicios con problemas',
            'servicios' => [
                'gemini'       => $gemini,
                'base_de_datos' => $bd,
            ],
            'timestamp'       => now()->toISOString(),
            'entorno'         => app()->environment(),
        ], $codigo);
    }

    public function gemini(): \Illuminate\Http\JsonResponse
    {
        $resultado = $this->verificarGemini();
        return response()->json($resultado, $resultado['ok'] ? 200 : 503);
    }

    public function db(): \Illuminate\Http\JsonResponse
    {
        $resultado = $this->verificarBD();
        return response()->json($resultado, $resultado['ok'] ? 200 : 503);
    }

    // ─────────────────────────────────────────────────────────────────
    // VERIFICAR GEMINI
    // Envía un prompt mínimo y mide latencia. Detecta:
    //   - API key faltante o inválida
    //   - Modelo incorrecto (404 de Google)
    //   - Rate limit (429)
    //   - Timeout (>10s)
    // ─────────────────────────────────────────────────────────────────
    private function verificarGemini(): array
    {
        $apiKey = config('services.gemini.api_key');

        if (empty($apiKey)) {
            return [
                'ok'          => false,
                'servicio'    => 'gemini',
                'problema'    => 'GEMINI_API_KEY no está configurada en las variables de entorno de Railway',
                'solucion'    => 'Ve a Railway → tu proyecto → Variables → agrega GEMINI_API_KEY',
                'latencia_ms' => null,
            ];
        }

        $inicio = microtime(true);

        try {
            $modelo = 'gemini-2.0-flash';
            $url    = "https://generativelanguage.googleapis.com/v1beta/models/{$modelo}:generateContent?key={$apiKey}";

            $resp = Http::timeout(10)->post($url, [
                'contents' => [
                    ['parts' => [['text' => 'Responde solo: OK']]],
                ],
                'generationConfig' => ['maxOutputTokens' => 10],
            ]);

            $latencia = round((microtime(true) - $inicio) * 1000);

            if ($resp->successful()) {
                return [
                    'ok'          => true,
                    'servicio'    => 'gemini',
                    'modelo'      => $modelo,
                    'latencia_ms' => $latencia,
                    'estado'      => '✅ Operativo',
                ];
            }

            // Diagnóstico automático según código HTTP
            $codigo   = $resp->status();
            $problema = match(true) {
                $codigo === 400 => 'Nombre de modelo incorrecto o payload inválido',
                $codigo === 401 => 'API key inválida o expirada',
                $codigo === 403 => 'API key sin permisos para este modelo',
                $codigo === 404 => 'Modelo no encontrado — verifica el nombre exacto del modelo',
                $codigo === 429 => 'Límite de tokens diarios alcanzado (rate limit)',
                $codigo >= 500  => 'Error en los servidores de Google — espera unos minutos',
                default         => "Error HTTP {$codigo}",
            };

            $solucion = match(true) {
                $codigo === 401 => 'Regenera la API key en aistudio.google.com y actualízala en Railway',
                $codigo === 404 => 'Cambia el modelo a gemini-2.0-flash en llamarGemini()',
                $codigo === 429 => 'El límite diario se reinicia a medianoche (hora del servidor de Google)',
                $codigo >= 500  => 'Problema temporal de Google — no requiere acción, reintenta en 5 min',
                default         => 'Revisa el body de la respuesta para más detalles',
            };

            Log::warning('Health check Gemini falló', ['codigo' => $codigo, 'body' => $resp->body()]);

            return [
                'ok'          => false,
                'servicio'    => 'gemini',
                'codigo_http' => $codigo,
                'problema'    => $problema,
                'solucion'    => $solucion,
                'latencia_ms' => $latencia,
            ];

        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            return [
                'ok'          => false,
                'servicio'    => 'gemini',
                'problema'    => 'Timeout — Gemini tardó más de 10 segundos en responder',
                'solucion'    => 'Puede ser un problema temporal. Reintenta en 2 minutos.',
                'latencia_ms' => round((microtime(true) - $inicio) * 1000),
            ];
        } catch (\Exception $e) {
            return [
                'ok'          => false,
                'servicio'    => 'gemini',
                'problema'    => 'Excepción inesperada: ' . $e->getMessage(),
                'solucion'    => 'Revisa los logs de Railway para el stack trace completo',
                'latencia_ms' => round((microtime(true) - $inicio) * 1000),
            ];
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // VERIFICAR BASE DE DATOS
    // ─────────────────────────────────────────────────────────────────
    private function verificarBD(): array
    {
        $inicio = microtime(true);
        try {
            DB::select('SELECT 1');
            return [
                'ok'          => true,
                'servicio'    => 'postgresql',
                'latencia_ms' => round((microtime(true) - $inicio) * 1000),
                'estado'      => '✅ Operativo',
            ];
        } catch (\Exception $e) {
            return [
                'ok'          => false,
                'servicio'    => 'postgresql',
                'problema'    => 'No se pudo conectar: ' . $e->getMessage(),
                'solucion'    => 'Verifica DATABASE_URL en Railway Variables',
                'latencia_ms' => round((microtime(true) - $inicio) * 1000),
            ];
        }
    }
}
