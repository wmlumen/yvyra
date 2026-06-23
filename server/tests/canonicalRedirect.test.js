const test = require('node:test');
const assert = require('node:assert/strict');

const { buildCanonicalRedirectUrl } = require('../middleware/canonicalRedirect');

test('redirige de http a https en el dominio canónico', () => {
  const target = buildCanonicalRedirectUrl({
    headers: { host: 'enlacehub.com', 'x-forwarded-proto': 'http' },
    secure: false,
    originalUrl: '/clasificados.html'
  }, new URL('https://enlacehub.com'));

  assert.equal(target, 'https://enlacehub.com/clasificados.html');
});

test('redirige www al host canónico configurado', () => {
  const target = buildCanonicalRedirectUrl({
    headers: { host: 'www.enlacehub.com', 'x-forwarded-proto': 'https' },
    secure: true,
    originalUrl: '/miniweb.html?tenant=demo'
  }, new URL('https://enlacehub.com'));

  assert.equal(target, 'https://enlacehub.com/miniweb.html?tenant=demo');
});

test('fuerza https en subdominios públicos', () => {
  const target = buildCanonicalRedirectUrl({
    headers: { host: 'acme.enlacehub.com', 'x-forwarded-proto': 'http' },
    secure: false,
    originalUrl: '/profile.html'
  }, new URL('https://enlacehub.com'));

  assert.equal(target, 'https://acme.enlacehub.com/profile.html');
});

test('no redirige cuando la URL ya es canónica', () => {
  const target = buildCanonicalRedirectUrl({
    headers: { host: 'enlacehub.com', 'x-forwarded-proto': 'https' },
    secure: true,
    originalUrl: '/'
  }, new URL('https://enlacehub.com'));

  assert.equal(target, null);
});
