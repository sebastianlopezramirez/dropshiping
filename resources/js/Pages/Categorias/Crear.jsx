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
                        ? val.charAt(0).toUpperCase() + val.slice(1)
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
                            <select
                                value={data.padre_id}
                                onChange={e => setData('padre_id', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500">
                                <option value="">Sin padre (categoría raíz)</option>
                                {padres.map(p => (
                                    <option key={p.id} value={p.id}>{p.nombre}</option>
                                ))}
                            </select>
                            <p className="mt-1 text-xs text-gray-500">Si elige una categoría padre, esta será una subcategoría de ella.</p>
                            {errors.padre_id && <p className="mt-1 text-xs text-red-600">{errors.padre_id}</p>}
                        </div>

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
