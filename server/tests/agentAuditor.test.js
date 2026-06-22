const test = require('node:test');
const assert = require('node:assert/strict');
const { audit } = require('../services/agentAuditor');

test('audit asigna EXCELLENT cuando todos los pasos pasan', () => {
  const steps = [
    { step: 1, type: 'create_block', result: { success: true, result: { id: '1', title: 'Test' } } },
    { step: 2, type: 'audit_check', result: { success: true, result: { health: 'ok', issues: [] } } }
  ];
  const result = audit(steps);
  assert.equal(result.verdict, 'EXCELLENT');
  assert.equal(result.score, 100);
  assert.equal(result.details.length, 2);
});

test('audit asigna GOOD cuando al menos 80% pasan', () => {
  const steps = [
    { step: 1, type: 'create_block', result: { success: true, result: { id: '1', title: 'Test' } } },
    { step: 2, type: 'create_block', result: { success: true, result: { id: '2', title: 'Test 2' } } },
    { step: 3, type: 'create_block', result: { success: true, result: { id: '3', title: 'Test 3' } } },
    { step: 4, type: 'create_block', result: { success: true, result: { id: '4', title: 'Test 4' } } },
    { step: 5, type: 'delete_block', result: { success: false, result: 'Bloque no encontrado' } }
  ];
  const result = audit(steps);
  assert.equal(result.verdict, 'GOOD');
  assert.equal(result.score, 80);
});

test('audit asigna FAIR cuando entre 50-79% pasan', () => {
  const steps = [
    { step: 1, type: 'create_block', result: { success: true, result: { id: '1' } } },
    { step: 2, type: 'create_block', result: { success: true, result: { id: '2' } } },
    { step: 3, type: 'delete_block', result: { success: false, result: 'Error' } }
  ];
  const result = audit(steps);
  assert.equal(result.verdict, 'FAIR');
  assert.equal(result.score, 67);
});

test('audit asigna POOR cuando menos de 50% pasan', () => {
  const steps = [
    { step: 1, type: 'create_block', result: { success: false, result: 'Error BD' } },
    { step: 2, type: 'create_block', result: { success: false, result: 'Error red' } },
    { step: 3, type: 'audit_check', result: { success: false, result: 'Timeout' } }
  ];
  const result = audit(steps);
  assert.equal(result.verdict, 'POOR');
  assert.equal(result.score, 0);
});

test('audit devuelve detalles descriptivos para create_block exitoso', () => {
  const steps = [
    { step: 1, type: 'create_block', result: { success: true, result: { id: 'abc', title: 'Mi enlace' } } }
  ];
  const result = audit(steps);
  assert.ok(result.details[0].note.includes('Mi enlace'));
  assert.ok(result.details[0].note.includes('abc'));
  assert.equal(result.details[0].status, 'passed');
});

test('audit devuelve detalles para fallo', () => {
  const steps = [
    { step: 1, type: 'create_block', result: { success: false, result: 'Error de conexión' } }
  ];
  const result = audit(steps);
  assert.equal(result.details[0].status, 'failed');
  assert.ok(result.details[0].note.includes('Error de conexión'));
});

test('audit con array vacío devuelve score 100 EXCELLENT', () => {
  const result = audit([]);
  assert.equal(result.score, 100);
  assert.equal(result.verdict, 'EXCELLENT');
  assert.equal(result.details.length, 0);
});
