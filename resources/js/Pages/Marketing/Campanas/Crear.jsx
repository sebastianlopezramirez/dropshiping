/*
|--------------------------------------------------------------------------
| PÁGINA: Marketing/Campanas/Crear.jsx
|--------------------------------------------------------------------------
*/

import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

// FUERA del componente para evitar re-creación en cada render (bug de foco)
function Campo({ label, name, type = 'text', placeholder = '', nota = '', required = false, data, onChange, errors }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input type={type} value={data[name] ?? ''}
                onChange={e => {
                    const val = e.target.value;
                    onChange(name, type === 'text' && val.length > 0
                        ? val.replace(/(^\s*\S|\s\S)/g, c => c.toUpperCase())
                        : val);
                }}
                placeholder={placeholder}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent
                    ${errors[name] ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
            />
            {nota && <p className="mt-1 text-xs text-gray-500">{nota}</p>}
            {errors[name] && <p className="mt-1 text-xs text-red-600">{errors[name]}</p>}
        </div>
    );
}

export default function Crear({ canales, estados }) {

    const hoy = new Date().toISOString().split('T')[0];

    const { data, setData, post, processing, errors } = useForm({
        nombre:       '',
        descripcion:  '',
        canal:        'instagram',
        presupuesto:  '',
        fecha_inicio: hoy,
        fecha_fin:    '',
        codigo_utm:   '',
        url_destino:  '',
        estado:       'activa',
        notas:        '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('campanas.store'));
    };

    return (
        <AuthenticatedLayout header={
            <div className="flex items-center gap-3">
                <Link href={route('campanas.index')} className="text-gray-400 hover:text-gray-600 transition">←</Link>
                <h2 className="text-xl font-semibold text-gray-800">Nueva Campaña</h2>
            </div>
        }>
            <Head title="Nueva Campaña" />

            <div className="py-8 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
                <form onSubmit={submit} className="space-y-6">

                    {/* Información principal */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                        <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Información</h3>

                        <Campo label="Nombre de la campaña" name="nombre" required
                            placeholder="Descuentos de verano Instagram"
                            data={data} onChange={setData} errors={errors} />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Canal <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {canales.map(c => (
                                    <button key={c.value} type="button"
                                        onClick={() => setData('canal', c.value)}
                                        className={`p-2 border-2 rounded-lg text-xs text-center transition
                                            ${data.canal === c.value
                                                ? 'border-purple-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-gray-300'}`}>
                                        {c.label}
                                    </button>
                                ))}
                            </div>
                            {errors.canal && <p className="mt-1 text-xs text-red-600">{errors.canal}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                            <textarea value={data.descripcion} onChange={e => setData('descripcion', e.target.value)}
                                rows={2} placeholder="Objetivo y detalles de la campaña..."
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none" />
                        </div>
                    </div>

                    {/* Fechas y presupuesto */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                        <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Fechas y Presupuesto</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <Campo label="Fecha de inicio" name="fecha_inicio" type="date" required
                                data={data} onChange={setData} errors={errors} />
                            <Campo label="Fecha de fin" name="fecha_fin" type="date" required
                                data={data} onChange={setData} errors={errors} />
                        </div>

                        <Campo label="Presupuesto ($COP — opcional)" name="presupuesto"
                            type="number" placeholder="500000"
                            nota="Necesario para calcular el ROI de la campaña."
                            data={data} onChange={setData} errors={errors} />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Estado inicial</label>
                            <div className="flex gap-3">
                                {estados.map(e => (
                                    <button key={e.value} type="button"
                                        onClick={() => setData('estado', e.value)}
                                        className={`px-4 py-2 border-2 rounded-lg text-sm transition
                                            ${data.estado === e.value
                                                ? 'border-purple-500 bg-blue-50 text-blue-900 font-medium'
                                                : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                                        {e.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Tracking UTM */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                        <div>
                            <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Tracking UTM</h3>
                            <p className="text-xs text-gray-500 mt-1">
                                El código UTM se añade a los links del anuncio para identificar de qué campaña viene cada cliente.
                            </p>
                        </div>

                        <Campo label="Código UTM (opcional)" name="codigo_utm"
                            placeholder="verano_2026_ig"
                            nota="Sin espacios. Ej: utm_campaign=verano_2026_ig"
                            data={data} onChange={setData} errors={errors} />

                        <Campo label="URL de destino (opcional)" name="url_destino"
                            type="url" placeholder="https://tu-tienda.com/coleccion/verano"
                            data={data} onChange={setData} errors={errors} />
                    </div>

                    {/* Notas */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notas internas</label>
                        <textarea value={data.notas} onChange={e => setData('notas', e.target.value)}
                            rows={3} placeholder="Audiencia objetivo, copies usados, segmentación..."
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none" />
                    </div>

                    {/* Botones */}
                    <div className="flex items-center justify-end gap-3">
                        <Link href={route('campanas.index')}
                            className="px-5 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition">
                            Cancelar
                        </Link>
                        <button type="submit" disabled={processing}
                            className="px-6 py-2 bg-blue-800 text-white text-sm font-medium rounded-lg hover:bg-blue-900 disabled:opacity-50 transition">
                            {processing ? 'Guardando...' : 'Crear Campaña'}
                        </button>
                    </div>

                </form>
            </div>
        </AuthenticatedLayout>
    );
}
