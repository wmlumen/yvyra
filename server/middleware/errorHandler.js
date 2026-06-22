/**
 * Middleware centralizado de errores.
 * - AppError: errores operacionales conocidos (código 4xx)
 * - Errores no esperados: 500 + log
 */

class AppError extends Error {
  /**
   * @param {string} message  Mensaje para el cliente
   * @param {number} status   Código HTTP (400-499)
   * @param {string} [code]   Código interno opcional (ej. "VALIDATION_ERROR")
   */
  constructor(message, status = 400, code = undefined) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Middleware express de 4 parámetros.
 * Debe registrarse DESPUÉS de todas las rutas.
 */
function errorHandler(err, req, res, _next) {
  // Error conocido lanzado con AppError
  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: err.message,
      ...(err.code && { code: err.code })
    });
  }

  // Error de validación de Prisma
  if (err?.constructor?.name === 'PrismaClientKnownRequestError') {
    if (err.code === 'P2002') {
      return res.status(409).json({
        error: 'El recurso ya existe (conflicto de campo único)',
        code: 'UNIQUE_CONSTRAINT'
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({
        error: 'El recurso solicitado no existe',
        code: 'NOT_FOUND'
      });
    }
  }

  // Error de parseo JSON en body
  if (err.type === 'entity.parse.failed' || err.status === 400) {
    return res.status(400).json({
      error: 'El cuerpo de la solicitud contiene JSON inválido',
      code: 'INVALID_JSON'
    });
  }

  // Error inesperado (500)
  console.error('[ERROR] No manejado:', err);
  const message = process.env.NODE_ENV === 'production'
    ? 'Error interno del servidor'
    : err.message || 'Error interno del servidor';

  return res.status(500).json({
    error: message,
    code: 'INTERNAL_ERROR'
  });
}

module.exports = { AppError, errorHandler };
