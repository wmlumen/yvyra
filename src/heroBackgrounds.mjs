// ─────────────────────────────────────────────
// Módulo compartido: mapa de handles → imágenes de fondo
// Fuente única de verdad — importar desde public.mjs y server
// ─────────────────────────────────────────────

export const HERO_BACKGROUNDS = {
  'milibeats':   'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4',
  'cafe-aroma':  'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb',
  'cafearoma':   'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb',
  'techfix':     'https://images.unsplash.com/photo-1531297484001-80022131f5a1',
  'techfixpro':  'https://images.unsplash.com/photo-1531297484001-80022131f5a1',
  'luna-arte':   'https://images.unsplash.com/photo-1513364776144-60967b0f800f',
  'lunaarte':    'https://images.unsplash.com/photo-1513364776144-60967b0f800f',
};

export const HERO_DEFAULT = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4';

/**
 * Resuelve la URL de imagen de fondo para un handle.
 * @param {string} handle      - Handle del workspace (ej: "cafearoma")
 * @param {string} [customUrl] - URL personalizada del dashboard (heroImage)
 * @param {string} [size]      - Parámetro de tamaño para Unsplash (ej: "960x540")
 * @returns {string} URL absoluta de la imagen
 */
export function resolveHeroBg(handle, customUrl, size) {
  if (customUrl && customUrl.trim()) return customUrl.trim();

  const key = (handle || '').toLowerCase().trim();
  const baseUrl = HERO_BACKGROUNDS[key] || HERO_DEFAULT;

  if (size) {
    return `${baseUrl}?w=${size.split('x')[0]}&h=${size.split('x')[1]}&fit=crop&crop=center`;
  }
  return baseUrl;
}
