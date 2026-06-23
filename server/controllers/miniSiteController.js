const prisma = require('../lib/prisma');
// Valores por defecto para la miniweb
const DEFAULT_MINI_SITE = {
  published: true,
  businessName: '',
  headline: 'Bienvenido a mi sitio',
  description: 'Conoce mis servicios, revisa mis clasificados y comunícate directamente conmigo.',
  services: [],
  whatsapp: '',
  email: '',
  address: 'Atención remota',
  primaryCtaLabel: 'Ver mi árbol de enlaces',
  primaryCtaUrl: '',
  showClassifieds: true,
  heroImage: '' // URL personalizada de imagen de fondo
};

/**
 * Obtener configuración de la miniweb del workspace (requiere auth)
 */
exports.getMiniSite = async (req, res) => {
  const workspaceId = req.user.workspaceId;

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { miniSite: true, name: true, handle: true }
    });

    if (!workspace) return res.status(404).json({ error: 'Espacio no encontrado' });

    let miniSite = workspace.miniSite;
    if (typeof miniSite === 'string') {
      try { miniSite = JSON.parse(miniSite); } catch (e) { miniSite = {}; }
    }

    res.json({
      config: { ...DEFAULT_MINI_SITE, ...(miniSite || {}) },
      businessName: workspace.name,
      handle: workspace.handle
    });
  } catch (error) {
    console.error('Error getting mini site:', error);
    res.status(500).json({ error: 'Error obteniendo la configuración de la miniweb' });
  }
};

/**
 * Actualizar configuración de la miniweb (requiere auth)
 */
exports.updateMiniSite = async (req, res) => {
  const workspaceId = req.user.workspaceId;
  const updates = req.body;

  try {
    // Obtener la configuración actual
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { miniSite: true }
    });

    if (!workspace) return res.status(404).json({ error: 'Espacio no encontrado' });

    let currentConfig = workspace.miniSite;
    if (typeof currentConfig === 'string') {
      try { currentConfig = JSON.parse(currentConfig); } catch (e) { currentConfig = {}; }
    }

    // Combinar configuración actual con las actualizaciones
    const newConfig = {
      ...DEFAULT_MINI_SITE,
      ...(currentConfig || {}),
      ...updates,
      services: updates.services || currentConfig?.services || []
    };

    // Validar campos
    if (newConfig.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newConfig.email)) {
      return res.status(400).json({ error: 'El correo electrónico no es válido' });
    }
    if (newConfig.primaryCtaUrl && !newConfig.primaryCtaUrl.startsWith('http')) {
      return res.status(400).json({ error: 'La URL del botón principal debe comenzar con http:// o https://' });
    }

    await prisma.workspace.update({
      where: { id: workspaceId },
      data: { miniSite: JSON.stringify(newConfig) }
    });

    // Auditoría
    await prisma.auditLog.create({
      data: {
        workspaceId,
        userId: req.user.userId,
        action: 'update',
        entity: 'minisite',
        details: JSON.stringify({ updatedFields: Object.keys(updates) })
      }
    });

    res.json({ message: 'Miniweb actualizada', config: newConfig });
  } catch (error) {
    console.error('Error updating mini site:', error);
    res.status(500).json({ error: 'Error actualizando la miniweb' });
  }
};

/**
 * Generar HTML estático de la miniweb (público por subdominio o privado)
 */
exports.generateMiniSiteHTML = async (req, res) => {
  const workspaceId = req.tenantWorkspaceId || req.user?.workspaceId;

  if (!workspaceId) return res.status(400).json({ error: 'No se pudo identificar el espacio de trabajo' });

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        blocks: {
          where: { isActive: true },
          orderBy: { order: 'asc' }
        },
        domainMappings: {
          where: { canonical: true },
          select: { hostname: true }
        }
      }
    });

    if (!workspace) return res.status(404).json({ error: 'Espacio no encontrado' });

    let miniSite = workspace.miniSite;
    if (typeof miniSite === 'string') {
      try { miniSite = JSON.parse(miniSite); } catch (e) { miniSite = {}; }
    }
    const config = { ...DEFAULT_MINI_SITE, ...(miniSite || {}) };

    // Generar HTML
    const html = buildMiniSiteHTML(workspace, config);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error) {
    console.error('Error generating mini site HTML:', error);
    res.status(500).json({ error: 'Error generando la miniweb' });
  }
};

