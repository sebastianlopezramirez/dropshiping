/*
|--------------------------------------------------------------------------
| PÁGINA: Categorias/Crear.jsx
|--------------------------------------------------------------------------
|
| PENSAR — ¿Por qué Campo está FUERA del componente Crear?
|
|   Si se define DENTRO, React la recrea en cada render (cada tecla).
|   Eso desmonta/remonta el <input> → pierde el foco después de cada carácter.
|   Al estar FUERA, la referencia es estable → el foco se mantiene.
|
*/

import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

// ── Componente auxiliar FUERA del componente principal ─────────────────────
function Campo({ label, name, type = 'text', placeholder = '', nota = '', required = false, data, onChange, errors }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
                type={type}
                value={data[name] ?? ''}
                onChange={e => {
                    const val = e.target.value;
                    onChange(name, type === 'text' && val.length > 0
                        ? val.replace(/(^\s*\S|\s\S)/g, c => c.toUpperCase())
                        : val);
                }}
                placeholder={placeholder}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                    ${errors[name] ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
            />
            {nota && <p className="mt-1 text-xs text-gray-500">{nota}</p>}
            {errors[name] && <p className="mt-1 text-xs text-red-600">{errors[name]}</p>}
        </div>
    );
}

export default function Crear({ padres }) {

    // ── Estado categorías inline ───────────────────────────────────────
    const [padresLocales, setPadresLocales] = useState(padres);
    const [miniPadre, setMiniPadre]         = useState(false);
    const [miniHija, setMiniHija]           = useState(false);
    const [creandoPadre, setCreandoPadre]   = useState(false);
    const [creandoHija, setCreandoHija]     = useState(false);
    const [nombreNuevoPadre, setNombreNuevoPadre] = useState('');
    const [nombreNuevaHija, setNombreNuevaHija]   = useState('');
    const [errorMiniPadre, setErrorMiniPadre] = useState('');
    const [errorMiniHija, setErrorMiniHija]   = useState('');

    // ── Toast ─────────────────────────────────────────────────────────
    const [toast, setToast] = useState(null); // { tipo: 'exito'|'error', msg }
    const mostrarToast = (tipo, msg) => {
        setToast({ tipo, msg });
        setTimeout(() => setToast(null), 4000);
    };

    // ── Helper fetch categoria ─────────────────────────────────────────
    const crearCategoriaFetch = async (nombre, padreId = null) => {
        const csrf = document.querySelector('meta[name="csrf-token"]')?.content ?? '';
        const body = new FormData();
        body.append('nombre', nombre.trim());
        if (padreId) body.append('padre_id', padreId);
        body.append('activo', '1');
        const resp = await fetch('/categorias', {
            method: 'POST',
            headers: { 'X-CSRF-TOKEN': csrf, 'Accept': 'application/json' },
            body,
        });
        const json = await resp.json();
        if (!resp.ok) throw new Error(json.message ?? 'Error al crear');
        return json;
    };

    const crearPadreInline = async () => {
        if (!nombreNuevoPadre.trim()) { setErrorMiniPadre('El nombre es obligatorio'); return; }
        setCreandoPadre(true); setErrorMiniPadre('');
        try {
            const nueva = await crearCategoriaFetch(nombreNuevoPadre);
            setPadresLocales(prev => [...prev, nueva]);
            setData('padre_id', String(nueva.id));
            setMiniPadre(false);
            setNombreNuevoPadre('');
            mostrarToast('exito', `✅ Categoría padre "${nueva.nombre}" creada correctamente.`);
        } catch (e) {
            setErrorMiniPadre(e.message);
            mostrarToast('error', `❌ ${e.message}`);
        } finally { setCreandoPadre(false); }
    };

    const crearHijaInline = async () => {
        if (!data.padre_id) { setErrorMiniHija('Primero selecciona una categoría padre'); return; }
        if (!nombreNuevaHija.trim()) { setErrorMiniHija('El nombre es obligatorio'); return; }
        setCreandoHija(true); setErrorMiniHija('');
        try {
            const nueva = await crearCategoriaFetch(nombreNuevaHija, data.padre_id);
            setMiniHija(false);
            setNombreNuevaHija('');
            mostrarToast('exito', `✅ Subcategoría "${nueva.nombre}" creada correctamente.`);
        } catch (e) {
            setErrorMiniHija(e.message);
            mostrarToast('error', `❌ ${e.message}`);
        } finally { setCreandoHija(false); }
    };

    const { data, setData, post, processing, errors } = useForm({
        nombre:      '',
        slug:        '',
        descripcion: '',
        imagen_url:  '',
        padre_id:    '',
        orden:       0,
        activo:      true,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('categorias.store'));
    };

    return (
        <AuthenticatedLayout header={
            <div className="flex items-center gap-3">
                <Link href={route('categorias.index')} className="text-gray-400 hover:text-gray-600 transition">←</Link>
                <h2 className="text-xl font-semibold text-gray-800">Nueva Categoría</h2>
            </div>
        }>
            <Head title="Nueva Categoría" />

            {/* Toast */}
            {toast && (
                <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all
                    ${toast.tipo === 'exito' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                    {toast.msg}
                </div>
            )}

            <div className="py-8 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
                <form onSubmit={submit} className="space-y-6">

                    {/* Identificación */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                        <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Identificación</h3>

                        <Campo label="Nombre" name="nombre" required
                            placeholder="Ropa Deportiva"
                            data={data} onChange={setData} errors={errors} />

                        <Campo label="Slug (opcional)" name="slug"
                            placeholder="ropa-deportiva"
                            nota="Se auto-genera desde el nombre si lo dejas vacío. Usado en las URLs de la tienda."
                            data={data} onChange={setData} errors={errors} />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                            <textarea
                                value={data.descripcion}
                                onChange={e => setData('descripcion', e.target.value)}
                                rows={3} placeholder="Descripción opcional de la categoría..."
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                            />
                        </div>
                    </div>

                    {/* Jerarquía y presentación */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                        <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Jerarquía y Presentación</h3>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría padre</label>
                            <div className="flex gap-2 items-center">
                                <select
                                    value={data.padre_id}
                                    onChange={e => setData('padre_id', e.target.value)}
                                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500">
                                    <option value="">Sin padre (categoría raíz)</option>
                                    {padresLocales.map(p => (
                                        <option key={p.id} value={p.id}>{p.nombre}</option>
                                    ))}
                                </select>
                                <button type="button" onClick={() => setMiniPadre(v => !v)}
                                    title="Crear nueva categoría padre"
                                    className="shrink-0 px-2 py-2 text-indigo-600 border border-indigo-300 rounded-lg hover:bg-indigo-50 text-sm font-bold">
                                    +
                                </button>
                            </div>
                            {miniPadre && (
                                <div className="mt-2 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                                    <p className="text-xs font-semibold text-indigo-700 mb-2">+ Nueva categoría raíz</p>
                                    <div className="flex gap-2">
                                        <input type="text" value={nombreNuevoPadre}
                                            onChange={e => setNombreNuevoPadre(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && crearPadreInline()}
                                            placeholder="Nombre..."
                                            className="flex-1 border border-indigo-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                            autoFocus />
                                        <button type="button" onClick={crearPadreInline} disabled={creandoPadre}
                                            className="px-3 py-1 text-xs font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700 disabled:opacity-50">
                                            {creandoPadre ? '...' : 'Crear'}
                                        </button>
                                        <button type="button" onClick={() => setMiniPadre(false)}
                                            className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700">✕</button>
                                    </div>
                                    {errorMiniPadre && <p className="text-xs text-red-600 mt-1">{errorMiniPadre}</p>}
                                </div>
                            )}
                            <p className="mt-1 text-xs text-gray-500">Si elige una categoría padre, esta será una subcategoría de ella.</p>
                            {errors.padre_id && <p className="mt-1 text-xs text-red-600">{errors.padre_id}</p>}
                        </div>

                        {/* Crear categoría hija inline */}
                        {data.padre_id && (
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-sm font-medium text-gray-700">
                                        ¿Crear subcategoría dentro de este padre? <span className="text-gray-400 font-normal">(opcional)</span>
                                    </label>
                                    <button type="button" onClick={() => setMiniHija(v => !v)}
                                        className="text-xs text-indigo-600 hover:underline font-medium">
                                        {miniHija ? 'Cancelar' : '+ Agregar subcategoría'}
                                    </button>
                                </div>
                                {miniHija && (
                                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                        <p className="text-xs font-semibold text-green-700 mb-2">+ Nueva subcategoría hija</p>
                                        <div className="flex gap-2">
                                            <input type="text" value={nombreNuevaHija}
                                                onChange={e => setNombreNuevaHija(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && crearHijaInline()}
                                                placeholder="Nombre de la subcategoría..."
                                                className="flex-1 border border-green-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                                                autoFocus />
                                            <button type="button" onClick={crearHijaInline} disabled={creandoHija}
                                                className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50">
                                                {creandoHija ? '...' : 'Crear'}
                                            </button>
                                            <button type="button" onClick={() => setMiniHija(false)}
                                                className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700">✕</button>
                                        </div>
                                        {errorMiniHija && <p className="text-xs text-red-600 mt-1">{errorMiniHija}</p>}
                                        <p className="text-xs text-green-600 mt-1">
                                            Se creará como hija de "{padresLocales.find(p => String(p.id) === String(data.padre_id))?.nombre}".
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        <Campo label="URL de imagen (opcional)" name="imagen_url" type="url"
                            placeholder="https://ejemplo.com/imagen.jpg"
                            data={data} onChange={setData} errors={errors} />

                        <div className="grid grid-cols-2 gap-4">
                            <Campo label="Orden" name="orden" type="number"
                                nota="Número menor = aparece primero"
                                data={data} onChange={setData} errors={errors} />

                            <div className="flex items-end pb-1">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input type="checkbox" checked={data.activo}
                                        onChange={e => setData('activo', e.target.checked)}
                                        className="w-4 h-4 text-indigo-600 rounded" />
                                    <div>
                                        <div className="font-medium text-gray-800 text-sm">Categoría activa</div>
                                        <div className="text-xs text-gray-500">Visible en la tienda</div>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Botones */}
                    <div className="flex items-center justify-end gap-3">
                        <Link href={route('categorias.index')}
                            className="px-5 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition">
                            Cancelar
                        </Link>
                        <button type="submit" disabled={processing}
                            className="px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition">
                            {processing ? 'Guardando...' : 'Crear Categoría'}
                        </button>
                    </div>

                </form>
            </div>
        </AuthenticatedLayout>
    );
}
