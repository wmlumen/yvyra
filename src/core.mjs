export const STORAGE_KEY = 'enlacehub:v2';

export const RESERVED_SLUGS = new Set([
  'admin', 'api', 'dashboard', 'login', 'logout', 'signup', 'settings',
  'analytics', 'shortener', 'classifieds', 'clasificados', 'assets', 'src',
  'tests', 'help', 'support', 'miniweb', 'website', 'whatsapp'
]);

export const RESERVED_SUBDOMAINS = new Set([
  ...RESERVED_SLUGS,
  'www', 'app', 'mail', 'email', 'ftp', 'cdn', 'static', 'status', 'billing',
  'docs', 'blog', 'store', 'shop', 'marketplace', 'root', 'system', 'security'
]);

export const CLASSIFIED_CATEGORIES = [
  'Servicios', 'Empleo', 'Hogar', 'Tecnología', 'Vehículos', 'Otros'
];

export const CLASSIFIED_KINDS = [
  { value: 'classified', label: 'Clasificado tradicional' },
  { value: 'need', label: 'Bolsa de necesidades' },
  { value: 'promo', label: 'Promocion o cupon' },
  { value: 'donation', label: 'Donacion' },
  { value: 'event', label: 'Evento' },
  { value: 'product', label: 'Producto' },
  { value: 'service', label: 'Servicio' }
];

export const DEFAULT_MINI_SITE = {
  published: true,
  businessName: 'Orlando Velez',
  headline: 'Soluciones digitales sencillas para personas y pequeños negocios',
  description: 'Conoce mis servicios, revisa mis clasificados y comunícate directamente conmigo.',
  services: ['Árbol de enlaces', 'Página web básica', 'Publicación de clasificados'],
  whatsapp: '',
  email: 'orlandocv24@vetdimail.com',
  address: 'Atención remota',
  primaryCtaLabel: 'Ver mi árbol de enlaces',
  primaryCtaUrl: 'index.html',
  showClassifieds: true
};

export const DEFAULT_STATE = {
  profile: {
    name: 'Orlando Velez',
    handle: '@orlandocv24',
    bio: 'Proyectos, recursos y formas de contacto en un solo lugar.',
    avatar: 'OV',
    theme: 'clean',
    subdomain: 'orlando'
  },
  miniSite: DEFAULT_MINI_SITE,
  links: [
    {
      id: 'l1',
      title: 'Mi sitio principal',
      url: 'https://example.com',
      active: true,
      startAt: '',
      endAt: ''
    },
    {
      id: 'l2',
      title: 'Escríbeme por correo',
      url: 'https://example.com/contacto',
      active: true,
      startAt: '',
      endAt: ''
    },
    {
      id: 'l3',
      title: 'Proyecto destacado',
      url: 'https://example.com/proyecto',
      active: true,
      startAt: '',
      endAt: ''
    }
  ],
  classifieds: [
    {
      id: 'ad_1',
      title: 'Diseño de página web para pequeños negocios',
      description: 'Servicio de diseño responsive con estructura clara, formulario de contacto y configuración inicial.',
      category: 'Servicios',
      price: 350000,
      currency: 'PYG',
      location: 'Remoto',
      contactUrl: 'https://example.com/contacto?anuncio=web',
      imageUrl: '',
      active: true,
      featured: true,
      createdAt: '2026-06-21T08:00:00.000Z',
      expiresAt: ''
    },
    {
      id: 'ad_2',
      title: 'Laptop reacondicionada para estudio',
      description: 'Equipo revisado, almacenamiento SSD y cargador incluido. Publicación demostrativa.',
      category: 'Tecnología',
      price: 280000,
      currency: 'PYG',
      location: 'Entrega coordinada',
      contactUrl: 'https://example.com/contacto?anuncio=laptop',
      imageUrl: '',
      active: true,
      featured: false,
      createdAt: '2026-06-20T10:00:00.000Z',
      expiresAt: ''
    },
    {
      id: 'ad_3',
      title: 'Apoyo administrativo por horas',
      description: 'Organización de documentos, hojas de cálculo y seguimiento de tareas para profesionales.',
      category: 'Empleo',
      price: 15,
      currency: 'USD',
      location: 'Remoto',
      contactUrl: 'https://example.com/contacto?anuncio=asistencia',
      imageUrl: '',
      active: true,
      featured: false,
      createdAt: '2026-06-19T14:00:00.000Z',
      expiresAt: ''
    }
  ],
  shortLinks: [],
  events: []
};

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function loadState(storage = globalThis.localStorage) {
  if (!storage) return clone(DEFAULT_STATE);
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = clone(DEFAULT_STATE);
      storage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return normalizeState(JSON.parse(raw));
  } catch {
    return clone(DEFAULT_STATE);
  }
}

