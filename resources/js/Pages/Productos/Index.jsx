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

import { useState, useRef } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index({ productos, categorias, filtros }) {
    const { auth, flash } = usePage().props;
    const esAdmin        = auth.roles?.includes('super_administrador') || auth.roles?.includes('administrador');
    const puedeImportar  = esAdmin || auth.roles?.includes('proveedor');

    // ── Estado del modal de importación CSV ────────────────────────────
    const [modalImportar, setModalImportar] = useState(false);
    const [archivoCsv, setArchivoCsv]       = useState(null);
    const [importando, setImportando]        = useState(false);
    const [previsualizando, setPrevisualizando] = useState(false);
    const [preview, setPreview]             = useState(null); // { filas, validas, invalidas, total }
    const inputCsvRef = useRef(null);

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

    // ── Función: previsualizar archivo ─────────────────────────────────
    const previsualizarArchivo = async (archivo) => {
        if (!archivo) return;
        setPrevisualizando(true);
        setPreview(null);
        const formData = new FormData();
        formData.append('archivo', archivo);
        try {
            const url = '/productos/importar/preview';
            const csrf = document.querySelector('meta[name="csrf-token"]')?.content ?? '';
            const resp = await fetch(url, {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': csrf, 'Accept': 'application/json' },
                body: formData,
            });
            const text = await resp.text();
            let json;
            try { json = JSON.parse(text); }
            catch (_) { json = { error: `El servidor respondió (${resp.status}): ${text.slice(0, 200)}` }; }
            setPreview(json.error && resp.ok ? json : (resp.ok ? json : { error: json.message ?? `Error ${resp.status}` }));
        } catch (e) {
            setPreview({ error: `Error de red: ${e.message}` });
        } finally {
            setPrevisualizando(false);
        }
    };

    // ── Función: enviar CSV al servidor ────────────────────────────────
    const enviarCsv = () => {
        if (!archivoCsv) return;
        setImportando(true);

        const formData = new FormData();
        formData.append('archivo', archivoCsv);

        router.post(route('productos.importar'), formData, {
            forceFormData: true,
            onSuccess: () => {
                setModalImportar(false);
                setArchivoCsv(null);
                setPreview(null);
                setImportando(false);
                if (inputCsvRef.current) inputCsvRef.current.value = '';
            },
            onError: () => setImportando(false),
        });
    };

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
                        ✅ {flash.exito}
                    </div>
                )}
                {flash?.error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        ❌ {flash.error}
                    </div>
                )}
                {/* Errores de fila de importación */}
                {flash?.errores_importacion?.length > 0 && (
                    <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-yellow-800 font-medium mb-1">Advertencias de importación:</p>
                        <ul className="text-sm text-yellow-700 list-disc list-inside space-y-0.5">
                            {flash.errores_importacion.map((e, i) => <li key={i}>{e}</li>)}
                        </ul>
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
                    <div className="flex items-center gap-2 flex-wrap">
                        {esAdmin && (
                            <Link
                                href={route('categorias.index')}
                                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition"
                            >
                                Categorías
                            </Link>
                        )}
                        {/* Botón importar CSV — admin, super admin y proveedor */}
                        {puedeImportar && (
                            <button
                                onClick={() => setModalImportar(true)}
                                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition"
                            >
                                ↑ Importar Excel / CSV
                            </button>
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

            {/* ── MODAL: Importar productos desde CSV ─────────────────── */}
            {/*
             * ENTENDER — ¿Cómo funciona este modal?
             *
             *   1. El usuario hace clic en "↑ Importar CSV"
             *   2. Se abre el modal (modalImportar = true)
             *   3. El usuario descarga la plantilla CSV o sube su archivo
             *   4. Al hacer clic en "Importar", enviamos el archivo con
             *      router.post() usando FormData (forceFormData: true)
             *   5. El controller parsea el CSV y crea los productos
             *   6. El flash message muestra cuántos se crearon y errores
             *
             * PENSAR — ¿Por qué forceFormData: true?
             *
             *   Inertia por defecto serializa los datos como JSON.
             *   Pero para subir archivos necesitamos multipart/form-data.
             *   forceFormData: true le dice a Inertia que use FormData.
             */}
            {modalImportar && (
                <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl my-8">

                        {/* Encabezado */}
                        <div className="flex items-center justify-between p-5 border-b">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Importar Productos (Excel o CSV)
                            </h3>
                            <button
                                onClick={() => { setModalImportar(false); setArchivoCsv(null); setPreview(null); }}
                                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                            >×</button>
                        </div>

                        {/* Cuerpo */}
                        <div className="p-5 space-y-4">

                            {/* Instrucciones */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                                <p className="font-medium mb-1">📊 Formatos: <strong>Excel (.xlsx)</strong> o CSV</p>
                                <p className="text-xs">
                                    Columna <strong>nombre</strong> es obligatoria. <strong>categoria_slug</strong>: slug exacto de la categoría.
                                </p>
                            </div>

                            {/* Selector de archivo */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Seleccionar archivo
                                </label>
                                <input
                                    ref={inputCsvRef}
                                    type="file"
                                    accept=".xlsx,.xls,.csv,.ods,text/csv"
                                    onChange={(e) => {
                                        const f = e.target.files[0] || null;
                                        setArchivoCsv(f);
                                        setPreview(null);
                                        if (f) previsualizarArchivo(f);
                                    }}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                                />
                                {archivoCsv && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        {archivoCsv.name} — {(archivoCsv.size / 1024).toFixed(1)} KB
                                    </p>
                                )}
                            </div>

                            {/* Cargando preview */}
                            {previsualizando && (
                                <div className="text-center py-6 text-gray-500 text-sm">
                                    ⏳ Analizando archivo...
                                </div>
                            )}

                            {/* Error de preview */}
                            {preview?.error && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                                    ⚠️ {preview.error}
                                </div>
                            )}

                            {/* Resumen */}
                            {preview && !preview.error && (
                                <div className="flex gap-3 text-sm">
                                    <span className="bg-gray-100 px-3 py-1 rounded-full font-medium">
                                        Total: {preview.total}
                                    </span>
                                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                                        ✅ Válidas: {preview.validas}
                                    </span>
                                    {preview.invalidas > 0 && (
                                        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full font-medium">
                                            ❌ Con error: {preview.invalidas}
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Tabla de preview */}
                            {preview?.filas?.length > 0 && (
                                <div className="overflow-x-auto max-h-96 border border-gray-200 rounded-lg">
                                    <table className="w-full text-xs">
                                        <thead className="bg-gray-50 sticky top-0">
                                            <tr>
                                                <th className="px-3 py-2 text-left text-gray-600 font-medium">#</th>
                                                <th className="px-3 py-2 text-left text-gray-600 font-medium">Nombre</th>
                                                <th className="px-3 py-2 text-left text-gray-600 font-medium">SKU</th>
                                                <th className="px-3 py-2 text-left text-gray-600 font-medium">Precio Venta</th>
                                                <th className="px-3 py-2 text-left text-gray-600 font-medium">Categoría</th>
                                                <th className="px-3 py-2 text-left text-gray-600 font-medium">Estado</th>
                                                <th className="px-3 py-2 text-left text-gray-600 font-medium">Errores</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {preview.filas.map((f) => (
                                                <tr key={f.fila} className={f.valida ? 'bg-white hover:bg-green-50' : 'bg-red-50 hover:bg-red-100'}>
                                                    <td className="px-3 py-2 text-gray-400">{f.fila}</td>
                                                    <td className="px-3 py-2 font-medium text-gray-800">{f.nombre}</td>
                                                    <td className="px-3 py-2 text-gray-500">{f.sku || '—'}</td>
                                                    <td className="px-3 py-2 text-gray-700">{f.precio_venta || '—'}</td>
                                                    <td className={`px-3 py-2 ${!f.categoria_ok ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                                                        {f.categoria_slug || '—'}
                                                    </td>
                                                    <td className="px-3 py-2 text-gray-600">{f.estado}</td>
                                                    <td className="px-3 py-2">
                                                        {f.errores.length > 0 ? (
                                                            <ul className="list-disc list-inside text-red-600 space-y-0.5">
                                                                {f.errores.map((e, i) => <li key={i}>{e}</li>)}
                                                            </ul>
                                                        ) : (
                                                            <span className="text-green-600">✓ OK</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Pie */}
                        <div className="flex justify-end gap-3 p-5 border-t">
                            <button
                                onClick={() => { setModalImportar(false); setArchivoCsv(null); setPreview(null); }}
                                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={enviarCsv}
                                disabled={!archivoCsv || importando || !preview || preview.validas === 0}
                                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {importando
                                    ? 'Importando...'
                                    : preview?.validas > 0
                                        ? `Importar ${preview.validas} producto(s) válido(s)`
                                        : 'Importar Productos'}
                            </button>
                        </div>

                    </div>
                </div>
            )}

        </AuthenticatedLayout>
    );
}
