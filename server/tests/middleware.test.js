const test = require('node:test');
const assert = require('node:assert/strict');

// Pruebas para funciones de validación (sin necesidad de servidor)
const { sanitize, isValidHttpUrl, isValidEmail } = require('../middleware/validate');

test('sanitize elimina scripts', () => {
  const result = sanitize('<script>alert("xss")</script>Hola');
  assert.equal(result, 'Hola');
});

test('sanitize elimina manejadores de eventos', () => {
  const result = sanitize('Click <img src=x onerror=alert(1)>');
  assert.equal(result, 'Click');
});

test('sanitize elimina javascript: URLs', () => {
  const result = sanitize('javascript:alert(1)');
  assert.equal(result.includes('javascript:'), false);
});

test('sanitize limita longitud', () => {
  const longStr = 'a'.repeat(2000);
  const result = sanitize(longStr, 100);
  assert.equal(result.length, 100);
});

test('isValidHttpUrl acepta http y https', () => {
  assert.equal(isValidHttpUrl('https://example.com'), true);
  assert.equal(isValidHttpUrl('http://example.com'), true);
  assert.equal(isValidHttpUrl('ftp://example.com'), false);
  assert.equal(isValidHttpUrl(''), false);
});

test('isValidEmail válido', () => {
  assert.equal(isValidEmail('test@example.com'), true);
  assert.equal(isValidEmail('not-an-email'), false);
  assert.equal(isValidEmail(''), false);
});
