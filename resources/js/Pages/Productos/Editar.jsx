/*
|--------------------------------------------------------------------------
| PÁGINA: Productos/Editar.jsx
|--------------------------------------------------------------------------
|
| ENTENDER — Diferencia con Crear.jsx
|
|   Casi idéntico a Crear.jsx, con dos diferencias clave:
|
|   1. useForm recibe los valores actuales del producto (pre-llenado)
|      En Crear: useForm({ nombre: '' })
|      En Editar: useForm({ nombre: producto.nombre }) ← ya tiene valor
|
|   2. Usa put() en lugar de post()
|      put() → envía PUT /productos/{id} → controller@update
|      post() → envía POST /productos    → controller@store
|
*/

import { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Editar({ producto, categorias }) {

    /*
    |----------------------------------------------------------------------
    | useForm — Pre-llenado con los datos actuales del producto
    |----------------------------------------------------------------------
    |
    | Pasamos producto.nombre, producto.precio_venta, etc.
    | El formulario arranca con esos valores → el usuario solo cambia lo que quiere.
    |
    | ?? '' → si el valor es null, usamos string vacío (los inputs no aceptan null)
    |
    */
    const [previews, setPreviews] = useState([]);

    const { data, setData, put, processing, errors } = useForm({
        nombre:            producto.nombre            ?? '',
        descripcion_corta: producto.descripcion_corta ?? '',
        descripcion:       producto.descripcion       ?? '',
        precio_costo:      producto.precio_costo      ?? '',
        precio_venta:      producto.precio_venta      ?? '',
        precio_oferta:     producto.precio_oferta     ?? '',
        stock:             producto.stock             ?? '',
        stock_minimo:      producto.stock_minimo      ?? 5,
        categoria_id:      producto.categoria_id      ?? '',
        estado:            producto.estado            ?? 'borrador',
        sku:               producto.sku               ?? '',
        peso_kg:           producto.peso_kg           ?? '',
        meta_titulo:       producto.meta_titulo       ?? '',
        meta_descripcion:  producto.meta_descripcion  ?? '',
        imagenes_nuevas:   [],
    });

    /*
    |----------------------------------------------------------------------
    | handleSubmit — Envía PUT al servidor
    |----------------------------------------------------------------------
    */
    const handleSubmit = (e) => {
        e.preventDefault();
        // forceFormData: true → siempre envía como multipart/form-data
        // Necesario para que los archivos viajen correctamente
        put(route('productos.update', producto.id), { forceFormData: true });
    };

    /*
    |----------------------------------------------------------------------
    | eliminarImagen — Borra una imagen del producto en R2
    |----------------------------------------------------------------------
    |
    | Llama a DELETE /productos/{id}/imagenes/{mediaId}
    | El controller borra de R2 + tabla media via Spatie.
    | Inertia recarga la página → producto.media se actualiza automáticamente.
    |
    */
    const eliminarImagen = (mediaId) => {
        if (!confirm('¿Eliminar esta imagen? Esta acción no se puede deshacer.')) return;
        router.delete(route('productos.imagenes.eliminar', [producto.id, mediaId]), {
            preserveScroll: true,
        });
    };

    const Error = ({ campo }) => errors[campo]
        ? <p className="mt-1 text-xs text-red-600">{errors[campo]}</p>
        : null;

    /*
    |----------------------------------------------------------------------
    | RENDER — Igual que Crear pero con valores pre-llenados
    |----------------------------------------------------------------------
    */
    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold text-gray-800">Editar Producto</h2>}
        >
            <Head title={`Editar: ${producto.nombre}`} />

            <div className="py-8 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                    <Link href={route('productos.index')} className="hover:text-indigo-600">Productos</Link>
                    <span>/</span>
                    <span className="text-gray-900 truncate max-w-xs">{producto.nombre}</span>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* ── SECCIÓN: Información básica ─────────────────── */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-base font-semibold text-gray-900 mb-4">Información básica</h3>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre del producto <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.nombre}
                                onChange={e => {
                                    const v = e.target.value;
                                    setData('nombre', v.length > 0 ? v.charAt(0).toUpperCase() + v.slice(1) : v);
                                }}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <Error campo="nombre" />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Descripción corta
                            </label>
                            <input
                                type="text"
                                value={data.descripcion_corta}
                                onChange={e => setData('descripcion_corta', e.target.value)}
                                maxLength={300}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <Error campo="descripcion_corta" />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Descripción completa
                            </label>
                            <textarea
                                value={data.descripcion}
                                onChange={e => setData('descripcion', e.target.value)}
                                rows={5}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <Error campo="descripcion" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                SKU (código interno)
                            </label>
                            <input
                                type="text"
                                value={data.sku}
                                onChange={e => setData('sku', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <Error campo="sku" />
                        </div>
                    </div>

                    {/* ── SECCIÓN: Precios ────────────────────────────── */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-base font-semibold text-gray-900 mb-4">Precios</h3>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Precio costo (COP) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="100"
                                    value={data.precio_costo}
                                    onChange={e => setData('precio_costo', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <Error campo="precio_costo" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Precio venta (COP) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="100"
                                    value={data.precio_venta}
                                    onChange={e => setData('precio_venta', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <Error campo="precio_venta" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Precio oferta (COP)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="100"
                                    value={data.precio_oferta}
                                    onChange={e => setData('precio_oferta', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Vacío = sin descuento"
                                />
                                <Error campo="precio_oferta" />
                            </div>
                        </div>

                        {data.precio_costo > 0 && data.precio_venta > 0 && (
                            <div className="mt-3 p-3 bg-indigo-50 rounded-lg text-sm text-indigo-700">
                                Margen estimado:{' '}
                                <strong>
                                    {Math.round(((data.precio_venta - data.precio_costo) / data.precio_venta) * 100)}%
                                </strong>{' '}
                                (${(data.precio_venta - data.precio_costo).toLocaleString('es-CO')} COP)
                            </div>
                        )}
                    </div>

                    {/* ── SECCIÓN: Inventario y categoría ─────────────── */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-base font-semibold text-gray-900 mb-4">Inventario y categoría</h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                                <select
                                    value={data.categoria_id}
                                    onChange={e => setData('categoria_id', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">Sin categoría</option>
                                    {categorias.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                                    ))}
                                </select>
                                <Error campo="categoria_id" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Estado <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={data.estado}
                                    onChange={e => setData('estado', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="borrador">Borrador</option>
                                    <option value="activo">Activo</option>
                                    <option value="agotado">Agotado</option>
                                    <option value="inactivo">Inactivo</option>
                                </select>
                                <Error campo="estado" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={data.stock}
                                    onChange={e => setData('stock', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Vacío = ilimitado"
                                />
                                <Error campo="stock" />
                            </div>
                        </div>
                    </div>

                    {/* ── SECCIÓN: Imágenes ───────────────────────────── */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-base font-semibold text-gray-900 mb-1">Imágenes</h3>
                        <p className="text-xs text-gray-400 mb-4">
                            Las nuevas imágenes se agregan a las existentes. Máximo 2MB por imagen.
                        </p>

                        {/*
                            Imágenes actuales — vienen de Spatie Media Library (R2)
                            producto.media → array de objetos con original_url, id, etc.
                            Botón "×" → llama a eliminarImagen(media.id) → borra de R2
                        */}
                        {producto.media?.length > 0 && (
                            <div className="mb-4">
                                <p className="text-xs font-medium text-gray-500 mb-2">
                                    Imágenes actuales ({producto.media.length}):
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    {producto.media.map((img, i) => (
                                        <div key={img.id} className="relative group">
                                            <img
                                                src={img.original_url}
                                                alt={`imagen ${i + 1}`}
                                                className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                                            />
                                            {/* Badge "Principal" en la primera imagen */}
                                            {i === 0 && (
                                                <span className="absolute -top-1 -left-1 bg-indigo-600 text-white text-xs px-1 rounded">
                                                    Principal
                                                </span>
                                            )}
                                            {/* Botón borrar — aparece al hacer hover */}
                                            <button
                                                type="button"
                                                onClick={() => eliminarImagen(img.id)}
                                                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center leading-none"
                                                title="Eliminar imagen"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <p className="mt-2 text-xs text-gray-400">
                                    Pasa el cursor sobre una imagen y presiona × para eliminarla.
                                </p>
                            </div>
                        )}

                        {/* Input para agregar nuevas imágenes */}
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={e => {
                                const archivos = Array.from(e.target.files);
                                setData('imagenes_nuevas', archivos);
                                setPreviews(archivos.map(f => URL.createObjectURL(f)));
                            }}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                        <Error campo="imagenes_nuevas" />

                        {previews.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-3">
                                <p className="w-full text-xs text-gray-400">Nuevas a agregar:</p>
                                {previews.map((url, i) => (
                                    <img
                                        key={i}
                                        src={url}
                                        alt={`nueva ${i + 1}`}
                                        className="w-20 h-20 object-cover rounded-lg border-2 border-dashed border-indigo-300"
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── INFO: ID del producto ────────────────────────── */}
                    <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-400">
                        ID: {producto.id} · Creado: {producto.creado_en}
                    </div>

                    {/* ── BOTONES ──────────────────────────────────────── */}
                    <div className="flex items-center justify-end gap-3">
                        <Link
                            href={route('productos.index')}
                            className="px-4 py-2 border border-gray-300 text-sm text-gray-600 rounded-lg hover:bg-gray-50 transition"
                        >
                            Cancelar
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                        >
                            {processing ? 'Guardando...' : 'Guardar cambios'}
                        </button>
                    </div>

                </form>
            </div>
        </AuthenticatedLayout>
    );
}
