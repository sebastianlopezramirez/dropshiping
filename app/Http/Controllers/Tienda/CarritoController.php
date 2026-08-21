<?php

/*
|--------------------------------------------------------------------------
| CONTROLADOR: CarritoController
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué hace este controlador?
|
|   Gestiona el proceso de compra público (sin login):
|
|   GET  /tienda/carrito         → index()   Página del carrito + formulario
|   POST /tienda/pedido          → store()   Guardar pedido en BD
|   GET  /tienda/pedido/{numero} → gracias() Página de confirmación
|
| PENSAR — El carrito vive en React (localStorage).
|
|   El servidor NO sabe qué hay en el carrito hasta que el cliente
|   envía el formulario. En ese momento store() recibe los items
|   en el body del request y los guarda en la BD.
|
*/

namespace App\Http\Controllers\Tienda;

use App\Http\Controllers\Controller;
use App\Models\Categoria;
use App\Models\ConsentimientoMarketing;
use App\Models\ItemPedido;
use App\Models\Pedido;
use App\Models\Producto;
use App\Models\TarifaDomicilio;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class CarritoController extends Controller
{
    /*
    |----------------------------------------------------------------------
    | index() — Página del carrito (renderiza React Carrito.jsx)
    |----------------------------------------------------------------------
    |
    | Envía al frontend las tarifas de domicilio para que el selector
    | muestre los precios automáticamente sin hacer otra petición.
    |
    */
    public function index(): Response
    {
        $tarifas = TarifaDomicilio::activas()
            ->select('id', 'nombre', 'tipo', 'precio', 'orden')
            ->get();

        $categorias = Categoria::where('activo', true)
            ->orderBy('nombre')
            ->select('id', 'nombre')
            ->get();

        return Inertia::render('Tienda/Carrito', [
            'tarifas'    => $tarifas,
            'categorias' => $categorias,
        ]);
    }

    /*
    |----------------------------------------------------------------------
    | store() — Guardar el pedido en la BD
    |----------------------------------------------------------------------
    |
    | PENSAR — ¿Qué validamos?
    |
    |   1. Datos del cliente (nombre, teléfono, dirección)
    |   2. Municipio (debe existir en tarifas_domicilio activas)
    |   3. Items: array de {producto_id, cantidad}
    |
    |   Luego re-calculamos precios desde la BD (no confiamos en el cliente)
    |   para evitar que alguien manipule precios desde el navegador.
    |
    */
    public function store(Request $request)
    {
        // ─── VALIDACIÓN ────────────────────────────────────────────────────
        $data = $request->validate([
            'cliente_nombre'   => 'required|string|max:150',
            'cliente_telefono' => 'required|string|max:20',
            'cliente_email'    => 'nullable|email|max:150',
            'municipio'        => 'required|string|max:100',
            'direccion'        => 'required|string|max:250',
            'notas'            => 'nullable|string|max:500',
            'metodo_pago'        => 'required|in:contra_entrega,transferencia',
            'acepta_datos'       => 'nullable|boolean',
            'cedula'             => 'nullable|string|max:20',
            'items'              => 'required|array|min:1',
            'items.*.producto_id' => 'required|uuid|exists:productos,id',
            'items.*.cantidad'    => 'required|integer|min:1|max:99',
        ]);

        // ─── OBTENER TARIFA DE DOMICILIO ───────────────────────────────────
        $tarifa = TarifaDomicilio::where('nombre', $data['municipio'])
                                 ->where('activo', true)
                                 ->first();

        $costoEnvio = $tarifa ? $tarifa->precio : 0;

        // ─── CARGAR PRODUCTOS DESDE LA BD (re-validar precios) ─────────────
        $idsProductos = collect($data['items'])->pluck('producto_id');
        $productos    = Producto::with('categoria')
                                ->whereIn('id', $idsProductos)
                                ->where('estado', 'activo')
                                ->get()
                                ->keyBy('id');

        if ($productos->isEmpty()) {
            return back()->withErrors(['items' => 'No se encontraron productos válidos.']);
        }

        // ─── CALCULAR TOTALES ──────────────────────────────────────────────
        $subtotal = 0;
        $itemsData = [];

        foreach ($data['items'] as $item) {
            $producto = $productos->get($item['producto_id']);
            if (!$producto) continue;

            $precio    = (float) $producto->precio_venta;
            $cantidad  = (int)   $item['cantidad'];
            $subtotalItem = $precio * $cantidad;
            $subtotal    += $subtotalItem;

            // URL de primera imagen (Spatie Media Library o campo legacy)
            try {
                $imagenUrl = $producto->getFirstMediaUrl('imagenes') ?: null;
            } catch (\Exception $e) {
                $imagenUrl = null;
            }
            if (!$imagenUrl && !empty($producto->imagenes)) {
                $imagenUrl = is_array($producto->imagenes)
                    ? ($producto->imagenes[0] ?? null)
                    : null;
            }

            $itemsData[] = [
                'producto_id'    => $producto->id,
                'nombre_producto'=> $producto->nombre,
                'sku'            => $producto->sku ?? null,
                'imagen_url'     => $imagenUrl,
                'cantidad'       => $cantidad,
                'precio_unitario'=> $precio,
                'precio_costo'   => (float) ($producto->precio_costo ?? 0),
                'descuento'      => 0,
                'subtotal'       => $subtotalItem,
            ];
        }

        $total = $subtotal + $costoEnvio;

        // ─── GUARDAR EN BD ─────────────────────────────────────────────────
        try {
            $pedido = DB::transaction(function () use ($data, $subtotal, $costoEnvio, $total, $itemsData) {

                $pedido = Pedido::create([
                    'cliente_nombre'   => $data['cliente_nombre'],
                    'cliente_email'    => $data['cliente_email']    ?? '',
                    'cliente_telefono' => $data['cliente_telefono'],
                    'direccion_entrega'=> $data['direccion'],
                    'ciudad'           => $data['municipio'],
                    'departamento'     => 'Antioquia',
                    'estado'           => 'pendiente',
                    'metodo_pago'      => $data['metodo_pago'],
                    'subtotal'         => $subtotal,
                    'costo_envio'      => $costoEnvio,
                    'descuento'        => 0,
                    'total'            => $total,
                    'notas'            => $data['notas'] ?? null,
                ]);

                foreach ($itemsData as $item) {
                    ItemPedido::create(array_merge($item, ['pedido_id' => $pedido->id]));
                }

                return $pedido;
            });

            // ─── GUARDAR CONSENTIMIENTO DE MARKETING (solo si aceptó) ─────────
            if (!empty($data['acepta_datos'])) {
                // Detectar categorías de los productos del pedido
                $categorias = $productos->map(fn($p) => $p->categoria?->nombre ?? null)
                                        ->filter()
                                        ->unique()
                                        ->values()
                                        ->join(', ');

                ConsentimientoMarketing::create([
                    'nombre'            => $data['cliente_nombre'],
                    'cedula'            => $data['cedula'] ?? null,
                    'celular'           => $data['cliente_telefono'],
                    'municipio'         => $data['municipio'],
                    'categoria_interes' => $categorias ?: null,
                    'numero_pedido'     => $pedido->numero_pedido,
                ]);
            }

            return redirect()
                ->route('tienda.pedido.gracias', $pedido->numero_pedido)
                ->with('success', '¡Pedido recibido! Te contactaremos pronto.')
                ->with('metodo_pago', $pedido->metodo_pago);

        } catch (\Exception $e) {
            \Log::error('CarritoController@store: ' . $e->getMessage());
            return back()->withErrors(['general' => 'Error al procesar el pedido: ' . $e->getMessage()]);
        }
    }

    /*
    |----------------------------------------------------------------------
    | gracias() — Página de confirmación del pedido
    |----------------------------------------------------------------------
    */
    public function gracias(string $numero): Response
    {
        $pedido = Pedido::with('items')
                        ->where('numero_pedido', $numero)
                        ->firstOrFail();

        return Inertia::render('Tienda/Gracias', [
            'pedido' => [
                'numero_pedido'    => $pedido->numero_pedido,
                'cliente_nombre'   => $pedido->cliente_nombre,
                'cliente_telefono' => $pedido->cliente_telefono,
                'ciudad'           => $pedido->ciudad,
                'direccion_entrega'=> $pedido->direccion_entrega,
                'subtotal'         => $pedido->subtotal,
                'costo_envio'      => $pedido->costo_envio,
                'total'            => $pedido->total,
                'estado'           => $pedido->estado,
                'metodo_pago'      => $pedido->metodo_pago,
                'items'            => $pedido->items->map(fn($i) => [
                    'nombre_producto' => $i->nombre_producto,
                    'cantidad'        => $i->cantidad,
                    'precio_unitario' => $i->precio_unitario,
                    'subtotal'        => $i->subtotal,
                    'imagen_url'      => $i->imagen_url,
                ]),
            ],
        ]);
    }
}
