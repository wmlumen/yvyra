const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Obtener auditoría del workspace
exports.getAuditLogs = async (req, res) => {
  const workspaceId = req.user.workspaceId;
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const offset = parseInt(req.query.offset) || 0;

  try {
    const logs = await prisma.auditLog.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    const total = await prisma.auditLog.count({ where: { workspaceId } });

    res.json({ logs, total, limit, offset });
  } catch (error) {
    console.error('Error getting audit logs:', error);
    res.status(500).json({ error: 'Error obteniendo registros de auditoría' });
  }
};

// Obtener auditoría global (solo admin)
exports.getGlobalAuditLogs = async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const offset = parseInt(req.query.offset) || 0;

  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        // No hay relación directa con User, usamos userId
      }
    });

    const total = await prisma.auditLog.count();

    res.json({ logs, total, limit, offset });
  } catch (error) {
    console.error('Error getting global audit logs:', error);
    res.status(500).json({ error: 'Error obteniendo auditoría global' });
  }
};
