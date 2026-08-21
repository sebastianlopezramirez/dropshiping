/*
|--------------------------------------------------------------------------
| PÁGINA: Productos/Crear.jsx
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué hace esta página?
|
|   Formulario para crear un nuevo producto.
|   Cuando se hace submit, Inertia envía los datos al servidor
|   sin recargar la página (SPA).
|
| PENSAR — Hooks clave:
|
|   useForm(valoresIniciales)
|     → Maneja el estado del formulario
|     → data     = valores actuales de los campos
|     → setData  = actualiza un campo: setData('nombre', 'iPhone 15')
|     → post()   = envía POST al servidor
|     → errors   = errores de validación del servidor
|     → processing = true mientras espera respuesta del servidor
|
*/

import { useState, useEffect, useRef } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Crear({ categorias }) {

    /*
    |----------------------------------------------------------------------
    | useForm — Estado del formulario
    |----------------------------------------------------------------------
    |
    | Definimos los valores iniciales de cada campo.
    | Cada campo corresponde a una columna de la tabla 'productos'.
    |
    */
    const { data, setData, post, processing, errors } = useForm({
        nombre:            '',
        descripcion_corta: '',
        descripcion:       '',
        precio_costo:      '',
        precio_venta:      '',
        precio_oferta:     '',
        stock:             '',
        stock_minimo:      5,
        categoria_id:      '',
        estado:            'borrador',
        sku:               '',
        peso_kg:           '',
        meta_titulo:       '',
        meta_descripcion:  '',
        imagenes_nuevas:   [],
        forzar_creacion:   0,
    });

    // ─── VERIFICACIÓN NOMBRE DUPLICADO (tiempo real) ─────────────────────
    const [duplicados, setDuplicados]   = useState([]);
    const [buscandoNombre, setBuscando] = useState(false);
    const [forzarCreacion, setForzar]   = useState(false);
    const debounceRef = useRef(null);

    useEffect(() => {
        setForzar(false);
        setDuplicados([]);
        if (data.nombre.length < 3) return;

        clearTimeout(debounceRef.current);
        setBuscando(true);
        debounceRef.current = setTimeout(async () => {
            try {
                const resp = await fetch(route('productos.verificar-nombre') + '?nombre=' + encodeURIComponent(data.nombre));
                const json = await resp.json();
                setDuplicados(json.existe ? json.productos : []);
            } catch (_) {}
            finally { setBuscando(false); }
        }, 500);
        return () => clearTimeout(debounceRef.current);
    }, [data.nombre]);

    // Preview local de las imágenes antes de subir
    // URL.createObjectURL() crea una URL temporal para mostrar la imagen
    const [previews, setPreviews] = useState([]);

    /*
    |----------------------------------------------------------------------
    | handleSubmit — Envío del formulario
    |----------------------------------------------------------------------
    |
    | post(ruta) → Inertia hace POST al servidor con los datos del form.
    | Si el servidor valida y guarda → redirige a la lista.
    | Si hay errores → los muestra en el formulario automáticamente.
    |
    */
    const handleSubmit = (e) => {
        e.preventDefault();
        // forceFormData: true → siempre envía como multipart/form-data
        // Necesario cuando el form puede tener archivos (imágenes).
        // Sin esto, Inertia envía como JSON y los archivos no viajan.
        post(route('productos.store'), { forceFormData: true });
    };

    /*
    |----------------------------------------------------------------------
    | COMPONENTE HELPER: Campo de error
    |----------------------------------------------------------------------
    |
    | Si hay un error de validación para un campo,
    | lo mostramos en rojo debajo del input.
    |
    */
    const Error = ({ campo }) => errors[campo]
        ? <p className="mt-1 text-xs text-red-600">{errors[campo]}</p>
        : null;

    /*
    |----------------------------------------------------------------------
    | RENDER
    |----------------------------------------------------------------------
    */
    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold text-gray-800">Nuevo Producto</h2>}
        >
            <Head title="Nuevo Producto" />

            <div className="py-8 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Alerta si hay errores de validación */}
                {Object.keys(errors).length > 0 && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm font-medium text-red-700 mb-1">Corrige los siguientes errores:</p>
                        <ul className="text-sm text-red-600 list-disc list-inside">
                            {Object.values(errors).map((err, i) => (
                                <li key={i}>{err}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Breadcrumb de navegación */}
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                    <Link href={route('productos.index')} className="hover:text-indigo-600">Productos</Link>
                    <span>/</span>
                    <span className="text-gray-900">Nuevo producto</span>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* ── SECCIÓN: Información básica ─────────────────── */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-base font-semibold text-gray-900 mb-4">Información básica</h3>

                        {/* Nombre */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre del producto <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={data.nombre}
                                    onChange={e => {
                                        const v = e.target.value;
                                        setData('nombre', v.length > 0 ? v.charAt(0).toUpperCase() + v.slice(1) : v);
                                    }}
                                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-8
                                        ${errors.nombre ? 'border-red-400 bg-red-50'
                                        : duplicados.length > 0 && !forzarCreacion ? 'border-amber-400 bg-amber-50'
                                        : 'border-gray-300'}`}
                                    placeholder="Ej: iPhone 15 Pro Max 256GB"
                                />
                                {buscandoNombre && (
                                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs animate-pulse">⏳</span>
                                )}
                            </div>

                            {errors.nombre && <p className="mt-1 text-xs text-red-600">{errors.nombre}</p>}

                            {/* Banner duplicado */}
                            {duplicados.length > 0 && !forzarCreacion && !errors.nombre && (
                                <div className="mt-2 bg-amber-50 border border-amber-300 rounded-lg p-3">
                                    <p className="text-xs font-semibold text-amber-800 mb-2">
                                        ⚠️ Ya existe un producto similar en el inventario:
                                    </p>
                                    <ul className="space-y-1.5 mb-3">
                                        {duplicados.map(p => (
                                            <li key={p.id} className="flex items-center justify-between text-xs bg-white border border-amber-200 rounded-lg px-3 py-2">
                                                <div>
                                                    <span className="font-medium text-gray-800">{p.nombre}</span>
                                                    <span className="ml-2 text-gray-400">SKU: {p.sku}</span>
                                                    <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs font-medium
                                                        ${p.estado === 'activo' ? 'bg-green-100 text-green-700'
                                                        : p.estado === 'inactivo' ? 'bg-red-100 text-red-700'
                                                        : 'bg-gray-100 text-gray-600'}`}>
                                                        {p.estado}
                                                    </span>
                                                </div>
                                                <a href={p.url_editar}
                                                    className="ml-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 whitespace-nowrap">
                                                    Editar →
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                    <button type="button"
                                        onClick={() => { setForzar(true); setData('forzar_creacion', 1); }}
                                        className="w-full text-xs font-medium bg-white border border-amber-400 text-amber-700 hover:bg-amber-100 rounded-lg py-2 transition-colors">
                                        Crear uno diferente de todas formas
                                    </button>
                                </div>
                            )}

                            {forzarCreacion && (
                                <p className="mt-1.5 text-xs text-green-600 font-medium flex items-center gap-1">
                                    ✅ Crearás un nuevo producto con este nombre.
                                    <button type="button"
                                        onClick={() => { setForzar(false); setData('forzar_creacion', 0); }}
                                        className="text-gray-400 hover:text-gray-600 underline ml-1">
                                        Cancelar
                                    </button>
                                </p>
                            )}
                            <Error campo="nombre" />
                        </div>

                        {/* Descripción corta */}
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
                                placeholder="Resumen en 1-2 líneas para tarjetas de producto"
                            />
                            <Error campo="descripcion_corta" />
                        </div>

                        {/* Descripción completa */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Descripción completa
                            </label>
                            <textarea
                                value={data.descripcion}
                                onChange={e => setData('descripcion', e.target.value)}
                                rows={5}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Descripción detallada del producto..."
                            />
                            <Error campo="descripcion" />
                        </div>

                        {/* SKU */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                SKU (código interno)
                            </label>
                            <input
                                type="text"
                                value={data.sku}
                                onChange={e => setData('sku', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Ej: APPLE-IPH15PM-256-NG"
                            />
                            <Error campo="sku" />
                        </div>
                    </div>

                    {/* ── SECCIÓN: Precios ────────────────────────────── */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-base font-semibold text-gray-900 mb-4">Precios</h3>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {/* Precio costo */}
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
                                    placeholder="0"
                                />
                                <p className="mt-1 text-xs text-gray-400">Lo que le pagas al proveedor</p>
                                <Error campo="precio_costo" />
                            </div>

                            {/* Precio venta */}
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
                                    placeholder="0"
                                />
                                <p className="mt-1 text-xs text-gray-400">Lo que cobra el cliente</p>
                                <Error campo="precio_venta" />
                            </div>

                            {/* Precio oferta */}
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
                                <p className="mt-1 text-xs text-gray-400">Debe ser menor que precio venta</p>
                                <Error campo="precio_oferta" />
                            </div>
                        </div>

                        {/* Margen calculado en tiempo real */}
                        {data.precio_costo > 0 && data.precio_venta > 0 && (
                            <div className="mt-3 p-3 bg-indigo-50 rounded-lg text-sm text-indigo-700">
                                Margen estimado:{' '}
                                <strong>
                                    {Math.round(((data.precio_venta - data.precio_costo) / data.precio_venta) * 100)}%
                                </strong>{' '}
                                (${(data.precio_venta - data.precio_costo).toLocaleString('es-CO')} COP de ganancia)
                            </div>
                        )}
                    </div>

                    {/* ── SECCIÓN: Inventario y categoría ─────────────── */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-base font-semibold text-gray-900 mb-4">Inventario y categoría</h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Categoría */}
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

                            {/* Estado */}
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

                            {/* Stock */}
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
                            La primera imagen será la principal. Máximo 2MB por imagen. Formatos: JPG, PNG, WEBP.
                        </p>

                        {/*
                            Input de archivos múltiples.
                            onChange → convertimos FileList a Array y guardamos en el form.
                            También generamos previews con URL.createObjectURL().
                        */}
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={e => {
                                const archivos = Array.from(e.target.files);
                                setData('imagenes_nuevas', archivos);
                                // Generamos URLs temporales para ver la preview
                                setPreviews(archivos.map(f => URL.createObjectURL(f)));
                            }}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                        <Error campo="imagenes_nuevas" />

                        {/* Preview de imágenes seleccionadas */}
                        {previews.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-3">
                                {previews.map((url, i) => (
                                    <div key={i} className="relative">
                                        <img
                                            src={url}
                                            alt={`preview ${i + 1}`}
                                            className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                                        />
                                        {i === 0 && (
                                            <span className="absolute -top-1 -left-1 bg-indigo-600 text-white text-xs px-1 rounded">
                                                Principal
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── BOTONES DE ACCIÓN ───────────────────────────── */}
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
                            className="px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {processing ? 'Guardando...' : 'Crear Producto'}
                        </button>
                    </div>

                </form>
            </div>
        </AuthenticatedLayout>
    );
}