export function saveState(state, storage = globalThis.localStorage) {
  const normalized = normalizeState(state);
  storage?.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function normalizeState(input) {
  const state = input && typeof input === 'object' ? input : {};
  return {
    profile: {
      ...DEFAULT_STATE.profile,
      ...(state.profile && typeof state.profile === 'object' ? state.profile : {}),
      subdomain: getSafeSubdomain(
        state.profile?.subdomain
          || state.profile?.handle
          || state.profile?.name,
        DEFAULT_STATE.profile.subdomain
      )
    },
    miniSite: {
      ...DEFAULT_MINI_SITE,
      ...(state.miniSite && typeof state.miniSite === 'object' ? state.miniSite : {}),
      services: Array.isArray(state.miniSite?.services)
        ? state.miniSite.services.map((item) => String(item).trim()).filter(Boolean).slice(0, 12)
        : clone(DEFAULT_MINI_SITE.services)
    },
    links: Array.isArray(state.links) ? state.links : [],
    classifieds: Array.isArray(state.classifieds) ? state.classifieds : clone(DEFAULT_STATE.classifieds),
    shortLinks: Array.isArray(state.shortLinks) ? state.shortLinks : [],
    events: Array.isArray(state.events) ? state.events : []
  };
}

export function isValidHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function normalizeSlug(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

export function isValidSlug(value) {
  const slug = normalizeSlug(value);
  return slug.length >= 3 && slug.length <= 48 && !RESERVED_SLUGS.has(slug);
}

export function normalizeSubdomain(value) {
  return normalizeSlug(String(value ?? '').replace(/^@+/, '')).slice(0, 48);
}

export function isValidSubdomain(value) {
  const raw = String(value ?? '').trim().toLowerCase();
  const label = normalizeSubdomain(raw);
  return raw === label
    && label.length >= 3
    && label.length <= 48
    && !RESERVED_SUBDOMAINS.has(label)
    && !label.startsWith('xn--')
    && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label);
}

export function getSafeSubdomain(value, fallback = 'usuario') {
  const candidate = normalizeSubdomain(value);
  if (isValidSubdomain(candidate)) return candidate;
  const safeFallback = normalizeSubdomain(fallback);
  return isValidSubdomain(safeFallback) ? safeFallback : 'usuario';
}

export function normalizeBaseDomain(value) {
  const domain = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/:\d+$/, '')
    .replace(/^\.+|\.+$/g, '');
  if (!domain || domain.length > 253) return '';
  const labels = domain.split('.');
  if (labels.length < 2 && domain !== 'localhost') return '';
  if (!labels.every((label) => /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label))) return '';
  return domain;
}

export function buildTenantUrls({
  subdomain,
  baseDomain = 'enlacehub.example',
  protocol = 'https:',
  port = '',
  demoFiles = false
} = {}) {
  const label = normalizeSubdomain(subdomain);
  const domain = normalizeBaseDomain(baseDomain);
  if (!isValidSubdomain(label)) throw new Error('El subdominio no es válido o está reservado.');
  if (!domain) throw new Error('El dominio base no es válido.');
  const normalizedProtocol = protocol === 'http:' ? 'http:' : 'https:';
  const normalizedPort = String(port ?? '').replace(/[^0-9]/g, '').slice(0, 5);
  const authority = `${label}.${domain}${normalizedPort ? `:${normalizedPort}` : ''}`;
  const origin = `${normalizedProtocol}//${authority}`;
  return {
    origin,
    tree: demoFiles ? `${origin}/index.html` : `${origin}/`,
    classifieds: demoFiles ? `${origin}/clasificados.html` : `${origin}/clasificados`,
    miniSite: demoFiles ? `${origin}/miniweb.html` : `${origin}/web`,
    dashboard: demoFiles ? `${origin}/dashboard.html` : `${origin}/panel`
  };
}

