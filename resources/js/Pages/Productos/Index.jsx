/*
|--------------------------------------------------------------------------
| PÁGINA: Productos/Index.jsx
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué hace esta página?
|
|   Lista todos los productos con:
|   - Filtros: buscar por nombre, categoría, estado, precio
|   - Tabla con imagen, nombre, precio, stock, estado, acciones
|   - Paginación
|   - Mensajes flash (éxito / error)
|
| PENSAR — ¿Cómo fluye la data?
|
|   Laravel (ProductoController@index)
|     → Inertia::render('Productos/Index', { productos, categorias, filtros, flash })
|     → React recibe esos datos como PROPS
|     → usePage().props → accedemos a la data
|
| HOOKS DE REACT USADOS:
|   useState     → estado local del componente (valores del formulario de filtro)
|   usePage      → acceder a las props de Inertia (productos, flash, etc.)
|   router       → navegar sin recargar la página (SPA)
|   useForm      → manejar formularios con Inertia
|
*/

import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index({ productos, categorias, filtros }) {
    const { auth } = usePage().props;
    const esAdmin = auth.roles?.includes('super_administrador') || auth.roles?.includes('administrador');

    /*
    |----------------------------------------------------------------------
    | ESTADO LOCAL — Formulario de filtros
    |----------------------------------------------------------------------
    |
    | useState(valorInicial) → retorna [valor, setValor]
    |
    | Guardamos los filtros activos en el estado local.
    | Cuando el usuario escribe o selecciona, actualizamos el estado.
    | Al hacer submit, enviamos los filtros al servidor con router.get().
    |
    */
    const [buscar, setBuscar]           = useState(filtros.buscar || '');
    const [categoriaId, setCategoriaId] = useState(filtros.categoria_id || '');
    const [estado, setEstado]           = useState(filtros.estado || '');

    // Obtenemos los mensajes flash del servidor
    const { flash } = usePage().props;

    /*
    |----------------------------------------------------------------------
    | FUNCIÓN: aplicarFiltros
    |----------------------------------------------------------------------
    |
    | Cuando el usuario aplica filtros, hacemos una navegación SPA.
    |
    | router.get() → envía una petición GET con los filtros como query string
    |   URL resultante: /productos?buscar=iphone&estado=activo
    |
    | preserveState: true → mantiene el estado del componente (no se resetea)
    | replace: true       → no agrega al historial del browser (un solo "atrás")
    |
    */
    const aplicarFiltros = (e) => {
        e.preventDefault(); // evita que el form recargue la página

        router.get(route('productos.index'), {
            buscar,
            categoria_id: categoriaId,
            estado,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    /*
    |----------------------------------------------------------------------
    | FUNCIÓN: limpiarFiltros
    |----------------------------------------------------------------------
    */
    const limpiarFiltros = () => {
        setBuscar('');
        setCategoriaId('');
        setEstado('');
        router.get(route('productos.index'));
    };

    /*
    |----------------------------------------------------------------------
    | FUNCIÓN: eliminarProducto
    |----------------------------------------------------------------------
    |
    | router.delete() → envía DELETE /productos/{id}
    | El controller hace soft delete (llena eliminado_en).
    |
    */
    const eliminarProducto = (producto) => {
        if (!confirm(`¿Eliminar "${producto.nombre}"? Esta acción se puede revertir.`)) return;

        router.delete(route('productos.destroy', producto.id), {
            preserveScroll: true,
        });
    };

    /*
    |----------------------------------------------------------------------
    | HELPERS DE PRESENTACIÓN
    |----------------------------------------------------------------------
    */

    // Formatea precio en pesos colombianos
    const formatearPrecio = (precio) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
        }).format(precio);
    };

    // Color del badge según el estado del producto
    const colorEstado = {
        activo:   'bg-green-100 text-green-800',
        borrador: 'bg-yellow-100 text-yellow-800',
        agotado:  'bg-red-100 text-red-800',
        inactivo: 'bg-gray-100 text-gray-600',
    };

    /*
    |----------------------------------------------------------------------
    | RENDER — Lo que React dibuja en pantalla
    |----------------------------------------------------------------------
    */
    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold text-gray-800">Productos</h2>}
        >
            <Head title="Productos" />

            <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* ── MENSAJE FLASH ──────────────────────────────────── */}
                {flash?.exito && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                        {flash.exito}
                    </div>
                )}
                {flash?.error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        {flash.error}
                    </div>
                )}

                {/* ── ENCABEZADO: título + botón crear ───────────────── */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Catálogo de Productos</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            {productos.total} productos en total
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {esAdmin && (
                            <Link
                                href={route('categorias.index')}
                                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition"
                            >
                                Categorías
                            </Link>
                        )}
                        <Link
                            href={route('productos.create')}
                            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition"
                        >
                            + Nuevo Producto
                        </Link>
                    </div>
                </div>

                {/* ── FORMULARIO DE FILTROS ───────────────────────────── */}
                <form onSubmit={aplicarFiltros} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

                        {/* Búsqueda por nombre */}
                        <input
                            type="text"
                            placeholder="Buscar por nombre..."
                            value={buscar}
                            onChange={e => setBuscar(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />

                        {/* Filtro por categoría */}
                        <select
                            value={categoriaId}
                            onChange={e => setCategoriaId(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">Todas las categorías</option>
                            {categorias.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                            ))}
                        </select>

                        {/* Filtro por estado */}
                        <select
                            value={estado}
                            onChange={e => setEstado(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">Todos los estados</option>
                            <option value="activo">Activo</option>
                            <option value="borrador">Borrador</option>
                            <option value="agotado">Agotado</option>
                            <option value="inactivo">Inactivo</option>
                        </select>

                        {/* Botones */}
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="flex-1 px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition"
                            >
                                Filtrar
                            </button>
                            <button
                                type="button"
                                onClick={limpiarFiltros}
                                className="px-3 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition"
                            >
                                Limpiar
                            </button>
                        </div>
                    </div>
                </form>

                {/* ── TABLA DE PRODUCTOS ──────────────────────────────── */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio venta</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {productos.data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                                        No hay productos. <Link href={route('productos.create')} className="text-indigo-600 hover:underline">Crear el primero</Link>
                                    </td>
                                </tr>
                            ) : (
                                productos.data.map(producto => (
                                    <tr key={producto.id} className="hover:bg-gray-50 transition">

                                        {/* Imagen + nombre
                                            Prioridad:
                                            1. Spatie Media Library → producto.media[0].original_url
                                            2. Campo legacy → producto.imagenes[0] (productos antiguos)
                                        */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                {(producto.media?.[0]?.original_url || producto.imagenes?.[0]) ? (
                                                    <img
                                                        src={producto.media?.[0]?.original_url ?? producto.imagenes[0]}
                                                        alt={producto.nombre}
                                                        className="w-10 h-10 object-cover rounded-lg border border-gray-200"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                                                        Sin img
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{producto.nombre}</p>
                                                    {producto.sku && (
                                                        <p className="text-xs text-gray-400">SKU: {producto.sku}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Categoría */}
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {producto.categoria?.nombre ?? <span className="text-gray-400 italic">Sin categoría</span>}
                                        </td>

                                        {/* Precio */}
                                        <td className="px-4 py-3">
                                            <p className="text-sm font-medium text-gray-900">
                                                {formatearPrecio(producto.precio_venta)}
                                            </p>
                                            {producto.precio_oferta && (
                                                <p className="text-xs text-green-600">
                                                    Oferta: {formatearPrecio(producto.precio_oferta)}
                                                </p>
                                            )}
                                        </td>

                                        {/* Stock */}
                                        <td className="px-4 py-3 text-sm">
                                            {producto.stock === null ? (
                                                <span className="text-gray-400">Ilimitado</span>
                                            ) : (
                                                <span className={producto.stock <= producto.stock_minimo ? 'text-red-600 font-medium' : 'text-gray-700'}>
                                                    {producto.stock} uds
                                                </span>
                                            )}
                                        </td>

                                        {/* Estado */}
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${colorEstado[producto.estado] || 'bg-gray-100 text-gray-600'}`}>
                                                {producto.estado}
                                            </span>
                                        </td>

                                        {/* Acciones */}
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={route('productos.edit', producto.id)}
                                                    className="text-xs text-indigo-600 hover:underline"
                                                >
                                                    Editar
                                                </Link>
                                                <button
                                                    onClick={() => eliminarProducto(producto)}
                                                    className="text-xs text-red-500 hover:underline"
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                  </div>
                </div>

                {/* ── PAGINACIÓN ──────────────────────────────────────── */}
                {productos.last_page > 1 && (
                    <div className="mt-4 flex items-center justify-center gap-1">
                        {productos.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url || '#'}
                                className={`px-3 py-1 text-sm rounded-lg border transition ${
                                    link.active
                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                        : link.url
                                            ? 'border-gray-300 text-gray-600 hover:bg-gray-50'
                                            : 'border-gray-200 text-gray-300 cursor-default'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}

            </div>
        </AuthenticatedLayout>
    );
}
