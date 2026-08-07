/*
|--------------------------------------------------------------------------
| PÁGINA: Marketing/Campanas/Editar.jsx
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
                        ? val.charAt(0).toUpperCase() + val.slice(1)
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

export default function Editar({ campana, canales, estados }) {

    const { data, setData, put, processing, errors } = useForm({
        nombre:       campana.nombre       || '',
        descripcion:  campana.descripcion  || '',
        canal:        campana.canal        || 'instagram',
        presupuesto:  campana.presupuesto  || '',
        fecha_inicio: campana.fecha_inicio || '',
        fecha_fin:    campana.fecha_fin    || '',
        codigo_utm:   campana.codigo_utm   || '',
        url_destino:  campana.url_destino  || '',
        estado:       campana.estado       || 'activa',
        notas:        campana.notas        || '',
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('campanas.update', campana.id));
    };

    return (
        <AuthenticatedLayout header={
            <div className="flex items-center gap-3">
                <Link href={route('campanas.show', campana.id)} className="text-gray-400 hover:text-gray-600 transition">←</Link>
                <h2 className="text-xl font-semibold text-gray-800">Editar Campaña</h2>
                <span className="text-sm text-gray-500">{campana.nombre}</span>
            </div>
        }>
            <Head title={`Editar ${campana.nombre}`} />

            <div className="py-8 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
                <form onSubmit={submit} className="space-y-6">

                    {/* Información principal */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                        <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Información</h3>

                        <Campo label="Nombre" name="nombre" required
                            data={data} onChange={setData} errors={errors} />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Canal <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {canales.map(c => (
                                    <button key={c.value} type="button"
                                        onClick={() => setData('canal', c.value)}
                                        className={`p-2 border-2 rounded-lg text-xs text-center transition
                                            ${data.canal === c.value
                                                ? 'border-purple-500 bg-purple-50'
                                                : 'border-gray-200 hover:border-gray-300'}`}>
                                        {c.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                            <textarea value={data.descripcion} onChange={e => setData('descripcion', e.target.value)}
                                rows={2}
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

                        <Campo label="Presupuesto ($COP)" name="presupuesto" type="number"
                            data={data} onChange={setData} errors={errors} />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                            <div className="flex gap-3">
                                {estados.map(e => (
                                    <button key={e.value} type="button"
                                        onClick={() => setData('estado', e.value)}
                                        className={`px-4 py-2 border-2 rounded-lg text-sm transition
                                            ${data.estado === e.value
                                                ? 'border-purple-500 bg-purple-50 text-purple-700 font-medium'
                                                : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                                        {e.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Tracking */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                        <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Tracking UTM</h3>
                        <Campo label="Código UTM" name="codigo_utm" placeholder="verano_2026_ig"
                            data={data} onChange={setData} errors={errors} />
                        <Campo label="URL de destino" name="url_destino" type="url"
                            data={data} onChange={setData} errors={errors} />
                    </div>

                    {/* Notas */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notas internas</label>
                        <textarea value={data.notas} onChange={e => setData('notas', e.target.value)}
                            rows={3}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none" />
                    </div>

                    {/* Botones */}
                    <div className="flex items-center justify-end gap-3">
                        <Link href={route('campanas.show', campana.id)}
                            className="px-5 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition">
                            Cancelar
                        </Link>
                        <button type="submit" disabled={processing}
                            className="px-6 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 transition">
                            {processing ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>

                </form>
            </div>
        </AuthenticatedLayout>
    );
}
