/**
 * Utilidad de navegación a páginas de error.
 * Usar desde cualquier módulo del SPA para redirigir
 * a páginas de error descriptivas.
 *
 * Uso:
 *   import { navigateToError } from './error.mjs';
 *   navigateToError(404);
 *   navigateToError(401, '/dashboard');
 *   navigateToError(500, null, 'Error al cargar datos');
 */

const ERROR_PAGES = {
  400: '400.html',
  401: '401.html',
  403: '403.html',
  404: '404.html',
  500: '500.html'
};

/**
 * Redirige a la página de error correspondiente.
 *
 * @param {number} statusCode - Código HTTP (400, 401, 403, 404, 500)
 * @param {string|null} [redirectTo] - A dónde redirigir después (opcional)
 * @param {string|null} [message] - Mensaje adicional (opcional)
 */
export function navigateToError(statusCode, redirectTo = null, message = null) {
  const page = ERROR_PAGES[statusCode];
  if (!page) {
    window.location.href = '404.html';
    return;
  }

  const params = new URLSearchParams();
  if (redirectTo) params.set('redirect', redirectTo);
  if (message) params.set('message', message);

  const query = params.toString();
  window.location.href = query ? `${page}?${query}` : page;
}

/**
 * Redirige según el error de una respuesta fetch.
 * Útil para try/catch en llamadas API.
 *
 * @param {Error} error - Error capturado
 * @param {string|null} [fallbackRedirect] - Ruta de redirección opcional
 */
export function handleApiError(error, fallbackRedirect = null) {
  const match = error.message?.match(/(\d{3})/);
  const code = match ? parseInt(match[1]) : null;

  if (code && ERROR_PAGES[code]) {
    navigateToError(code, fallbackRedirect, error.message);
  } else if (error.message?.toLowerCase().includes('conexión') ||
             error.message?.toLowerCase().includes('network') ||
             error.message?.toLowerCase().includes('fetch')) {
    window.location.href = 'offline.html';
  } else {
    navigateToError(500, fallbackRedirect, error.message);
  }
}
