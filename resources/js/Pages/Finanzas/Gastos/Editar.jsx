/*
|--------------------------------------------------------------------------
| PÁGINA: Finanzas/Gastos/Editar.jsx
|--------------------------------------------------------------------------
*/

import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Editar({ gasto, categorias }) {

    const { data, setData, put, processing, errors } = useForm({
        categoria:   gasto.categoria   ?? '',
        descripcion: gasto.descripcion ?? '',
        monto:       gasto.monto       ?? '',
        fecha_gasto: gasto.fecha_gasto?.split('T')[0] ?? '',
        notas:       gasto.notas       ?? '',
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('gastos.update', gasto.id));
    };

    const inputClass = (campo) =>
        `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors[campo] ? 'border-red-400' : 'border-gray-300'}`;

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800">Editar Gasto</h2>}>
            <Head title="Editar Gasto" />

            <div className="py-8 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">

                <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                    <Link href={route('gastos.index')} className="hover:text-indigo-600">Gastos</Link>
                    <span>/</span>
                    <span className="text-gray-900">Editar</span>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Categoría <span className="text-red-500">*</span>
                            </label>
                            <select value={data.categoria} onChange={e => setData('categoria', e.target.value)}
                                className={inputClass('categoria')}>
                                <option value="">Seleccionar categoría...</option>
                                {categorias.map(c => (
                                    <option key={c.value} value={c.value}>{c.icono} {c.label}</option>
                                ))}
                            </select>
                            {errors.categoria && <p className="text-red-500 text-xs mt-1">{errors.categoria}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Descripción <span className="text-red-500">*</span>
                            </label>
                            <input type="text" value={data.descripcion}
                                onChange={e => setData('descripcion', e.target.value)}
                                className={inputClass('descripcion')} />
                            {errors.descripcion && <p className="text-red-500 text-xs mt-1">{errors.descripcion}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Monto (COP) <span className="text-red-500">*</span>
                                </label>
                                <input type="number" min="1" step="100"
                                    value={data.monto} onChange={e => setData('monto', e.target.value)}
                                    className={inputClass('monto')} />
                                {errors.monto && <p className="text-red-500 text-xs mt-1">{errors.monto}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Fecha del gasto <span className="text-red-500">*</span>
                                </label>
                                <input type="date" value={data.fecha_gasto}
                                    onChange={e => setData('fecha_gasto', e.target.value)}
                                    className={inputClass('fecha_gasto')} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                            <textarea rows={3} value={data.notas}
                                onChange={e => setData('notas', e.target.value)}
                                className={inputClass('notas')} />
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <Link href={route('gastos.index')}
                            className="px-4 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition">
                            Cancelar
                        </Link>
                        <button type="submit" disabled={processing}
                            className="px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition">
                            {processing ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