export function makeId(prefix = 'id') {
  const random = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
  return `${prefix}_${random}`;
}

export function isLinkVisible(link, now = new Date()) {
  if (!link?.active || !isValidHttpUrl(link.url)) return false;
  const timestamp = now.getTime();
  if (link.startAt) {
    const start = new Date(link.startAt).getTime();
    if (Number.isFinite(start) && timestamp < start) return false;
  }
  if (link.endAt) {
    const end = new Date(link.endAt).getTime();
    if (Number.isFinite(end) && timestamp > end) return false;
  }
  return true;
}

export function isClassifiedVisible(item, now = new Date()) {
  if (!item?.active || !item.title?.trim() || !isValidHttpUrl(item.contactUrl)) return false;
  if (!item.expiresAt) return true;
  const expiry = new Date(item.expiresAt).getTime();
  return !Number.isFinite(expiry) || now.getTime() <= expiry;
}

export function validateClassified(input) {
  const title = String(input?.title ?? '').trim();
  const description = String(input?.description ?? '').trim();
  const category = String(input?.category ?? '').trim();
  const location = String(input?.location ?? '').trim();
  const contactUrl = String(input?.contactUrl ?? '').trim();
  const imageUrl = String(input?.imageUrl ?? '').trim();
  const rawPrice = input?.price;
  const price = rawPrice === '' || rawPrice === null || rawPrice === undefined ? null : Number(rawPrice);

  if (title.length < 5 || title.length > 120) throw new Error('El título debe tener entre 5 y 120 caracteres.');
  if (description.length < 15 || description.length > 1000) throw new Error('La descripción debe tener entre 15 y 1000 caracteres.');
  if (!CLASSIFIED_CATEGORIES.includes(category)) throw new Error('Selecciona una categoría válida.');
  if (!isValidHttpUrl(contactUrl)) throw new Error('El enlace de contacto debe usar http:// o https://.');
  if (imageUrl && !isValidHttpUrl(imageUrl)) throw new Error('La imagen debe usar una URL http:// o https://.');
  if (price !== null && (!Number.isFinite(price) || price < 0 || price > 100000000)) throw new Error('El precio no es válido.');

  return {
    title,
    description,
    category,
    price,
    currency: String(input?.currency ?? 'PYG').trim().toUpperCase().slice(0, 3) || 'PYG',
    location: location.slice(0, 120),
    contactUrl,
    imageUrl,
    active: Boolean(input?.active),
    featured: Boolean(input?.featured),
    expiresAt: String(input?.expiresAt ?? '')
  };
}

export function createClassified(state, input, now = new Date()) {
  if (!Array.isArray(state.classifieds)) state.classifieds = [];
  const item = {
    id: makeId('ad'),
    ...validateClassified(input),
    createdAt: now.toISOString()
  };
  state.classifieds.unshift(item);
  return item;
}

export function updateClassified(state, id, input) {
  const index = state.classifieds.findIndex((item) => item.id === id);
  if (index < 0) throw new Error('El anuncio no existe.');
  const current = state.classifieds[index];
  state.classifieds[index] = {
    ...current,
    ...validateClassified(input),
    id: current.id,
    createdAt: current.createdAt
  };
  return state.classifieds[index];
}

