/*
|--------------------------------------------------------------------------
| PÁGINA: Portal/CrearProducto.jsx
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Para qué sirve esta página?
|
|   El proveedor propone un producto nuevo desde su portal.
|   El producto nace como "inactivo" — el admin lo revisa y lo activa.
|
| PENSAR — ¿Qué campos necesitamos?
|
|   ESENCIALES (requeridos):
|     - nombre       → nombre del producto
|     - precio_costo → lo que el negocio le paga al proveedor
|     - stock        → unidades disponibles
|     - categoria_id → categoría del catálogo
|
|   OPCIONALES (el admin puede completar después):
|     - descripcion_corta → resumen en 300 chars
|     - descripcion       → descripción larga
|     - precio_venta      → sugerencia de precio al cliente
|     - peso_kg           → para calcular envío
|
| PENSAR — Patrón useForm de Inertia:
|
|   useForm({ campo: valorInicial }) → devuelve { data, setData, post, errors, processing }
|   post(url) → envía los datos y maneja errores de validación automáticamente
|
*/

import { useState, useEffect, useRef } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import PortalLayout from '@/Layouts/PortalLayout';
import { capitalize } from '@/utils/texto';

export default function CrearProducto({ categorias }) {

    // ─── FORMULARIO ─────────────────────────────────────────────────────
    const { data, setData, post, errors, processing } = useForm({
        nombre:            '',
        descripcion_corta: '',
        descripcion:       '',
        precio_costo:      '',
        precio_venta:      '',
        stock:             '',
        categoria_id:      '',
        peso_kg:           '',
        imagenes_nuevas:   [],
        forzar_creacion:   0,   // 1 cuando el usuario confirma crear aunque ya exista
    });

    // ─── SKU PREVIEW (solo visual, el servidor genera el definitivo) ──────
    const skuPreview = (() => {
        const d = new Date();
        const yy = String(d.getFullYear()).slice(-2);
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const rand = Array.from({ length: 4 }, () => letras[Math.floor(Math.random() * 26)]).join('');
        return `GS-${yy}${mm}-${rand}`;
    })();

    // ─── CATEGORÍAS EN CASCADA ─────────────────────────────────────────
    const [categoriaPadreId, setCategoriaPadreId] = useState('');

    const categoriasPadre = categorias.filter(c => !c.padre_id);
    const subcategorias   = categoriaPadreId
        ? categorias.filter(c => String(c.padre_id) === String(categoriaPadreId))
        : [];

    const handleCategoriaPadre = (id) => {
        setCategoriaPadreId(id);
        const tieneHijos = categorias.some(c => String(c.padre_id) === String(id));
        setData('categoria_id', tieneHijos ? '' : id);
    };

    // ─── VERIFICACIÓN DE NOMBRE DUPLICADO (tiempo real) ─────────────────
    const [duplicados, setDuplicados]     = useState([]);   // productos similares encontrados
    const [buscandoNombre, setBuscando]   = useState(false);
    const [forzarCreacion, setForzar]     = useState(false); // usuario eligió "crear de todas formas"
    const debounceRef = useRef(null);

    // Cuando cambia el nombre, espera 500ms y consulta el backend
    useEffect(() => {
        setForzar(false); // resetear si el nombre cambia
        setDuplicados([]);

        if (data.nombre.length < 3) return;

        clearTimeout(debounceRef.current);
        setBuscando(true);

        debounceRef.current = setTimeout(async () => {
            try {
                const resp = await fetch(
                    route('portal.productos.verificar') + '?nombre=' + encodeURIComponent(data.nombre)
                );
                const json = await resp.json();
                setDuplicados(json.existe ? json.productos : []);
            } catch (_) {
                // silencioso — no bloquear si falla la consulta
            } finally {
                setBuscando(false);
            }
        }, 500);

        return () => clearTimeout(debounceRef.current);
    }, [data.nombre]);

    // ─── ENVÍO ───────────────────────────────────────────────────────────
    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('portal.productos.guardar'), { forceFormData: true });
    };

    // Preview de imágenes seleccionadas (URLs temporales en el browser)
    const [previews, setPreviews] = useState([]);

    const handleImagenes = (e) => {
        const archivos = Array.from(e.target.files);
        setData('imagenes_nuevas', archivos);
        // Crear URLs temporales para mostrar preview
        setPreviews(archivos.map(f => URL.createObjectURL(f)));
    };


    return (
        <PortalLayout header={
            <div className="flex items-center gap-3">
                <Link href={route('portal.productos')}
                    className="text-sm text-emerald-600 hover:text-emerald-800 font-medium">
                    ← Mis Productos
                </Link>
                <span className="text-gray-300">/</span>
                <h2 className="text-xl font-semibold text-gray-800">Agregar Producto</h2>
            </div>
        }>
            <Head title="Agregar Producto" />

            <div className="py-8 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Aviso informativo */}
                <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                    <span className="text-xl shrink-0">ℹ️</span>
                    <div>
                        <p className="font-medium text-amber-800 text-sm">Producto pendiente de aprobación</p>
                        <p className="text-sm text-amber-700 mt-0.5">
                            Al enviar, el producto quedará como <strong>inactivo</strong> hasta que
                            el administrador lo revise y active. Recibirás acceso a él en tu lista de productos.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* ─── INFORMACIÓN BÁSICA ─────────────────────────── */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                            <h3 className="font-semibold text-gray-800">Información básica</h3>
                            <p className="text-xs text-gray-500 mt-0.5">Los campos con * son obligatorios</p>
                        </div>
                        <div className="px-6 py-5 space-y-4">

                            {/* Nombre */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre del producto *
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={data.nombre}
                                        onChange={e => setData('nombre', capitalize(e.target.value))}
                                        placeholder="Ej: Camiseta Premium Algodón Pima"
                                        className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-8
                                            ${errors.nombre ? 'border-red-400 bg-red-50'
                                            : duplicados.length > 0 && !forzarCreacion ? 'border-amber-400 bg-amber-50'
                                            : 'border-gray-300'}`}
                                    />
                                    {buscandoNombre && (
                                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs animate-pulse">⏳</span>
                                    )}
                                </div>

                                {/* Error del servidor */}
                                {errors.nombre && <p className="mt-1 text-xs text-red-600">{errors.nombre}</p>}

                                {/* SKU preview — solo lectura */}
                                <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                                    <span className="font-mono font-semibold text-emerald-600 tracking-wider">{skuPreview}</span>
                                    <span className="text-gray-400">— código interno (se asigna automáticamente)</span>
                                </div>

                                {/* ── Banner de producto duplicado ─────────────────── */}
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
                                                        className="ml-2 text-xs font-semibold text-emerald-600 hover:text-emerald-800 whitespace-nowrap">
                                                        Editar →
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                        <div className="flex gap-2">
                                            <button type="button"
                                                onClick={() => {
                                                    setForzar(true);
                                                    setData('forzar_creacion', 1);
                                                }}
                                                className="flex-1 text-xs font-medium bg-white border border-amber-400 text-amber-700 hover:bg-amber-100 rounded-lg py-2 transition-colors">
                                                Crear uno diferente de todas formas
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Confirmación cuando eligió forzar */}
                                {forzarCreacion && (
                                    <p className="mt-1.5 text-xs text-emerald-600 font-medium flex items-center gap-1">
                                        ✅ Crearás un nuevo producto con este nombre.
                                        <button type="button" onClick={() => { setForzar(false); setData('forzar_creacion', 0); }} className="text-gray-400 hover:text-gray-600 underline ml-1">
                                            Cancelar
                                        </button>
                                    </p>
                                )}
                            </div>

                            {/* Categoría */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Categoría
                                    <span className="ml-1 text-xs font-normal text-gray-400">(opcional)</span>
                                </label>
                                {categorias.length === 0 ? (
                                    <div className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-400 bg-gray-50">
                                        Sin categorías creadas — el administrador la asignará al activar el producto.
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        {/* Paso 1: Categoría principal */}
                                        <select
                                            value={categoriaPadreId}
                                            onChange={e => handleCategoriaPadre(e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        >
                                            <option value="">— Selecciona una categoría —</option>
                                            {categoriasPadre.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                                            ))}
                                        </select>

                                        {/* Paso 2: Subcategoría (aparece solo si hay padre elegido) */}
                                        {subcategorias.length > 0 && (
                                            <select
                                                value={data.categoria_id}
                                                onChange={e => setData('categoria_id', e.target.value)}
                                                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.categoria_id ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                                            >
                                                <option value="">— Selecciona una subcategoría —</option>
                                                {subcategorias.map(sub => (
                                                    <option key={sub.id} value={sub.id}>{sub.nombre}</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                )}
                                {errors.categoria_id && <p className="mt-1 text-xs text-red-600">{errors.categoria_id}</p>}
                            </div>

                            {/* Descripción corta */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Descripción corta
                                    <span className="ml-1 text-xs font-normal text-gray-400">(máx. 300 caracteres)</span>
                                </label>
                                <textarea
                                    rows={2}
                                    value={data.descripcion_corta}
                                    onChange={e => setData('descripcion_corta', capitalize(e.target.value))}
                                    placeholder="Resumen breve que aparece en la lista de productos..."
                                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none ${errors.descripcion_corta ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                                />
                                <p className="mt-0.5 text-xs text-gray-400 text-right">
                                    {data.descripcion_corta.length}/300
                                </p>
                                {errors.descripcion_corta && <p className="mt-1 text-xs text-red-600">{errors.descripcion_corta}</p>}
                            </div>

                            {/* Descripción larga */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Descripción completa
                                </label>
                                <textarea
                                    rows={5}
                                    value={data.descripcion}
                                    onChange={e => setData('descripcion', e.target.value)}
                                    placeholder="Descripción detallada del producto, materiales, tallas disponibles, instrucciones de cuidado..."
                                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y ${errors.descripcion ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                                />
                                {errors.descripcion && <p className="mt-1 text-xs text-red-600">{errors.descripcion}</p>}
                            </div>
                        </div>
                    </div>

                    {/* ─── PRECIOS Y STOCK ─────────────────────────────── */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                            <h3 className="font-semibold text-gray-800">Precio y disponibilidad</h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                                El precio de venta es una sugerencia — el administrador puede ajustarlo.
                            </p>
                        </div>
                        <div className="px-6 py-5">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                                {/* Precio costo */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tu precio (costo) *
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="100"
                                            value={data.precio_costo}
                                            onChange={e => setData('precio_costo', e.target.value)}
                                            placeholder="0"
                                            className={`w-full pl-7 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.precio_costo ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                                        />
                                    </div>
                                    <p className="mt-0.5 text-xs text-gray-400">Lo que el negocio te paga a ti</p>
                                    {errors.precio_costo && <p className="mt-1 text-xs text-red-600">{errors.precio_costo}</p>}
                                </div>

                                {/* Precio venta sugerido */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Precio venta sugerido
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="100"
                                            value={data.precio_venta}
                                            onChange={e => setData('precio_venta', e.target.value)}
                                            placeholder="0"
                                            className={`w-full pl-7 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.precio_venta ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                                        />
                                    </div>
                                    <p className="mt-0.5 text-xs text-gray-400">El admin puede cambiarlo</p>
                                    {errors.precio_venta && <p className="mt-1 text-xs text-red-600">{errors.precio_venta}</p>}
                                </div>

                                {/* Stock */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Stock disponible *
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={data.stock}
                                        onChange={e => setData('stock', e.target.value)}
                                        placeholder="0"
                                        className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.stock ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                                    />
                                    <p className="mt-0.5 text-xs text-gray-400">Unidades que puedes enviar</p>
                                    {errors.stock && <p className="mt-1 text-xs text-red-600">{errors.stock}</p>}
                                </div>
                            </div>

                            {/* Indicador de margen — si ambos precios están llenos */}
                            {data.precio_costo > 0 && data.precio_venta > 0 && (
                                <div className="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                                    <p className="text-sm text-emerald-700">
                                        Margen sugerido: <strong>
                                            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(data.precio_venta - data.precio_costo)}
                                        </strong>
                                        {' '}({data.precio_venta > 0 ? (((data.precio_venta - data.precio_costo) / data.precio_venta) * 100).toFixed(1) : 0}% sobre el precio de venta)
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ─── DATOS ADICIONALES ───────────────────────────── */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                            <h3 className="font-semibold text-gray-800">Datos adicionales</h3>
                            <p className="text-xs text-gray-500 mt-0.5">Opcionales — ayudan a calcular envíos</p>
                        </div>
                        <div className="px-6 py-5">
                            <div className="max-w-xs">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Peso (kg)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={data.peso_kg}
                                    onChange={e => setData('peso_kg', e.target.value)}
                                    placeholder="0.5"
                                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.peso_kg ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                                />
                                {errors.peso_kg && <p className="mt-1 text-xs text-red-600">{errors.peso_kg}</p>}
                            </div>
                        </div>
                    </div>

                    {/* ─── IMÁGENES ────────────────────────────────────── */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                            <h3 className="font-semibold text-gray-800">Imágenes del producto</h3>
                            <p className="text-xs text-gray-500 mt-0.5">Máx. 2MB por imagen. La primera será la imagen principal.</p>
                        </div>
                        <div className="px-6 py-5">
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition">
                                <div className="text-center">
                                    <p className="text-2xl mb-1">📸</p>
                                    <p className="text-sm text-gray-600">Haz click para seleccionar imágenes</p>
                                    <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, WEBP · múltiples permitidas</p>
                                </div>
                                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImagenes} />
                            </label>
                            {previews.length > 0 && (
                                <div className="mt-4 flex flex-wrap gap-3">
                                    {previews.map((url, i) => (
                                        <div key={i} className="relative">
                                            <img src={url} className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                                            {i === 0 && (
                                                <span className="absolute -top-1.5 -left-1.5 bg-emerald-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                                                    Principal
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                            {errors['imagenes_nuevas.0'] && (
                                <p className="mt-2 text-xs text-red-600">{errors['imagenes_nuevas.0']}</p>
                            )}
                        </div>
                    </div>

                    {/* ─── ACCIONES ─────────────────────────────────────── */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <Link href={route('portal.productos')}
                            className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition">
                            Cancelar
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-6 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {processing ? 'Enviando...' : 'Enviar para aprobación'}
                        </button>
                    </div>
                </form>
            </div>
        </PortalLayout>
    );
}
