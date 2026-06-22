/**
 * Middleware de validación de entrada.
 * Ayuda a prevenir XSS, inyección y datos malformados.
 */

// Sanitizar string: eliminar HTML tags peligrosos, limitar longitud
function sanitize(value, maxLength = 1000) {
  if (typeof value !== 'string') return value;
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Eliminar scripts completos
    .replace(/<[^>]*\bon\w+\s*=[^>]*>/gi, '') // Eliminar etiquetas con manejadores de eventos
    .replace(/javascript\s*:/gi, '') // Eliminar javascript: URLs
    .trim()
    .slice(0, maxLength);
}

// Validar que un campo existe y es string
function requiredString(value, fieldName) {
  if (!value || typeof value !== 'string' || !value.trim()) {
    throw new Error(`${fieldName} es requerido`);
  }
  return sanitize(value);
}

// Validar URL
function isValidHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

// Validar email
function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// Middleware para sanitizar body
function sanitizeBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    for (const [key, value] of Object.entries(req.body)) {
      if (typeof value === 'string') {
        req.body[key] = sanitize(value, 5000);
      }
    }
  }
  next();
}

// Middleware para validar Content-Type
function requireJson(req, res, next) {
  const contentType = req.headers['content-type'];
  if (req.method !== 'GET' && req.method !== 'DELETE') {
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(415).json({ error: 'Content-Type debe ser application/json' });
    }
  }
  next();
}

module.exports = {
  sanitize,
  requiredString,
  isValidHttpUrl,
  isValidEmail,
  sanitizeBody,
  requireJson
};
