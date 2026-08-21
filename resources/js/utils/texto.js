/*
|--------------------------------------------------------------------------
| utils/texto.js — Transformaciones de texto para inputs del formulario
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Para qué sirve esto?
|   Funciones reutilizables para formatear texto mientras el usuario escribe.
|   Se importan en cualquier componente que tenga inputs de nombre/título.
|
| PENSAR — ¿Qué problema resuelven?
|   Sin esto, cada componente tendría su propia lógica repetida.
|   Con esto, una sola función centralizada = fácil de cambiar.
|
| USO:
|   import { capitalize } from '@/utils/texto';
|   onChange={e => setData('nombre', capitalize(e.target.value))}
|
*/

/**
 * Capitaliza la primera letra de cada palabra.
 * No toca las demás letras (respeta siglas como "HDMI", "USB").
 *
 * Ejemplos:
 *   "iphone 15 pro" → "Iphone 15 Pro"
 *   "cable HDMI 2.0" → "Cable HDMI 2.0"
 *   "" → ""
 */
export function capitalize(texto) {
    if (!texto) return texto;
    // Pone en mayúscula el primer carácter no-espacio al inicio y tras cada espacio
    return texto.replace(/(^\s*\S|\s\S)/g, char => char.toUpperCase());
}
