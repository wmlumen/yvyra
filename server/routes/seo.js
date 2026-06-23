/**
 * Rutas SEO: sitemap.xml y robots.txt
 * Sirven contenido dinámico para motores de búsqueda.
 */
const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

const BASE_URL = process.env.BASE_URL || 'https://enlacehub.com';
const SITE_NAME = process.env.SITE_NAME || 'EnlaceHub';
const GOOGLE_SITE_VERIFICATION = process.env.GOOGLE_SITE_VERIFICATION || '';

function getBaseUrl(req) {
  const fallback = String(BASE_URL || '').trim();
  try {
    return new URL(fallback).toString().replace(/\/$/, '');
  } catch {
    const protocol = req?.protocol === 'http' ? 'http' : 'https';
    const host = req?.headers?.host || 'localhost';
    return `${protocol}://${host}`;
  }
}

function buildStaticUrls(baseUrl) {
  return [
    { loc: `${baseUrl}/`, priority: '1.0', changefreq: 'daily' },
    { loc: `${baseUrl}/profile.html`, priority: '0.9', changefreq: 'daily' },
    { loc: `${baseUrl}/clasificados.html`, priority: '0.9', changefreq: 'daily' },
    { loc: `${baseUrl}/miniweb.html`, priority: '0.8', changefreq: 'weekly' },
    { loc: `${baseUrl}/pricing.html`, priority: '0.7', changefreq: 'monthly' },
    { loc: `${baseUrl}/templates.html`, priority: '0.7', changefreq: 'monthly' },
    { loc: `${baseUrl}/registro.html`, priority: '0.8', changefreq: 'weekly' }
  ];
}

function buildTenantUrls(baseUrl, domains = []) {
  const baseHost = new URL(baseUrl).hostname;
  return domains.flatMap((domain) => {
    const subdomainOrigin = `https://${domain.hostname}.${baseHost}`;
    const lastmod = domain.workspace?.updatedAt instanceof Date
      ? domain.workspace.updatedAt.toISOString()
      : undefined;

    return [
      { loc: `${subdomainOrigin}/profile.html`, priority: '0.9', changefreq: 'daily', lastmod },
      { loc: `${subdomainOrigin}/clasificados.html`, priority: '0.8', changefreq: 'daily', lastmod },
      { loc: `${subdomainOrigin}/miniweb.html`, priority: '0.8', changefreq: 'weekly', lastmod }
    ];
  });
}

function buildSitemapXml(urls = []) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    ${u.lastmod ? `<lastmod>${escapeXml(u.lastmod)}</lastmod>` : ''}
    ${u.changefreq ? `<changefreq>${u.changefreq}</changefreq>` : ''}
    ${u.priority ? `<priority>${u.priority}</priority>` : ''}
  </url>`).join('\n')}
</urlset>`;
}

function buildRobotsTxt({ baseUrl, isSubdomain }) {
  if (isSubdomain) {
    return `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml
`;
  }

  return `User-agent: *
Allow: /
Disallow: /login.html
Disallow: /dashboard.html
Disallow: /superadmin.html
Disallow: /shortener.html
Disallow: /miniweb-admin.html
Disallow: /clasificados-admin.html

Sitemap: ${baseUrl}/sitemap.xml
`;
}

/**
 * GET /sitemap.xml
 * Genera un sitemap dinámico con todos los subdominios públicos.
 */
router.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = getBaseUrl(req);
    const domains = await prisma.domainMapping.findMany({
      where: { canonical: true },
      select: {
        hostname: true,
        workspaceId: true,
        workspace: { select: { updatedAt: true } }
      },
      take: 5000 // límite seguridad
    });

    const allUrls = [
      ...buildStaticUrls(baseUrl),
      ...buildTenantUrls(baseUrl, domains)
    ];
    const xml = buildSitemapXml(allUrls);

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
  const baseUrl = getBaseUrl(req);
  const content = buildRobotsTxt({ baseUrl, isSubdomain });

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send(content);
});

router.get(/^\/google([a-zA-Z0-9_-]+)\.html$/, (req, res) => {
  const requestedToken = req.params[0] || '';
  if (!GOOGLE_SITE_VERIFICATION || requestedToken !== GOOGLE_SITE_VERIFICATION) {
    return res.status(404).send('Not found');
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`google-site-verification: google${GOOGLE_SITE_VERIFICATION}.html`);
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
module.exports.buildStaticUrls = buildStaticUrls;
module.exports.buildTenantUrls = buildTenantUrls;
module.exports.buildSitemapXml = buildSitemapXml;
module.exports.buildRobotsTxt = buildRobotsTxt;
