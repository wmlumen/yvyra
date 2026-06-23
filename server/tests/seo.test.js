const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildStaticUrls,
  buildTenantUrls,
  buildSitemapXml,
  buildRobotsTxt
} = require('../routes/seo');

test('buildStaticUrls incluye las superficies públicas clave', () => {
  const urls = buildStaticUrls('https://enlacehub.example');
  const locs = urls.map((item) => item.loc);

  assert.ok(locs.includes('https://enlacehub.example/'));
  assert.ok(locs.includes('https://enlacehub.example/profile.html'));
  assert.ok(locs.includes('https://enlacehub.example/clasificados.html'));
  assert.ok(locs.includes('https://enlacehub.example/miniweb.html'));
});

test('buildTenantUrls genera URLs indexables por tenant', () => {
  const urls = buildTenantUrls('https://enlacehub.example', [
    { hostname: 'acme', workspace: { updatedAt: new Date('2026-06-23T10:00:00Z') } }
  ]);

  const locs = urls.map((item) => item.loc);
  assert.deepEqual(locs, [
    'https://acme.enlacehub.example/profile.html',
    'https://acme.enlacehub.example/clasificados.html',
    'https://acme.enlacehub.example/miniweb.html'
  ]);
  assert.equal(urls[0].lastmod, '2026-06-23T10:00:00.000Z');
});

test('buildSitemapXml incorpora loc, lastmod y changefreq', () => {
  const xml = buildSitemapXml([
    {
      loc: 'https://enlacehub.example/profile.html',
      lastmod: '2026-06-23T10:00:00.000Z',
      changefreq: 'daily',
      priority: '0.9'
    }
  ]);

  assert.match(xml, /<loc>https:\/\/enlacehub\.example\/profile\.html<\/loc>/);
  assert.match(xml, /<lastmod>2026-06-23T10:00:00.000Z<\/lastmod>/);
  assert.match(xml, /<changefreq>daily<\/changefreq>/);
  assert.match(xml, /<priority>0.9<\/priority>/);
});

test('buildRobotsTxt protege áreas privadas del dominio principal', () => {
  const robots = buildRobotsTxt({ baseUrl: 'https://enlacehub.example', isSubdomain: false });

  assert.match(robots, /Disallow: \/login\.html/);
  assert.match(robots, /Disallow: \/superadmin\.html/);
  assert.match(robots, /Sitemap: https:\/\/enlacehub\.example\/sitemap\.xml/);
});

test('buildRobotsTxt permite rastreo total en subdominios públicos', () => {
  const robots = buildRobotsTxt({ baseUrl: 'https://enlacehub.example', isSubdomain: true });

  assert.match(robots, /Allow: \//);
  assert.doesNotMatch(robots, /Disallow: \/login\.html/);
});