/**
 * Descargar la miniweb como archivo HTML estático
 */
exports.downloadMiniSite = async (req, res) => {
  const workspaceId = req.user.workspaceId;

  if (!workspaceId) return res.status(400).json({ error: 'No se pudo identificar el espacio de trabajo' });

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        blocks: {
          where: { isActive: true },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!workspace) return res.status(404).json({ error: 'Espacio no encontrado' });

    let miniSite = workspace.miniSite;
    if (typeof miniSite === 'string') {
      try { miniSite = JSON.parse(miniSite); } catch (e) { miniSite = {}; }
    }
    const config = { ...DEFAULT_MINI_SITE, ...(miniSite || {}) };

    const html = buildMiniSiteHTML(workspace, config);

    const filename = `miniweb-${workspace.handle || workspace.name.replace(/\s+/g, '-').toLowerCase() || 'sitio'}.html`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(html);
  } catch (error) {
    console.error('Error downloading mini site:', error);
    res.status(500).json({ error: 'Error descargando la miniweb' });
  }
};

// ─────────────────────────────────────────────
// Map de handles → imágenes de fondo Unsplash
// Fuente única de verdad: src/heroBackgrounds.mjs
// Ambas ubicaciones deben mantenerse sincronizadas.
// ─────────────────────────────────────────────
const HERO_BACKGROUNDS = {
  'milibeats': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=960&h=540&fit=crop&crop=center',
  'cafe-aroma': 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=960&h=540&fit=crop&crop=center',
  'cafearoma': 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=960&h=540&fit=crop&crop=center',
  'techfix': 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=960&h=540&fit=crop&crop=center',
  'techfixpro': 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=960&h=540&fit=crop&crop=center',
  'luna-arte': 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=960&h=540&fit=crop&crop=center',
  'lunaarte': 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=960&h=540&fit=crop&crop=center',
};
const HERO_DEFAULT = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=960&h=540&fit=crop&crop=center';

