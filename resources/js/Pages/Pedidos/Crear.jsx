/*
|--------------------------------------------------------------------------
| PÁGINA: Pedidos/Crear.jsx
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué hace este formulario?
|
|   Registra un nuevo pedido con:
|   1. Datos del cliente (nombre, email, teléfono, documento)
|   2. Dirección de entrega (dirección, ciudad, departamento, barrio)
|   3. Productos del pedido (selector dinámico, cantidad, precio)
|   4. Totales calculados en tiempo real
|
| PENSAR — ¿Cómo funciona el selector de productos?
|
|   - El usuario busca y selecciona un producto del catálogo
|   - Se agrega a la lista de ítems con su precio y cantidad
|   - Puede agregar varios productos al mismo pedido
|   - Los totales se recalculan cada vez que cambia algo
|
*/

import { useState, useMemo } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Crear({ productos, estados }) {

    // ── ESTADO LOCAL ─────────────────────────────────────────────────────
    // Items del pedido (los productos que el cliente está comprando)
    const [items, setItems]             = useState([]);
    // Búsqueda en el selector de productos
    const [buscarProducto, setBuscarProducto] = useState('');
    // Mostrar/ocultar el selector de productos
    const [mostrarSelector, setMostrarSelector] = useState(false);

    // ── FORM INERTIA ─────────────────────────────────────────────────────
    const { data, setData, post, processing, errors } = useForm({
        cliente_nombre:    '',
        cliente_email:     '',
        cliente_telefono:  '',
        cliente_documento: '',
        direccion_entrega: '',
        ciudad:            '',
        departamento:      '',
        codigo_postal:     '',
        barrio:            '',
        estado:            'pendiente',
        costo_envio:       0,
        descuento:         0,
        notas:             '',
        notas_internas:    '',
        items:             [],
    });

    // ── CÁLCULOS EN TIEMPO REAL ──────────────────────────────────────────
    const subtotal = useMemo(() =>
        items.reduce((sum, item) => sum + (item.precio_unitario * item.cantidad) - (item.descuento ?? 0), 0),
    [items]);

    const total = useMemo(() =>
        subtotal + Number(data.costo_envio || 0) - Number(data.descuento || 0),
    [subtotal, data.costo_envio, data.descuento]);

    // ── HELPERS DE PRECIO ────────────────────────────────────────────────
    const formatearPrecio = (valor) => new Intl.NumberFormat('es-CO', {
        style: 'currency', currency: 'COP', minimumFractionDigits: 0,
    }).format(valor ?? 0);

    // ── MANEJO DE ÍTEMS ──────────────────────────────────────────────────

    // ── HELPER: sincroniza items en useForm ─────────────────────────────
    // Inertia's post() envía `data` automáticamente — necesitamos que
    // data.items siempre refleje el estado actual de la lista.
    const syncItems = (nuevosItems) => {
        setItems(nuevosItems);
        setData('items', nuevosItems);
    };

    // Agrega un producto a la lista de ítems del pedido
    const agregarProducto = (producto) => {
        // Si ya está en la lista, aumentamos la cantidad
        const existe = items.find(i => i.producto_id === producto.id);
        if (existe) {
            const actualizados = items.map(item =>
                item.producto_id === producto.id
                    ? { ...item, cantidad: item.cantidad + 1 }
                    : item
            );
            syncItems(actualizados);
        } else {
            const precio = producto.precio_oferta || producto.precio_venta;
            syncItems([...items, {
                producto_id:      producto.id,
                nombre_producto:  producto.nombre,
                sku:              producto.sku,
                imagen_url:       producto.imagenes?.[0] ?? null,
                cantidad:         1,
                precio_unitario:  precio,
                precio_costo:     producto.precio_costo,
                descuento:        0,
            }]);
        }
        setMostrarSelector(false);
        setBuscarProducto('');
    };

    // Actualiza un campo de un ítem específico
    const actualizarItem = (productoId, campo, valor) => {
        const actualizados = items.map(item =>
            item.producto_id === productoId
                ? { ...item, [campo]: Number(valor) || valor }
                : item
        );
        syncItems(actualizados);
    };

    // Elimina un ítem de la lista
    const quitarItem = (productoId) => {
        syncItems(items.filter(i => i.producto_id !== productoId));
    };

    // ── SUBMIT ───────────────────────────────────────────────────────────
    const handleSubmit = (e) => {
        e.preventDefault();
        // data.items ya está sincronizado — post() lo envía automáticamente
        post(route('pedidos.store'));
    };

    // Productos filtrados por la búsqueda
    const productosFiltrados = productos.filter(p =>
        p.nombre.toLowerCase().includes(buscarProducto.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(buscarProducto.toLowerCase()))
    ).slice(0, 8);

    const Error = ({ campo }) => errors[campo]
        ? <p className="mt-1 text-xs text-red-600">{errors[campo]}</p>
        : null;

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold text-gray-800">Nuevo Pedido</h2>}
        >
            <Head title="Nuevo Pedido" />

            <div className="py-8 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Errores generales */}
                {Object.keys(errors).length > 0 && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm font-medium text-red-700 mb-1">Corrige los siguientes errores:</p>
                        <ul className="text-sm text-red-600 list-disc list-inside">
                            {Object.values(errors).map((err, i) => <li key={i}>{err}</li>)}
                        </ul>
                    </div>
                )}

                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                    <Link href={route('pedidos.index')} className="hover:text-blue-800">Pedidos</Link>
                    <span>/</span>
                    <span className="text-gray-900">Nuevo pedido</span>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* ── SECCIÓN: Datos del cliente ──────────────────────── */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-base font-semibold text-gray-900 mb-4">Datos del cliente</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre completo <span className="text-red-500">*</span>
                                </label>
                                <input type="text" value={data.cliente_nombre}
                                    onChange={e => setData('cliente_nombre', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
                                    placeholder="Juan Carlos Pérez" />
                                <Error campo="cliente_nombre" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input type="email" value={data.cliente_email}
                                    onChange={e => setData('cliente_email', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
                                    placeholder="juan@ejemplo.com" />
                                <Error campo="cliente_email" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                                <input type="text" value={data.cliente_telefono}
                                    onChange={e => setData('cliente_telefono', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
                                    placeholder="3001234567" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cédula / NIT</label>
                                <input type="text" value={data.cliente_documento}
                                    onChange={e => setData('cliente_documento', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
                                    placeholder="1234567890" />
                            </div>
                        </div>
                    </div>

                    {/* ── SECCIÓN: Dirección de entrega ───────────────────── */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-base font-semibold text-gray-900 mb-4">Dirección de entrega</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Dirección <span className="text-red-500">*</span>
                                </label>
                                <input type="text" value={data.direccion_entrega}
                                    onChange={e => setData('direccion_entrega', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
                                    placeholder="Calle 123 # 45-67" />
                                <Error campo="direccion_entrega" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Ciudad <span className="text-red-500">*</span>
                                </label>
                                <input type="text" value={data.ciudad}
                                    onChange={e => setData('ciudad', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
                                    placeholder="Bogotá" />
                                <Error campo="ciudad" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Departamento <span className="text-red-500">*</span>
                                </label>
                                <input type="text" value={data.departamento}
                                    onChange={e => setData('departamento', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
                                    placeholder="Cundinamarca" />
                                <Error campo="departamento" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Barrio</label>
                                <input type="text" value={data.barrio}
                                    onChange={e => setData('barrio', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
                                    placeholder="Chapinero" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Código postal</label>
                                <input type="text" value={data.codigo_postal}
                                    onChange={e => setData('codigo_postal', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
                                    placeholder="110111" />
                            </div>
                        </div>
                    </div>

                    {/* ── SECCIÓN: Productos del pedido ───────────────────── */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-semibold text-gray-900">Productos</h3>
                            <button
                                type="button"
                                onClick={() => setMostrarSelector(!mostrarSelector)}
                                className="px-3 py-1.5 bg-gray-50 text-blue-900 text-sm font-medium rounded-lg hover:bg-gray-100 transition"
                            >
                                + Agregar producto
                            </button>
                        </div>

                        {/* Selector de productos */}
                        {mostrarSelector && (
                            <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <input
                                    type="text"
                                    placeholder="Buscar producto por nombre o SKU..."
                                    value={buscarProducto}
                                    onChange={e => setBuscarProducto(e.target.value)}
                                    autoFocus
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-700"
                                />
                                <div className="space-y-1 max-h-48 overflow-y-auto">
                                    {productosFiltrados.length === 0 ? (
                                        <p className="text-sm text-gray-400 text-center py-4">No se encontraron productos</p>
                                    ) : (
                                        productosFiltrados.map(p => (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => agregarProducto(p)}
                                                className="w-full flex items-center gap-3 p-2 text-left hover:bg-white rounded-lg transition"
                                            >
                                                {p.imagenes?.[0] ? (
                                                    <img src={p.imagenes[0]} alt={p.nombre} className="w-8 h-8 object-cover rounded border border-gray-200" />
                                                ) : (
                                                    <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">Sin</div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">{p.nombre}</p>
                                                    {p.sku && <p className="text-xs text-gray-400">SKU: {p.sku}</p>}
                                                </div>
                                                <span className="text-sm font-semibold text-blue-800">
                                                    {formatearPrecio(p.precio_oferta || p.precio_venta)}
                                                </span>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Lista de ítems agregados */}
                        {items.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-8">
                                Agrega al menos un producto al pedido
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {items.map(item => (
                                    <div key={item.producto_id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg">
                                        {item.imagen_url ? (
                                            <img src={item.imagen_url} alt={item.nombre_producto} className="w-10 h-10 object-cover rounded border border-gray-200" />
                                        ) : (
                                            <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">Sin img</div>
                                        )}

                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">{item.nombre_producto}</p>
                                            {item.sku && <p className="text-xs text-gray-400">SKU: {item.sku}</p>}
                                        </div>

                                        {/* Cantidad */}
                                        <div className="flex items-center gap-1">
                                            <label className="text-xs text-gray-500">Cant:</label>
                                            <input
                                                type="number" min="1" value={item.cantidad}
                                                onChange={e => actualizarItem(item.producto_id, 'cantidad', e.target.value)}
                                                className="w-16 border border-gray-300 rounded px-2 py-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-blue-700"
                                            />
                                        </div>

                                        {/* Precio unitario */}
                                        <div className="flex items-center gap-1">
                                            <label className="text-xs text-gray-500">Precio:</label>
                                            <input
                                                type="number" min="0" value={item.precio_unitario}
                                                onChange={e => actualizarItem(item.producto_id, 'precio_unitario', e.target.value)}
                                                className="w-28 border border-gray-300 rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-blue-700"
                                            />
                                        </div>

                                        {/* Subtotal */}
                                        <div className="text-sm font-semibold text-gray-900 w-24 text-right">
                                            {formatearPrecio(item.precio_unitario * item.cantidad)}
                                        </div>

                                        {/* Quitar */}
                                        <button type="button" onClick={() => quitarItem(item.producto_id)}
                                            className="text-red-400 hover:text-red-600 text-sm ml-1">
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {errors.items && (
                            <p className="mt-2 text-xs text-red-600">{errors.items}</p>
                        )}
                    </div>

                    {/* ── SECCIÓN: Totales y estado ───────────────────────── */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-base font-semibold text-gray-900 mb-4">Totales y estado</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                                <select value={data.estado} onChange={e => setData('estado', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700">
                                    {estados.map(e => (
                                        <option key={e} value={e}>{e.replace('_', ' ')}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Costo de envío (COP)</label>
                                <input type="number" min="0" step="1000" value={data.costo_envio}
                                    onChange={e => setData('costo_envio', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descuento (COP)</label>
                                <input type="number" min="0" step="1000" value={data.descuento}
                                    onChange={e => setData('descuento', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700" />
                            </div>
                        </div>

                        {/* Resumen de totales */}
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal ({items.length} productos)</span>
                                <span>{formatearPrecio(subtotal)}</span>
                            </div>
                            {Number(data.costo_envio) > 0 && (
                                <div className="flex justify-between text-gray-600">
                                    <span>Costo de envío</span>
                                    <span>+ {formatearPrecio(data.costo_envio)}</span>
                                </div>
                            )}
                            {Number(data.descuento) > 0 && (
                                <div className="flex justify-between text-green-600">
                                    <span>Descuento</span>
                                    <span>- {formatearPrecio(data.descuento)}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-bold text-gray-900 text-base border-t border-gray-200 pt-2">
                                <span>TOTAL</span>
                                <span>{formatearPrecio(total)}</span>
                            </div>
                        </div>
                    </div>

                    {/* ── SECCIÓN: Notas ─────────────────────────────────── */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-base font-semibold text-gray-900 mb-4">Notas</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Instrucciones del cliente</label>
                                <textarea value={data.notas} onChange={e => setData('notas', e.target.value)}
                                    rows={3} placeholder="Ej: Dejar con el portero..."
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notas internas (no visibles al cliente)</label>
                                <textarea value={data.notas_internas} onChange={e => setData('notas_internas', e.target.value)}
                                    rows={3} placeholder="Ej: Cliente frecuente, dar prioridad..."
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700" />
                            </div>
                        </div>
                    </div>

                    {/* ── BOTONES ─────────────────────────────────────────── */}
                    <div className="flex items-center justify-end gap-3">
                        <Link href={route('pedidos.index')}
                            className="px-4 py-2 border border-gray-300 text-sm text-gray-600 rounded-lg hover:bg-gray-50 transition">
                            Cancelar
                        </Link>
                        <button type="submit" disabled={processing || items.length === 0}
                            className="px-6 py-2 bg-blue-800 text-white text-sm font-medium rounded-lg hover:bg-blue-900 transition disabled:opacity-50 disabled:cursor-not-allowed">
                            {processing ? 'Guardando...' : 'Crear Pedido'}
                        </button>
                    </div>

                </form>
            </div>
        </AuthenticatedLayout>
    );
}
