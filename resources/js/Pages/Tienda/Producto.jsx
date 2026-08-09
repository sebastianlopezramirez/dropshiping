/*
|--------------------------------------------------------------------------
| PÁGINA: Tienda/Producto.jsx
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué hace esta página?
|
|   Muestra el detalle completo de un producto:
|   galería de imágenes, precio, descripción y productos relacionados.
|   También inyecta los meta tags SEO en el <head> para que Google,
|   WhatsApp y redes sociales lean el título, descripción e imagen.
|
| PENSAR — Props que recibe del controller:
|
|   producto    → objeto completo con categoria e imagenes (array)
|   relacionados → array de hasta 4 productos de la misma categoría
|   seo         → { titulo, descripcion, imagen, url }
|
| PENSAR — ¿Cómo funciona el SEO con Inertia?
|
|   Inertia usa el componente <Head> de @inertiajs/react para inyectar
|   tags en el <head> del HTML. En cada navegación, Inertia reemplaza
|   el <head> con los nuevos valores → el título y meta cambian por producto.
|
|   Para og:title, og:description y og:image usamos <Head> con tags
|   <meta> explícitos. Esto permite que WhatsApp, Telegram y Google
|   lean la info correcta al compartir el enlace.
|
*/

import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import TiendaLayout from '@/Layouts/TiendaLayout';

