import test from 'node:test';
import assert from 'node:assert/strict';
import {
  aggregateAnalytics,
  buildTenantUrls,
  buildTrackedUrl,
  buildWhatsAppShareUrl,
  createClassified,
  createShortLink,
  escapeHtml,
  generateStaticMiniSiteHTML,
  isClassifiedVisible,
  isLinkVisible,
  isValidHttpUrl,
  isValidSlug,
  isValidSubdomain,
  loadState,
  normalizeBaseDomain,
  normalizeSlug,
  normalizeSubdomain,
  normalizeWhatsAppNumber,
  parseTrafficAttribution,
  resolveShortLink,
  saveState,
  updateClassified,
  validateClassified
} from '../src/core.mjs';

// ========== URL Validation ==========

test('valida solo URLs HTTP y HTTPS', () => {
  assert.equal(isValidHttpUrl('https://example.com'), true);
  assert.equal(isValidHttpUrl('http://example.com/a'), true);
  assert.equal(isValidHttpUrl('javascript:alert(1)'), false);
  assert.equal(isValidHttpUrl('mailto:test@example.com'), false);
  assert.equal(isValidHttpUrl('ftp://example.com'), false);
  assert.equal(isValidHttpUrl(''), false);
});

// ========== Slug ==========

test('normaliza y valida slugs', () => {
  assert.equal(normalizeSlug(' Mi Campaña 2026 '), 'mi-campana-2026');
  assert.equal(isValidSlug('mi-campana'), true);
  assert.equal(isValidSlug('api'), false);
  assert.equal(isValidSlug('a'), false);
  assert.equal(isValidSlug(''), false);
  assert.equal(isValidSlug('admin'), false);
  assert.equal(isValidSlug('mi-campaña-especial'), true);
});

// ========== Subdomain ==========

test('normaliza, valida y genera URLs de subdominio', () => {
  assert.equal(normalizeSubdomain(' @Mi Negocio '), 'mi-negocio');
  assert.equal(isValidSubdomain('mi-negocio'), true);
  assert.equal(isValidSubdomain('admin'), false);
  assert.equal(isValidSubdomain('-incorrecto'), false);
  assert.equal(isValidSubdomain('xn--ejemplo'), false);
  const urls = buildTenantUrls({ subdomain: 'mi-negocio', baseDomain: 'enlacehub.example' });
  assert.deepEqual(urls, {
    origin: 'https://mi-negocio.enlacehub.example',
    tree: 'https://mi-negocio.enlacehub.example/',
    classifieds: 'https://mi-negocio.enlacehub.example/clasificados',
    miniSite: 'https://mi-negocio.enlacehub.example/web',
    dashboard: 'https://mi-negocio.enlacehub.example/panel'
  });
});

test('buildTenantUrls con demoFiles=true', () => {
  const urls = buildTenantUrls({ subdomain: 'test', baseDomain: 'localhost', protocol: 'http:', port: '8080', demoFiles: true });
  assert.match(urls.tree, /http:\/\/test\.localhost:8080\/index\.html/);
  assert.match(urls.classifieds, /clasificados\.html/);
});

test('normalizeBaseDomain rechaza dominios inválidos', () => {
  assert.equal(normalizeBaseDomain(''), '');
  assert.equal(normalizeBaseDomain('https://example.com'), 'example.com');
  assert.equal(normalizeBaseDomain('example.com:3000'), 'example.com');
  assert.equal(normalizeBaseDomain('a'), '');
  assert.equal(normalizeBaseDomain('.com'), '');
});

// ========== Link Visibility ==========

test('respeta estado y ventana de programación', () => {
  const now = new Date('2026-06-21T12:00:00Z');
  assert.equal(isLinkVisible({ active: true, url: 'https://example.com', startAt: '', endAt: '' }, now), true);
  assert.equal(isLinkVisible({ active: false, url: 'https://example.com', startAt: '', endAt: '' }, now), false);
  assert.equal(isLinkVisible({ active: true, url: 'https://example.com', startAt: '2026-06-22T00:00:00Z', endAt: '' }, now), false);
  assert.equal(isLinkVisible({ active: true, url: 'https://example.com', startAt: '', endAt: '2026-06-20T00:00:00Z' }, now), false);
  assert.equal(isLinkVisible({ active: true, url: '', startAt: '', endAt: '' }, now), false);
});

