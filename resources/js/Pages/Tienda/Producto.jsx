/*
|--------------------------------------------------------------------------
| PÁGINA: Tienda/Producto.jsx — GadGet Store
|--------------------------------------------------------------------------
*/

import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import TiendaLayout from '@/Layouts/TiendaLayout';
import { useCart } from '@/Context/CartContext';

export default function Producto({ producto, relacionados, seo, whatsapp, tarifas = [] }) {

    const [imagenActiva, setImagenActiva] = useState(0);
    const [agregado, setAgregado] = useState(false);
    const { agregarItem } = useCart();

    // ── TARIFAS agrupadas (igual que Carrito) ───────────────────────────────
    const areaMetro = tarifas.filter(t => t.tipo === 'area_metro');
    const ciudades  = tarifas.filter(t => t.tipo === 'ciudad');

    // ── FORMULARIO DE LEAD ──────────────────────────────────────────────────
    const [lead, setLead] = useState({ nombre: '', celular: '', email: '', municipio: '', direccion: '' });
    const [aceptaDatos, setAceptaDatos] = useState(false);
    const [leadGuardado, setLeadGuardado] = useState(false);
    const [leadEnviando, setLeadEnviando] = useState(false);
    const [leadError, setLeadError]     = useState('');

    const handleLeadSubmit = async (e) => {
        e.preventDefault();
        if (!aceptaDatos) { setLeadError('Debes aceptar el tratamiento de datos.'); return; }
        setLeadError('');
        setLeadEnviando(true);
        try {
            const token = document.querySelector('meta[name="csrf-token"]')?.content ?? '';
            const res = await fetch(route('tienda.lead'), {
                method:  'POST',
                headers: {
                    'Content-Type':  'application/json',
                    'Accept':        'application/json',
                    'X-CSRF-TOKEN':  token,
                },
                body: JSON.stringify({
                    nombre:    lead.nombre,
                    celular:   lead.celular,
                    email:     lead.email || null,
                    municipio: lead.municipio,
                    direccion: lead.direccion || null,
                    producto:  producto.nombre,
                    categoria: producto.categoria?.nombre ?? null,
                }),
            });
            if (res.ok) { setLeadGuardado(true); }
            else        { setLeadError('Ocurrió un error. Inténtalo de nuevo.'); }
        } catch {
            setLeadError('Sin conexión. Inténtalo de nuevo.');
        } finally {
            setLeadEnviando(false);
        }
    };

    const imagenes = producto.media?.length > 0
        ? producto.media.map(m => m.original_url)
        : (producto.imagenes || []);

    const cop = (n) => Number(n).toLocaleString('es-CO', {
        style: 'currency', currency: 'COP', maximumFractionDigits: 0
    });

    const tieneOferta = producto.precio_oferta
        && Number(producto.precio_oferta) < Number(producto.precio_venta);

    const descuentoPct = tieneOferta
        ? Math.round((1 - producto.precio_oferta / producto.precio_venta) * 100)
        : 0;

    const handleAgregarCarrito = () => {
        agregarItem({
            id:          producto.id,
            nombre:      producto.nombre,
            slug:        producto.slug,
            precio_venta: tieneOferta ? producto.precio_oferta : producto.precio_venta,
            imagen:      imagenes[0] || null,
        });
        setAgregado(true);
        setTimeout(() => setAgregado(false), 2000);
    };

    const handleComprarAhora = () => {
        handleAgregarCarrito();
        router.visit(route('tienda.carrito'));
    };

    const precioMostrar = tieneOferta ? producto.precio_oferta : producto.precio_venta;

    // Datos del cliente para mensajes WA
    const saludo     = lead.nombre    ? `Hola! Soy *${lead.nombre}*` : `Hola!`;
    const telCliente = lead.celular   ? `\nMi celular: ${lead.celular}` : '';
    const mpio       = lead.municipio ? `\nMunicipio: ${lead.municipio}` : '';
    const dir        = lead.direccion ? `\nDirección: ${lead.direccion}` : '';

    // Sin contraentrega: pago por transferencia primero
    const msgEnvioTransferencia = encodeURIComponent(
        `${saludo}, me interesa este producto:\n\n` +
        `*${producto.nombre}*\n` +
        `Precio: ${cop(precioMostrar)}\n` +
        (producto.sku ? `SKU: ${producto.sku}\n` : '') +
        `${seo.url}` +
        `${telCliente}${mpio}${dir}\n\n` +
        `Quiero que me lo *envíen a domicilio*. Por favor compártame los datos bancarios de GadGet Store para realizar el pago por transferencia.`
    );

    const msgReclamarAlmacen = encodeURIComponent(
        `${saludo}, me interesa este producto:\n\n` +
        `*${producto.nombre}*\n` +
        `Precio: ${cop(precioMostrar)}\n` +
        (producto.sku ? `SKU: ${producto.sku}\n` : '') +
        `${seo.url}` +
        `${telCliente}${mpio}\n\n` +
        `Quiero *reclamarlo en el almacén*. Por favor compártame los datos bancarios de GadGet Store para realizar el pago por transferencia.`
    );

    // Con contraentrega: el cliente paga al recibir
    const msgEnvioContraentrega = encodeURIComponent(
        `${saludo}, me interesa este producto:\n\n` +
        `*${producto.nombre}*\n` +
        `Precio: ${cop(precioMostrar)}\n` +
        (producto.sku ? `SKU: ${producto.sku}\n` : '') +
        `${seo.url}` +
        `${telCliente}${mpio}${dir}\n\n` +
        `Quiero que me lo *envíen a domicilio* (pago contraentrega). Por favor confírmeme el tiempo de entrega estimado.`
    );

    return (
        <TiendaLayout>

            {/* ── SEO ──────────────────────────────────────────────────── */}
            <Head>
                <title>{seo.titulo}</title>
                <meta name="description"        content={seo.descripcion} />
                <meta property="og:title"       content={seo.titulo} />
                <meta property="og:description" content={seo.descripcion} />
                <meta property="og:url"         content={seo.url} />
                <meta property="og:type"        content="product" />
                {seo.imagen && <meta property="og:image" content={seo.imagen} />}
                <meta name="twitter:card"       content="summary_large_image" />
                <meta name="twitter:title"      content={seo.titulo} />
                <meta name="twitter:description" content={seo.descripcion} />
                {seo.imagen && <meta name="twitter:image" content={seo.imagen} />}
            </Head>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

                {/* ── BOTÓN VOLVER ────────────────────────────────────────── */}
                <div className="mb-4">
                    <Link
                        href={producto.categoria
                            ? route('tienda.categoria', producto.categoria.slug)
                            : route('tienda.index')}
                        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-orange-400 transition-colors"
                    >
                        ← {producto.categoria ? producto.categoria.nombre : 'Tienda'}
                    </Link>
                </div>

                {/* ── BREADCRUMB ──────────────────────────────────────────── */}
                <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-6">
                    <Link href={route('tienda.index')} className="hover:text-orange-400 transition-colors">
                        Tienda
                    </Link>
                    {producto.categoria && (
                        <>
                            <span className="text-gray-700">/</span>
                            <Link href={route('tienda.categoria', producto.categoria.slug)}
                                className="hover:text-orange-400 transition-colors">
                                {producto.categoria.nombre}
                            </Link>
                        </>
                    )}
                    <span className="text-gray-700">/</span>
                    <span className="text-gray-300 truncate max-w-[200px] sm:max-w-xs font-medium">
                        {producto.nombre}
                    </span>
                </nav>

                {/* ── DETALLE ─────────────────────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">

                    {/* COLUMNA IZQUIERDA: Galería */}
                    <div className="space-y-3">
                        <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-900 border border-gray-800 shadow-xl">
                            {imagenes.length > 0 ? (
                                <img
                                    src={imagenes[imagenActiva]}
                                    alt={producto.nombre}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-700 text-7xl">
                                    📦
                                </div>
                            )}

                            {/* Badge descuento */}
                            {tieneOferta && (
                                <div className="absolute top-3 left-3">
                                    <span className="bg-gradient-to-r from-orange-500 to-pink-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg">
                                        -{descuentoPct}% OFF
                                    </span>
                                </div>
                            )}

                            {/* Flechas de navegación */}
                            {imagenes.length > 1 && (
                                <>
                                    <button
                                        onClick={() => setImagenActiva(i => (i - 1 + imagenes.length) % imagenes.length)}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-gray-900/80 hover:bg-gray-900 border border-gray-700 rounded-full flex items-center justify-center shadow-md transition-colors"
                                    >
                                        <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => setImagenActiva(i => (i + 1) % imagenes.length)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-gray-900/80 hover:bg-gray-900 border border-gray-700 rounded-full flex items-center justify-center shadow-md transition-colors"
                                    >
                                        <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                    {/* Puntos */}
                                    <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                                        {imagenes.map((_, i) => (
                                            <button key={i} onClick={() => setImagenActiva(i)}
                                                className={`w-2 h-2 rounded-full transition-all ${i === imagenActiva ? 'bg-orange-400 w-4' : 'bg-gray-600'}`}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Miniaturas */}
                        {imagenes.length > 1 && (
                            <div className="flex gap-2 flex-wrap">
                                {imagenes.map((url, i) => (
                                    <button key={i} onClick={() => setImagenActiva(i)}
                                        className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all
                                            ${imagenActiva === i
                                                ? 'border-orange-500 shadow-md shadow-orange-900/30 scale-105'
                                                : 'border-gray-800 hover:border-gray-600 opacity-60 hover:opacity-100'}`}
                                    >
                                        <img src={url} alt={`imagen ${i + 1}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* COLUMNA DERECHA: Info + CTAs */}
                    <div className="flex flex-col">

                        {/* Categoría */}
                        {producto.categoria && (
                            <Link href={route('tienda.categoria', producto.categoria.slug)}
                                className="inline-flex items-center text-xs font-semibold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-full w-fit mb-3 hover:bg-orange-500/20 transition-colors">
                                {producto.categoria.nombre}
                            </Link>
                        )}

                        {/* Nombre */}
                        <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight mb-4">
                            {producto.nombre}
                        </h1>

                        {/* Precio */}
                        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mb-5">
                            {tieneOferta ? (
                                <div>
                                    <div className="flex items-baseline gap-3">
                                        <span className="text-3xl font-extrabold bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
                                            {cop(producto.precio_oferta)}
                                        </span>
                                        <span className="text-lg text-gray-600 line-through">
                                            {cop(producto.precio_venta)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-orange-400 font-medium mt-1">
                                        ¡Ahorras {cop(producto.precio_venta - producto.precio_oferta)}!
                                    </p>
                                </div>
                            ) : (
                                <span className="text-3xl font-extrabold text-white">
                                    {cop(producto.precio_venta)}
                                </span>
                            )}
                            <p className="text-xs text-gray-600 mt-1">IVA incluido · Precio en COP</p>
                        </div>

                        {/* Descripción corta */}
                        {producto.descripcion_corta && (
                            <p className="text-gray-400 text-sm leading-relaxed mb-5">
                                {producto.descripcion_corta}
                            </p>
                        )}

                        {/* Disponibilidad + SKU */}
                        <div className="flex items-center gap-4 mb-5 text-sm">
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-green-400 inline-block animate-pulse"></span>
                                <span className="text-gray-300 font-medium">
                                    {producto.stock ? `${producto.stock} disponibles` : 'En stock'}
                                </span>
                            </div>
                            {producto.sku && (
                                <span className="text-gray-600 font-mono text-xs">SKU: {producto.sku}</span>
                            )}
                        </div>

                        {/* CTAs */}
                        <div className="space-y-3">

                            {/* ── FORMULARIO DE DATOS (paso previo a WA) ──── */}
                            {!leadGuardado ? (
                                <form onSubmit={handleLeadSubmit}
                                    className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-3">

                                    <div>
                                        <p className="text-white font-semibold text-sm">¿Quieres hacer un pedido?</p>
                                        <p className="text-gray-500 text-xs mt-0.5">Déjanos tus datos y te contactamos por WhatsApp.</p>
                                    </div>

                                    {/* Nombre */}
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">
                                            Nombre completo <span className="text-orange-400">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={lead.nombre}
                                            onChange={e => setLead(l => ({ ...l, nombre: e.target.value }))}
                                            placeholder="Tu nombre"
                                            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 transition-colors"
                                        />
                                    </div>

                                    {/* Teléfono */}
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">
                                            WhatsApp / Teléfono <span className="text-orange-400">*</span>
                                        </label>
                                        <input
                                            type="tel"
                                            required
                                            value={lead.celular}
                                            onChange={e => setLead(l => ({ ...l, celular: e.target.value }))}
                                            placeholder="3001234567"
                                            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 transition-colors"
                                        />
                                    </div>

                                    {/* Municipio / Ciudad */}
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">
                                            Municipio / Ciudad <span className="text-orange-400">*</span>
                                        </label>
                                        <select
                                            required
                                            value={lead.municipio}
                                            onChange={e => setLead(l => ({ ...l, municipio: e.target.value }))}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
                                        >
                                            <option value="">— Selecciona tu ciudad —</option>
                                            {areaMetro.length > 0 && (
                                                <optgroup label="— Área Metropolitana de Medellín —">
                                                    {areaMetro.map(t => (
                                                        <option key={t.id} value={t.nombre}>{t.nombre}</option>
                                                    ))}
                                                </optgroup>
                                            )}
                                            {ciudades.length > 0 && (
                                                <optgroup label="— Otras ciudades —">
                                                    {ciudades.map(t => (
                                                        <option key={t.id} value={t.nombre}>{t.nombre}</option>
                                                    ))}
                                                </optgroup>
                                            )}
                                        </select>
                                    </div>

                                    {/* Dirección */}
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">
                                            Dirección de entrega <span className="text-orange-400">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={lead.direccion}
                                            onChange={e => setLead(l => ({ ...l, direccion: e.target.value }))}
                                            placeholder="Calle 50 #30-20, Apto 401"
                                            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 transition-colors"
                                        />
                                    </div>

                                    {/* Email (opcional) */}
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">
                                            Correo electrónico <span className="text-gray-600">(opcional)</span>
                                        </label>
                                        <input
                                            type="email"
                                            value={lead.email}
                                            onChange={e => setLead(l => ({ ...l, email: e.target.value }))}
                                            placeholder="tucorreo@email.com"
                                            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 transition-colors"
                                        />
                                    </div>

                                    {/* Acepta datos — Ley 1581 */}
                                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={aceptaDatos}
                                            onChange={e => setAceptaDatos(e.target.checked)}
                                            className="mt-0.5 accent-orange-500 w-4 h-4 shrink-0"
                                        />
                                        <span className="text-xs text-gray-500 leading-snug">
                                            Autorizo el tratamiento de mis datos personales conforme a la{' '}
                                            <span className="text-orange-400">Ley 1581 de 2012</span> para recibir
                                            información sobre pedidos y promociones de GadGet Store.
                                        </span>
                                    </label>

                                    {leadError && (
                                        <p className="text-xs text-red-400">{leadError}</p>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={leadEnviando}
                                        className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 disabled:opacity-50 text-white font-bold text-sm px-6 py-3 rounded-xl transition-all"
                                    >
                                        {leadEnviando ? 'Guardando...' : 'Continuar con el pedido →'}
                                    </button>
                                </form>
                            ) : (
                                /* ── BOTONES WA (aparecen tras guardar lead) ─ */
                                <>
                                    <div className="bg-gray-900 border border-green-800/40 rounded-2xl px-4 py-2.5 flex items-center gap-2">
                                        <span className="text-green-400 text-sm">✓</span>
                                        <p className="text-gray-300 text-sm">
                                            ¡Listo, <span className="text-white font-medium">{lead.nombre}</span>! Ahora elige cómo recibir tu pedido:
                                        </p>
                                    </div>

                                    {whatsapp && producto.permite_contraentrega ? (
                                        /* ── CONTRAENTREGA ACTIVA: pago al recibir ─── */
                                        <a
                                            href={`https://wa.me/${whatsapp}?text=${msgEnvioContraentrega}`}
                                            target="_blank" rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-2.5 w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-bold text-base px-6 py-4 rounded-2xl transition-all shadow-lg shadow-orange-900/30"
                                        >
                                            <IconWA className="w-5 h-5" />
                                            Enviar a domicilio
                                        </a>
                                    ) : whatsapp ? (
                                        /* ── SIN CONTRAENTREGA: transferencia primero ─ */
                                        <>
                                            <a
                                                href={`https://wa.me/${whatsapp}?text=${msgEnvioTransferencia}`}
                                                target="_blank" rel="noopener noreferrer"
                                                className="flex items-center justify-center gap-2.5 w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-bold text-base px-6 py-4 rounded-2xl transition-all shadow-lg shadow-orange-900/30"
                                            >
                                                <IconWA className="w-5 h-5" />
                                                Enviar a domicilio
                                            </a>
                                            <a
                                                href={`https://wa.me/${whatsapp}?text=${msgReclamarAlmacen}`}
                                                target="_blank" rel="noopener noreferrer"
                                                className="flex items-center justify-center gap-2.5 w-full border-2 border-orange-500 text-orange-400 hover:bg-orange-500/10 font-semibold text-base px-6 py-3.5 rounded-2xl transition-all"
                                            >
                                                <IconWA className="w-5 h-5" />
                                                Reclamar en el almacén
                                            </a>
                                        </>
                                    ) : null}
                                </>
                            )}

                            <a
                                href={`https://wa.me/?text=${encodeURIComponent(`${producto.nombre} — ${seo.url}`)}`}
                                target="_blank" rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 text-gray-500 hover:text-gray-300 text-sm px-6 py-2.5 rounded-2xl transition-colors w-full border border-gray-800 hover:bg-gray-800/50"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                                Compartir este producto
                            </a>
                        </div>

                    </div>
                </div>

                {/* ── DESCRIPCIÓN COMPLETA ─────────────────────────────────── */}
                {producto.descripcion && (
                    <section className="mb-16">
                        <div className="mb-5 flex items-center gap-3">
                            <h2 className="text-lg font-bold text-white">Descripción del producto</h2>
                            <div className="flex-1 h-px bg-gradient-to-r from-orange-500/30 to-transparent"></div>
                        </div>
                        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                            <p className="text-white text-sm leading-relaxed whitespace-pre-line">{producto.descripcion}</p>
                        </div>
                    </section>
                )}

                {/* ── PRODUCTOS RELACIONADOS ───────────────────────────────── */}
                {relacionados.length > 0 && (
                    <section>
                        <div className="mb-5 flex items-center gap-3">
                            <h2 className="text-lg font-bold text-white">También te puede interesar</h2>
                            <div className="flex-1 h-px bg-gradient-to-r from-pink-500/30 to-transparent"></div>
                        </div>
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


/* ─── ICONO WHATSAPP ───────────────────────────────────────────────── */
function IconWA({ className = 'w-5 h-5' }) {
    return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
    );
}

/* ─── TARJETA RELACIONADO ──────────────────────────────────────────── */
function TarjetaRelacionado({ producto, cop }) {
    const imagen = producto.media?.[0]?.original_url || producto.imagenes?.[0] || null;
    const tieneOferta = producto.precio_oferta
        && Number(producto.precio_oferta) < Number(producto.precio_venta);

    return (
        <Link href={route('tienda.show', producto.slug)}
            className="group bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-900/20 hover:-translate-y-0.5 transition-all duration-200">
            <div className="aspect-square bg-gray-800 overflow-hidden">
                {imagen ? (
                    <img src={imagen} alt={producto.nombre}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-700 text-3xl">📦</div>
                )}
            </div>
            <div className="p-3">
                <p className="text-sm font-semibold text-gray-100 line-clamp-2 leading-snug mb-1.5">
                    {producto.nombre}
                </p>
                <p className="text-sm font-bold text-white">
                    {tieneOferta ? cop(producto.precio_oferta) : cop(producto.precio_venta)}
                </p>
            </div>
        </Link>
    );
}