export default function Producto({ producto, relacionados, seo, whatsapp }) {

    // Índice de la imagen actualmente visible en la galería
    const [imagenActiva, setImagenActiva] = useState(0);

    // Imágenes del producto como array de URLs strings
    // Prioridad: Spatie media (R2) → campo legacy imagenes → vacío
    const imagenes = producto.media?.length > 0
        ? producto.media.map(m => m.original_url)
        : (producto.imagenes || []);

    // Formateador de precio COP
    const cop = (n) => Number(n).toLocaleString('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0
    });

    const tieneOferta = producto.precio_oferta
        && Number(producto.precio_oferta) < Number(producto.precio_venta);

    const descuentoPct = tieneOferta
        ? Math.round((1 - producto.precio_oferta / producto.precio_venta) * 100)
        : 0;

    return (
        <TiendaLayout>

            {/*
            |------------------------------------------------------------------
            | SEO: Meta tags en el <head>
            |------------------------------------------------------------------
            |
            | PENSAR — ¿Por qué usamos <Head> y no un <meta> directo?
            |
            |   Inertia renderiza el HTML en el servidor (SSR) o en el cliente.
            |   El componente <Head> de Inertia gestiona el ciclo de vida
            |   de los tags: los inserta al entrar a la página y los elimina
            |   al salir. Sin esto, los meta tags se acumularían en el DOM.
            |
            */}
            <Head>
                <title>{seo.titulo}</title>
                <meta name="description"          content={seo.descripcion} />

                {/* Open Graph — para WhatsApp, Telegram, Facebook */}
                <meta property="og:title"         content={seo.titulo} />
                <meta property="og:description"   content={seo.descripcion} />
                <meta property="og:url"           content={seo.url} />
                <meta property="og:type"          content="product" />
                {seo.imagen && (
                    <meta property="og:image"     content={seo.imagen} />
                )}

                {/* Twitter Card */}
                <meta name="twitter:card"         content="summary_large_image" />
                <meta name="twitter:title"        content={seo.titulo} />
                <meta name="twitter:description"  content={seo.descripcion} />
                {seo.imagen && (
                    <meta name="twitter:image"    content={seo.imagen} />
                )}
            </Head>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* ── BREADCRUMB ─────────────────────────────── */}
                <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                    <Link href={route('tienda.index')} className="hover:text-indigo-600 transition-colors">
                        Tienda
                    </Link>
                    {producto.categoria && (
                        <>
                            <span>/</span>
                            <Link
                                href={route('tienda.categoria', producto.categoria.slug)}
                                className="hover:text-indigo-600 transition-colors"
                            >
                                {producto.categoria.nombre}
                            </Link>
                        </>
                    )}
                    <span>/</span>
                    <span className="text-gray-700 truncate max-w-xs">{producto.nombre}</span>
                </nav>

                {/* ── DETALLE DEL PRODUCTO ────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">

                    {/* COLUMNA IZQUIERDA: Galería de imágenes */}
                    <div>
                        {/* Imagen principal */}
                        <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100 mb-3">
                            {imagenes.length > 0 ? (
                                <img
                                    src={imagenes[imagenActiva]}
                                    alt={producto.nombre}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300 text-6xl">
                                    📦
                                </div>
                            )}
                        </div>

                        {/* Miniaturas — solo si hay más de una imagen */}
                        {imagenes.length > 1 && (
                            <div className="flex gap-2 flex-wrap">
                                {imagenes.map((url, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setImagenActiva(i)}
                                        className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors
                                            ${imagenActiva === i
                                                ? 'border-indigo-500'
                                                : 'border-gray-200 hover:border-gray-400'}`}
                                    >
                                        <img
                                            src={url}
                                            alt={`imagen ${i + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* COLUMNA DERECHA: Info del producto */}
                    <div className="flex flex-col">

                        {/* Categoría */}
                        {producto.categoria && (
                            <Link
                                href={route('tienda.categoria', producto.categoria.slug)}
                                className="text-sm text-indigo-500 font-medium hover:text-indigo-700 mb-2 w-fit"
                            >
                                {producto.categoria.nombre}
                            </Link>
                        )}

                        {/* Nombre */}
                        <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-4">
                            {producto.nombre}
                        </h1>

                        {/* Precio */}
                        <div className="mb-6">
                            {tieneOferta ? (
                                <div className="flex items-baseline gap-3">
                                    <span className="text-3xl font-bold text-red-600">
                                        {cop(producto.precio_oferta)}
                                    </span>
                                    <span className="text-lg text-gray-400 line-through">
                                        {cop(producto.precio_venta)}
                                    </span>
                                    <span className="bg-red-100 text-red-700 text-sm font-bold px-2 py-0.5 rounded-full">
                                        -{descuentoPct}%
                                    </span>
                                </div>
                            ) : (
                                <span className="text-3xl font-bold text-gray-900">
                                    {cop(producto.precio_venta)}
                                </span>
                            )}
                            <p className="text-xs text-gray-400 mt-1">IVA incluido · Precio en COP</p>
                        </div>

                        {/* Descripción corta */}
                        {producto.descripcion_corta && (
                            <p className="text-gray-600 text-sm leading-relaxed mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                {producto.descripcion_corta}
                            </p>
                        )}

                        {/* Disponibilidad */}
                        <div className="flex items-center gap-2 mb-6">
                            <span className="w-2 h-2 rounded-full bg-green-400 inline-block"></span>
                            <span className="text-sm text-gray-600">
                                {producto.stock
                                    ? `${producto.stock} unidades disponibles`
                                    : 'Disponible'}
                            </span>
                        </div>

                        {/* SKU */}
                        {producto.sku && (
                            <p className="text-xs text-gray-400 font-mono mb-6">
                                SKU: {producto.sku}
                            </p>
                        )}

                        {/*
                         * CTAs — Botones de acción
                         *
                         * 1. "Pedir por WhatsApp" → abre chat con el negocio
                         *    Mensaje pre-llenado: nombre del producto + URL
                         *    Requiere variable WHATSAPP_NUMERO en Railway
                         *
                         * 2. "Preguntar antes de comprar" → mismo chat, mensaje diferente
                         *
                         * 3. "Compartir" → reenvía el link del producto a cualquiera
                         */}
                        <div className="flex flex-col gap-3 mt-2">

                            {/* Botón principal: Pedir */}
                            {whatsapp ? (
                                <a
                                    href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(
                                        `Hola, quiero pedir:\n\n*${producto.nombre}*\n${seo.url}`
                                    )}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold text-base px-6 py-4 rounded-xl transition-colors w-full shadow-sm"
                                >
                                    <IconWA />
                                    Pedir por WhatsApp
                                </a>
                            ) : null}

                            {/* Botón secundario: Preguntar */}
                            {whatsapp ? (
                                <a
                                    href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(
                                        `Hola, tengo una pregunta sobre:\n\n*${producto.nombre}*\n${seo.url}`
                                    )}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-2 border-2 border-green-500 text-green-700 hover:bg-green-50 font-medium text-sm px-6 py-3 rounded-xl transition-colors w-full"
                                >
                                    <IconWA className="w-4 h-4" />
                                    Preguntar antes de comprar
                                </a>
                            ) : null}

                            {/* Compartir enlace */}
                            <a
                                href={`https://wa.me/?text=${encodeURIComponent(`${producto.nombre} — ${seo.url}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 text-gray-500 hover:text-gray-700 text-sm px-6 py-2 rounded-xl transition-colors w-full border border-gray-200 hover:bg-gray-50"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                                Compartir este producto
                            </a>

                        </div>

                    </div>
                </div>

                {/* ── DESCRIPCIÓN COMPLETA ────────────────────── */}
                {producto.descripcion && (
                    <section className="mb-16">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                            Descripción del producto
                        </h2>
                        {/*
                            whitespace-pre-line → respeta los saltos de línea del texto
                            que guardó el vendedor en el campo descripcion
                        */}
                        <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-line leading-relaxed">
                            {producto.descripcion}
                        </div>
                    </section>
                )}

                {/* ── PRODUCTOS RELACIONADOS ───────────────────── */}
                {relacionados.length > 0 && (
                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                            También te puede interesar
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {relacionados.map(rel => (
                                <TarjetaRelacionado key={rel.id} producto={rel} cop={cop} />
                            ))}
                        </div>
                    </section>
                )}

            </div>
        </TiendaLayout>
    );
}

/*
|--------------------------------------------------------------------------
| COMPONENTE: IconWA — Ícono de WhatsApp reutilizable
|--------------------------------------------------------------------------
*/
function IconWA({ className = 'w-5 h-5' }) {
    return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
    );
}

/*
|--------------------------------------------------------------------------
| COMPONENTE: TarjetaRelacionado
|--------------------------------------------------------------------------
| Versión compacta de tarjeta para la sección "También te puede interesar".
| Fuera del componente principal por el patrón Campo/helper establecido.
*/
function TarjetaRelacionado({ producto, cop }) {
    const imagen = producto.imagenes?.[0] || null;
    const tieneOferta = producto.precio_oferta
        && Number(producto.precio_oferta) < Number(producto.precio_venta);

    return (
        <Link
            href={route('tienda.show', producto.slug)}
            className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
        >
            <div className="aspect-square bg-gray-100 overflow-hidden">
                {imagen ? (
                    <img
                        src={imagen}
                        alt={producto.nombre}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">
                        📦
                    </div>
                )}
            </div>
            <div className="p-3">
                <p className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug mb-1">
                    {producto.nombre}
                </p>
                <p className="text-sm font-bold text-gray-900">
                    {tieneOferta ? cop(producto.precio_oferta) : cop(producto.precio_venta)}
                </p>
            </div>
        </Link>
    );
}
