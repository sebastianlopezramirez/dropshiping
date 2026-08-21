/*
|--------------------------------------------------------------------------
| PÁGINA: Tienda/Gracias.jsx — Confirmación de pedido
|--------------------------------------------------------------------------
*/

import { Head, Link } from '@inertiajs/react';
import TiendaLayout from '@/Layouts/TiendaLayout';

const cop = (n) => Number(n).toLocaleString('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0
});

export default function Gracias({ pedido }) {
    return (
        <TiendaLayout>
            <Head title={`Pedido ${pedido.numero_pedido} confirmado — GadGet Store`} />

            <div className="max-w-2xl mx-auto px-4 py-12">

                {/* Éxito */}
                <div className="text-center mb-8">
                    <div className="text-6xl mb-4">🎉</div>
                    <h1 className="text-2xl font-bold text-white mb-2">¡Pedido recibido!</h1>
                    {pedido.metodo_pago === 'transferencia' ? (
                        <p className="text-gray-400">
                            Ya se abrió WhatsApp para coordinar tu transferencia. Una vez confirmemos el pago, despachamos tu pedido.
                        </p>
                    ) : (
                        <p className="text-gray-400">
                            Te contactaremos pronto al <strong className="text-white">{pedido.cliente_telefono}</strong> para coordinar el envío y la entrega.
                        </p>
                    )}
                </div>

                {/* Badge método de pago */}
                <div className="flex justify-center mb-6">
                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border ${
                        pedido.metodo_pago === 'transferencia'
                            ? 'bg-green-500/10 text-green-400 border-green-500/30'
                            : 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                    }`}>
                        {pedido.metodo_pago === 'transferencia' ? '💳 Pago con transferencia' : '💵 Pago contra entrega'}
                    </span>
                </div>

                {/* Tarjeta resumen */}
                <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden mb-6">

                    {/* Header */}
                    <div className="bg-gray-800/60 px-6 py-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider">Número de pedido</p>
                            <p className="text-lg font-bold text-orange-400">{pedido.numero_pedido}</p>
                        </div>
                        <span className="bg-yellow-500/20 text-yellow-400 text-xs font-semibold px-3 py-1.5 rounded-full border border-yellow-500/30">
                            Pendiente
                        </span>
                    </div>

                    {/* Items */}
                    <div className="divide-y divide-gray-800">
                        {pedido.items.map((item, i) => (
                            <div key={i} className="flex items-center gap-4 px-6 py-4">
                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-800 shrink-0">
                                    {item.imagen_url
                                        ? <img src={item.imagen_url} alt={item.nombre_producto} className="w-full h-full object-cover" />
                                        : <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                                    }
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white text-sm font-medium line-clamp-1">{item.nombre_producto}</p>
                                    <p className="text-gray-500 text-xs">{item.cantidad} × {cop(item.precio_unitario)}</p>
                                </div>
                                <p className="text-white font-semibold text-sm shrink-0">{cop(item.subtotal)}</p>
                            </div>
                        ))}
                    </div>

                    {/* Totales */}
                    <div className="border-t border-gray-800 px-6 py-4 space-y-2 text-sm">
                        <div className="flex justify-between text-gray-400">
                            <span>Subtotal</span>
                            <span>{cop(pedido.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                            <span>Domicilio ({pedido.ciudad})</span>
                            <span>{cop(pedido.costo_envio)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-800">
                            <span className="text-white">Total</span>
                            <span className="bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
                                {cop(pedido.total)}
                            </span>
                        </div>
                    </div>

                    {/* Dirección */}
                    <div className="border-t border-gray-800 px-6 py-4">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Dirección de entrega</p>
                        <p className="text-white text-sm">{pedido.direccion_entrega}</p>
                        <p className="text-gray-400 text-sm">{pedido.ciudad}</p>
                    </div>
                </div>

                {/* CTA */}
                <div className="text-center space-y-4">
                    <Link href={route('tienda.index')}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold px-8 py-3 rounded-2xl hover:from-orange-600 hover:to-pink-600 transition-all">
                        Seguir comprando
                    </Link>
                    <p className="text-gray-600 text-sm">¿Dudas? Escríbenos por WhatsApp.</p>
                </div>
            </div>
        </TiendaLayout>
    );
}