export function normalizeTrafficValue(value, fallback = '') {
  return String(value ?? fallback)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function parseTrafficAttribution(search = globalThis.location?.search ?? '') {
  const params = search instanceof URLSearchParams ? search : new URLSearchParams(String(search).replace(/^\?/, ''));
  return {
    source: normalizeTrafficValue(params.get('src') || params.get('utm_source')),
    medium: normalizeTrafficValue(params.get('medium') || params.get('utm_medium')),
    campaign: normalizeTrafficValue(params.get('campaign') || params.get('utm_campaign'))
  };
}

export function buildTrackedUrl(baseUrl, { source = 'whatsapp', medium = 'messaging', campaign = 'general' } = {}) {
  const url = new URL(baseUrl);
  const normalizedSource = normalizeTrafficValue(source, 'direct');
  const normalizedMedium = normalizeTrafficValue(medium, 'referral');
  const normalizedCampaign = normalizeTrafficValue(campaign, 'general');
  if (normalizedSource) url.searchParams.set('src', normalizedSource);
  if (normalizedMedium) url.searchParams.set('medium', normalizedMedium);
  if (normalizedCampaign) url.searchParams.set('campaign', normalizedCampaign);
  return url.toString();
}

export function normalizeWhatsAppNumber(value) {
  return String(value ?? '').replace(/\D+/g, '').slice(0, 18);
}

export function buildWhatsAppShareUrl({ url = '', text = '', phone = '' } = {}) {
  const message = [String(text).trim(), String(url).trim()].filter(Boolean).join('\n\n');
  const number = normalizeWhatsAppNumber(phone);
  const base = number ? `https://wa.me/${number}` : 'https://wa.me/';
  return `${base}?text=${encodeURIComponent(message)}`;
}

export function recordEvent(state, type, targetId = null, at = new Date(), metadata = {}) {
  if (!Array.isArray(state.events)) state.events = [];
  const attribution = {
    source: normalizeTrafficValue(metadata.source),
    medium: normalizeTrafficValue(metadata.medium),
    campaign: normalizeTrafficValue(metadata.campaign)
  };
  const event = {
    id: makeId('event'),
    type,
    targetId,
    at: at.toISOString(),
    visitor: getOrCreateVisitorId(),
    ...attribution
  };
  state.events.push(event);
  if (state.events.length > 5000) state.events = state.events.slice(-5000);
  return event;
}

export function getOrCreateVisitorId(storage = globalThis.sessionStorage) {
  const key = 'enlacehub:visitor';
  try {
    let id = storage?.getItem(key);
    if (!id) {
      id = makeId('visitor');
      storage?.setItem(key, id);
    }
    return id;
  } catch {
    return 'visitor_local';
  }
}

export function aggregateAnalytics(state, days = 30, now = new Date()) {
  const since = new Date(now);
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - Math.max(0, days - 1));
  const relevant = (state.events ?? []).filter((event) => {
    const time = new Date(event.at).getTime();
    return Number.isFinite(time) && time >= since.getTime() && time <= now.getTime();
  });
  const pageViews = relevant.filter((event) => ['page_view', 'classified_page_view', 'mini_site_view'].includes(event.type));
  const clicks = relevant.filter((event) => ['link_click', 'short_click', 'classified_contact', 'mini_site_cta', 'whatsapp_share'].includes(event.type));
  const uniqueVisitors = new Set(relevant.map((event) => event.visitor).filter(Boolean)).size;
  const byTarget = {};
  const bySource = {};
  for (const event of clicks) {
    const key = event.targetId ?? 'unknown';
    byTarget[key] = (byTarget[key] ?? 0) + 1;
  }
  for (const event of pageViews) {
    const source = normalizeTrafficValue(event.source, 'direct') || 'direct';
    bySource[source] = (bySource[source] ?? 0) + 1;
  }
  return {
    pageViews: pageViews.length,
    clicks: clicks.length,
    uniqueVisitors,
    whatsappVisits: bySource.whatsapp ?? 0,
    byTarget,
    bySource
  };
}

export function createShortLink(state, { slug, url }) {
  const normalized = normalizeSlug(slug || randomSlug());
  if (!isValidSlug(normalized)) throw new Error('El slug debe tener entre 3 y 48 caracteres y no estar reservado.');
  if (!isValidHttpUrl(url)) throw new Error('La URL debe comenzar con http:// o https://.');
  if (state.shortLinks.some((item) => item.slug === normalized)) throw new Error('Ese slug ya existe.');
  const item = {
    id: makeId('short'),
    slug: normalized,
    url,
    active: true,
    createdAt: new Date().toISOString()
  };
  state.shortLinks.unshift(item);
  return item;
}

export function randomSlug() {
  return Math.random().toString(36).slice(2, 9);
}

