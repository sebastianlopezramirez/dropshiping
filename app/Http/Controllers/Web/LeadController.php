<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\ConsentimientoMarketing;
use App\Models\ItemPedido;
use App\Models\Pedido;
use App\Models\Producto;
use App\Models\TarifaDomicilio;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LeadController extends Controller
{
    /**
     * ENTENDER — ¿Qué hace este endpoint?
     *
     *   Recibe el pedido desde la página de detalle de producto (Tienda/Producto.jsx).
     *   A diferencia del carrito (que puede tener varios productos), aquí siempre
     *   es 1 producto con cantidad 1.
     *
     * PENSAR — ¿Qué hace en orden?
     *   1. Valida los datos del cliente y el producto
     *   2. Carga el producto desde la BD (no confía en el precio del cliente)
     *   3. Obtiene la tarifa de domicilio para el municipio seleccionado
     *   4. Crea el Pedido + ItemPedido en una transacción
     *   5. Descuenta el stock del producto
     *   6. Guarda el consentimiento de marketing (para el export CSV/Excel)
     *   7. Devuelve JSON con los datos del pedido para armar el mensaje WhatsApp
     */
    public function guardar(Request $request)
    {
        // ─── 1. VALIDACIÓN ────────────────────────────────────────────────────
        $data = $request->validate([
            'nombre'        => ['required', 'string', 'max:150'],
            'celular'       => ['required', 'string', 'max:20'],
            'email'         => ['nullable', 'email', 'max:150'],
            'municipio'     => ['required', 'string', 'max:100'],
            'direccion'     => ['required', 'string', 'max:300'],
            'acepta_datos'  => ['required', 'boolean'],
            'metodo_pago'   => ['required', 'in:contra_entrega,transferencia'],
            'producto_id'   => ['required', 'uuid', 'exists:productos,id'],
            'categoria'     => ['nullable', 'string', 'max:100'],
            'notas'         => ['nullable', 'string', 'max:500'],
        ]);

        // ─── 2. CARGAR PRODUCTO DESDE BD (precio real, no del cliente) ────────
        $producto = Producto::where('id', $data['producto_id'])
                            ->where('estado', 'activo')
                            ->firstOrFail();

        // Verificar stock disponible (null = ilimitado)
        if (!is_null($producto->stock) && $producto->stock < 1) {
            return response()->json([
                'ok'    => false,
                'error' => 'Este producto no tiene stock disponible.',
            ], 422);
        }

        // Precio real: oferta si existe y es menor
        $tieneOferta = $producto->precio_oferta
            && (float) $producto->precio_oferta < (float) $producto->precio_venta;
        $precioUnitario = $tieneOferta
            ? (float) $producto->precio_oferta
            : (float) $producto->precio_venta;

        // ─── 3. TARIFA DE DOMICILIO ───────────────────────────────────────────
        $tarifa     = TarifaDomicilio::where('nombre', $data['municipio'])
                                     ->where('activo', true)
                                     ->first();
        $costoEnvio = $tarifa ? (float) $tarifa->precio : 0;
        $subtotal   = $precioUnitario;
        $total      = $subtotal + $costoEnvio;

        // ─── 4. CREAR PEDIDO + ITEM EN TRANSACCIÓN ────────────────────────────
        try {
            $pedido = DB::transaction(function () use (
                $data, $producto, $precioUnitario, $subtotal, $costoEnvio, $total
            ) {
                // Imagen principal del producto
                try {
                    $imagenUrl = $producto->getFirstMediaUrl('imagenes') ?: null;
                } catch (\Exception $e) {
                    $imagenUrl = null;
                }
                if (!$imagenUrl && !empty($producto->imagenes)) {
                    $imagenUrl = is_array($producto->imagenes)
                        ? ($producto->imagenes[0] ?? null) : null;
                }

                // Nota especial para recogida en tienda
                $notas = $data['notas'] ?? null;

                $pedido = Pedido::create([
                    'cliente_nombre'    => $data['nombre'],
                    'cliente_email'     => $data['email'] ?? '',
                    'cliente_telefono'  => $data['celular'],
                    'direccion_entrega' => $data['direccion'],
                    'ciudad'            => $data['municipio'],
                    'departamento'      => 'Antioquia',
                    'estado'            => 'pendiente',
                    'metodo_pago'       => $data['metodo_pago'],
                    'subtotal'          => $subtotal,
                    'costo_envio'       => $costoEnvio,
                    'descuento'         => 0,
                    'total'             => $total,
                    'notas'             => $notas,
                ]);

                ItemPedido::create([
                    'pedido_id'       => $pedido->id,
                    'producto_id'     => $producto->id,
                    'nombre_producto' => $producto->nombre,
                    'sku'             => $producto->sku ?? null,
                    'imagen_url'      => $imagenUrl,
                    'cantidad'        => 1,
                    'precio_unitario' => $precioUnitario,
                    'precio_costo'    => (float) ($producto->precio_costo ?? 0),
                    'descuento'       => 0,
                    'subtotal'        => $subtotal,
                ]);

                // ─── 5. DESCONTAR STOCK (solo si no es ilimitado) ─────────────
                if (!is_null($producto->stock)) {
                    $producto->decrement('stock', 1);
                }

                return $pedido;
            });

            // ─── 6. CONSENTIMIENTO DE MARKETING ──────────────────────────────
            if (!empty($data['acepta_datos'])) {
                ConsentimientoMarketing::create([
                    'nombre'            => $data['nombre'],
                    'celular'           => $data['celular'],
                    'municipio'         => $data['municipio'],
                    'categoria_interes' => $data['categoria'] ?? $producto->nombre,
                    'numero_pedido'     => $pedido->numero_pedido,
                    'consentimiento_en' => now(),
                ]);
            }

            // ─── 7. RESPUESTA JSON AL FRONTEND ───────────────────────────────
            return response()->json([
                'ok'    => true,
                'pedido' => [
                    'numero'      => $pedido->numero_pedido,
                    'subtotal'    => $subtotal,
                    'costo_envio' => $costoEnvio,
                    'total'       => $total,
                    'metodo_pago' => $pedido->metodo_pago,
                ],
            ]);

        } catch (\Exception $e) {
            \Log::error('LeadController@guardar: ' . $e->getMessage());
            return response()->json([
                'ok'    => false,
                'error' => 'Error al registrar el pedido. Inténtalo de nuevo.',
            ], 500);
        }
    }
}
