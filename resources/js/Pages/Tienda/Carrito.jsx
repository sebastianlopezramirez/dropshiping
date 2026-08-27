/*
|--------------------------------------------------------------------------
| PÁGINA: Tienda/Carrito.jsx — GadGet Store
|--------------------------------------------------------------------------
|
| ENTENDER — Flujo de compra:
|
|   1. Cliente llena datos (nombre, teléfono, municipio, dirección)
|   2. Hace clic en "Hacer pedido"
|   3. Se abre un modal con 2 opciones de pago:
|        A. Contra entrega  → solo área metropolitana
|        B. Transferencia   → abre WhatsApp con los datos del pedido
|   4. El pedido queda guardado en BD con estado "pendiente"
|   5. El admin confirma el pago por sus medios y cambia el estado en el panel
|
*/

import { Head, Link, router } from '@inertiajs/react';
import { useState, useRef, useEffect } from 'react';
import TiendaLayout from '@/Layouts/TiendaLayout';
import { useCart } from '@/Context/CartContext';

const cop = (n) => Number(n).toLocaleString('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0
});

// Número de WhatsApp del negocio para transferencias
const WA_NEGOCIO = '573137921336';

export default function Carrito({ tarifas, categorias }) {

    const { items, cambiarCantidad, eliminarItem, vaciarCarrito, subtotal } = useCart();

    // Modal de método de pago
    const [modalPago, setModalPago] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});

    // Cliente identificado (si tiene sesión)
    const [clienteIdentificado, setClienteIdentificado] = useState(false);
    // Si está identificado, por defecto NO muestra el formulario completo
    // (solo muestra la tarjeta "¿Misma dirección?")
    const [cambiarDireccion, setCambiarDireccion] = useState(false);

    // ─── FORMULARIO (estado local, no useForm) ─────────────────────────────
    const [data, setDataState] = useState({
        cliente_nombre:   '',
        cliente_telefono: '',
        cliente_email:    '',
        cedula:           '',
        municipio:        '',
        direccion:        '',
        notas:            '',
        acepta_datos:     false,
    });

    const setData = (key, value) => setDataState(prev => ({ ...prev, [key]: value }));

    // ─── PRE-LLENAR FORMULARIO SI EL CLIENTE TIENE SESIÓN ─────────────────
    //
    // PENSAR — ¿Por qué hacemos fetch en lugar de pasar los datos por props?
    //
    //   La sesión del cliente es independiente de la sesión Laravel/Inertia.
    //   El controller de carrito no sabe si hay un cliente logueado; quien
    //   sabe es ClienteController::datosActuales(). Llamamos a esa ruta AJAX
    //   al montar el componente para pre-llenar si aplica.
    //
    useEffect(() => {
        fetch(route('tienda.cuenta.datos'), { headers: { 'Accept': 'application/json' } })
            .then(r => r.json())
            .then(json => {
                if (json.identificado && json.datos) {
                    setClienteIdentificado(true);
                    setDataState(prev => ({
                        ...prev,
                        cliente_nombre:   json.datos.nombre   || prev.cliente_nombre,
                        cliente_telefono: json.datos.celular  || prev.cliente_telefono,
                        municipio:        json.datos.municipio || prev.municipio,
                        direccion:        json.datos.direccion || prev.direccion,
                        ciudad:           json.datos.ciudad    || prev.ciudad,
                    }));
                }
            })
            .catch(() => {}); // silencioso si falla — el cliente llena manualmente
    }, []);

    // ─── CUPÓN ────────────────────────────────────────────────────────────
    const [codigoCupon, setCodigoCupon]   = useState('');
    const [cuponInfo, setCuponInfo]       = useState(null);   // { valido, descuento, cupon_id, mensaje }
    const [cuponCargando, setCuponCargando] = useState(false);
    const cuponTimer = useRef(null);

    const aplicarCupon = async () => {
        if (!codigoCupon.trim()) return;
        setCuponCargando(true);
        setCuponInfo(null);

        try {
            const itemsPayload = items.map(i => ({
                producto_id:  i.id,
                categoria_id: i.categoria_id ?? null,
                subtotal:     i.precio * i.cantidad,
            }));

            const res = await fetch(route('cupones.validar'), {
                method:  'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept':       'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content ?? '',
                },
                body: JSON.stringify({ codigo: codigoCupon, items: itemsPayload }),
            });

            const json = await res.json();
            setCuponInfo(json);
        } catch {
            setCuponInfo({ valido: false, mensaje: 'Error al validar el cupón. Intenta de nuevo.' });
        } finally {
            setCuponCargando(false);
        }
    };

    const limpiarCupon = () => {
        setCodigoCupon('');
        setCuponInfo(null);
    };

    // ─── TARIFA SELECCIONADA ───────────────────────────────────────────────
    const tarifaSeleccionada = tarifas.find(t => t.nombre === data.municipio);
    const costoEnvio  = tarifaSeleccionada ? tarifaSeleccionada.precio : 0;
    const descuento   = cuponInfo?.valido ? (cuponInfo.descuento ?? 0) : 0;
    const total       = subtotal + costoEnvio - descuento;
    const esAreaMetro = tarifaSeleccionada?.tipo === 'area_metro';

    const areaMetro = tarifas.filter(t => t.tipo === 'area_metro');
    const ciudades  = tarifas.filter(t => t.tipo === 'ciudad');

    // ─── VALIDAR FORMULARIO ANTES DE ABRIR MODAL ──────────────────────────
    const abrirModalPago = (e) => {
        e.preventDefault();
        // Validación básica client-side
        if (!data.cliente_nombre.trim()) return alert('Ingresa tu nombre completo.');
        if (!data.cliente_telefono.trim()) return alert('Ingresa tu teléfono / WhatsApp.');
        if (!data.municipio) return alert('Selecciona tu municipio o ciudad.');
        if (!data.direccion.trim()) return alert('Ingresa la dirección de entrega.');
        setModalPago(true);
    };

    // ─── CONFIRMAR CON MÉTODO DE PAGO ─────────────────────────────────────
    const confirmarConMetodo = (metodo) => {
        const payload = {
            ...data,
            metodo_pago:  metodo,
            cupon_codigo: cuponInfo?.valido ? codigoCupon : null,
            items: items.map(i => ({
                producto_id: i.id,
                cantidad:    i.cantidad,
            })),
        };

        setProcessing(true);

        router.post(route('tienda.pedido.store'), payload, {
            onSuccess: () => {
                vaciarCarrito();
                setModalPago(false);
                setProcessing(false);
            },
            onError: (errs) => {
                setErrors(errs);
                setModalPago(false);
                setProcessing(false);
            },
        });
    };

    // ─── CARRITO VACÍO ─────────────────────────────────────────────────────
    if (items.length === 0) {
        return (
            <TiendaLayout>
                <Head title="Carrito — GadGet Store" />
                <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-20">
                    <div className="text-6xl mb-6">🛒</div>
                    <h2 className="text-2xl font-bold text-white mb-3">Tu carrito está vacío</h2>
                    <p className="text-gray-400 mb-8">Agrega productos desde el catálogo para comenzar tu pedido.</p>
                    <Link href={route('tienda.index')}
                        className="bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold px-8 py-3 rounded-2xl hover:from-orange-600 hover:to-pink-600 transition-all">
                        Ver catálogo
                    </Link>
                </div>
            </TiendaLayout>
        );
    }

    return (
        <TiendaLayout>
            <Head title="Carrito — GadGet Store" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Título */}
                <div className="mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">Tu carrito</h1>
                    <p className="text-gray-400 mt-1">{items.length} {items.length === 1 ? 'producto' : 'productos'}</p>
                </div>

                <form onSubmit={abrirModalPago}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* ── COLUMNA IZQUIERDA: Items + Formulario ───────── */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* Lista de productos */}
                            <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
                                {items.map((item, idx) => (
                                    <div key={item.id}
                                        className={`flex gap-4 p-4 ${idx < items.length - 1 ? 'border-b border-gray-800' : ''}`}>

                                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-800 shrink-0">
                                            {item.imagen
                                                ? <img src={item.imagen} alt={item.nombre} className="w-full h-full object-cover" />
                                                : <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                                            }
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="text-white font-medium text-sm leading-snug line-clamp-2">{item.nombre}</p>
                                            <p className="text-orange-400 font-bold mt-1">{cop(item.precio)}</p>

                                            <div className="flex items-center gap-3 mt-2">
                                                <button type="button"
                                                    onClick={() => cambiarCantidad(item.id, item.cantidad - 1)}
                                                    className="w-7 h-7 rounded-full bg-gray-800 border border-gray-700 text-white flex items-center justify-center hover:bg-gray-700 text-sm font-bold">
                                                    −
                                                </button>
                                                <span className="text-white font-semibold w-6 text-center">{item.cantidad}</span>
                                                <button type="button"
                                                    onClick={() => cambiarCantidad(item.id, item.cantidad + 1)}
                                                    className="w-7 h-7 rounded-full bg-gray-800 border border-gray-700 text-white flex items-center justify-center hover:bg-gray-700 text-sm font-bold">
                                                    +
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end justify-between shrink-0">
                                            <button type="button" onClick={() => eliminarItem(item.id)}
                                                className="text-gray-600 hover:text-red-400 transition-colors">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                            <p className="text-white font-bold text-sm">{cop(item.precio * item.cantidad)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Formulario del cliente */}
                            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 space-y-5">
                                <h2 className="text-lg font-bold text-white">Datos del pedido</h2>

                                {/* ── TARJETA "¿MISMA DIRECCIÓN?" ─────────────
                                    Solo aparece cuando el cliente está identificado
                                    y aún no pidió cambiar dirección.
                                ──────────────────────────────────────────────── */}
                                {clienteIdentificado && !cambiarDireccion && (
                                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-green-400 text-lg">✅</span>
                                            <div>
                                                <p className="text-white font-semibold text-sm">{data.cliente_nombre}</p>
                                                <p className="text-gray-400 text-xs">{data.cliente_telefono}</p>
                                            </div>
                                        </div>

                                        {data.direccion && (
                                            <div className="bg-gray-800/60 rounded-lg px-3 py-2 text-sm">
                                                <p className="text-gray-500 text-xs mb-0.5">Entregar en</p>
                                                <p className="text-gray-200">{data.direccion}</p>
                                                {data.municipio && (
                                                    <p className="text-gray-400 text-xs mt-0.5">{data.municipio}</p>
                                                )}
                                            </div>
                                        )}

                                        <div className="flex gap-2 pt-1">
                                            <span className="flex-1 text-center bg-green-500/20 text-green-400 text-sm font-medium py-2 rounded-lg border border-green-500/30">
                                                ✓ Usar esta dirección
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setCambiarDireccion(true)}
                                                className="flex-1 text-center bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium py-2 rounded-lg transition-colors border border-gray-600"
                                            >
                                                Cambiar dirección
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* ── FORMULARIO COMPLETO ──────────────────────
                                    Siempre visible si NO está identificado.
                                    Visible si está identificado pero pidió cambiar.
                                ──────────────────────────────────────────────── */}
                                {(!clienteIdentificado || cambiarDireccion) && (<>

                                {cambiarDireccion && (
                                    <button
                                        type="button"
                                        onClick={() => setCambiarDireccion(false)}
                                        className="text-xs text-gray-500 hover:text-orange-400 transition-colors"
                                    >
                                        ← Volver a usar dirección guardada
                                    </button>
                                )}

                                <div>
                                    <label className="block text-sm text-gray-400 mb-1.5">Nombre completo *</label>
                                    <input type="text" value={data.cliente_nombre}
                                        onChange={e => setData('cliente_nombre', e.target.value)}
                                        placeholder="Tu nombre completo"
                                        className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                                    {errors.cliente_nombre && <p className="text-red-400 text-xs mt-1">{errors.cliente_nombre}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-400 mb-1.5">Teléfono / WhatsApp *</label>
                                    <input type="tel" value={data.cliente_telefono}
                                        onChange={e => setData('cliente_telefono', e.target.value)}
                                        placeholder="3001234567"
                                        className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                                    {errors.cliente_telefono && <p className="text-red-400 text-xs mt-1">{errors.cliente_telefono}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-400 mb-1.5">
                                        Número de cédula <span className="text-gray-600">(opcional — te crea cuenta para ver tus pedidos)</span>
                                    </label>
                                    <input type="text" value={data.cedula}
                                        onChange={e => setData('cedula', e.target.value)}
                                        placeholder="Ej: 1234567890"
                                        className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                                </div>

                                </>)} {/* ← fin bloque condicional nombre/tel/cedula */}

                                <div>
                                    <label className="block text-sm text-gray-400 mb-1.5">
                                        Correo electrónico <span className="text-gray-600">(opcional)</span>
                                    </label>
                                    <input type="email" value={data.cliente_email}
                                        onChange={e => setData('cliente_email', e.target.value)}
                                        placeholder="tu@correo.com"
                                        className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-400 mb-1.5">Municipio / Ciudad *</label>
                                    <select value={data.municipio}
                                        onChange={e => setData('municipio', e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                                        <option value="">Selecciona tu municipio o ciudad</option>
                                        {areaMetro.length > 0 && (
                                            <optgroup label="— Área Metropolitana de Medellín —">
                                                {areaMetro.map(t => (
                                                    <option key={t.id} value={t.nombre}>
                                                        {t.nombre} — domicilio {cop(t.precio)}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        )}
                                        {ciudades.length > 0 && (
                                            <optgroup label="— Otras ciudades —">
                                                {ciudades.map(t => (
                                                    <option key={t.id} value={t.nombre}>
                                                        {t.nombre} — domicilio {cop(t.precio)}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        )}
                                    </select>
                                    {errors.municipio && <p className="text-red-400 text-xs mt-1">{errors.municipio}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-400 mb-1.5">Dirección de entrega *</label>
                                    <input type="text" value={data.direccion}
                                        onChange={e => setData('direccion', e.target.value)}
                                        placeholder="Ej: Cra 45 #67-89, Apto 302, Barrio El Poblado"
                                        className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                                    {errors.direccion && <p className="text-red-400 text-xs mt-1">{errors.direccion}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-400 mb-1.5">
                                        Notas <span className="text-gray-600">(opcional)</span>
                                    </label>
                                    <textarea value={data.notas}
                                        onChange={e => setData('notas', e.target.value)}
                                        placeholder="Instrucciones especiales, punto de referencia..."
                                        rows={3}
                                        className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" />
                                </div>

                                {errors.general && (
                                    <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
                                        {errors.general}
                                    </p>
                                )}

                                {/* ── CONSENTIMIENTO DE DATOS ──────────────── */}
                                <div className="border-t border-gray-700 pt-5">
                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={data.acepta_datos}
                                            onChange={e => setData('acepta_datos', e.target.checked)}
                                            className="mt-0.5 w-4 h-4 accent-orange-500 shrink-0"
                                        />
                                        <span className="text-xs text-gray-400 leading-relaxed">
                                            Acepto el <strong className="text-orange-400">tratamiento de mis datos personales</strong> (Ley 1581 de 2012) para recibir información sobre bonos, descuentos y promociones de GadGet Store. Este campo es <strong className="text-white">opcional</strong> y no afecta tu pedido.
                                        </span>
                                    </label>
                                    {data.acepta_datos && (
                                        <p className="mt-2 pl-7 text-xs text-green-400">
                                            ✅ ¡Gracias! Usaremos los datos de tu pedido para enviarte promociones exclusivas.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ── COLUMNA DERECHA: Resumen ─────────────────────── */}
                        <div className="lg:col-span-1">
                            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 sticky top-24">

                                <h2 className="text-lg font-bold text-white mb-5">Resumen</h2>

                                {/* ── Campo cupón ──────────────────────── */}
                                <div className="mb-5">
                                    <label className="block text-xs text-gray-400 mb-1.5">Código de descuento</label>
                                    {cuponInfo?.valido ? (
                                        <div className="flex items-center gap-2 bg-green-900/30 border border-green-700/50 rounded-xl px-3 py-2">
                                            <span className="text-green-400 text-sm flex-1">
                                                🏷️ <strong>{codigoCupon.toUpperCase()}</strong> — {cuponInfo.mensaje}
                                            </span>
                                            <button type="button" onClick={limpiarCupon}
                                                className="text-gray-500 hover:text-red-400 transition text-xs shrink-0">
                                                ✕
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={codigoCupon}
                                                onChange={e => { setCodigoCupon(e.target.value.toUpperCase()); setCuponInfo(null); }}
                                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), aplicarCupon())}
                                                placeholder="VERANO20"
                                                className="flex-1 bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-xl px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            />
                                            <button type="button" onClick={aplicarCupon} disabled={cuponCargando || !codigoCupon.trim()}
                                                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-white text-xs font-medium rounded-xl transition whitespace-nowrap">
                                                {cuponCargando ? '...' : 'Aplicar'}
                                            </button>
                                        </div>
                                    )}
                                    {cuponInfo && !cuponInfo.valido && (
                                        <p className="text-red-400 text-xs mt-1.5">{cuponInfo.mensaje}</p>
                                    )}
                                </div>

                                <div className="space-y-3 text-sm mb-5">
                                    <div className="flex justify-between text-gray-400">
                                        <span>Subtotal</span>
                                        <span className="text-white">{cop(subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-400">
                                        <span>Domicilio {data.municipio ? `(${data.municipio})` : ''}</span>
                                        <span className={costoEnvio > 0 ? 'text-white' : 'text-gray-600'}>
                                            {data.municipio ? cop(costoEnvio) : '—'}
                                        </span>
                                    </div>
                                    {descuento > 0 && (
                                        <div className="flex justify-between text-green-400">
                                            <span>Descuento cupón</span>
                                            <span>− {cop(descuento)}</span>
                                        </div>
                                    )}
                                    <div className="border-t border-gray-800 pt-3 flex justify-between font-bold text-base">
                                        <span className="text-white">Total</span>
                                        <span className="bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
                                            {cop(total)}
                                        </span>
                                    </div>
                                </div>

                                {tarifaSeleccionada && (
                                    <div className="bg-gray-800/60 rounded-xl px-4 py-3 mb-5 text-xs text-gray-400 leading-relaxed">
                                        🚚 Domicilio a <strong className="text-white">{tarifaSeleccionada.nombre}</strong>: {cop(tarifaSeleccionada.precio)}
                                        <br />Recogida extra tiene costo adicional de <strong className="text-white">$4.000</strong>.
                                    </div>
                                )}

                                {/* Botón principal */}
                                <button type="submit" disabled={processing || items.length === 0}
                                    className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-base px-6 py-4 rounded-2xl transition-all shadow-lg shadow-orange-900/30 flex items-center justify-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 11H4L5 9z" />
                                    </svg>
                                    Hacer pedido
                                </button>

                                <p className="text-center text-xs text-gray-600 mt-4">
                                    Elige cómo pagar en el siguiente paso
                                </p>

                                <Link href={route('tienda.index')}
                                    className="flex items-center justify-center gap-2 w-full border border-gray-700 text-gray-300 hover:border-orange-500 hover:text-orange-400 font-medium text-sm px-4 py-3 rounded-xl transition-all mt-2">
                                    ← Seguir comprando
                                </Link>
                            </div>
                        </div>
                    </div>
                </form>
            </div>

            {/* ── MODAL MÉTODO DE PAGO ─────────────────────────────────────── */}
            {modalPago && (
                <ModalMetodoPago
                    total={total}
                    municipio={data.municipio}
                    esAreaMetro={esAreaMetro}
                    processing={processing}
                    onSeleccionar={confirmarConMetodo}
                    onCerrar={() => setModalPago(false)}
                    datosCliente={data}
                    items={items}
                />
            )}
        </TiendaLayout>
    );
}

// ─── MODAL MÉTODO DE PAGO ─────────────────────────────────────────────────
function ModalMetodoPago({ total, municipio, esAreaMetro, processing, onSeleccionar, onCerrar, datosCliente, items }) {

    const cop = (n) => Number(n).toLocaleString('es-CO', {
        style: 'currency', currency: 'COP', maximumFractionDigits: 0
    });

    // Construye el mensaje de WhatsApp para transferencia
    const buildMsgWA = () => {
        const lineas = items.map(i => `• ${i.nombre} x${i.cantidad} — ${Number(i.precio * i.cantidad).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}`).join('\n');
        return encodeURIComponent(
            `Hola, quiero hacer un pedido con transferencia 💳\n\n` +
            `*Cliente:* ${datosCliente.cliente_nombre}\n` +
            `*Tel:* ${datosCliente.cliente_telefono}\n` +
            `*Ciudad:* ${municipio}\n` +
            `*Dirección:* ${datosCliente.direccion}\n\n` +
            `*Productos:*\n${lineas}\n\n` +
            `*Total a pagar: ${cop(total)}*\n\n` +
            `Por favor indicarme los datos para la transferencia 🙏`
        );
    };

    const handleTransferencia = () => {
        // Primero guardar el pedido, luego redirigir a WhatsApp
        onSeleccionar('transferencia');
        // Abrir WhatsApp (pequeño delay para que el pedido se guarde)
        setTimeout(() => {
            window.open(`https://wa.me/${WA_NEGOCIO}?text=${buildMsgWA()}`, '_blank');
        }, 800);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            {/* Fondo oscuro */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCerrar} />

            {/* Modal */}
            <div className="relative bg-gray-900 border border-gray-700 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl">

                {/* Cerrar */}
                <button onClick={onCerrar}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <h2 className="text-xl font-bold text-white mb-2">¿Cómo quieres pagar?</h2>
                <p className="text-gray-400 text-sm mb-6">
                    Total del pedido: <strong className="text-orange-400 text-base">{cop(total)}</strong>
                </p>

                <div className="space-y-4">

                    {/* Opción 1: Contra entrega */}
                    {esAreaMetro ? (
                        <button
                            onClick={() => onSeleccionar('contra_entrega')}
                            disabled={processing}
                            className="w-full bg-gray-800 hover:bg-gray-750 border-2 border-gray-700 hover:border-orange-500 text-left p-5 rounded-2xl transition-all group disabled:opacity-50"
                        >
                            <div className="flex items-start gap-4">
                                <div className="text-3xl">💵</div>
                                <div>
                                    <p className="font-bold text-white group-hover:text-orange-400 transition-colors">
                                        Pago contra entrega
                                    </p>
                                    <p className="text-gray-400 text-sm mt-0.5">
                                        Pagas en efectivo cuando recibes el pedido.
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                                        <span className="bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full text-xs">Solo área metro de Medellín</span>
                                    </p>
                                </div>
                            </div>
                        </button>
                    ) : (
                        <div className="w-full bg-gray-800/50 border-2 border-gray-700/50 p-5 rounded-2xl opacity-50 cursor-not-allowed">
                            <div className="flex items-start gap-4">
                                <div className="text-3xl grayscale">💵</div>
                                <div>
                                    <p className="font-bold text-gray-500">Pago contra entrega</p>
                                    <p className="text-gray-600 text-sm mt-0.5">No disponible para {municipio}.</p>
                                    <p className="text-xs text-gray-600 mt-1">Solo disponible en el área metropolitana de Medellín.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Opción 2: Transferencia */}
                    <button
                        onClick={handleTransferencia}
                        disabled={processing}
                        className="w-full bg-gray-800 hover:bg-gray-750 border-2 border-gray-700 hover:border-green-500 text-left p-5 rounded-2xl transition-all group disabled:opacity-50"
                    >
                        <div className="flex items-start gap-4">
                            <div className="text-3xl">💳</div>
                            <div>
                                <p className="font-bold text-white group-hover:text-green-400 transition-colors">
                                    Pago con transferencia
                                </p>
                                <p className="text-gray-400 text-sm mt-0.5">
                                    Te enviamos los datos bancarios por WhatsApp para que hagas la transferencia.
                                </p>
                                <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                                    <span className="text-green-400">📲</span>
                                    <span>Disponible para todo el país</span>
                                </p>
                            </div>
                        </div>
                    </button>
                </div>

                {processing && (
                    <p className="text-center text-gray-400 text-sm mt-5 animate-pulse">
                        Registrando tu pedido...
                    </p>
                )}
            </div>
        </div>
    );
}
