/**
 * ARCHIVO: bootstrap.js
 * PROPÓSITO: Configuración inicial del frontend — se carga antes que cualquier
 *            componente React. Aquí se configura Axios para que todas las
 *            peticiones HTTP al backend incluyan los headers de seguridad.
 *
 * ¿QUÉ ES AXIOS?
 *   Es la librería que usamos para hacer peticiones HTTP desde React al backend.
 *   En lugar de usar fetch() nativo del navegador, Axios agrega:
 *   - Interceptores (middleware para requests/responses)
 *   - Manejo automático de JSON
 *   - Cancelación de peticiones
 *   - Headers automáticos (como el token CSRF que configuramos aquí)
 *
 * ¿QUÉ ES EL TOKEN CSRF?
 *   Cross-Site Request Forgery Protection.
 *   Sin CSRF: un sitio malicioso podría hacer peticiones a tu app
 *   haciéndose pasar por el usuario autenticado.
 *
 *   Con CSRF: cada formulario/petición incluye un token único que
 *   Laravel verifica. Si el token no coincide → Laravel rechaza la petición.
 *
 *   Laravel pone el token en una cookie llamada 'XSRF-TOKEN'.
 *   Axios la lee automáticamente y la envía en el header 'X-XSRF-TOKEN'.
 */

import axios from 'axios';

// Hace que Axios esté disponible globalmente en window.axios
// Útil para debugging en la consola del navegador: window.axios.get('/api/test')
window.axios = axios;

// Configura Axios para enviar cookies en todas las peticiones
// Sin esto, la sesión de Laravel no se mantiene entre requests
window.axios.defaults.withCredentials = true;

// Configura el header que Axios envía en cada petición
// Laravel busca 'X-Requested-With': 'XMLHttpRequest' para saber
// que es una petición AJAX (no una navegación normal del browser)
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
