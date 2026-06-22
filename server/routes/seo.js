/**
 * Rutas SEO: sitemap.xml y robots.txt
 * Sirven contenido dinámico para motores de búsqueda.
 */
const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

const BASE_URL = process.env.BASE_URL || 'https://enlacehub.com';
const SITE_NAME = process.env.SITE_NAME || 'EnlaceHub';

/**
 * GET /sitemap.xml
 * Genera un sitemap dinámico con todos los subdominios públicos.
 */
router.get('/sitemap.xml', async (req, res) => {
  try {
    const domains = await prisma.domainMapping.findMany({
      where: { canonical: true },
      select: { hostname: true, workspaceId: true },
      take: 5000 // límite seguridad
    });

    const staticUrls = [
      { loc: `${BASE_URL}/`, priority: '1.0' },
      { loc: `${BASE_URL}/pricing.html`, priority: '0.8' },
      { loc: `${BASE_URL}/templates.html`, priority: '0.7' },
      { loc: `${BASE_URL}/registro.html`, priority: '0.9' }
    ];

    const domainUrls = domains.map(d => ({
      loc: `https://${d.hostname}.${new URL(BASE_URL).hostname}`,
      priority: '0.9',
      changefreq: 'weekly'
    }));

    const allUrls = [...staticUrls, ...domainUrls];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(u => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <priority>${u.priority}</priority>
    ${u.changefreq ? `<changefreq>${u.changefreq}</changefreq>` : ''}
  </url>`).join('\n')}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.send(xml);
  } catch (error) {
    console.error('Error generando sitemap:', error);
    res.status(500).send('Error generando sitemap');
  }
});

/**
 * GET /robots.txt
 * Indica a los robots qué pueden rastrear.
 */
router.get('/robots.txt', (req, res) => {
  const host = req.headers.host || 'enlacehub.com';
  const isSubdomain = host.split('.').length > 2;

  let content;
  if (isSubdomain) {
    // Para subdominios, permitir todo (son páginas públicas)
    content = `User-agent: *
Allow: /
Sitemap: ${BASE_URL}/sitemap.xml
`;
  } else {
    // Para el dominio principal, permitir pero priorizar contenido
    content = `User-agent: *
Allow: /
Disallow: /login.html
Disallow: /dashboard.html
Disallow: /superadmin.html
Disallow: /shortener.html
Disallow: /miniweb-admin.html
Disallow: /clasificados-admin.html

Sitemap: ${BASE_URL}/sitemap.xml
`;
  }

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send(content);
});

/**
 * GET /seo/metadata
 * API para que el frontend SPA obtenga meta tags dinámicos según el tenant.
 */
router.get('/metadata', async (req, res) => {
  try {
    const tenant = req.query.tenant || req.query.profile || req.query.subdomain;
    if (!tenant) {
      return res.json({
        title: SITE_NAME,
        description: 'Plataforma de perfiles digitales, miniweb y clasificados.',
        image: '',
        url: BASE_URL
      });
    }

    const mapping = await prisma.domainMapping.findUnique({ where: { hostname: tenant } });
    if (!mapping) {
      return res.json({ title: 'No encontrado', description: 'El perfil solicitado no existe.' });
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: mapping.workspaceId },
      select: { name: true, handle: true, bio: true, avatar: true, miniSite: true }
    });

    if (!workspace) {
      return res.json({ title: 'No encontrado', description: 'El perfil solicitado no existe.' });
    }

    let miniSite = workspace.miniSite;
    if (typeof miniSite === 'string') {
      try { miniSite = JSON.parse(miniSite); } catch { miniSite = {}; }
    }

    const businessName = miniSite?.businessName || workspace.name || SITE_NAME;
    const headline = miniSite?.headline || 'Perfil digital';
    const description = miniSite?.description || workspace.bio || `Perfil de ${businessName}`;
    const avatarUrl = workspace.avatar ? `https://avatar.enlacehub.com/${workspace.avatar}` : '';

    res.json({
      title: `${businessName} · ${headline}`,
      description: description.slice(0, 160),
      image: avatarUrl,
      url: `https://${tenant}.${new URL(BASE_URL).hostname}`,
      businessName,
      headline,
      handle: workspace.handle
    });
  } catch (error) {
    console.error('Error en metadata SEO:', error);
    res.status(500).json({ error: 'Error obteniendo metadata' });
  }
});

function escapeXml(str) {
  return String(str ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

module.exports = router;
