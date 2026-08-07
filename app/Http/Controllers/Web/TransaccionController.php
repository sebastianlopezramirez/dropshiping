<?php

/*
|--------------------------------------------------------------------------
| CONTROLADOR: TransaccionController
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué métodos tiene?
|
|   GET    /transacciones           → index()           — lista de pagos
|   GET    /transacciones/create    → create()          — formulario manual
|   POST   /transacciones           → store()           — guardar pago manual
|   GET    /transacciones/{id}      → show()            — detalle del pago
|   PATCH  /transacciones/{id}      → update()          — anular transacción
|   POST   /transacciones/wompi/{pedido} → generarLinkWompi() — link de pago
|   POST   /wompi/webhook           → webhookWompi()    — PÚBLICO, recibe Wompi
|
| PENSAR — ¿Qué es el webhook de Wompi?
|
|   Wompi llama a nuestra URL cuando el cliente paga. No requiere que el
|   usuario esté logueado — es una llamada server-to-server. Por eso su
|   ruta está FUERA del middleware de autenticación.
|
|   Flujo Wompi:
|   1. Generamos un link de pago → cliente hace clic
|   2. Cliente paga en la página de Wompi
|   3. Wompi llama POST /wompi/webhook con los datos del pago
|   4. Verificamos la firma (integrity_signature) para asegurarnos que es real
|   5. Actualizamos el estado de la Transaccion en nuestra BD
|
*/

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Pedido;
use App\Models\Transaccion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class TransaccionController extends Controller
{
    /*
    |----------------------------------------------------------------------
    | index() — Lista de transacciones con filtros
    |----------------------------------------------------------------------
    */
    public function index(Request $request): Response
    {
        $query = Transaccion::with('pedido')
                            ->orderBy('creado_en', 'desc');

        // Filtrar por número de pedido o referencia
        if ($request->filled('buscar')) {
            $termino = $request->buscar;
            $query->where(function ($q) use ($termino) {
                $q->where('referencia_wompi', 'ilike', '%' . $termino . '%')
                  ->orWhere('referencia_pago', 'ilike', '%' . $termino . '%')
                  ->orWhereHas('pedido', fn ($p) =>
                      $p->where('numero_pedido', 'ilike', '%' . $termino . '%')
                        ->orWhere('cliente_nombre', 'ilike', '%' . $termino . '%')
                  );
            });
        }

        if ($request->filled('estado')) {
            $query->where('estado', $request->estado);
        }

        if ($request->filled('metodo')) {
            $query->where('metodo_pago', $request->metodo);
        }

        if ($request->filled('periodo')) {
            match ($request->periodo) {
                'hoy'    => $query->whereDate('creado_en', today()),
                'semana' => $query->whereBetween('creado_en', [now()->startOfWeek(), now()->endOfWeek()]),
                'mes'    => $query->whereMonth('creado_en', now()->month)->whereYear('creado_en', now()->year),
                default  => null,
            };
        }

        $transacciones = $query->paginate(20)->withQueryString();

        // Estadísticas rápidas
        $estadisticas = [
            'total_aprobadas_mes' => Transaccion::aprobadas()->delMes()->sum('monto'),
            'total_pendientes'    => Transaccion::where('estado', Transaccion::ESTADO_PENDIENTE)->count(),
            'total_hoy'           => Transaccion::aprobadas()->deHoy()->sum('monto'),
            'count_hoy'           => Transaccion::deHoy()->count(),
        ];

        return Inertia::render('Finanzas/Transacciones/Index', [
            'transacciones' => $transacciones,
            'estadisticas'  => $estadisticas,
            'estados'       => Transaccion::todosLosEstados(),
            'metodos'       => Transaccion::metodosConEtiqueta(),
            'filtros'       => $request->only(['buscar', 'estado', 'metodo', 'periodo']),
            'flash'         => ['exito' => session('exito'), 'error' => session('error')],
        ]);
    }

    /*
    |----------------------------------------------------------------------
    | create() — Formulario para registrar un pago manual
    |----------------------------------------------------------------------
    */
    public function create(): Response
    {
        // Pedidos pendientes de pago (sin transacción aprobada aún)
        $pedidos = Pedido::whereDoesntHave('transacciones', fn ($q) =>
            $q->where('estado', Transaccion::ESTADO_APROBADA)
        )->orderBy('creado_en', 'desc')
         ->get(['id', 'numero_pedido', 'cliente_nombre', 'total']);

        return Inertia::render('Finanzas/Transacciones/Crear', [
            'pedidos' => $pedidos,
            'metodos' => Transaccion::metodosConEtiqueta(),
        ]);
    }

    /*
    |----------------------------------------------------------------------
    | store() — Guarda un pago manual
    |----------------------------------------------------------------------
    */
    public function store(Request $request)
    {
        $datos = $request->validate([
            'pedido_id'       => 'required|uuid|exists:pedidos,id',
            'metodo_pago'     => ['required', Rule::in(Transaccion::todosLosMetodos())],
            'monto'           => 'required|numeric|min:1',
            'referencia_pago' => 'nullable|string|max:100',
            'descripcion'     => 'nullable|string|max:250',
            'estado'          => ['required', Rule::in(Transaccion::todosLosEstados())],
        ]);

        Transaccion::create($datos);

        return redirect()
            ->route('transacciones.index')
            ->with('exito', 'Pago registrado correctamente.');
    }

    /*
    |----------------------------------------------------------------------
    | show() — Detalle de una transacción
    |----------------------------------------------------------------------
    */
    public function show(Transaccion $transaccion): Response
    {
        $transaccion->load('pedido.items');

        return Inertia::render('Finanzas/Transacciones/Ver', [
            'transaccion' => $transaccion,
            'flash'       => ['exito' => session('exito'), 'error' => session('error')],
        ]);
    }

    /*
    |----------------------------------------------------------------------
    | update() — Anular una transacción (único cambio permitido)
    |----------------------------------------------------------------------
    |
    | PENSAR — ¿Por qué solo se puede anular?
    |
    |   Los registros financieros son inmutables. No se puede cambiar el
    |   monto ni el método después de creada. Solo se puede anular para
    |   que no cuente en los totales del dashboard.
    |
    */
    public function update(Request $request, Transaccion $transaccion)
    {
        $request->validate([
            'estado' => ['required', Rule::in([
                Transaccion::ESTADO_APROBADA,
                Transaccion::ESTADO_ANULADA,
            ])],
        ]);

        $transaccion->update(['estado' => $request->estado]);

        return back()->with('exito', 'Estado actualizado correctamente.');
    }

    /*
    |----------------------------------------------------------------------
    | generarLinkWompi() — Crea un link de pago en Wompi
    |----------------------------------------------------------------------
    |
    | PENSAR — ¿Cómo funciona un link de pago Wompi?
    |
    |   1. Hacemos POST a la API de Wompi con los datos del pedido
    |   2. Wompi devuelve una URL (ej: https://checkout.wompi.co/l/abc123)
    |   3. El vendedor envía esa URL al cliente (WhatsApp, email, etc.)
    |   4. El cliente paga → Wompi llama nuestro webhook automáticamente
    |
    |   Credenciales en .env:
    |   WOMPI_PUBLIC_KEY=pub_test_xxx
    |   WOMPI_PRIVATE_KEY=prv_test_xxx
    |   WOMPI_INTEGRITY_KEY=test_integrity_xxx
    |   WOMPI_SANDBOX=true
    |
    */
    public function generarLinkWompi(Pedido $pedido)
    {
        $esSandbox  = config('services.wompi.sandbox', true);
        $baseUrl    = $esSandbox
            ? 'https://sandbox.wompi.co/v1'
            : 'https://production.wompi.co/v1';

        $privateKey = config('services.wompi.private_key');

        // Wompi trabaja en CENTAVOS
        $montoCentavos = (int) round($pedido->total * 100);

        $response = Http::withToken($privateKey)
            ->post("{$baseUrl}/payment_links", [
                'name'            => "Pedido {$pedido->numero_pedido}",
                'description'     => "Pago de {$pedido->cliente_nombre}",
                'single_use'      => true,
                'collect_shipping' => false,
                'currency'        => 'COP',
                'amount_in_cents' => $montoCentavos,
                'redirect_url'    => route('pedidos.show', $pedido->id),
                'reference'       => $pedido->numero_pedido,
            ]);

        if ($response->failed()) {
            return back()->with('error', 'No se pudo generar el link de Wompi. Verifica las credenciales.');
        }

        $linkData = $response->json('data');

        // Crear una transacción pendiente vinculada al pedido
        Transaccion::create([
            'pedido_id'   => $pedido->id,
            'metodo_pago' => Transaccion::METODO_WOMPI,
            'monto'       => $pedido->total,
            'estado'      => Transaccion::ESTADO_PENDIENTE,
            'descripcion' => "Link Wompi generado: {$linkData['id']}",
            'datos_wompi' => $linkData,
        ]);

        return back()->with('exito', "Link generado: {$linkData['permalink']}");
    }

    /*
    |----------------------------------------------------------------------
    | webhookWompi() — Recibe notificaciones de Wompi (ruta PÚBLICA)
    |----------------------------------------------------------------------
    |
    | PENSAR — ¿Cómo verificamos que el webhook es real?
    |
    |   Wompi firma cada evento con nuestra "llave de integridad".
    |   El checksum se calcula así:
    |
    |   string = id + status + amount_in_cents + timestamp + integrity_key
    |   checksum = SHA256(string)
    |
    |   Si el checksum no coincide → es una petición falsa, la ignoramos.
    |
    */
    public function webhookWompi(Request $request)
    {
        $payload = $request->all();

        // ── VERIFICAR FIRMA DE INTEGRIDAD ─────────────────────────────────
        if (!$this->verificarFirmaWompi($payload)) {
            Log::warning('Wompi webhook: firma inválida', ['payload' => $payload]);
            return response()->json(['error' => 'Firma inválida'], 401);
        }

        // ── PROCESAR SOLO EVENTOS DE TRANSACCIÓN ──────────────────────────
        if (($payload['event'] ?? '') !== 'transaction.updated') {
            return response()->json(['status' => 'ignorado']);
        }

        $txWompi = $payload['data']['transaction'] ?? null;
        if (!$txWompi) {
            return response()->json(['error' => 'Payload inválido'], 400);
        }

        // ── BUSCAR TRANSACCIÓN POR REFERENCIA ─────────────────────────────
        // La referencia es el numero_pedido que enviamos al crear el link
        $pedido = Pedido::where('numero_pedido', $txWompi['reference'])->first();

        if (!$pedido) {
            Log::warning('Wompi webhook: pedido no encontrado', ['reference' => $txWompi['reference']]);
            return response()->json(['error' => 'Pedido no encontrado'], 404);
        }

        // ── MAPEAR ESTADO WOMPI → NUESTRO ESTADO ─────────────────────────
        $estadoMap = [
            'APPROVED' => Transaccion::ESTADO_APROBADA,
            'DECLINED' => Transaccion::ESTADO_RECHAZADA,
            'ERROR'    => Transaccion::ESTADO_ERROR,
            'VOIDED'   => Transaccion::ESTADO_ANULADA,
            'PENDING'  => Transaccion::ESTADO_PENDIENTE,
        ];
        $estadoLocal = $estadoMap[$txWompi['status']] ?? Transaccion::ESTADO_ERROR;

        // ── ACTUALIZAR O CREAR TRANSACCIÓN ────────────────────────────────
        Transaccion::updateOrCreate(
            ['referencia_wompi' => $txWompi['id']],
            [
                'pedido_id'        => $pedido->id,
                'metodo_pago'      => Transaccion::METODO_WOMPI,
                'monto'            => $txWompi['amount_in_cents'] / 100, // centavos → pesos
                'estado'           => $estadoLocal,
                'datos_wompi'      => $txWompi,
                'pagado_en'        => $estadoLocal === Transaccion::ESTADO_APROBADA ? now() : null,
            ]
        );

        Log::info('Wompi webhook procesado', [
            'pedido'    => $pedido->numero_pedido,
            'estado'    => $estadoLocal,
            'referencia' => $txWompi['id'],
        ]);

        return response()->json(['status' => 'ok']);
    }

    /*
    |----------------------------------------------------------------------
    | verificarFirmaWompi() — Valida que el webhook viene de Wompi
    |----------------------------------------------------------------------
    */
    private function verificarFirmaWompi(array $payload): bool
    {
        $integrityKey = config('services.wompi.integrity_key');

        if (!$integrityKey) {
            // En desarrollo sin clave configurada, aceptamos todo
            return app()->environment('local');
        }

        $signature   = $payload['signature'] ?? [];
        $checksum    = $signature['checksum'] ?? '';
        $properties  = $signature['properties'] ?? [];
        $timestamp   = $payload['timestamp'] ?? '';

        // Construir el string a hashear
        $txData = $payload['data']['transaction'] ?? [];
        $string = '';
        foreach ($properties as $prop) {
            // Las properties son dot-notation: "transaction.id" → $txData['id']
            $key     = str_replace('transaction.', '', $prop);
            $string .= $txData[$key] ?? '';
        }
        $string .= $timestamp . $integrityKey;

        return hash('sha256', $string) === $checksum;
    }
}
