const DEFAULT_API_URL = 'http://localhost:3000/api';

function getConfiguredApiUrl() {
  const runtimeValue = globalThis?.ENLACEHUB_API_URL;
  if (typeof runtimeValue === 'string' && runtimeValue.trim()) {
    return runtimeValue.trim().replace(/\/+$/, '');
  }

  try {
    const params = new URLSearchParams(globalThis.location?.search || '');
    const queryValue = params.get('api') || '';
    if (queryValue.trim()) {
      return queryValue.trim().replace(/\/+$/, '');
    }
  } catch {
    // Ignore malformed URLs and fall back to localhost.
  }

  return DEFAULT_API_URL;
}

export const API_URL = getConfiguredApiUrl();