test('isClassifiedVisible', () => {
  const now = new Date('2026-06-21T12:00:00Z');
  assert.equal(isClassifiedVisible({ active: true, title: 'Test', contactUrl: 'https://example.com', expiresAt: '' }, now), true);
  assert.equal(isClassifiedVisible({ active: false, title: 'Test', contactUrl: 'https://example.com', expiresAt: '' }, now), false);
  assert.equal(isClassifiedVisible({ active: true, title: '', contactUrl: 'https://example.com', expiresAt: '' }, now), false);
  assert.equal(isClassifiedVisible({ active: true, title: 'Test', contactUrl: 'https://example.com', expiresAt: '2026-06-20T00:00:00Z' }, now), false);
});

// ========== Short Links ==========

test('crea y resuelve enlaces cortos sin duplicados', () => {
  const state = { shortLinks: [] };
  const item = createShortLink(state, { slug: 'Oferta Especial', url: 'https://example.com/oferta' });
  assert.equal(item.slug, 'oferta-especial');
  assert.equal(resolveShortLink(state, 'oferta-especial')?.url, 'https://example.com/oferta');
  assert.throws(() => createShortLink(state, { slug: 'oferta-especial', url: 'https://example.com/otra' }), /ya existe/i);
});

test('createShortLink con slug aleatorio', () => {
  const state = { shortLinks: [] };
  const item = createShortLink(state, { slug: '', url: 'https://example.com' });
  assert.ok(item.slug.length >= 6);
  assert.ok(item.active);
});

test('resolveShortLink devuelve null para slug inexistente', () => {
  assert.equal(resolveShortLink({ shortLinks: [] }, 'no-existe'), null);
});

// ========== Analytics ==========

test('agrega vistas, clics y visitantes', () => {
  const state = {
    events: [
      { type: 'page_view', targetId: null, visitor: 'a', at: '2026-06-21T08:00:00Z', source: '', medium: '', campaign: '' },
      { type: 'link_click', targetId: 'l1', visitor: 'a', at: '2026-06-21T08:01:00Z', source: '', medium: '', campaign: '' },
      { type: 'link_click', targetId: 'l1', visitor: 'b', at: '2026-06-21T08:02:00Z', source: '', medium: '', campaign: '' }
    ]
  };
  const metrics = aggregateAnalytics(state, 7, new Date('2026-06-21T12:00:00Z'));
  assert.deepEqual(metrics, {
    pageViews: 1,
    clicks: 2,
    uniqueVisitors: 2,
    whatsappVisits: 0,
    byTarget: { l1: 2 },
    bySource: { direct: 1 }
  });
});

test('aggregateAnalytics con eventos vacíos', () => {
  const metrics = aggregateAnalytics({ events: [] }, 30, new Date('2026-06-21T12:00:00Z'));
  assert.equal(metrics.pageViews, 0);
  assert.equal(metrics.clicks, 0);
  assert.equal(metrics.uniqueVisitors, 0);
});

test('aggregateAnalytics con atribución WhatsApp', () => {
  const state = {
    events: [
      { type: 'page_view', targetId: null, visitor: 'a', at: '2026-06-21T08:00:00Z', source: 'whatsapp', medium: 'messaging', campaign: 'c1' },
      { type: 'link_click', targetId: 'l1', visitor: 'a', at: '2026-06-21T08:01:00Z', source: 'whatsapp', medium: 'messaging', campaign: 'c1' }
    ]
  };
  const metrics = aggregateAnalytics(state, 7, new Date('2026-06-21T12:00:00Z'));
  assert.equal(metrics.whatsappVisits, 1);
  assert.equal(metrics.bySource.whatsapp, 1);
  assert.equal(metrics.clicks, 1);
  assert.equal(metrics.pageViews, 1);
});

// ========== Traffic Attribution ==========

test('parseTrafficAttribution extrae src, medium, campaign', () => {
  const att = parseTrafficAttribution('?src=whatsapp&medium=messaging&campaign=verano');
  assert.equal(att.source, 'whatsapp');
  assert.equal(att.medium, 'messaging');
  assert.equal(att.campaign, 'verano');
});

test('parseTrafficAttribution usa utm_* como fallback', () => {
  const att = parseTrafficAttribution('?utm_source=facebook&utm_medium=social&utm_campaign=2026');
  assert.equal(att.source, 'facebook');
  assert.equal(att.medium, 'social');
  assert.equal(att.campaign, '2026');
});

