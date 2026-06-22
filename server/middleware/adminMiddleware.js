/**
 * Middleware de autorización de administrador.
 * Verifica que el usuario autenticado tenga rol ADMIN.
 * Debe usarse DESPUÉS de authMiddleware.
 */

const { AppError } = require('./errorHandler');

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
module.exports = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'No autorizado: debe iniciar sesión' });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Acceso denegado: Se requiere rol de Súper Administrador' });
  }

  next();
};
