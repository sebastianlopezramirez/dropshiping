/*
|--------------------------------------------------------------------------
| PÁGINA: Tienda/Cuenta/Dashboard
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué ve el cliente aquí?
|
|   - Su nombre y datos de contacto
|   - La lista de todos sus pedidos con estado y total
|   - El detalle de cada pedido (expandible)
|
| PENSAR — ¿Qué información mostramos?
|
|   Solo datos propios del cliente. No ve otros pedidos ni clientes.
|   El controller ya filtra por session('cliente_id').
|
*/

import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

// ── Helpers ────────────────────────────────────────────────────────────────
const ESTADOS = {
    pendiente:   { label: 'Pendiente',   color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    confirmado:  { label: 'Confirmado',  color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    entregado:   { label: 'Entregado',   color: 'bg-green-500/20 text-green-400 border-green-500/30' },
    cancelado:   { label: 'Cancelado',   color: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

function EstadoBadge({ estado }) {
    const e = ESTADOS[estado] || { label: estado, color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${e.color}`}>
            {e.label}
        </span>
    );
}

function formatCOP(valor) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(valor);
}

// ── Componente pedido expandible ────────────────────────────────────────────
function PedidoCard({ pedido }) {
    const [abierto, setAbierto] = useState(false);

    return (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">

            {/* Cabecera del pedido */}
            <button
                onClick={() => setAbierto(!abierto)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-800 transition-colors text-left"
            >
                <div className="flex items-center gap-3">
                    <span className="text-white font-mono text-sm">
                        #{pedido.numero_pedido || pedido.id.slice(0, 8).toUpperCase()}
                    </span>
                    <EstadoBadge estado={pedido.estado} />
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-orange-400 font-semibold text-sm">
                        {formatCOP(pedido.total)}
                    </span>
                    <span className="text-gray-500 text-xs">{pedido.creado_en}</span>
                    <span className="text-gray-500 text-sm">{abierto ? '▲' : '▼'}</span>
                </div>
            </button>

            {/* Detalle expandible */}
            {abierto && (
                <div className="border-t border-gray-700 p-4">
                    <p className="text-xs text-gray-500 mb-3 uppercase tracking-wide">Productos</p>
                    <div className="space-y-2">
                        {pedido.items.map((item, i) => (
                            <div key={i} className="flex justify-between items-center text-sm">
                                <span className="text-gray-300">
                                    {item.nombre}
                                    {item.cantidad > 1 && (
                                        <span className="text-gray-500 ml-1">× {item.cantidad}</span>
                                    )}
                                </span>
                                <span className="text-gray-400">{formatCOP(item.precio * item.cantidad)}</span>
                            </div>
                        ))}
                    </div>
                    {pedido.metodo_pago && (
                        <p className="text-xs text-gray-500 mt-3">
                            Pago: <span className="text-gray-400 capitalize">{pedido.metodo_pago}</span>
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Página principal ─────────────────────────────────────────────────────────
export default function Dashboard({ cliente, pedidos = [] }) {

    function handleLogout() {
        router.post(route('tienda.cuenta.logout'));
    }

    return (
        <>
            <Head title={`Mi cuenta — ${cliente?.nombre}`} />

            <div className="min-h-screen bg-gray-950 py-10 px-4">
                <div className="max-w-2xl mx-auto">

                    {/* ── ENCABEZADO ──────────────────────────────────────── */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <Link href={route('tienda.index')} className="text-gray-500 hover:text-orange-400 text-sm transition-colors block mb-1">
                                ← Seguir comprando
                            </Link>
                            <h1 className="text-xl font-bold text-white">
                                Hola, {cliente?.nombre?.split(' ')[0]} 👋
                            </h1>
                            <p className="text-gray-500 text-sm">Cédula: {cliente?.cedula}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="text-sm text-gray-500 hover:text-red-400 transition-colors border border-gray-700 hover:border-red-500/40 px-3 py-1.5 rounded-lg"
                        >
                            Cerrar sesión
                        </button>
                    </div>

                    {/* ── DATOS DEL CLIENTE ───────────────────────────────── */}
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6">
                        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">Tus datos</h2>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <span className="text-gray-500 text-xs">Celular</span>
                                <p className="text-gray-200">{cliente?.celular}</p>
                            </div>
                            {cliente?.ciudad && (
                                <div>
                                    <span className="text-gray-500 text-xs">Ciudad</span>
                                    <p className="text-gray-200">{cliente?.ciudad}</p>
                                </div>
                            )}
                            {cliente?.municipio && (
                                <div>
                                    <span className="text-gray-500 text-xs">Municipio</span>
                                    <p className="text-gray-200">{cliente?.municipio}</p>
                                </div>
                            )}
                            {cliente?.direccion && (
                                <div className="col-span-2">
                                    <span className="text-gray-500 text-xs">Dirección</span>
                                    <p className="text-gray-200">{cliente?.direccion}</p>
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-gray-600 mt-4">
                            Tus datos se actualizan automáticamente con cada nuevo pedido.
                        </p>
                    </div>

                    {/* ── PEDIDOS ─────────────────────────────────────────── */}
                    <div>
                        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">
                            Mis pedidos ({pedidos.length})
                        </h2>

                        {pedidos.length === 0 ? (
                            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 text-center">
                                <p className="text-gray-500 text-sm">Todavía no tenés pedidos.</p>
                                <Link
                                    href={route('tienda.index')}
                                    className="inline-block mt-4 bg-orange-500 hover:bg-orange-400 text-white font-medium text-sm px-5 py-2.5 rounded-xl transition-colors"
                                >
                                    Ver catálogo
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {pedidos.map(pedido => (
                                    <PedidoCard key={pedido.id} pedido={pedido} />
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </>
    );
}
