<?php

/*
|--------------------------------------------------------------------------
| CONTROLLER: ClienteController (Tienda)
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué hace este controller?
|
|   Maneja la "cuenta" del cliente en la tienda pública:
|
|   login()     → muestra el formulario de identificación
|   autenticar()→ verifica cédula + últimos 4 del cel → crea sesión
|   cuenta()    → dashboard del cliente (mis pedidos)
|   logout()    → destruye la sesión del cliente
|
| SEGURIDAD:
|
|   - Rate limiting: máx 5 intentos fallidos por IP en 15 minutos
|   - Sesión cliente separada de la sesión admin (clave 'cliente_id')
|   - Cédula nunca va en URL (siempre POST)
|   - Los datos retornados son mínimos (no exponemos todo el modelo)
|
*/

namespace App\Http\Controllers\Tienda;

use App\Http\Controllers\Controller;
use App\Models\Cliente;
use App\Models\Pedido;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ClienteController extends Controller
{
    /*
    |----------------------------------------------------------------------
    | login() — Muestra el formulario de identificación
    |----------------------------------------------------------------------
    */
    public function login(): InertiaResponse
    {
        // Si ya está identificado, redirigir a su cuenta
        if (session()->has('cliente_id')) {
            return Inertia::render('Tienda/Cuenta/Dashboard', $this->datosCliente());
        }

        return Inertia::render('Tienda/Cuenta/Login');
    }

    /*
    |----------------------------------------------------------------------
    | autenticar() — Verifica cédula + últimos 4 dígitos
    |----------------------------------------------------------------------
    |
    | SEGURIDAD — Rate limiting:
    |
    |   RateLimiter::tooManyAttempts(key, maxAttempts)
    |   Si el mismo IP ha fallado 5 veces en 15 min → bloquear.
    |
    |   ¿Por qué por IP y no por cédula?
    |   Un atacante que prueba cédulas al azar tiene la misma IP.
    |   Bloquear por cédula no sirve si usa cédulas diferentes.
    |
    */
    public function autenticar(Request $request): RedirectResponse|InertiaResponse
    {
        $request->validate([
            'cedula'      => 'required|string|max:20',
            'celular_pin' => 'required|digits:4',
        ]);

        // ── Rate limiting ──────────────────────────────────────────────
        $key = 'login_cliente_' . $request->ip();

        if (RateLimiter::tooManyAttempts($key, maxAttempts: 5)) {
            $segundos = RateLimiter::availableIn($key);
            return back()->withErrors([
                'cedula' => "Demasiados intentos. Volvé a intentar en {$segundos} segundos.",
            ]);
        }

        // ── Buscar cliente ────────────────────────────────────────────
        $cliente = Cliente::where('cedula', $request->cedula)->first();

        if (!$cliente || !$cliente->verificarCelular($request->celular_pin)) {
            // Registrar intento fallido
            RateLimiter::hit($key, decay: 900); // bloquea 15 minutos tras 5 fallos

            return back()->withErrors([
                'cedula' => 'Cédula o PIN incorrecto. Verificá tus datos.',
            ]);
        }

        // ── Éxito: crear sesión del cliente ───────────────────────────
        RateLimiter::clear($key); // limpiar contador de intentos

        // Regenerar session ID para prevenir session fixation
        $request->session()->regenerate();

        session([
            'cliente_id'     => $cliente->id,
            'cliente_nombre' => $cliente->nombre,
        ]);

        return redirect()->route('tienda.cuenta');
    }

    /*
    |----------------------------------------------------------------------
    | cuenta() — Dashboard del cliente: sus pedidos
    |----------------------------------------------------------------------
    */
    public function cuenta(Request $request): InertiaResponse|RedirectResponse
    {
        if (!session()->has('cliente_id')) {
            return redirect()->route('tienda.cuenta.login');
        }

        return Inertia::render('Tienda/Cuenta/Dashboard', $this->datosCliente());
    }

    /*
    |----------------------------------------------------------------------
    | logout() — Destruye la sesión del cliente
    |----------------------------------------------------------------------
    */
    public function logout(Request $request): RedirectResponse
    {
        // Solo eliminar los datos del cliente, no toda la sesión
        // (por si hay otros datos de sesión del sistema)
        $request->session()->forget(['cliente_id', 'cliente_nombre']);

        return redirect()->route('tienda.index')
                         ->with('mensaje', 'Sesión cerrada correctamente.');
    }

    /*
    |----------------------------------------------------------------------
    | datosActuales() — API: retorna datos del cliente para pre-llenar carrito
    |----------------------------------------------------------------------
    |
    | El carrito llama a esta ruta AJAX al cargar para pre-llenar
    | nombre, celular, ciudad, dirección si el cliente está identificado.
    |
    */
    public function datosActuales(Request $request)
    {
        if (!session()->has('cliente_id')) {
            return response()->json(['identificado' => false]);
        }

        $cliente = Cliente::find(session('cliente_id'));

        if (!$cliente) {
            session()->forget(['cliente_id', 'cliente_nombre']);
            return response()->json(['identificado' => false]);
        }

        return response()->json([
            'identificado' => true,
            'datos'        => $cliente->datosCarrito(),
        ]);
    }

    /*
    |----------------------------------------------------------------------
    | exportarExcel() — Descarga todos los clientes como CSV
    |----------------------------------------------------------------------
    |
    | ENTENDER — ¿Por qué CSV y no Excel?
    |
    |   CSV no requiere librerías externas. Excel lo abre automáticamente.
    |   Para un Excel con formato se usaría PhpSpreadsheet, pero para
    |   exportar clientes un CSV limpio es suficiente y más liviano.
    |
    | Solo accesible para admins (ruta protegida con middleware)
    |
    */
    public function exportarExcel(): StreamedResponse
    {
        $clientes = Cliente::with(['pedidos' => function ($q) {
            $q->select('cliente_id', 'total', 'estado', 'creado_en')
              ->orderBy('creado_en', 'desc');
        }])->orderBy('creado_en', 'desc')->get();

        $filename = 'clientes-' . now()->format('Y-m-d') . '.csv';

        return response()->streamDownload(function () use ($clientes) {
            $output = fopen('php://output', 'w');

            // BOM para que Excel abra el CSV con tildes correctamente
            fprintf($output, chr(0xEF) . chr(0xBB) . chr(0xBF));

            // Encabezados
            fputcsv($output, [
                'Cédula',
                'Nombre',
                'Celular',
                'Email',
                'Ciudad',
                'Municipio',
                'Dirección',
                'Total pedidos',
                'Valor total comprado',
                'Último pedido',
                'Registrado desde',
            ]);

            foreach ($clientes as $cliente) {
                $totalPedidos  = $cliente->pedidos->count();
                $valorTotal    = $cliente->pedidos->sum('total');
                $ultimoPedido  = $cliente->pedidos->first()?->creado_en ?? '';

                fputcsv($output, [
                    $cliente->cedula,
                    $cliente->nombre,
                    $cliente->celular,
                    $cliente->email ?? '',
                    $cliente->ciudad ?? '',
                    $cliente->municipio ?? '',
                    $cliente->direccion ?? '',
                    $totalPedidos,
                    number_format($valorTotal, 0, ',', '.'),
                    $ultimoPedido ? substr($ultimoPedido, 0, 10) : '',
                    substr($cliente->creado_en, 0, 10),
                ]);
            }

            fclose($output);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    /*
    |----------------------------------------------------------------------
    | datosCliente() — Helper privado
    |----------------------------------------------------------------------
    */
    private function datosCliente(): array
    {
        $cliente = Cliente::find(session('cliente_id'));

        if (!$cliente) {
            session()->forget(['cliente_id', 'cliente_nombre']);
            return [];
        }

        $pedidos = $cliente->pedidos()
                           ->with('items.producto:id,nombre,slug')
                           ->orderBy('creado_en', 'desc')
                           ->get()
                           ->map(fn($p) => [
                               'id'             => $p->id,
                               'numero_pedido'  => $p->numero_pedido,
                               'estado'         => $p->estado,
                               'total'          => $p->total,
                               'metodo_pago'    => $p->metodo_pago,
                               'creado_en'      => substr($p->creado_en, 0, 10),
                               'items'          => $p->items->map(fn($i) => [
                                   'nombre'   => $i->producto?->nombre ?? $i->nombre_snapshot ?? 'Producto',
                                   'cantidad' => $i->cantidad,
                                   'precio'   => $i->precio_unitario,
                               ]),
                           ]);

        return [
            'cliente' => [
                'nombre'    => $cliente->nombre,
                'celular'   => $cliente->celular,
                'cedula'    => $cliente->cedula,
                'ciudad'    => $cliente->ciudad,
                'municipio' => $cliente->municipio,
                'direccion' => $cliente->direccion,
            ],
            'pedidos' => $pedidos,
        ];
    }
}
