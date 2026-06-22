/**
 * Controlador de auditoría.
 */

const prisma = require('../lib/prisma');
const { AppError } = require('../middleware/errorHandler');
const { asyncHandler } = require('../lib/utils');

// Obtener auditoría del workspace
exports.getAuditLogs = asyncHandler(async (req, res) => {
  const workspaceId = req.user?.workspaceId;
  if (!workspaceId) throw new AppError('No autenticado', 401);

  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const offset = parseInt(req.query.offset) || 0;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    }),
    prisma.auditLog.count({ where: { workspaceId } })
  ]);

  res.json({ logs, total, limit, offset });
});

// Obtener auditoría global (solo admin)
exports.getGlobalAuditLogs = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const offset = parseInt(req.query.offset) || 0;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    }),
    prisma.auditLog.count()
  ]);

  res.json({ logs, total, limit, offset });
});
