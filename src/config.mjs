const DEFAULT_API_URL = 'http://localhost:3000/api';

function getConfiguredApiUrl() {
  // 1) Runtime override (set globalThis.ENLACEHUB_API_URL antes de cargar este módulo)
  const runtimeValue = globalThis?.ENLACEHUB_API_URL;
  if (typeof runtimeValue === 'string' && runtimeValue.trim()) {
    return runtimeValue.trim().replace(/\/+$/, '');
  }

  // 2) Query param ?api=... (útil en desarrollo)
  try {
    const params = new URLSearchParams(globalThis.location?.search || '');
    const queryValue = params.get('api') || '';
    if (queryValue.trim()) {
      return queryValue.trim().replace(/\/+$/, '');
    }
  } catch {
    // Ignore
  }

  // 3) En producción (mismo origen), usar ruta relativa
  try {
    const host = globalThis.location?.hostname || '';
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return '/api';
    }
  } catch {
    // Ignore
  }

  // 4) Fallback: localhost desarrollo
  return DEFAULT_API_URL;
}

export const API_URL = getConfiguredApiUrl();
