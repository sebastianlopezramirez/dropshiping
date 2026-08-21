/*
|--------------------------------------------------------------------------
| PÁGINA: Admin/Tarifas/Index.jsx — Gestión de tarifas de domicilio
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué hace esta página?
|
|   El admin puede:
|     1. Ver todas las tarifas agrupadas por tipo (área metro / ciudades)
|     2. Crear nuevas ciudades con su precio
|     3. Editar el precio de cualquier ciudad
|     4. Activar / desactivar (sin eliminar)
|     5. Eliminar si es necesario
|
*/

import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import { capitalize } from '@/utils/texto';

const cop = (n) => Number(n).toLocaleString('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0
});

export default function TarifasIndex({ tarifas }) {

    const areaMetro = tarifas.filter(t => t.tipo === 'area_metro');
    const ciudades  = tarifas.filter(t => t.tipo === 'ciudad');

    // ─── MODAL EDITAR ─────────────────────────────────────────────────────
    const [editando, setEditando] = useState(null);

    // ─── FORMULARIO CREAR ─────────────────────────────────────────────────
    const crear = useForm({ nombre: '', tipo: 'ciudad', precio: '', orden: '' });

    const handleCrear = (e) => {
        e.preventDefault();
        crear.post(route('tarifas.store'), {
            onSuccess: () => crear.reset(),
        });
    };

    // ─── FORMULARIO EDITAR ────────────────────────────────────────────────
    const editar = useForm({ nombre: '', tipo: '', precio: '', orden: '' });

    const abrirEditar = (tarifa) => {
        setEditando(tarifa.id);
        editar.setData({
            nombre: tarifa.nombre,
            tipo:   tarifa.tipo,
            precio: tarifa.precio,
            orden:  tarifa.orden,
        });
    };

    const handleEditar = (e, id) => {
        e.preventDefault();
        editar.put(route('tarifas.update', id), {
            onSuccess: () => setEditando(null),
        });
    };

    const handleToggle = (id) => {
        router.patch(route('tarifas.toggle', id));
    };

    const handleEliminar = (id, nombre) => {
        if (confirm(`¿Eliminar tarifa para "${nombre}"?`)) {
            router.delete(route('tarifas.destroy', id));
        }
    };

    return (
        <>
            <Head title="Tarifas de domicilio" />

            <div className="space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Tarifas de domicilio</h1>
                        <p className="text-gray-500 text-sm mt-1">Gestiona los precios de envío por municipio y ciudad</p>
                    </div>
                </div>

                {/* Formulario crear */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                    <h2 className="text-base font-semibold text-gray-800 mb-4">➕ Agregar nueva ciudad / municipio</h2>
                    <form onSubmit={handleCrear} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Nombre *</label>
                            <input
                                type="text"
                                value={crear.data.nombre}
                                onChange={e => crear.setData('nombre', capitalize(e.target.value))}
                                placeholder="Ej: Rionegro"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                            {crear.errors.nombre && <p className="text-red-500 text-xs mt-1">{crear.errors.nombre}</p>}
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Tipo *</label>
                            <select
                                value={crear.data.tipo}
                                onChange={e => crear.setData('tipo', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                            >
                                <option value="area_metro">Área Metro Medellín</option>
                                <option value="ciudad">Otra ciudad</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Precio domicilio (COP) *</label>
                            <input
                                type="number"
                                value={crear.data.precio}
                                onChange={e => crear.setData('precio', e.target.value)}
                                placeholder="Ej: 15000"
                                min="0"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                            {crear.errors.precio && <p className="text-red-500 text-xs mt-1">{crear.errors.precio}</p>}
                        </div>
                        <div className="flex items-end">
                            <button type="submit" disabled={crear.processing}
                                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
                                {crear.processing ? 'Guardando...' : 'Agregar'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Tabla Área Metro */}
                <TarifaTable
                    titulo="🏙️ Área Metropolitana de Medellín"
                    tarifas={areaMetro}
                    editando={editando}
                    editar={editar}
                    onAbrirEditar={abrirEditar}
                    onEditar={handleEditar}
                    onToggle={handleToggle}
                    onEliminar={handleEliminar}
                    onCancelarEditar={() => setEditando(null)}
                />

                {/* Tabla Ciudades */}
                <TarifaTable
                    titulo="🗺️ Otras ciudades del país"
                    tarifas={ciudades}
                    editando={editando}
                    editar={editar}
                    onAbrirEditar={abrirEditar}
                    onEditar={handleEditar}
                    onToggle={handleToggle}
                    onEliminar={handleEliminar}
                    onCancelarEditar={() => setEditando(null)}
                />
            </div>
        </>
    );
}

// ─── COMPONENTE: Tabla de tarifas ──────────────────────────────────────────
function TarifaTable({ titulo, tarifas, editando, editar, onAbrirEditar, onEditar, onToggle, onEliminar, onCancelarEditar }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800">{titulo}</h2>
                <p className="text-xs text-gray-500 mt-0.5">{tarifas.length} {tarifas.length === 1 ? 'tarifa' : 'tarifas'}</p>
            </div>

            {tarifas.length === 0 ? (
                <p className="text-center text-gray-400 py-8 text-sm">No hay tarifas configuradas en esta sección.</p>
            ) : (
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                            <th className="text-left px-6 py-3">Municipio / Ciudad</th>
                            <th className="text-right px-6 py-3">Precio domicilio</th>
                            <th className="text-center px-6 py-3">Estado</th>
                            <th className="text-right px-6 py-3">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {tarifas.map(tarifa => (
                            <tr key={tarifa.id} className={`hover:bg-gray-50 transition-colors ${!tarifa.activo ? 'opacity-50' : ''}`}>
                                {editando === tarifa.id ? (
                                    // Fila edición inline
                                    <td colSpan={4} className="px-6 py-3">
                                        <form onSubmit={e => onEditar(e, tarifa.id)}
                                            className="flex flex-wrap gap-3 items-end">
                                            <input
                                                type="text"
                                                value={editar.data.nombre}
                                                onChange={e => editar.setData('nombre', capitalize(e.target.value))}
                                                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            />
                                            <select
                                                value={editar.data.tipo}
                                                onChange={e => editar.setData('tipo', e.target.value)}
                                                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            >
                                                <option value="area_metro">Área Metro</option>
                                                <option value="ciudad">Ciudad</option>
                                            </select>
                                            <input
                                                type="number"
                                                value={editar.data.precio}
                                                onChange={e => editar.setData('precio', e.target.value)}
                                                min="0"
                                                placeholder="Precio"
                                                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            />
                                            <button type="submit" disabled={editar.processing}
                                                className="bg-green-500 hover:bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                                                Guardar
                                            </button>
                                            <button type="button" onClick={onCancelarEditar}
                                                className="text-gray-500 hover:text-gray-700 text-xs px-3 py-1.5 rounded-lg border border-gray-300 transition-colors">
                                                Cancelar
                                            </button>
                                        </form>
                                    </td>
                                ) : (
                                    <>
                                        <td className="px-6 py-3 font-medium text-gray-900">{tarifa.nombre}</td>
                                        <td className="px-6 py-3 text-right font-semibold text-gray-800">{cop(tarifa.precio)}</td>
                                        <td className="px-6 py-3 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                                tarifa.activo
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-gray-100 text-gray-500'
                                            }`}>
                                                {tarifa.activo ? 'Activa' : 'Inactiva'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => onAbrirEditar(tarifa)}
                                                    className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors">
                                                    Editar
                                                </button>
                                                <button onClick={() => onToggle(tarifa.id)}
                                                    className={`text-xs font-medium px-2 py-1 rounded transition-colors ${
                                                        tarifa.activo
                                                            ? 'text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50'
                                                            : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                                                    }`}>
                                                    {tarifa.activo ? 'Desactivar' : 'Activar'}
                                                </button>
                                                <button onClick={() => onEliminar(tarifa.id, tarifa.nombre)}
                                                    className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors">
                                                    Eliminar
                                                </button>
                                            </div>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
