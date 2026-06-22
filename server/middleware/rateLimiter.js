/**
 * Rate Limiter simple en memoria.
 * Para producción, reemplazar con express-rate-limit o similar.
 */

const requestCounts = new Map();

const WINDOW_MS = 60 * 1000; // 1 minuto
const MAX_REQUESTS = 100;     // Máximo de requests por ventana

// Limpieza periódica
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of requestCounts.entries()) {
    if (now - record.windowStart > WINDOW_MS * 2) {
      requestCounts.delete(key);
    }
  }
}, 60000);

/**
 * Middleware de rate limiting.
 * @param {Object} options
 * @param {number} options.windowMs - Ventana en milisegundos
 * @param {number} options.max - Máximo de requests por ventana
 * @param {Function} options.keyGenerator - Función para generar la clave (default: req.ip)
 */
function rateLimiter(options = {}) {
  const windowMs = options.windowMs || WINDOW_MS;
  const max = options.max || MAX_REQUESTS;
  const keyGen = options.keyGenerator || (req => req.ip || req.connection?.remoteAddress || 'unknown');

  return (req, res, next) => {
    const key = keyGen(req);
    const now = Date.now();

    let record = requestCounts.get(key);
    if (!record || now - record.windowStart > windowMs) {
      record = { windowStart: now, count: 0 };
      requestCounts.set(key, record);
    }

    record.count++;

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil((record.windowStart + windowMs) / 1000));

    if (record.count > max) {
      return res.status(429).json({ error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' });
    }

    next();
  };
}

module.exports = rateLimiter;
