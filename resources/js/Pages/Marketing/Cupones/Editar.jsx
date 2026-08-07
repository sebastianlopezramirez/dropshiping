/*
|--------------------------------------------------------------------------
| PÁGINA: Marketing/Cupones/Editar.jsx
|--------------------------------------------------------------------------
*/

import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

// FUERA del componente para evitar re-creación en cada render (bug de foco)
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

export default function Editar({ cupon }) {

    const { data, setData, put, processing, errors } = useForm({
        codigo:           cupon.codigo           || '',
        descripcion:      cupon.descripcion      || '',
        tipo:             cupon.tipo             || 'porcentaje',
        valor:            cupon.valor            || '',
        minimo_compra:    cupon.minimo_compra    || '',
        maximo_descuento: cupon.maximo_descuento || '',
        limite_usos:      cupon.limite_usos      || '',
        fecha_inicio:     cupon.fecha_inicio     || '',
        fecha_expiracion: cupon.fecha_expiracion || '',
        activo:           cupon.activo           ?? true,
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('cupones.update', cupon.id));
    };

    const fmt = (v) => new Intl.NumberFormat('es-CO', {
        style: 'currency', currency: 'COP', minimumFractionDigits: 0,
    }).format(v ?? 0);

    return (
        <AuthenticatedLayout header={
            <div className="flex items-center gap-3">
                <Link href={route('cupones.index')} className="text-gray-400 hover:text-gray-600 transition">←</Link>
                <h2 className="text-xl font-semibold text-gray-800">Editar Cupón</h2>
                <span className="font-mono text-sm bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                    {cupon.codigo}
                </span>
            </div>
        }>
            <Head title={`Editar ${cupon.codigo}`} />

            <div className="py-8 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

                {/* Info de usos actuales */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-700">{cupon.usos_actuales}</div>
                        <div className="text-xs text-blue-600">usos realizados</div>
                    </div>
                    {cupon.limite_usos && (
                        <>
                            <div className="text-blue-300">/ {cupon.limite_usos} máximo</div>
                            <div className="flex-1 bg-blue-200 rounded-full h-2 ml-2">
                                <div className="bg-blue-600 h-2 rounded-full"
                                    style={{ width: `${Math.min(100, (cupon.usos_actuales / cupon.limite_usos) * 100)}%` }} />
                            </div>
                        </>
                    )}
                    <div className="ml-auto text-xs text-blue-600">
                        Creado: {new Date(cupon.creado_en).toLocaleDateString('es-CO')}
                    </div>
                </div>

                <form onSubmit={submit} className="space-y-6">

                    {/* Código y descripción */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                        <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Identificación</h3>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Código del cupón <span className="text-red-500">*</span>
                            </label>
                            <input type="text"
                                value={data.codigo}
                                onChange={e => setData('codigo', e.target.value.toUpperCase())}
                                className={`w-full border rounded-lg px-3 py-2 text-sm font-mono uppercase focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                                    ${errors.codigo ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                            />
                            {errors.codigo && <p className="mt-1 text-xs text-red-600">{errors.codigo}</p>}
                        </div>

                        <Campo label="Descripción (opcional)" name="descripcion"
                            data={data} onChange={setData} errors={errors} />
                    </div>

                    {/* Tipo y valor */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                        <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Descuento</h3>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { value: 'porcentaje', label: '% Porcentaje' },
                                    { value: 'valor_fijo', label: '$ Valor fijo' },
                                ].map(op => (
                                    <button key={op.value} type="button"
                                        onClick={() => { setData('tipo', op.value); if (op.value === 'valor_fijo') setData('maximo_descuento', ''); }}
                                        className={`p-3 border-2 rounded-xl text-left transition
                                            ${data.tipo === op.value
                                                ? 'border-emerald-500 bg-emerald-50'
                                                : 'border-gray-200 hover:border-gray-300'}`}>
                                        <div className="font-semibold text-sm text-gray-800">{op.label}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {data.tipo === 'porcentaje' ? 'Porcentaje' : 'Monto fijo'} <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                                    {data.tipo === 'porcentaje' ? '%' : '$'}
                                </span>
                                <input type="number" min="0.01" step="any"
                                    value={data.valor}
                                    onChange={e => setData('valor', e.target.value)}
                                    className={`w-full border rounded-lg pl-8 pr-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                                        ${errors.valor ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                                />
                            </div>
                            {errors.valor && <p className="mt-1 text-xs text-red-600">{errors.valor}</p>}
                        </div>

                        {data.tipo === 'porcentaje' && (
                            <Campo label="Tope máximo de descuento (opcional)" name="maximo_descuento"
                                type="number" data={data} onChange={setData} errors={errors} />
                        )}
                    </div>

                    {/* Restricciones */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                        <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Restricciones</h3>
                        <Campo label="Compra mínima ($)" name="minimo_compra" type="number"
                            data={data} onChange={setData} errors={errors} />
                        <Campo label="Límite de usos (vacío = ilimitado)" name="limite_usos" type="number"
                            data={data} onChange={setData} errors={errors} />
                        <div className="grid grid-cols-2 gap-4">
                            <Campo label="Fecha de inicio" name="fecha_inicio" type="date"
                                data={data} onChange={setData} errors={errors} />
                            <Campo label="Fecha de expiración" name="fecha_expiracion" type="date"
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
                                <div className="text-xs text-gray-500">Desactivarlo no borra el historial de usos.</div>
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
                            {processing ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>

                </form>
            </div>
        </AuthenticatedLayout>
    );
}
