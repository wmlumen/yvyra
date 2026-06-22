const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Registrar un evento de analytics (público, con rate limiting básico)
exports.recordEvent = async (req, res) => {
  const workspaceId = req.tenantWorkspaceId || req.body.workspaceId;
  const { type, targetId, source, medium, campaign, metadata } = req.body;

  const VALID_TYPES = ['page_view', 'link_click', 'short_click', 'whatsapp_share', 'contact', 'classified_view'];

  if (!workspaceId) return res.status(400).json({ error: 'Falta workspaceId' });
  if (!type || !VALID_TYPES.includes(type)) {
    return res.status(400).json({ error: `Tipo de evento inválido. Válidos: ${VALID_TYPES.join(', ')}` });
  }

  try {
    const event = await prisma.analyticsEvent.create({
      data: {
        workspaceId,
        type,
        targetId: targetId || null,
        visitorId: req.headers['x-visitor-id'] || req.cookies?.visitor || null,
        source: (source || '').toLowerCase().slice(0, 80) || null,
        medium: (medium || '').toLowerCase().slice(0, 80) || null,
        campaign: (campaign || '').toLowerCase().slice(0, 80) || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
        ip: (req.ip || '').split('.').slice(0, 3).join('.') || null
      }
    });

    res.status(201).json({ id: event.id, message: 'Evento registrado' });
  } catch (error) {
    console.error('Error recording event:', error);
    res.status(500).json({ error: 'Error registrando evento' });
  }
};

// Obtener analytics agregados del workspace (requiere auth)
exports.getAnalytics = async (req, res) => {
  const workspaceId = req.user?.workspaceId || req.tenantWorkspaceId;
  const days = Math.min(parseInt(req.query.days) || 30, 90);

  if (!workspaceId) return res.status(400).json({ error: 'Falta workspaceId' });

  try {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const events = await prisma.analyticsEvent.findMany({
      where: {
        workspaceId,
        createdAt: { gte: since }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Agregaciones
    const totalViews = events.filter(e => e.type === 'page_view').length;
    const totalClicks = events.filter(e => ['link_click', 'short_click', 'classified_view'].includes(e.type)).length;
    const totalWhatsApp = events.filter(e => e.type === 'whatsapp_share' || e.source === 'whatsapp').length;

    // Visitantes únicos
    const uniqueVisitors = new Set(events.map(e => e.visitorId).filter(Boolean)).size;

    // Clics por target
    const byTarget = {};
    events.filter(e => ['link_click', 'short_click'].includes(e.type)).forEach(e => {
      const key = e.targetId || 'unknown';
      byTarget[key] = (byTarget[key] || 0) + 1;
    });

    // Visitas por fuente
    const bySource = {};
    events.forEach(e => {
      const source = e.source || 'direct';
      bySource[source] = (bySource[source] || 0) + 1;
    });

    // Serie temporal por día
    const byDay = {};
    events.forEach(e => {
      const day = e.createdAt.toISOString().split('T')[0];
      if (!byDay[day]) byDay[day] = { views: 0, clicks: 0 };
      if (e.type === 'page_view') byDay[day].views++;
      if (['link_click', 'short_click'].includes(e.type)) byDay[day].clicks++;
    });

    res.json({
      period: `${days} days`,
      totalViews,
      totalClicks,
      totalWhatsApp,
      uniqueVisitors,
      byTarget,
      bySource,
      byDay: Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b)).map(([date, data]) => ({ date, ...data }))
    });
  } catch (error) {
    console.error('Error getting analytics:', error);
    res.status(500).json({ error: 'Error obteniendo analytics' });
  }
};

// Exportar analytics como CSV
exports.exportAnalyticsCSV = async (req, res) => {
  const workspaceId = req.user.workspaceId;
  const days = Math.min(parseInt(req.query.days) || 90, 365);

  try {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const events = await prisma.analyticsEvent.findMany({
      where: {
        workspaceId,
        createdAt: { gte: since }
      },
      orderBy: { createdAt: 'asc' }
    });

    const header = 'id,tipo,objeto_id,visitante,fuente,medio,campaña,fecha\n';
    const rows = events.map(e =>
      `${e.id},${e.type},${e.targetId || ''},${e.visitorId || ''},${e.source || ''},${e.medium || ''},${e.campaign || ''},${e.createdAt.toISOString()}`
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="analytics-${workspaceId}-${days}d.csv"`);
    res.send(header + rows);
  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(500).json({ error: 'Error exportando analytics' });
  }
};
