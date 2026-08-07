/*
|--------------------------------------------------------------------------
| PÁGINA: Tienda/Index.jsx
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué hace esta página?
|
|   Es el catálogo público de la tienda. Muestra todos los productos
|   activos con stock, con filtros de búsqueda, categoría y precio.
|
| PENSAR — Props que recibe del controller:
|
|   productos      → objeto paginado de Laravel (data, links, meta)
|   categorias     → array de { id, nombre, slug } para el sidebar
|   filtros        → { q, categoria, precio_min, precio_max } aplicados
|   categoriaActual → objeto categoría (solo en /tienda/categoria/{slug})
|
| PENSAR — Interacciones:
|
|   Los filtros usan router.get() de Inertia → navega sin recargar la página.
|   La paginación usa los links del objeto paginado de Laravel.
|
*/

import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import TiendaLayout from '@/Layouts/TiendaLayout';

export default function Index({ productos, categorias, filtros = {}, categoriaActual = null }) {

    // Estado local de los filtros del formulario del sidebar
    const [busqueda, setBusqueda]     = useState(filtros.q            || '');
    const [precioMin, setPrecioMin]   = useState(filtros.precio_min   || '');
    const [precioMax, setPrecioMax]   = useState(filtros.precio_max   || '');

    /*
    |----------------------------------------------------------------------
    | aplicarFiltros — Navega con los filtros actuales
    |----------------------------------------------------------------------
    | Construye el objeto de parámetros y navega a /tienda con router.get()
    | Inertia hace la petición como AJAX → no recarga la página completa.
    */
    const aplicarFiltros = (extra = {}) => {
        const params = {};
        if (busqueda)  params.q          = busqueda;
        if (precioMin) params.precio_min = precioMin;
        if (precioMax) params.precio_max = precioMax;
        // extra permite pasar la categoría al hacer clic en el sidebar
        Object.assign(params, extra);

        router.get(route('tienda.index'), params, { preserveScroll: false });
    };

    const limpiarFiltros = () => {
        setBusqueda('');
        setPrecioMin('');
        setPrecioMax('');
        router.get(route('tienda.index'));
    };

    // Formatea precios en COP
    const cop = (n) => Number(n).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

    // ¿Hay algún filtro activo?
    const hayFiltros = filtros.q || filtros.categoria || filtros.precio_min || filtros.precio_max;

    return (
        <TiendaLayout>
            <Head title={categoriaActual ? `${categoriaActual.nombre} — Tienda` : 'Catálogo'} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* ── ENCABEZADO ─────────────────────────────── */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">
                        {categoriaActual ? categoriaActual.nombre : 'Catálogo de productos'}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {productos.total} producto{productos.total !== 1 ? 's' : ''} disponible{productos.total !== 1 ? 's' : ''}
                    </p>
                </div>

                <div className="flex gap-8">

                    {/* ── SIDEBAR: Filtros ────────────────────── */}
                    <aside className="hidden lg:block w-56 shrink-0">

                        {/* Categorías */}
                        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                                Categorías
                            </h3>
                            <ul className="space-y-1">
                                {/* Opción "Todas" */}
                                <li>
                                    <button
                                        onClick={() => {
                                            const params = {};
                                            if (busqueda)  params.q          = busqueda;
                                            if (precioMin) params.precio_min = precioMin;
                                            if (precioMax) params.precio_max = precioMax;
                                            router.get(route('tienda.index'), params);
                                        }}
                                        className={`w-full text-left text-sm px-2 py-1 rounded-lg transition-colors
                                            ${!filtros.categoria
                                                ? 'bg-indigo-50 text-indigo-700 font-medium'
                                                : 'text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        Todas las categorías
                                    </button>
                                </li>

                                {/* Lista de categorías */}
                                {categorias.map(cat => (
                                    <li key={cat.id}>
                                        <button
                                            onClick={() => aplicarFiltros({ categoria: cat.slug })}
                                            className={`w-full text-left text-sm px-2 py-1 rounded-lg transition-colors
                                                ${filtros.categoria === cat.slug
                                                    ? 'bg-indigo-50 text-indigo-700 font-medium'
                                                    : 'text-gray-600 hover:bg-gray-50'}`}
                                        >
                                            {cat.nombre}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Rango de precio */}
                        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                                Precio (COP)
                            </h3>
                            <div className="space-y-2">
                                <input
                                    type="number"
                                    placeholder="Mínimo"
                                    value={precioMin}
                                    onChange={e => setPrecioMin(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                />
                                <input
                                    type="number"
                                    placeholder="Máximo"
                                    value={precioMax}
                                    onChange={e => setPrecioMax(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                />
                                <button
                                    onClick={() => aplicarFiltros(filtros.categoria ? { categoria: filtros.categoria } : {})}
                                    className="w-full bg-indigo-600 text-white text-sm rounded-lg px-3 py-1.5 hover:bg-indigo-700 transition-colors"
                                >
                                    Aplicar
                                </button>
                            </div>
                        </div>

                        {/* Limpiar filtros */}
                        {hayFiltros && (
                            <button
                                onClick={limpiarFiltros}
                                className="w-full text-sm text-gray-500 hover:text-red-600 transition-colors underline"
                            >
                                Limpiar filtros
                            </button>
                        )}
                    </aside>

                    {/* ── CONTENIDO PRINCIPAL ─────────────────── */}
                    <div className="flex-1 min-w-0">

                        {/* Banner de filtro activo */}
                        {hayFiltros && (
                            <div className="flex items-center gap-2 mb-4 p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-sm text-indigo-700">
                                <span>Filtrando por:</span>
                                {filtros.q          && <span className="bg-indigo-100 px-2 py-0.5 rounded-full">"{filtros.q}"</span>}
                                {filtros.categoria  && <span className="bg-indigo-100 px-2 py-0.5 rounded-full">{categoriaActual?.nombre || filtros.categoria}</span>}
                                {filtros.precio_min && <span className="bg-indigo-100 px-2 py-0.5 rounded-full">Desde {cop(filtros.precio_min)}</span>}
                                {filtros.precio_max && <span className="bg-indigo-100 px-2 py-0.5 rounded-full">Hasta {cop(filtros.precio_max)}</span>}
                                <button onClick={limpiarFiltros} className="ml-auto text-indigo-400 hover:text-indigo-700">✕</button>
                            </div>
                        )}

                        {/* Grid de productos */}
                        {productos.data.length === 0 ? (
                            <div className="text-center py-20">
                                <p className="text-4xl mb-4">🔍</p>
                                <p className="text-gray-500 text-lg font-medium">Sin resultados</p>
                                <p className="text-gray-400 text-sm mt-1">
                                    Intenta con otra búsqueda o elimina los filtros.
                                </p>
                                <button
                                    onClick={limpiarFiltros}
                                    className="mt-4 text-indigo-600 text-sm hover:underline"
                                >
                                    Ver todos los productos
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                {productos.data.map(producto => (
                                    <TarjetaProducto key={producto.id} producto={producto} cop={cop} />
                                ))}
                            </div>
                        )}

                        {/* ── PAGINACIÓN ──────────────────────── */}
                        {productos.last_page > 1 && (
                            <div className="mt-8 flex justify-center gap-1">
                                {productos.links.map((link, i) => (
                                    <button
                                        key={i}
                                        onClick={() => link.url && router.get(link.url)}
                                        disabled={!link.url}
                                        className={`px-3 py-1.5 text-sm rounded-lg border transition-colors
                                            ${link.active
                                                ? 'bg-indigo-600 text-white border-indigo-600'
                                                : link.url
                                                    ? 'border-gray-300 text-gray-600 hover:bg-gray-50'
                                                    : 'border-gray-200 text-gray-300 cursor-not-allowed'}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </TiendaLayout>
    );
}

/*
|--------------------------------------------------------------------------
| COMPONENTE: TarjetaProducto
|--------------------------------------------------------------------------
|
| PENSAR — ¿Por qué está FUERA de Index?
|
|   Patrón establecido: componentes helper FUERA del componente principal.
|   Si estuviera dentro, React lo recrearía en cada render → más lento.
|
|   Muestra: imagen, nombre, categoría, precio (con oferta si aplica),
|   y un link al detalle del producto.
|
*/
function TarjetaProducto({ producto, cop }) {
    const imagen = producto.imagenes?.[0] || null;
    const tieneOferta = producto.precio_oferta && Number(producto.precio_oferta) < Number(producto.precio_venta);

    const descuentoPct = tieneOferta
        ? Math.round((1 - producto.precio_oferta / producto.precio_venta) * 100)
        : 0;

    return (
        <Link
            href={route('tienda.show', producto.slug)}
            className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col"
        >
            {/* Imagen del producto */}
            <div className="relative aspect-square bg-gray-100 overflow-hidden">
                {imagen ? (
                    <img
                        src={imagen}
                        alt={producto.nombre}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">
                        📦
                    </div>
                )}

                {/* Badge de descuento */}
                {tieneOferta && (
                    <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        -{descuentoPct}%
                    </span>
                )}
            </div>

            {/* Info del producto */}
            <div className="p-3 flex flex-col flex-1">
                {/* Categoría */}
                {producto.categoria && (
                    <span className="text-xs text-indigo-500 font-medium mb-1">
                        {producto.categoria.nombre}
                    </span>
                )}

                {/* Nombre */}
                <p className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug flex-1">
                    {producto.nombre}
                </p>

                {/* Precio */}
                <div className="mt-2">
                    {tieneOferta ? (
                        <>
                            <span className="text-base font-bold text-red-600">
                                {cop(producto.precio_oferta)}
                            </span>
                            <span className="ml-2 text-xs text-gray-400 line-through">
                                {cop(producto.precio_venta)}
                            </span>
                        </>
                    ) : (
                        <span className="text-base font-bold text-gray-900">
                            {cop(producto.precio_venta)}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}
