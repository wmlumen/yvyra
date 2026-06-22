/**
 * Utilidades compartidas para el servidor.
 * @module lib/utils
 */

const { AppError } = require('../middleware/errorHandler');

/**
 * Parsea JSON de forma segura sin lanzar excepción.
 * @param {string|null|undefined} str
 * @param {*} fallback - Valor por defecto si falla el parseo
 * @returns {*} Objeto parseado o fallback
 */
function safeJsonParse(str, fallback = null) {
  if (!str || typeof str !== 'string') return fallback;
  try { return JSON.parse(str); } catch { return fallback; }
}

/**
 * Parsea el payload de un TreeBlock (string → objeto).
 * @param {object} block
 * @returns {object} El mismo bloque con payload parseado
 */
function parseBlockPayload(block) {
  if (!block) return block;
  if (typeof block.payload === 'string') {
    block.payload = safeJsonParse(block.payload, {});
  }
  if (block.classified && typeof block.classified.tags === 'string') {
    block.classified.tags = safeJsonParse(block.classified.tags, []);
  }
  return block;
}

/**
 * Parsea miniSite JSON de un workspace.
 * @param {object} workspace
 * @returns {object} Workspace con miniSite como objeto
 */
function parseMiniSite(workspace) {
  if (!workspace) return workspace;
  if (workspace.miniSite && typeof workspace.miniSite === 'string') {
    workspace.miniSite = safeJsonParse(workspace.miniSite, {});
  }
  return workspace;
}

/**
 * Stringifica payload para guardar en DB (objeto → string).
 * @param {*} payload
 * @returns {string}
 */
function stringifyPayload(payload) {
  if (typeof payload === 'string') return payload;
  return JSON.stringify(payload ?? {});
}

/**
 * Envuelve un controlador async para capturar errores y pasarlos a next().
 * Elimina la necesidad de try/catch en cada controlador.
 * 
 * @param {Function} fn - Controlador async (req, res, next) => {...}
 * @returns {Function} Middleware Express con manejo de errores
 * 
 * @example
 * const getProfile = asyncHandler(async (req, res) => {
 *   const data = await prisma.workspace.findUnique(...);
 *   if (!data) throw new AppError('No encontrado', 404);
 *   res.json(data);
 * });
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  safeJsonParse,
  parseBlockPayload,
  parseMiniSite,
  stringifyPayload,
  asyncHandler
};
