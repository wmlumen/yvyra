const test = require('node:test');
const assert = require('node:assert/strict');

// Pruebas para funciones de validación (sin necesidad de servidor)
const { sanitize, requiredString, isValidHttpUrl, isValidEmail } = require('../middleware/validate');

test('sanitize elimina scripts completos', () => {
  assert.equal(sanitize('<script>alert("xss")</script>Hola'), 'Hola');
});

test('sanitize elimina etiquetas con manejadores de eventos', () => {
  const result = sanitize('<img src=x onerror=alert(1)>');
  assert.equal(result.includes('onerror'), false);
  assert.equal(result.includes('<img'), false);
});

test('sanitize elimina javascript: URLs', () => {
  const result = sanitize('javascript:alert(1)');
  assert.equal(result.includes('javascript:'), false);
});

test('sanitize limita longitud por defecto a 1000', () => {
  const longStr = 'a'.repeat(2000);
  const result = sanitize(longStr);
  assert.equal(result.length, 1000);
});

test('sanitize respeta maxLength personalizado', () => {
  const longStr = 'a'.repeat(2000);
  const result = sanitize(longStr, 100);
  assert.equal(result.length, 100);
});

test('sanitize devuelve el mismo valor si no es string', () => {
  assert.equal(sanitize(123), 123);
  assert.equal(sanitize(null), null);
  assert.equal(sanitize(undefined), undefined);
});

test('requiredString lanza error si está vacío', () => {
  assert.throws(() => requiredString('', 'campo'), /campo es requerido/i);
  assert.throws(() => requiredString('   ', 'campo'), /campo es requerido/i);
  assert.throws(() => requiredString(null, 'campo'), /campo es requerido/i);
  assert.throws(() => requiredString(undefined, 'campo'), /campo es requerido/i);
});

test('requiredString sanitiza y recorta', () => {
  assert.equal(requiredString('  Hola <script>malo</script>  ', 'campo'), 'Hola');
});

test('isValidHttpUrl acepta http y https', () => {
  assert.equal(isValidHttpUrl('https://example.com'), true);
  assert.equal(isValidHttpUrl('http://example.com/path?a=1'), true);
  assert.equal(isValidHttpUrl('ftp://example.com'), false);
  assert.equal(isValidHttpUrl('javascript:void(0)'), false);
  assert.equal(isValidHttpUrl(''), false);
  assert.equal(isValidHttpUrl('not-a-url'), false);
});

test('isValidEmail válido', () => {
  assert.equal(isValidEmail('test@example.com'), true);
  assert.equal(isValidEmail('user+tag@domain.co'), true);
  assert.equal(isValidEmail('not-an-email'), false);
  assert.equal(isValidEmail(''), false);
  assert.equal(isValidEmail('@domain.com'), false);
});
