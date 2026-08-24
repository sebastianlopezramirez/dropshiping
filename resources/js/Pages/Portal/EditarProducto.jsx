/*
|--------------------------------------------------------------------------
| PÁGINA: Portal/EditarProducto.jsx
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué puede editar el proveedor?
|   ✅ precio              → su precio en la pivot producto_proveedor
|   ✅ stock               → su stock en la pivot producto_proveedor
|   ✅ descripcion         → en la tabla productos
|   ✅ permite_contraentrega → si el producto acepta pago contraentrega
|   ✅ imagenes            → agregar (máx 3 en total) y eliminar las propias
|
|   ❌ nombre, sku, categoría, estado → solo el admin puede cambiarlos
|
*/

import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import PortalLayout from '@/Layouts/PortalLayout';

export default function EditarProducto({ proveedor, producto, pivot }) {

    const imagenes = producto.media ?? [];

    const { data, setData, post, processing, errors } = useForm({
        _method:                'put',
        precio:                 pivot?.precio               ?? '',
        stock:                  pivot?.stock                ?? 0,
        descripcion:            producto.descripcion        ?? '',
        permite_contraentrega:  producto.permite_contraentrega ?? false,
        imagenes_nuevas:        [],
        eliminar_imagenes:      [],
    });

    // Previews de imágenes nuevas seleccionadas
    const [previews, setPreviews]             = useState([]);
    // IDs de imágenes existentes marcadas para eliminar
    const [marcadasEliminar, setMarcadas]     = useState([]);

    const totalImagenes = imagenes.length - marcadasEliminar.length + previews.length;

    const handleImagenes = (e) => {
        const archivos    = Array.from(e.target.files);
        const disponibles = 3 - (imagenes.length - marcadasEliminar.length);
        const seleccion   = archivos.slice(0, disponibles);
        setData('imagenes_nuevas', seleccion);
        setPreviews(seleccion.map(f => URL.createObjectURL(f)));
    };

    const toggleEliminar = (id) => {
        const nuevas = marcadasEliminar.includes(id)
            ? marcadasEliminar.filter(i => i !== id)
            : [...marcadasEliminar, id];
        setMarcadas(nuevas);
        setData('eliminar_imagenes', nuevas);
        // Limpiar nuevas si ahora hay espacio
        if (nuevas.length > marcadasEliminar.length) setPreviews([]);
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('portal.productos.actualizar', producto.id), { forceFormData: true });
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

                    {/* ─── MIS CONDICIONES ─────────────────────────────── */}
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

                        {/* Contraentrega */}
                        <div>
                            <label className="flex items-center gap-3 cursor-pointer select-none">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={data.permite_contraentrega}
                                        onChange={e => setData('permite_contraentrega', e.target.checked)}
                                    />
                                    <div className={`w-10 h-6 rounded-full transition-colors ${data.permite_contraentrega ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${data.permite_contraentrega ? 'translate-x-4' : 'translate-x-0'}`} />
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-700">Permite contraentrega</span>
                                    <p className="text-xs text-gray-500">
                                        {data.permite_contraentrega
                                            ? 'El cliente paga al recibir el producto.'
                                            : 'El cliente paga por transferencia antes del envío o recogida.'}
                                    </p>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* ─── DESCRIPCIÓN ─────────────────────────────────── */}
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

                    {/* ─── IMÁGENES ────────────────────────────────────── */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
                        <div className="border-b border-gray-100 pb-2 flex items-center justify-between">
                            <h3 className="font-semibold text-gray-800">Imágenes del producto</h3>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                totalImagenes >= 3 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                            }`}>
                                {totalImagenes}/3
                            </span>
                        </div>

                        {/* Imágenes existentes */}
                        {imagenes.length > 0 && (
                            <div>
                                <p className="text-xs text-gray-500 mb-2">Imágenes actuales — marca las que quieras eliminar:</p>
                                <div className="flex flex-wrap gap-3">
                                    {imagenes.map((media, i) => {
                                        const marcada = marcadasEliminar.includes(media.id);
                                        return (
                                            <div key={media.id} className="relative">
                                                <img
                                                    src={media.original_url}
                                                    className={`w-20 h-20 object-cover rounded-lg border-2 transition-all ${
                                                        marcada ? 'opacity-30 border-red-400' : 'border-gray-200'
                                                    }`}
                                                />
                                                {i === 0 && !marcada && (
                                                    <span className="absolute -top-1.5 -left-1.5 bg-emerald-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                                                        Principal
                                                    </span>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => toggleEliminar(media.id)}
                                                    className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shadow transition-colors ${
                                                        marcada
                                                            ? 'bg-emerald-500 text-white'
                                                            : 'bg-red-500 text-white hover:bg-red-600'
                                                    }`}
                                                    title={marcada ? 'Restaurar' : 'Eliminar'}
                                                >
                                                    {marcada ? '↩' : '×'}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Agregar nuevas (solo si hay espacio) */}
                        {totalImagenes < 3 && (
                            <div>
                                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition">
                                    <div className="text-center">
                                        <p className="text-xl mb-0.5">📸</p>
                                        <p className="text-xs text-gray-600">Agregar imágenes</p>
                                        <p className="text-xs text-gray-400">JPG, PNG, WEBP · máx. 2MB · quedan {3 - totalImagenes} espacios</p>
                                    </div>
                                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleImagenes} />
                                </label>
                                {previews.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {previews.map((url, i) => (
                                            <img key={i} src={url} className="w-16 h-16 object-cover rounded-lg border border-emerald-200" />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {totalImagenes >= 3 && (
                            <p className="text-xs text-amber-600">Límite de 3 imágenes alcanzado. Elimina una para agregar otra.</p>
                        )}

                        {errors['imagenes_nuevas.0'] && (
                            <p className="text-xs text-red-600">{errors['imagenes_nuevas.0']}</p>
                        )}
                    </div>

                    {/* ─── SOLO LECTURA ────────────────────────────────── */}
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
