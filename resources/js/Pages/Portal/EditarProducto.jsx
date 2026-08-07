/*
|--------------------------------------------------------------------------
| PÁGINA: Portal/EditarProducto.jsx
|--------------------------------------------------------------------------
|
| Formulario para que el proveedor edite su relación con un producto.
|
| PENSAR — ¿Qué puede editar el proveedor?
|   ✅ precio     → su precio en la pivot producto_proveedor
|   ✅ stock      → su stock en la pivot producto_proveedor
|   ✅ descripcion → en la tabla productos (info del producto)
|
|   ❌ nombre, sku, categoría, estado → solo el admin puede cambiarlos
|
*/

import { Head, Link, useForm } from '@inertiajs/react';
import PortalLayout from '@/Layouts/PortalLayout';

export default function EditarProducto({ proveedor, producto, pivot }) {

    const { data, setData, put, processing, errors } = useForm({
        precio:       pivot?.precio      ?? '',
        stock:        pivot?.stock       ?? 0,
        descripcion:  producto.descripcion ?? '',
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('portal.productos.actualizar', producto.id));
    };

    const fmt = (v) => new Intl.NumberFormat('es-CO', {
        style: 'currency', currency: 'COP', minimumFractionDigits: 0,
    }).format(v ?? 0);

    const inputClass = (campo) =>
        `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors[campo] ? 'border-red-400' : 'border-gray-300'}`;

    return (
        <PortalLayout header={
            <div className="flex items-center gap-2 text-sm text-gray-500">
                <Link href={route('portal.productos')} className="hover:text-emerald-600">Mis Productos</Link>
                <span>/</span>
                <span className="text-gray-900">Editar</span>
            </div>
        }>
            <Head title={`Editar — ${producto.nombre}`} />

            <div className="py-8 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Info del producto (solo lectura) */}
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-6 flex items-center gap-4">
                    {producto.imagen_principal_url ? (
                        <img src={producto.imagen_principal_url}
                            className="w-16 h-16 rounded-lg object-cover border border-emerald-200" />
                    ) : (
                        <div className="w-16 h-16 rounded-lg bg-emerald-100 flex items-center justify-center text-2xl">📦</div>
                    )}
                    <div>
                        <p className="font-semibold text-gray-900">{producto.nombre}</p>
                        <p className="text-sm text-gray-500">SKU: {producto.sku}</p>
                        <p className="text-sm text-gray-500">Categoría: {producto.categoria?.nombre ?? '—'}</p>
                    </div>
                </div>

                <form onSubmit={submit} className="space-y-6">

                    {/* Mis datos (pivot) */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
                        <h3 className="font-semibold text-gray-800 border-b border-gray-100 pb-2">
                            Mis condiciones
                        </h3>
                        <p className="text-xs text-gray-400">
                            Estos datos son tu relación con el producto. Solo tú los ves.
                        </p>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Mi precio (COP) <span className="text-red-500">*</span>
                                </label>
                                <input type="number" min="0" step="100"
                                    value={data.precio} onChange={e => setData('precio', e.target.value)}
                                    className={inputClass('precio')} />
                                {errors.precio && <p className="text-red-500 text-xs mt-1">{errors.precio}</p>}
                                <p className="text-xs text-gray-400 mt-1">Precio al que nos vendes el producto</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Stock disponible <span className="text-red-500">*</span>
                                </label>
                                <input type="number" min="0"
                                    value={data.stock} onChange={e => setData('stock', e.target.value)}
                                    className={inputClass('stock')} />
                                {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Descripción del producto */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
                        <h3 className="font-semibold text-gray-800 border-b border-gray-100 pb-2">
                            Descripción del producto
                        </h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                            <textarea rows={5} value={data.descripcion}
                                onChange={e => setData('descripcion', e.target.value)}
                                className={inputClass('descripcion')}
                                placeholder="Descripción detallada del producto para los clientes..." />
                            {errors.descripcion && <p className="text-red-500 text-xs mt-1">{errors.descripcion}</p>}
                        </div>
                    </div>

                    {/* Campos de solo lectura — solo informativos */}
                    <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-sm text-gray-500">
                        <p className="font-medium text-gray-700 mb-2">Campos del administrador (solo lectura)</p>
                        <div className="grid grid-cols-2 gap-2">
                            <p>Nombre: <span className="text-gray-900">{producto.nombre}</span></p>
                            <p>SKU: <span className="text-gray-900">{producto.sku}</span></p>
                            <p>Estado: <span className="text-gray-900">{producto.estado}</span></p>
                            <p>SKU tuyo: <span className="text-gray-900">{pivot?.sku_proveedor ?? '—'}</span></p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <Link href={route('portal.productos')}
                            className="px-4 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition">
                            Cancelar
                        </Link>
                        <button type="submit" disabled={processing}
                            className="px-6 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition">
                            {processing ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </PortalLayout>
    );
}
