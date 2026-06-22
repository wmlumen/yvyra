/**
 * Middleware de validación de entrada.
 * Ayuda a prevenir XSS, inyección y datos malformados.
 * 
 * Incluye un validador por schema para aplicar reglas
 * específicas a cada endpoint.
 */

// ============================================================
// Funciones de sanitización
// ============================================================

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

// ============================================================
// Schema-based validation
// ============================================================

/**
 * Tipos de campo soportados por los schemas:
 *   'string'   → string no vacío (sanitizado)
 *   'email'    → email válido
 *   'url'      → URL http/https válida
 *   'number'   → número finito
 *   'boolean'  → booleano
 *   'any'      → cualquier valor (pasa sanitización si es string)
 *   'string?'  → string opcional (puede no venir o ser vacío)
 *   'number?'  → número opcional
 *
 * Cada campo puede tener:
 *   { type, required, minLength, maxLength, min, max, message }
 */

/**
 * Valida req.body contra un schema y aplica sanitización.
 * 
 * @param {Object} schema  Mapa de campos: { fieldName: rule }
 * @returns {Function} Middleware Express
 * 
 * @example
 * const loginSchema = {
 *   email: { type: 'email', required: true },
 *   password: { type: 'string', required: true, minLength: 6 }
 * };
 * router.post('/login', validateSchema(loginSchema), controller.login);
 */
function validateSchema(schema) {
  return (req, res, next) => {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'El cuerpo de la solicitud debe ser un objeto JSON', code: 'INVALID_BODY' });
    }

    const errors = [];
    const cleaned = {};

    for (const [field, rule] of Object.entries(schema)) {
      const value = req.body[field];
      const isOptional = rule.type.endsWith('?');
      const baseType = isOptional ? rule.type.slice(0, -1) : rule.type;
      const isPresent = value !== undefined && value !== null && value !== '';

      // Campo requerido no presente
      if (rule.required && !isPresent) {
        errors.push(rule.message || `El campo "${field}" es requerido`);
        continue;
      }

      // Campo opcional ausente → omitir
      if (!isPresent && isOptional) {
        continue;
      }

      // Validar tipo
      switch (baseType) {
        case 'string': {
          if (typeof value !== 'string') {
            errors.push(rule.message || `El campo "${field}" debe ser un texto`);
            break;
          }
          const sanitized = sanitize(value, rule.maxLength || 5000);
          if (!sanitized && rule.required) {
            errors.push(rule.message || `El campo "${field}" no puede estar vacío`);
            break;
          }
          if (rule.minLength && sanitized.length < rule.minLength) {
            errors.push(rule.message || `El campo "${field}" debe tener al menos ${rule.minLength} caracteres`);
            break;
          }
          if (rule.pattern && !rule.pattern.test(sanitized)) {
            errors.push(rule.message || `El campo "${field}" no tiene el formato esperado`);
            break;
          }
          cleaned[field] = sanitized;
          break;
        }

        case 'email': {
          if (typeof value !== 'string' || !isValidEmail(value)) {
            errors.push(rule.message || `El campo "${field}" debe ser un correo electrónico válido`);
            break;
          }
          cleaned[field] = sanitize(value).toLowerCase();
          break;
        }

        case 'url': {
          if (typeof value !== 'string' || !isValidHttpUrl(value)) {
            errors.push(rule.message || `El campo "${field}" debe ser una URL válida (http/https)`);
            break;
          }
          cleaned[field] = value.trim();
          break;
        }

        case 'number': {
          const num = Number(value);
          if (!Number.isFinite(num)) {
            errors.push(rule.message || `El campo "${field}" debe ser un número válido`);
            break;
          }
          if (rule.min !== undefined && num < rule.min) {
            errors.push(rule.message || `El campo "${field}" debe ser mayor o igual a ${rule.min}`);
            break;
          }
          if (rule.max !== undefined && num > rule.max) {
            errors.push(rule.message || `El campo "${field}" debe ser menor o igual a ${rule.max}`);
            break;
          }
          cleaned[field] = num;
          break;
        }

        case 'boolean': {
          if (typeof value !== 'boolean') {
            errors.push(rule.message || `El campo "${field}" debe ser verdadero o falso`);
            break;
          }
          cleaned[field] = value;
          break;
        }

        case 'any': {
          cleaned[field] = typeof value === 'string' ? sanitize(value) : value;
          break;
        }

        default:
          cleaned[field] = value;
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join('; '), code: 'VALIDATION_ERROR' });
    }

    // Reemplazar body con datos limpios + campos extra no definidos en schema
    req.body = { ...cleaned };
    // Pasar campos no definidos en schema (permitir extras si no hay regla estricta)
    for (const [key, val] of Object.entries(req.body)) {
      if (!(key in schema)) {
        req.body[key] = typeof val === 'string' ? sanitize(val) : val;
      }
    }

    next();
  };
}

// ============================================================
// Schemas predefinidos para endpoints comunes
// ============================================================

const authRegisterSchema = {
  email: { type: 'email', required: true, message: 'Correo electrónico inválido' },
  password: { type: 'string', required: true, minLength: 6, message: 'La contraseña debe tener al menos 6 caracteres' },
  name: { type: 'string', required: true, minLength: 2, message: 'El nombre debe tener al menos 2 caracteres' },
  subdomain: { type: 'string', required: true, minLength: 3, message: 'El subdominio debe tener al menos 3 caracteres' }
};

const authLoginSchema = {
  email: { type: 'email', required: true },
  password: { type: 'string', required: true, minLength: 1 }
};

const createBlockSchema = {
  type: { type: 'string', required: true, message: 'El tipo de bloque es requerido' },
  title: { type: 'string', required: true, minLength: 2, message: 'El título debe tener al menos 2 caracteres' },
  payload: { type: 'any' }
};

const createClassifiedSchema = {
  title: { type: 'string', required: true, minLength: 5, maxLength: 120 },
  description: { type: 'string', required: true, minLength: 15, maxLength: 1000 },
  category: { type: 'string', required: true },
  price: { type: 'number?', min: 0, max: 100000000 },
  currency: { type: 'string?' },
  location: { type: 'string?' },
  contactUrl: { type: 'url', required: true }
};

const createShortLinkSchema = {
  slug: { type: 'string', required: true, minLength: 3, message: 'El slug debe tener al menos 3 caracteres' },
  url: { type: 'url', required: true }
};

const agentTaskSchema = {
  task: { type: 'string', required: true, minLength: 3, message: 'La tarea debe tener al menos 3 caracteres' },
  dryRun: { type: 'boolean?' }
};

// ============================================================
// Middlewares utilitarios
// ============================================================

// Middleware para sanitizar body genéricamente (para endpoints sin schema)
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
  requireJson,
  validateSchema,
  // Schemas
  authRegisterSchema,
  authLoginSchema,
  createBlockSchema,
  createClassifiedSchema,
  createShortLinkSchema,
  agentTaskSchema
};
