/*
|--------------------------------------------------------------------------
| PÁGINA: Marketing/Asistente.jsx
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué hace esta página?
|
|   Es el ÍNDICE del Asistente de Marketing Pro.
|   Solo visible para super_administrador.
|
|   Izquierda: árbol de categorías → subcategorías (como navegar la tienda)
|   Derecha: tabla de productos con SKU, ROAS actual, fase, estado semáforo
|
|   El admin hace clic en un producto → va a AsistenteProducto.jsx
|
| FLUJO:
|   Dashboard (card Marketing → 🚀 Asistente Pro) → esta página
|   → clic en producto → /marketing/asistente/{producto}
|
*/

import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

// ──────────────────────────────────────────────────────────────────────
// SUBCOMPONENTE: Nodo del árbol de categorías
// ──────────────────────────────────────────────────────────────────────
function NodoCategoria({ categoria, seleccionada, onSeleccionar }) {
    const [expandido, setExpandido] = useState(false);
    const tieneHijos   = categoria.hijos && categoria.hijos.length > 0;
    const activa       = seleccionada?.id === categoria.id;

    return (
        <div>
            {/* Fila de la categoría */}
            <button
                onClick={() => {
                    onSeleccionar(categoria);
                    if (tieneHijos) setExpandido(!expandido);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                    activa
                        ? 'bg-orange-50 text-orange-700 font-semibold'
                        : 'text-gray-700 hover:bg-gray-100'
                }`}
            >
                {tieneHijos && (
                    <span className="text-gray-400 text-xs w-3">
                        {expandido ? '▾' : '▸'}
                    </span>
                )}
                {!tieneHijos && <span className="w-3" />}
                <span className="truncate">{categoria.nombre}</span>
                {/* Badge con cantidad de productos */}
                {(categoria.productos?.length ?? 0) > 0 && (
                    <span className="ml-auto bg-gray-200 text-gray-600 text-xs rounded-full px-2 py-0.5 flex-shrink-0">
                        {categoria.productos.length}
                    </span>
                )}
            </button>

            {/* Subcategorías (hijos) */}
            {tieneHijos && expandido && (
                <div className="ml-4 border-l border-gray-200 pl-2 mt-1 space-y-0.5">
                    {categoria.hijos.map(hijo => (
                        <NodoCategoria
                            key={hijo.id}
                            categoria={hijo}
                            seleccionada={seleccionada}
                            onSeleccionar={onSeleccionar}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ──────────────────────────────────────────────────────────────────────
// SUBCOMPONENTE: Badge de estado del producto en el asistente
// ──────────────────────────────────────────────────────────────────────
function BadgeEstado({ roas, totalMetricas }) {
    if (!totalMetricas || totalMetricas === 0) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500">
                ⚪ Sin iniciar
            </span>
        );
    }
    if (roas >= 3.5) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 font-medium">
                🟢 Escalando
            </span>
        );
    }
    if (roas >= 2.5) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700 font-medium">
                🟡 Optimizando
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700 font-medium">
            🔴 Atención
        </span>
    );
}

// ──────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ──────────────────────────────────────────────────────────────────────
export default function Asistente({ categorias, estadisticas }) {

    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
    const [buscar, setBuscar] = useState('');

    const fmt = (v) => new Intl.NumberFormat('es-CO', {
        style: 'currency', currency: 'COP', minimumFractionDigits: 0,
    }).format(v ?? 0);

    // ── Obtener todos los productos de la categoría seleccionada ──
    const productosDeCategoria = () => {
        if (!categoriaSeleccionada) {
            // Si no hay categoría seleccionada, mostrar todos
            const todos = [];
            categorias.forEach(cat => {
                (cat.productos || []).forEach(p => todos.push(p));
                (cat.hijos || []).forEach(hijo => {
                    (hijo.productos || []).forEach(p => todos.push(p));
                });
            });
            return todos;
        }

        // Productos de la categoría seleccionada
        const directos = categoriaSeleccionada.productos || [];

        // También incluir productos de subcategorías si la seleccionada es padre
        const deHijos = [];
        if (categoriaSeleccionada.hijos) {
            categoriaSeleccionada.hijos.forEach(h => {
                (h.productos || []).forEach(p => deHijos.push(p));
            });
        }

        return [...directos, ...deHijos];
    };

    // ── Filtrar por búsqueda (nombre o SKU) ──
    const productosFiltrados = productosDeCategoria().filter(p => {
        if (!buscar.trim()) return true;
        const q = buscar.toLowerCase();
        return p.nombre.toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q);
    });

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🚀</span>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Asistente de Marketing Pro</h2>
                            <p className="text-sm text-gray-500">Estrategia y optimización con IA para cada producto</p>
                        </div>
                    </div>
                    <Link
                        href={route('campanas.index')}
                        className="text-sm text-gray-500 hover:text-gray-700"
                    >
                        ← Volver a Campañas
                    </Link>
                </div>
            }
        >
            <Head title="Asistente Marketing Pro" />

            <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">

                {/* ── Tarjetas de estadísticas ── */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Productos activos</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{estadisticas.total_productos}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Con métricas</p>
                        <p className="text-2xl font-bold text-blue-600 mt-1">{estadisticas.con_metricas}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">🟢 Escalando</p>
                        <p className="text-2xl font-bold text-green-600 mt-1">{estadisticas.escalando}</p>
                    </div>
                </div>

                {/* ── Layout de dos columnas ── */}
                <div className="flex gap-5">

                    {/* ══ COLUMNA IZQUIERDA: Árbol de categorías ══ */}
                    <div className="w-64 flex-shrink-0">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                                <h3 className="text-sm font-semibold text-gray-700">📂 Categorías</h3>
                            </div>
                            <div className="p-2 space-y-0.5 max-h-[calc(100vh-280px)] overflow-y-auto">
                                {/* Opción "Todos" */}
                                <button
                                    onClick={() => setCategoriaSeleccionada(null)}
                                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                                        !categoriaSeleccionada
                                            ? 'bg-orange-50 text-orange-700 font-semibold'
                                            : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    <span>🏪</span>
                                    <span>Todos los productos</span>
                                </button>

                                {/* Árbol de categorías */}
                                {categorias.map(cat => (
                                    <NodoCategoria
                                        key={cat.id}
                                        categoria={cat}
                                        seleccionada={categoriaSeleccionada}
                                        onSeleccionar={setCategoriaSeleccionada}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ══ COLUMNA DERECHA: Tabla de productos ══ */}
                    <div className="flex-1 min-w-0">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

                            {/* Header con buscador */}
                            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3">
                                <h3 className="text-sm font-semibold text-gray-700">
                                    {categoriaSeleccionada
                                        ? `📁 ${categoriaSeleccionada.nombre}`
                                        : '🏪 Todos los productos'}
                                    <span className="ml-2 text-gray-400 font-normal">
                                        ({productosFiltrados.length})
                                    </span>
                                </h3>
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre o SKU…"
                                    value={buscar}
                                    onChange={e => setBuscar(e.target.value)}
                                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-orange-400"
                                />
                            </div>

                            {/* Tabla */}
                            {productosFiltrados.length === 0 ? (
                                <div className="py-16 text-center text-gray-400">
                                    <p className="text-4xl mb-3">📦</p>
                                    <p className="text-sm">
                                        {buscar
                                            ? 'No hay productos que coincidan con la búsqueda.'
                                            : 'No hay productos en esta categoría.'}
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-gray-50 text-left">
                                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">SKU</th>
                                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Producto</th>
                                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Precio</th>
                                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado tienda</th>
                                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado IA</th>
                                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {productosFiltrados.map(producto => (
                                                <tr key={producto.id} className="hover:bg-gray-50 transition-colors">
                                                    {/* SKU */}
                                                    <td className="px-4 py-3">
                                                        <code className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-mono">
                                                            {producto.sku || '—'}
                                                        </code>
                                                    </td>

                                                    {/* Nombre */}
                                                    <td className="px-4 py-3">
                                                        <p className="font-medium text-gray-900 line-clamp-1">{producto.nombre}</p>
                                                    </td>

                                                    {/* Precio */}
                                                    <td className="px-4 py-3 text-gray-600 tabular-nums">
                                                        {fmt(producto.precio_venta)}
                                                    </td>

                                                    {/* Estado tienda */}
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                                            producto.estado === 'activo'
                                                                ? 'bg-green-100 text-green-700'
                                                                : 'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                            {producto.estado === 'activo' ? '✅ Activo' : '📝 Borrador'}
                                                        </span>
                                                    </td>

                                                    {/* Estado IA (sin métricas por ahora en esta vista) */}
                                                    <td className="px-4 py-3">
                                                        <BadgeEstado roas={0} totalMetricas={0} />
                                                    </td>

                                                    {/* Botón analizar */}
                                                    <td className="px-4 py-3 text-right">
                                                        <Link
                                                            href={route('marketing.asistente.producto', producto.id)}
                                                            className="inline-flex items-center gap-1 bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                                                        >
                                                            🤖 Analizar
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Leyenda de estados */}
                        <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                            <span>⚪ Sin iniciar</span>
                            <span>🟢 Escalando (ROAS ≥ 3.5x)</span>
                            <span>🟡 Optimizando (ROAS 2.5–3.5x)</span>
                            <span>🔴 Atención (ROAS &lt; 2.5x)</span>
                        </div>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
