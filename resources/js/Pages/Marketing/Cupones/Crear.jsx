/*
|--------------------------------------------------------------------------
| PÁGINA: Marketing/Cupones/Crear.jsx
|--------------------------------------------------------------------------
|
| PENSAR — ¿Por qué CampoTexto está FUERA del componente Crear?
|
|   Si se define DENTRO, React la recrea en cada render (cada tecla).
|   Eso hace que React desmonte y remonte el <input> → pierdes el foco.
|   Al estar FUERA, la referencia es estable y React solo actualiza el value.
|
*/

import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

// ── Componente auxiliar FUERA del componente principal ─────────────────────
function Campo({ label, name, type = 'text', placeholder = '', nota = '', data, onChange, errors }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
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
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                    ${errors[name] ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
            />
            {nota && <p className="mt-1 text-xs text-gray-500">{nota}</p>}
            {errors[name] && <p className="mt-1 text-xs text-red-600">{errors[name]}</p>}
        </div>
    );
}

export default function Crear() {

    const { data, setData, post, processing, errors } = useForm({
        codigo:           '',
        descripcion:      '',
        tipo:             'porcentaje',
        valor:            '',
        minimo_compra:    '',
        maximo_descuento: '',
        limite_usos:      '',
        fecha_inicio:     '',
        fecha_expiracion: '',
        activo:           true,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('cupones.store'));
    };

    return (
        <AuthenticatedLayout header={
            <div className="flex items-center gap-3">
                <Link href={route('cupones.index')} className="text-gray-400 hover:text-gray-600 transition">←</Link>
                <h2 className="text-xl font-semibold text-gray-800">Nuevo Cupón</h2>
            </div>
        }>
            <Head title="Nuevo Cupón" />

            <div className="py-8 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
                <form onSubmit={submit} className="space-y-6">

                    {/* Código y descripción */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                        <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Identificación</h3>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Código del cupón <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.codigo}
                                onChange={e => setData('codigo', e.target.value.toUpperCase())}
                                placeholder="VERANO20"
                                className={`w-full border rounded-lg px-3 py-2 text-sm font-mono uppercase focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                                    ${errors.codigo ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                            />
                            <p className="mt-1 text-xs text-gray-500">Se convierte automáticamente a mayúsculas.</p>
                            {errors.codigo && <p className="mt-1 text-xs text-red-600">{errors.codigo}</p>}
                        </div>

                        <Campo label="Descripción (opcional)" name="descripcion"
                            placeholder="Descuento de verano 20%"
                            nota="Visible solo para administradores."
                            data={data} onChange={setData} errors={errors} />
                    </div>

                    {/* Tipo y valor */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                        <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Descuento</h3>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tipo de descuento <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { value: 'porcentaje', label: '% Porcentaje', desc: 'Ej: 20% de descuento' },
                                    { value: 'valor_fijo', label: '$ Valor fijo',  desc: 'Ej: $50.000 de descuento' },
                                ].map(op => (
                                    <button key={op.value} type="button"
                                        onClick={() => { setData('tipo', op.value); if (op.value === 'valor_fijo') setData('maximo_descuento', ''); }}
                                        className={`p-3 border-2 rounded-xl text-left transition
                                            ${data.tipo === op.value
                                                ? 'border-emerald-500 bg-emerald-50'
                                                : 'border-gray-200 hover:border-gray-300'}`}>
                                        <div className="font-semibold text-sm text-gray-800">{op.label}</div>
                                        <div className="text-xs text-gray-500 mt-0.5">{op.desc}</div>
                                    </button>
                                ))}
                            </div>
                            {errors.tipo && <p className="mt-1 text-xs text-red-600">{errors.tipo}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {data.tipo === 'porcentaje' ? 'Porcentaje de descuento' : 'Monto fijo de descuento'} <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                                    {data.tipo === 'porcentaje' ? '%' : '$'}
                                </span>
                                <input
                                    type="number" min="0.01" step="any"
                                    value={data.valor}
                                    onChange={e => setData('valor', e.target.value)}
                                    placeholder={data.tipo === 'porcentaje' ? '20' : '50000'}
                                    className={`w-full border rounded-lg pl-8 pr-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                                        ${errors.valor ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                                />
                            </div>
                            {errors.valor && <p className="mt-1 text-xs text-red-600">{errors.valor}</p>}
                        </div>

                        {data.tipo === 'porcentaje' && (
                            <Campo label="Tope máximo de descuento (opcional)" name="maximo_descuento"
                                type="number" placeholder="30000"
                                nota="Si el descuento calculado supera este monto, se aplica el tope."
                                data={data} onChange={setData} errors={errors} />
                        )}
                    </div>

                    {/* Restricciones */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                        <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Restricciones</h3>

                        <Campo label="Compra mínima ($ — opcional)" name="minimo_compra"
                            type="number" placeholder="100000"
                            nota="El cliente debe comprar al menos este monto para usar el cupón."
                            data={data} onChange={setData} errors={errors} />

                        <Campo label="Límite de usos totales (opcional)" name="limite_usos"
                            type="number" placeholder="100"
                            nota="Después de N usos, el cupón se bloquea automáticamente. Vacío = ilimitado."
                            data={data} onChange={setData} errors={errors} />

                        <div className="grid grid-cols-2 gap-4">
                            <Campo label="Fecha de inicio (opcional)" name="fecha_inicio" type="date"
                                data={data} onChange={setData} errors={errors} />
                            <Campo label="Fecha de expiración (opcional)" name="fecha_expiracion" type="date"
                                data={data} onChange={setData} errors={errors} />
                        </div>
                    </div>

                    {/* Estado */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" checked={data.activo}
                                onChange={e => setData('activo', e.target.checked)}
                                className="w-4 h-4 text-emerald-600 rounded" />
                            <div>
                                <div className="font-medium text-gray-800 text-sm">Cupón activo</div>
                                <div className="text-xs text-gray-500">Si está desactivado, no puede usarse aunque esté dentro de las fechas.</div>
                            </div>
                        </label>
                    </div>

                    {/* Botones */}
                    <div className="flex items-center justify-end gap-3">
                        <Link href={route('cupones.index')}
                            className="px-5 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition">
                            Cancelar
                        </Link>
                        <button type="submit" disabled={processing}
                            className="px-6 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition">
                            {processing ? 'Guardando...' : 'Crear Cupón'}
                        </button>
                    </div>

                </form>
            </div>
        </AuthenticatedLayout>
    );
}