test('buildTrackedUrl agrega parámetros de tracking', () => {
  const url = buildTrackedUrl('https://example.com', { source: 'whatsapp', medium: 'messaging', campaign: 'test' });
  assert.match(url, /\?src=whatsapp/);
  assert.match(url, /&medium=messaging/);
  assert.match(url, /&campaign=test/);
});

// ========== WhatsApp ==========

test('normalizeWhatsAppNumber solo dígitos', () => {
  assert.equal(normalizeWhatsAppNumber('+54 11 1234-5678'), '541112345678');
  assert.equal(normalizeWhatsAppNumber(''), '');
  assert.equal(normalizeWhatsAppNumber('abc'), '');
});

test('buildWhatsAppShareUrl genera URL wa.me', () => {
  const result = buildWhatsAppShareUrl({ url: 'https://example.com', text: 'Hola', phone: '541111234567' });
  assert.match(result, /^https:\/\/wa\.me\/541111234567/);
  assert.match(result, /text=Hola/);
  assert.match(result, /example\.com/);
});

// ========== Classifieds ==========

test('validateClassified valida campos requeridos', () => {
  assert.throws(() => validateClassified({}), /título/i);
  assert.throws(() => validateClassified({ title: 'ABC', description: 'Descripción completa aquí...', category: 'Servicios', location: 'Remoto', contactUrl: 'https://example.com' }), /título.*entre 5 y 120/i);
});

test('validateClassified acepta datos válidos', () => {
  const result = validateClassified({
    title: 'Servicio de diseño web',
    description: 'Creación de sitios web responsivos con HTML, CSS y JavaScript.',
    category: 'Servicios',
    location: 'Remoto',
    contactUrl: 'https://example.com/contacto',
    price: 350,
    currency: 'USD'
  });
  assert.equal(result.title, 'Servicio de diseño web');
  assert.equal(result.category, 'Servicios');
  assert.equal(result.price, 350);
});

test('createClassified y updateClassified', () => {
  const state = { classifieds: [] };
  const item = createClassified(state, {
    title: 'Nuevo servicio',
    description: 'Descripción detallada del servicio ofrecido.',
    category: 'Servicios',
    location: 'Remoto',
    contactUrl: 'https://example.com',
    price: 100
  });
  assert.ok(item.id.startsWith('ad_'));
  assert.equal(state.classifieds.length, 1);

  const updated = updateClassified(state, item.id, {
    title: 'Servicio actualizado',
    description: 'Nueva descripción del servicio actualizado.',
    category: 'Servicios',
    location: 'Presencial',
    contactUrl: 'https://example.com/new',
    price: 150
  });
  assert.equal(updated.title, 'Servicio actualizado');
  assert.equal(updated.price, 150);
});

// ========== HTML Escaping ==========

test('escapeHtml escapa caracteres peligrosos', () => {
  assert.equal(escapeHtml('<script>alert("xss")</script>'), '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  assert.equal(escapeHtml('texto normal'), 'texto normal');
  assert.equal(escapeHtml(''), '');
});

// ========== MiniSite HTML Generator ==========

test('generateStaticMiniSiteHTML genera HTML válido', () => {
  const html = generateStaticMiniSiteHTML({
    profile: { name: 'Test', handle: '@test' },
    miniSite: { businessName: 'Test Business', headline: 'Headline', description: 'Desc', published: true, services: ['S1', 'S2'], primaryCtaLabel: 'CTA', primaryCtaUrl: 'https://example.com' }
  });
  assert.match(html, /<html lang="es">/);
  assert.match(html, /Test Business/);
  assert.match(html, /Headline/);
  assert.match(html, /S1.*S2/);
  assert.match(html, /CTA/);
});

// ========== State Management ==========

test('loadState y saveState con mock', () => {
  const storage = {};
  const mockStorage = {
    getItem(key) { return storage[key] || null; },
    setItem(key, val) { storage[key] = val; }
  };
  const state = loadState(mockStorage);
  assert.ok(state.profile);
  assert.ok(Array.isArray(state.links));
  assert.ok(Array.isArray(state.classifieds));

  state.profile.name = 'Nombre Actualizado';
  const saved = saveState(state, mockStorage);
  assert.equal(saved.profile.name, 'Nombre Actualizado');
});