// ========== Funciones auxiliares ==========

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function buildMiniSiteHTML(workspace, config) {
  const services = Array.isArray(config.services) ? config.services.filter(Boolean).slice(0, 12) : [];
  const links = (workspace.blocks || [])
    .filter(b => b.type === 'link')
    .map(b => {
      try {
        const payload = typeof b.payload === 'string' ? JSON.parse(b.payload) : b.payload;
        return { title: b.title, url: payload?.url || '#' };
      } catch { return null; }
    })
    .filter(Boolean);

  const classifiedLinks = (workspace.blocks || [])
    .filter(b => b.type === 'classified')
    .map(b => ({
      title: b.title,
      description: b.classified?.description || '',
      category: b.classified?.category || '',
      price: b.classified?.price,
      contactUrl: b.classified ? (() => { try { return JSON.parse(b.classified.tags || '[]')[0]; } catch { return ''; } })() : ''
    }))
    .filter(Boolean);

  const whatsappUrl = config.whatsapp
    ? `https://wa.me/${config.whatsapp.replace(/\D+/g, '').slice(0, 18)}?text=${encodeURIComponent('Hola, vi tu miniweb y deseo información.')}`
    : '';
  const emailLink = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.email || '')
    ? `mailto:${encodeURIComponent(config.email)}`
    : '';

  const linkItems = links.map(l =>
    `<a href="${escapeHtml(l.url)}" class="link-item" target="_blank" rel="noopener">${escapeHtml(l.title)} <span class="arrow">↗</span></a>`
  ).join('\n          ');

  const serviceItems = services.map(s =>
    `<li>${escapeHtml(s)}</li>`
  ).join('\n            ');

  const classifiedItems = classifiedLinks.slice(0, 6).map(c =>
    `<div class="ad-card">
      <span class="ad-category">${escapeHtml(c.category)}</span>
      <h3>${escapeHtml(c.title)}</h3>
      <p>${escapeHtml(c.description || '').slice(0, 120)}</p>
      ${c.price ? `<p class="ad-price">$${Number(c.price).toFixed(2)}</p>` : ''}
    </div>`
  ).join('\n          ');

  const contactLinks = [
    whatsappUrl ? `<a href="${escapeHtml(whatsappUrl)}" class="contact-btn">WhatsApp</a>` : '',
    emailLink ? `<a href="${escapeHtml(emailLink)}" class="contact-btn">Correo</a>` : ''
  ].filter(Boolean).join('\n          ');

  const businessName = config.businessName || workspace.name || 'Miniweb';
  const description = config.description || `${businessName} · Perfil digital`;
  const siteUrl = config.primaryCtaUrl || `${workspace.handle ? `https://${workspace.handle}.enlacehub.com` : ''}`;
  const avatarUrl = workspace.avatar ? `https://avatar.enlacehub.com/${workspace.avatar}` : '';
  const year = new Date().getFullYear();
  
  // Fondo hero: usar el personalizado del usuario o el automático según handle
  const autoHeroBg = HERO_BACKGROUNDS[(workspace.handle || '').toLowerCase()];
  let heroBgUrl = config.heroImage && config.heroImage.trim() ? config.heroImage.trim() : (autoHeroBg || HERO_DEFAULT);

  // JSON-LD Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: businessName,
    description: description.slice(0, 160),
    url: siteUrl || undefined,
    image: avatarUrl || undefined,
    email: config.email || undefined,
    address: config.address ? { '@type': 'PostalAddress', streetAddress: config.address } : undefined,
    ...(config.whatsapp ? { telephone: `+${config.whatsapp.replace(/\D/g, '')}` } : {}),
    ...(Array.isArray(config.services) && config.services.length ? { makesOffer: config.services.map(s => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s } })) } : {})
  };

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(businessName)} · ${escapeHtml(config.headline || 'Perfil digital')}</title>
  
  <!-- Meta tags básicos -->
  <meta name="description" content="${escapeHtml(description.slice(0, 160))}">
  <meta name="robots" content="index, follow">
  <meta name="language" content="es">
  <link rel="canonical" href="${escapeHtml(siteUrl || `${workspace.handle ? 'https://' + workspace.handle + '.enlacehub.com' : ''}`)}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${escapeHtml(businessName)}">
  <meta property="og:title" content="${escapeHtml(businessName)} · ${escapeHtml(config.headline || 'Perfil digital')}">
  <meta property="og:description" content="${escapeHtml(description.slice(0, 160))}">
  <meta property="og:url" content="${escapeHtml(siteUrl)}">
  ${avatarUrl ? `<meta property="og:image" content="${escapeHtml(avatarUrl)}">` : ''}
  <meta property="og:locale" content="es_PY">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${escapeHtml(businessName)} · ${escapeHtml(config.headline || 'Perfil digital')}">
  <meta name="twitter:description" content="${escapeHtml(description.slice(0, 160))}">
  ${avatarUrl ? `<meta name="twitter:image" content="${escapeHtml(avatarUrl)}">` : ''}
  
  <!-- JSON-LD Structured Data -->
  <script type="application/ld+json">
  ${JSON.stringify(jsonLd, null, 2)}
  </script>
  
  <!-- Theme color para navegadores móviles -->
  <meta name="theme-color" content="#5b5bd6">
  <meta name="apple-mobile-web-app-capable" content="yes">
  
  <style>
    :root{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#172033;background:#f5f7fb;line-height:1.6}
    *{box-sizing:border-box;margin:0;padding:0}
    body{margin:0;min-height:100vh;display:flex;flex-direction:column}
    .wrap{width:min(100% - 32px,960px);margin:0 auto}
    .hero{position:relative;overflow:hidden;padding:80px 0 48px;text-align:center}
    .hero-bg{position:absolute;inset:0;background-size:cover;background-position:center;z-index:0}
    .hero-overlay{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,0.3),rgba(0,0,0,0.7));z-index:1}
    .hero > *{position:relative;z-index:2}
    .hero h1{font-size:clamp(2rem,6vw,3.5rem);line-height:1.1;margin:.2em 0;color:#fff}
    .hero .handle{color:rgba(255,255,255,0.7);font-weight:600;font-size:.95rem}
    .hero p{color:rgba(255,255,255,0.9);max-width:600px;margin:.5em auto}
    .cta-button,.contact-btn{display:inline-flex;align-items:center;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:700;transition:all .2s}
    .cta-button{background:#5b5bd6;color:#fff;font-size:1.1rem}
    .cta-button:hover{background:#4a4ac0;transform:translateY(-1px)}
    .section{padding:32px 0}
    .card{background:#fff;border:1px solid #e2e6ed;border-radius:16px;padding:24px;margin-bottom:16px}
    .card h2{margin-bottom:12px;color:#172033}
    .links{display:flex;flex-direction:column;gap:10px}
    .link-item{display:flex;justify-content:space-between;align-items:center;padding:14px 18px;background:#fff;border:1px solid #e2e6ed;border-radius:12px;text-decoration:none;color:#172033;font-weight:500;transition:all .2s}
    .link-item:hover{border-color:#5b5bd6;box-shadow:0 2px 8px rgba(91,91,214,.1)}
    .arrow{color:#5b5bd6;font-size:1.2rem}
    .services{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;list-style:none;padding:0}
    .services li{background:#f0f2f6;padding:12px 16px;border-radius:10px;text-align:center;font-weight:500}
    .ads-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px}
    .ad-card{border:1px solid #e2e6ed;border-radius:12px;padding:16px;background:#fafbfc}
    .ad-category{font-size:.78rem;font-weight:700;color:#5b5bd6;text-transform:uppercase}
    .ad-card h3{margin:8px 0 4px;font-size:1rem}
    .ad-card p{color:#667085;font-size:.9rem}
    .ad-price{font-weight:700;color:#172033;margin-top:8px}
    .contact-links{display:flex;gap:12px;flex-wrap:wrap;justify-content:center}
    .contact-btn{background:#fff;border:1px solid #dce1ea;color:#172033}
    .contact-btn:hover{background:#f5f7fb}
    footer{padding:32px 0;color:#667085;text-align:center;font-size:.9rem;margin-top:auto;border-top:1px solid #e2e6ed}
    @media(max-width:600px){.hero{padding:60px 0 36px}.hero h1{font-size:1.8rem}}
  </style>
</head>
<body>
  <main>
    <section class="hero wrap">
      <div class="hero-bg" style="background-image:url('${escapeHtml(heroBgUrl)}')"></div>
      <div class="hero-overlay"></div>
      <p class="handle">${escapeHtml(workspace.handle || '')}</p>
      <h1>${escapeHtml(config.businessName || workspace.name || 'Mi sitio')}</h1>
      <p>${escapeHtml(config.headline)}</p>
      <p>${escapeHtml(config.description)}</p>
      ${config.primaryCtaUrl ? `<div style="margin-top:20px"><a href="${escapeHtml(config.primaryCtaUrl)}" class="cta-button">${escapeHtml(config.primaryCtaLabel || 'Conocer más')}</a></div>` : ''}
    </section>

    ${linkItems.length ? `<section class="section wrap"><div class="card"><h2>Enlaces</h2><div class="links">${linkItems}</div></div></section>` : ''}

    ${serviceItems.length ? `<section class="section wrap"><div class="card"><h2>Servicios</h2><ul class="services">${serviceItems}</ul></div></section>` : ''}

    ${config.showClassifieds && classifiedItems.length ? `<section class="section wrap"><div class="card"><h2>Clasificados</h2><div class="ads-grid">${classifiedItems}</div></div></section>` : ''}

    <section class="section wrap"><div class="card" style="text-align:center">
      <h2>Contacto</h2>
      ${config.address ? `<p>${escapeHtml(config.address)}</p>` : ''}
      <div class="contact-links" style="margin-top:16px">
        ${contactLinks || '<span>Agrega tus datos de contacto en la configuración.</span>'}
      </div>
    </div></section>
  </main>
  <footer class="wrap">
    <p>&copy; ${year} ${escapeHtml(config.businessName || workspace.name || '')} &middot; Generado desde EnlaceHub</p>
  </footer>
</body>
</html>`;
}

// Las exportaciones ya están definidas con exports.* arriba
