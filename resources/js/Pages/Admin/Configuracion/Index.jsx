/*
|--------------------------------------------------------------------------
| Página: Admin/Configuracion/Index
|--------------------------------------------------------------------------
| ENTENDER: Formulario para que el super admin configure el horario de
|           disponibilidad que aparece en el navbar de la tienda.
|
| PENSAR:   - Lee los valores actuales desde props (Inertia)
|           - Al guardar hace POST a /configuracion
|           - Muestra vista previa en tiempo real del indicador
|
| ESCRIBIR: Formulario simple con inputs de número + texto + preview
*/

import { useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function ConfiguracionIndex({ configuracion }) {
    const { flash } = usePage().props;

    const { data, setData, post, processing, errors } = useForm({
        hora_apertura:   configuracion.hora_apertura,
        hora_cierre:     configuracion.hora_cierre,
        mensaje_cerrado: configuracion.mensaje_cerrado,
        mensaje_abierto: configuracion.mensaje_abierto,
    });

    // Vista previa: simula si ahora estaría abierto o cerrado
    const horaActualColombia = () => {
        const ahora = new Date();
        return new Date(ahora.toLocaleString('en-US', { timeZone: 'America/Bogota' })).getHours();
    };
    const horaActual = horaActualColombia();
    const estaAbierto = horaActual >= data.hora_apertura && horaActual < data.hora_cierre;

    const guardar = (e) => {
        e.preventDefault();
        post(route('configuracion.actualizar'));
    };

    // Formatea número a hora legible: 8 → "8:00 am", 21 → "9:00 pm"
    const formatearHora = (hora) => {
        const h = parseInt(hora);
        if (isNaN(h)) return '';
        const ampm = h >= 12 ? 'pm' : 'am';
        const h12 = h % 12 || 12;
        return `${h12}:00 ${ampm}`;
    };

    return (
        <AuthenticatedLayout>
            <Head title="Configuración — GadGet Store" />

            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto">

                {/* Encabezado */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        ⚙️ Configuración General
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Ajusta el horario de disponibilidad que se muestra en el navbar de la tienda.
                    </p>
                </div>

                {/* Mensaje de éxito */}
                {flash?.exito && (
                    <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl text-green-800 dark:text-green-300 text-sm">
                        {flash.exito}
                    </div>
                )}

                {/* Vista previa en tiempo real */}
                <div className="mb-6 p-4 bg-gray-900 rounded-2xl border border-gray-700">
                    <p className="text-xs text-gray-500 mb-3 uppercase tracking-wide">Vista previa (hora actual Colombia: {horaActual}:00)</p>
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                            {estaAbierto ? (
                                <>
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
                                </>
                            ) : (
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                            )}
                        </span>
                        <span className={`text-sm font-semibold ${estaAbierto ? 'text-green-400' : 'text-gray-400'}`}>
                            {estaAbierto ? data.mensaje_abierto : data.mensaje_cerrado}
                        </span>
                    </div>
                </div>

                {/* Formulario */}
                <form onSubmit={guardar} className="space-y-5 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">

                    {/* Horario */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                🕗 Hora apertura
                            </label>
                            <input
                                type="number"
                                min="0" max="23"
                                value={data.hora_apertura}
                                onChange={e => setData('hora_apertura', parseInt(e.target.value))}
                                className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                            <p className="text-xs text-gray-400 mt-1">{formatearHora(data.hora_apertura)}</p>
                            {errors.hora_apertura && <p className="text-xs text-red-500 mt-1">{errors.hora_apertura}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                🕘 Hora cierre
                            </label>
                            <input
                                type="number"
                                min="0" max="23"
                                value={data.hora_cierre}
                                onChange={e => setData('hora_cierre', parseInt(e.target.value))}
                                className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                            <p className="text-xs text-gray-400 mt-1">{formatearHora(data.hora_cierre)}</p>
                            {errors.hora_cierre && <p className="text-xs text-red-500 mt-1">{errors.hora_cierre}</p>}
                        </div>
                    </div>

                    {/* Mensaje abierto */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            🟢 Mensaje cuando está abierto
                        </label>
                        <input
                            type="text"
                            maxLength="40"
                            value={data.mensaje_abierto}
                            onChange={e => setData('mensaje_abierto', e.target.value)}
                            className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        {errors.mensaje_abierto && <p className="text-xs text-red-500 mt-1">{errors.mensaje_abierto}</p>}
                    </div>

                    {/* Mensaje cerrado */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            🔴 Mensaje cuando está cerrado
                        </label>
                        <input
                            type="text"
                            maxLength="60"
                            value={data.mensaje_cerrado}
                            onChange={e => setData('mensaje_cerrado', e.target.value)}
                            className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="Volvemos a las 8am"
                        />
                        {errors.mensaje_cerrado && <p className="text-xs text-red-500 mt-1">{errors.mensaje_cerrado}</p>}
                    </div>

                    {/* Botón guardar */}
                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-semibold py-2.5 rounded-xl transition-all disabled:opacity-50 text-sm"
                        >
                            {processing ? 'Guardando...' : '💾 Guardar configuración'}
                        </button>
                    </div>

                    {/* Info */}
                    <p className="text-xs text-gray-400 text-center">
                        Los cambios se aplican de inmediato en el navbar de la tienda.
                    </p>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
