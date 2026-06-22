const test = require('node:test');
const assert = require('node:assert/strict');
const {
  safeJsonParse,
  parseBlockPayload,
  parseMiniSite,
  stringifyPayload
} = require('../lib/utils');

test('safeJsonParse parsa JSON válido', () => {
  assert.deepEqual(safeJsonParse('{"a":1}'), { a: 1 });
  assert.deepEqual(safeJsonParse('[1,2,3]'), [1, 2, 3]);
});

test('safeJsonParse devuelve fallback para inválido', () => {
  assert.equal(safeJsonParse('not-json'), null);
  assert.equal(safeJsonParse(''), null);
  assert.equal(safeJsonParse(null), null);
  assert.equal(safeJsonParse(undefined), null);
  assert.deepEqual(safeJsonParse('bad', {}), {});
});

test('parseBlockPayload parsea payload string a objeto', () => {
  const block = { id: '1', payload: '{"url":"https://example.com"}', classified: null };
  const result = parseBlockPayload(block);
  assert.deepEqual(result.payload, { url: 'https://example.com' });
});

test('parseBlockPayload parsea classified.tags si existe', () => {
  const block = {
    id: '2',
    payload: '{}',
    classified: { tags: '["tag1","tag2"]' }
  };
  const result = parseBlockPayload(block);
  assert.deepEqual(result.classified.tags, ['tag1', 'tag2']);
});

test('parseBlockPayload maneja payload no string', () => {
  const block = { id: '3', payload: { url: 'https://example.com' } };
  const result = parseBlockPayload(block);
  assert.deepEqual(result.payload, { url: 'https://example.com' });
});

test('parseBlockPayload devuelve null si input es null', () => {
  assert.equal(parseBlockPayload(null), null);
});

test('parseMiniSite parsea miniSite string a objeto', () => {
  const ws = { id: '1', miniSite: '{"headline":"Test"}' };
  const result = parseMiniSite(ws);
  assert.deepEqual(result.miniSite, { headline: 'Test' });
});

test('parseMiniSite no modifica si miniSite ya es objeto', () => {
  const ws = { id: '1', miniSite: { headline: 'Test' } };
  const result = parseMiniSite(ws);
  assert.deepEqual(result.miniSite, { headline: 'Test' });
});

test('parseMiniSite devuelve null si input es null', () => {
  assert.equal(parseMiniSite(null), null);
});

test('stringifyPayload convierte objeto a string', () => {
  assert.equal(stringifyPayload({ a: 1 }), '{"a":1}');
});

test('stringifyPayload devuelve string si ya es string', () => {
  assert.equal(stringifyPayload('{"a":1}'), '{"a":1}');
});

test('stringifyPayload maneja null/undefined', () => {
  assert.equal(stringifyPayload(null), '{}');
  assert.equal(stringifyPayload(undefined), '{}');
});
