const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Normalizar número de WhatsApp: solo dígitos, máx 18
function normalizeWhatsAppNumber(value) {
  return String(value ?? '').replace(/\D+/g, '').slice(0, 18);
}

// Normalizar valores de tráfico
function normalizeTrafficValue(value, fallback = '') {
  return String(value ?? fallback)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/**
 * Generar URL de campaña para WhatsApp
 * POST /api/whatsapp/campaign
 * Body: { url, campaign?, source?, medium?, text?, phone? }
 */
exports.generateCampaign = async (req, res) => {
  const workspaceId = req.user?.workspaceId || req.tenantWorkspaceId;
  const { url, campaign, source, medium, text, phone } = req.body;

  if (!url) return res.status(400).json({ error: 'Falta la URL base de la campaña' });

  try {
    const baseUrl = new URL(url);
    const normalizedSource = normalizeTrafficValue(source || 'whatsapp', 'whatsapp');
    const normalizedMedium = normalizeTrafficValue(medium || 'messaging', 'messaging');
    const normalizedCampaign = normalizeTrafficValue(campaign || 'general', 'general');

    // Construir URL con tracking
    baseUrl.searchParams.set('src', normalizedSource);
    baseUrl.searchParams.set('medium', normalizedMedium);
    if (normalizedCampaign) baseUrl.searchParams.set('campaign', normalizedCampaign);

    const trackedUrl = baseUrl.toString();

    // Construir URL wa.me
    const message = [String(text || '').trim(), trackedUrl].filter(Boolean).join('\n\n');
    const number = normalizeWhatsAppNumber(phone);
    const waBase = number ? `https://wa.me/${number}` : 'https://wa.me/';
    const whatsappUrl = `${waBase}?text=${encodeURIComponent(message)}`;

    // Registrar en analytics
    try {
      await prisma.analyticsEvent.create({
        data: {
          workspaceId: workspaceId || 'unknown',
          type: 'whatsapp_share',
          targetId: 'campaign',
          source: normalizedSource,
          medium: normalizedMedium,
          campaign: normalizedCampaign,
          metadata: JSON.stringify({ trackedUrl, phone: number ? 'provided' : 'none' })
        }
      });
    } catch (e) {
      // No bloquear
    }

    res.json({
      trackedUrl,
      whatsappUrl,
      waUrl: waBase,
      message: message,
      campaign: normalizedCampaign
    });
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('URL')) {
      return res.status(400).json({ error: 'La URL proporcionada no es válida' });
    }
    console.error('Error generating campaign:', error);
    res.status(500).json({ error: 'Error generando campaña' });
  }
};

/**
 * Registrar un evento de contacto por WhatsApp
 * POST /api/whatsapp/contact
 * Body: { workspaceId, campaign? }
 */
exports.recordContact = async (req, res) => {
  const workspaceId = req.body.workspaceId || req.tenantWorkspaceId;
  const { campaign } = req.body;

  if (!workspaceId) return res.status(400).json({ error: 'Falta workspaceId' });

  try {
    const event = await prisma.analyticsEvent.create({
      data: {
        workspaceId,
        type: 'contact',
        targetId: 'whatsapp',
        source: 'whatsapp',
        medium: 'messaging',
        campaign: campaign || null,
        visitorId: req.headers['x-visitor-id'] || null
      }
    });

    res.status(201).json({ id: event.id, message: 'Contacto registrado' });
  } catch (error) {
    console.error('Error recording contact:', error);
    res.status(500).json({ error: 'Error registrando contacto' });
  }
};

/**
 * Obtener estadísticas de campañas WhatsApp
 * GET /api/whatsapp/stats
 */
exports.getCampaignStats = async (req, res) => {
  const workspaceId = req.user?.workspaceId || req.tenantWorkspaceId;
  const days = Math.min(parseInt(req.query.days) || 30, 90);

  try {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const events = await prisma.analyticsEvent.findMany({
      where: {
        workspaceId,
        createdAt: { gte: since },
        OR: [
          { type: 'whatsapp_share' },
          { type: 'contact' },
          { source: 'whatsapp' }
        ]
      },
      orderBy: { createdAt: 'asc' }
    });

    const totalShares = events.filter(e => e.type === 'whatsapp_share').length;
    const totalContacts = events.filter(e => e.type === 'contact').length;
    const totalVisits = events.filter(e => e.source === 'whatsapp' && e.type === 'page_view').length;

    // Agrupar por campaña
    const byCampaign = {};
    events.forEach(e => {
      const camp = e.campaign || 'sin-campaña';
      if (!byCampaign[camp]) byCampaign[camp] = { shares: 0, contacts: 0, visits: 0 };
      if (e.type === 'whatsapp_share') byCampaign[camp].shares++;
      if (e.type === 'contact') byCampaign[camp].contacts++;
      if (e.source === 'whatsapp' && e.type === 'page_view') byCampaign[camp].visits++;
    });

    res.json({
      period: `${days} days`,
      totalShares,
      totalContacts,
      totalVisits,
      conversionRate: totalShares > 0 ? ((totalContacts / totalShares) * 100).toFixed(1) + '%' : '0%',
      byCampaign
    });
  } catch (error) {
    console.error('Error getting campaign stats:', error);
    res.status(500).json({ error: 'Error obteniendo estadísticas de campañas' });
  }
};