export function resolveShortLink(state, slug) {
  const normalized = normalizeSlug(slug);
  return state.shortLinks.find((item) => item.slug === normalized && item.active && isValidHttpUrl(item.url)) ?? null;
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function generateStaticMiniSiteHTML({ profile = {}, miniSite = {}, classifieds = [], treeUrl = '' } = {}) {
  const site = { ...DEFAULT_MINI_SITE, ...miniSite };
  const services = Array.isArray(site.services) ? site.services.filter(Boolean).slice(0, 12) : [];
  const visibleClassifieds = site.showClassifieds
    ? classifieds.filter((item) => isClassifiedVisible(item)).slice(0, 6)
    : [];
  const ctaUrl = isValidHttpUrl(site.primaryCtaUrl)
    ? site.primaryCtaUrl
    : (isValidHttpUrl(treeUrl) ? treeUrl : '#');
  const whatsappUrl = site.whatsapp
    ? buildWhatsAppShareUrl({
      phone: site.whatsapp,
      text: `Hola, vi la página de ${site.businessName || profile.name || 'tu negocio'} y deseo información.`
    })
    : '';
  const emailLink = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(site.email || '')
    ? `mailto:${encodeURIComponent(site.email)}`
    : '';
  const serviceHtml = services.map((service) => `<li>${escapeHtml(service)}</li>`).join('');
  const classifiedHtml = visibleClassifieds.map((item) => `
        <article class="ad">
          <span>${escapeHtml(item.category)}</span>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.description)}</p>
          <a href="${escapeHtml(item.contactUrl)}" rel="noopener noreferrer nofollow">Consultar</a>
        </article>`).join('');
  const contactLinks = [
    whatsappUrl ? `<a href="${escapeHtml(whatsappUrl)}">WhatsApp</a>` : '',
    emailLink ? `<a href="${escapeHtml(emailLink)}">Correo</a>` : ''
  ].filter(Boolean).join('');

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escapeHtml(site.description)}">
  <title>${escapeHtml(site.businessName || profile.name || 'Mi sitio')}</title>
  <style>
    :root{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#172033;background:#f5f7fb;line-height:1.6}
    *{box-sizing:border-box}body{margin:0}.wrap{width:min(100% - 32px,960px);margin:auto}.hero{padding:72px 0 42px}.eyebrow{font-weight:800;color:#5b5bd6}.hero h1{font-size:clamp(2.3rem,8vw,4.8rem);line-height:1.02;margin:.2em 0}.hero p{max-width:680px;color:#5f6878;font-size:1.08rem}.actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:24px}.button,.contacts a,.ad a{display:inline-flex;padding:12px 18px;border-radius:12px;text-decoration:none;font-weight:800;border:1px solid #dce1ea;color:#172033;background:#fff}.button.primary{background:#5b5bd6;color:#fff;border-color:#5b5bd6}.section{padding:32px 0}.panel{background:#fff;border:1px solid #dce1ea;border-radius:22px;padding:24px;box-shadow:0 16px 50px rgba(30,41,59,.08)}.services{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px;padding:0;list-style:none}.services li,.ad{border:1px solid #e2e6ed;border-radius:16px;padding:18px;background:#fff}.ads{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px}.ad span{font-size:.78rem;font-weight:800;color:#5b5bd6}.ad h3{margin:.5rem 0}.ad p{color:#667085}.contacts{display:flex;gap:10px;flex-wrap:wrap}footer{padding:36px 0;color:#667085}@media(max-width:600px){.hero{padding-top:44px}}
  </style>
</head>
<body>
  <main>
    <section class="hero wrap">
      <p class="eyebrow">${escapeHtml(profile.handle || 'Página oficial')}</p>
      <h1>${escapeHtml(site.businessName || profile.name || 'Mi sitio')}</h1>
      <h2>${escapeHtml(site.headline)}</h2>
      <p>${escapeHtml(site.description)}</p>
      <div class="actions">
        <a class="button primary" href="${escapeHtml(ctaUrl)}">${escapeHtml(site.primaryCtaLabel || 'Conocer más')}</a>
        ${whatsappUrl ? `<a class="button" href="${escapeHtml(whatsappUrl)}">Escribir por WhatsApp</a>` : ''}
      </div>
    </section>
    ${services.length ? `<section class="section wrap"><div class="panel"><h2>Servicios</h2><ul class="services">${serviceHtml}</ul></div></section>` : ''}
    ${visibleClassifieds.length ? `<section class="section wrap"><h2>Clasificados destacados</h2><div class="ads">${classifiedHtml}</div></section>` : ''}
    <section class="section wrap"><div class="panel"><h2>Contacto</h2><p>${escapeHtml(site.address)}</p><div class="contacts">${contactLinks || '<span>Agrega tus datos de contacto.</span>'}</div></div></section>
  </main>
  <footer class="wrap">Sitio HTML básico generado desde el árbol de enlaces.</footer>
</body>
</html>`;
}
