const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Normalizar slug
function normalizeSlug(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

const RESERVED_SLUGS = new Set([
  'admin', 'api', 'dashboard', 'login', 'logout', 'signup', 'settings',
  'analytics', 'shortener', 'classifieds', 'clasificados', 'assets', 'src',
  'tests', 'help', 'support', 'miniweb', 'website', 'whatsapp',
  'www', 'app', 'mail', 'email', 'ftp', 'cdn', 'static', 'status'
]);

function isValidSlug(slug) {
  return slug.length >= 3 && slug.length <= 48 && !RESERVED_SLUGS.has(slug);
}

function isValidHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

// Crear enlace corto
exports.createShortLink = async (req, res) => {
  const workspaceId = req.user.workspaceId;
  const { slug, url, expiresAt } = req.body;

  try {
    const normalizedSlug = normalizeSlug(slug || Math.random().toString(36).slice(2, 9));
    if (!isValidSlug(normalizedSlug)) {
      return res.status(400).json({ error: 'El slug debe tener entre 3 y 48 caracteres y no estar reservado.' });
    }
    if (!isValidHttpUrl(url)) {
      return res.status(400).json({ error: 'La URL debe comenzar con http:// o https://.' });
    }

    // Verificar unicidad
    const existing = await prisma.shortLink.findUnique({ where: { slug: normalizedSlug } });
    if (existing) {
      return res.status(409).json({ error: 'Ese slug ya existe. Elige otro.' });
    }

    const shortLink = await prisma.shortLink.create({
      data: {
        workspaceId,
        slug: normalizedSlug,
        url,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      }
    });

    // Auditoría
    await prisma.auditLog.create({
      data: {
        workspaceId,
        userId: req.user.userId,
        action: 'create',
        entity: 'shortlink',
        entityId: shortLink.id,
        details: JSON.stringify({ slug: normalizedSlug, url })
      }
    });

    res.status(201).json(shortLink);
  } catch (error) {
    console.error('Error creating short link:', error);
    res.status(500).json({ error: 'Error interno creando el enlace corto' });
  }
};

// Listar enlaces cortos del workspace
exports.listShortLinks = async (req, res) => {
  const workspaceId = req.user.workspaceId;

  try {
    const links = await prisma.shortLink.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(links);
  } catch (error) {
    console.error('Error listing short links:', error);
    res.status(500).json({ error: 'Error obteniendo enlaces cortos' });
  }
};

// Actualizar enlace corto
exports.updateShortLink = async (req, res) => {
  const workspaceId = req.user.workspaceId;
  const linkId = req.params.id;
  const { url, isActive, expiresAt } = req.body;

  try {
    const link = await prisma.shortLink.findFirst({ where: { id: linkId, workspaceId } });
    if (!link) return res.status(404).json({ error: 'Enlace corto no encontrado' });

    if (url && !isValidHttpUrl(url)) {
      return res.status(400).json({ error: 'La URL debe comenzar con http:// o https://.' });
    }

    const updated = await prisma.shortLink.update({
      where: { id: linkId },
      data: {
        ...(url && { url }),
        ...(isActive !== undefined && { isActive }),
        ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null })
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating short link:', error);
    res.status(500).json({ error: 'Error actualizando el enlace corto' });
  }
};

// Eliminar enlace corto
exports.deleteShortLink = async (req, res) => {
  const workspaceId = req.user.workspaceId;
  const linkId = req.params.id;

  try {
    const link = await prisma.shortLink.findFirst({ where: { id: linkId, workspaceId } });
    if (!link) return res.status(404).json({ error: 'Enlace corto no encontrado' });

    await prisma.shortLink.delete({ where: { id: linkId } });
    res.json({ message: 'Enlace corto eliminado' });
  } catch (error) {
    console.error('Error deleting short link:', error);
    res.status(500).json({ error: 'Error eliminando el enlace corto' });
  }
};

// Resolver enlace corto (público, sin auth)
exports.resolveShortLink = async (req, res) => {
  const { slug } = req.params;

  try {
    const link = await prisma.shortLink.findUnique({ where: { slug } });
    if (!link) return res.status(404).json({ error: 'Enlace corto no encontrado' });
    if (!link.isActive) return res.status(410).json({ error: 'Este enlace corto está desactivado' });
    if (link.expiresAt && new Date() > link.expiresAt) {
      return res.status(410).json({ error: 'Este enlace corto ha expirado' });
    }

    // Incrementar contador de clics
    await prisma.shortLink.update({
      where: { id: link.id },
      data: { clickCount: { increment: 1 } }
    });

    // Registrar evento de analytics
    try {
      await prisma.analyticsEvent.create({
        data: {
          workspaceId: link.workspaceId,
          type: 'short_click',
          targetId: link.id,
          visitorId: req.headers['x-visitor-id'] || null,
          source: req.query.src || null,
          medium: req.query.medium || null,
          campaign: req.query.campaign || null,
          ip: (req.ip || '').split('.').slice(0, 3).join('.') || null
        }
      });
    } catch (e) {
      // No bloquear la redirección si falla la analítica
      console.error('Error logging analytics:', e.message);
    }

    // Redirigir
    res.json({ url: link.url });
  } catch (error) {
    console.error('Error resolving short link:', error);
    res.status(500).json({ error: 'Error interno' });
  }
};
