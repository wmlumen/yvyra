/**
 * Controlador de administración global.
 * Proporciona métricas, gestión de usuarios, logs de auditoría y ejecuciones de agentes.
 */

const prisma = require('../lib/prisma');
const { AppError } = require('../middleware/errorHandler');
const { asyncHandler } = require('../lib/utils');

// ─── Métricas ───────────────────────────────────────────────

exports.getStats = asyncHandler(async (req, res) => {
  const [usersCount, workspacesCount, blocksCount, classifiedsCount] = await Promise.all([
    prisma.user.count(),
    prisma.workspace.count(),
    prisma.treeBlock.count(),
    prisma.classified.count()
  ]);

  res.json({
    users: usersCount,
    workspaces: workspacesCount,
    blocks: blocksCount,
    classifieds: classifiedsCount
  });
});

exports.getDetailedStats = asyncHandler(async (req, res) => {
  const [
    usersCount,
    workspacesCount,
    blocksCount,
    classifiedsCount,
    shortLinksCount,
    analyticsCount,
    auditLogsCount,
    agentExecutionsCount
  ] = await Promise.all([
    prisma.user.count(),
    prisma.workspace.count(),
    prisma.treeBlock.count(),
    prisma.classified.count(),
    prisma.shortLink.count(),
    prisma.analyticsEvent.count(),
    prisma.auditLog.count(),
    prisma.agentExecution.count()
  ]);

  const recentSignups = await prisma.user.count({
    where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
  });

  res.json({
    users: usersCount,
    workspaces: workspacesCount,
    blocks: blocksCount,
    classifieds: classifiedsCount,
    shortLinks: shortLinksCount,
    analyticsEvents: analyticsCount,
    auditLogs: auditLogsCount,
    agentExecutions: agentExecutionsCount,
    recentSignups
  });
});

// ─── Usuarios ───────────────────────────────────────────────

exports.getUsers = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const offset = parseInt(req.query.offset) || 0;
  const search = req.query.search || '';

  const where = search
    ? {
        OR: [
          { name: { contains: search } },
          { email: { contains: search } }
        ]
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true, email: true, name: true, role: true, createdAt: true,
        workspaces: {
          select: { name: true, handle: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    }),
    prisma.user.count({ where })
  ]);

  res.json({ users, total, limit, offset });
});

exports.getUser = asyncHandler(async (req, res) => {
  const userId = req.params.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true,
      workspaces: {
        include: {
          _count: { select: { blocks: true, shortLinks: true, analyticsEvents: true } }
        }
      }
    }
  });

  if (!user) throw new AppError('Usuario no encontrado', 404);
  res.json(user);
});

exports.updateUserRole = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  const { role } = req.body;

  if (!role || !['USER', 'ADMIN'].includes(role)) {
    throw new AppError('Rol inválido. Debe ser USER o ADMIN', 400);
  }

  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser) throw new AppError('Usuario no encontrado', 404);

  // No permitir auto-desescalada del último admin
  if (targetUser.id === req.user.userId && role !== 'ADMIN') {
    throw new AppError('No puedes cambiar tu propio rol de administrador', 403);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, email: true, name: true, role: true }
  });

  res.json(updated);
});

exports.deleteUser = asyncHandler(async (req, res) => {
  const userId = req.params.id;

  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser) throw new AppError('Usuario no encontrado', 404);

  if (targetUser.id === req.user.userId) {
    throw new AppError('No puedes eliminarte a ti mismo', 403);
  }

  if (targetUser.role === 'ADMIN') {
    throw new AppError('No se puede eliminar a otro Súper Administrador', 403);
  }

  await prisma.user.delete({ where: { id: userId } });
  res.json({ message: 'Usuario y todos sus datos eliminados' });
});

// ─── Auditoría Global ────────────────────────────────────────

exports.getGlobalAudit = asyncHandler(async (req, res) => {
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

// ─── Ejecuciones de Agentes ──────────────────────────────────

exports.getAgentExecutions = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const offset = parseInt(req.query.offset) || 0;

  const [executions, total] = await Promise.all([
    prisma.agentExecution.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    }),
    prisma.agentExecution.count()
  ]);

  res.json({ executions, total, limit, offset });
});
