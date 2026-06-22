const test = require('node:test');
const assert = require('node:assert/strict');
const { plan, STEP_TYPES } = require('../services/agentPlanner');

test('plan lanza error si la tarea está vacía', () => {
  assert.throws(() => plan(''), /tarea es requerida/i);
  assert.throws(() => plan('   '), /tarea es requerida/i);
  assert.throws(() => plan(null), /tarea es requerida/i);
  assert.throws(() => plan(undefined), /tarea es requerida/i);
});

test('plan reconoce crear enlace', () => {
  const steps = plan('Crea un nuevo enlace titulado "Mi web" https://miweb.com');
  assert.ok(steps.length >= 1);
  const createStep = steps.find((s) => s.type === 'create_block');
  assert.ok(createStep, 'Debe haber un paso create_block');
  assert.equal(createStep.params.title, 'Mi web');
  assert.equal(createStep.params.type, 'link');
});

test('plan reconoce crear enlace sin URL', () => {
  const steps = plan('Agrega un enlace llamado "Instagram"');
  const createStep = steps.find((s) => s.type === 'create_block');
  assert.ok(createStep);
  assert.equal(createStep.params.title, 'Instagram');
  assert.ok(createStep.params.payload);
});

test('plan reconoce actualizar perfil', () => {
  const steps = plan('Actualiza mi perfil, cambia el nombre a "Juan Perez" y la bio a "Desarrollador web"');
  const updateStep = steps.find((s) => s.type === 'update_profile');
  assert.ok(updateStep, 'Debe haber un paso update_profile');
  assert.equal(updateStep.params.name, 'Juan Perez');
  assert.equal(updateStep.params.bio, 'Desarrollador web');
});

test('plan reconoce crear clasificado', () => {
  const steps = plan('Publica un clasificado titulado "Vendo laptop", precio 500 dólares, categoría Tecnología');
  const createStep = steps.find((s) => s.type === 'create_classified');
  assert.ok(createStep, 'Debe haber un paso create_classified');
  assert.equal(createStep.params.title, 'Vendo laptop');
  assert.equal(createStep.params.price, 500);
});

test('plan reconoce auditoría', () => {
  const steps = plan('Revisa el estado de mi cuenta, haz un health check');
  const auditStep = steps.find((s) => s.type === 'audit_check');
  assert.ok(auditStep, 'Debe haber un paso audit_check');
  assert.equal(auditStep.params.scope, 'full');
});

test('plan genera audit_check como fallback para tarea no reconocida', () => {
  const steps = plan('Hola mundo, esto es una prueba sin sentido');
  assert.ok(steps.length >= 1);
  assert.equal(steps[0].type, 'audit_check');
});

test('plan reconoce eliminar bloque', () => {
  const steps = plan('Elimina el enlace llamado "Instagram"');
  const deleteStep = steps.find((s) => s.type === 'delete_block');
  assert.ok(deleteStep);
  assert.equal(deleteStep.params.titleFilter, 'Instagram');
});

test('plan reconoce actualizar miniweb', () => {
  const steps = plan('Modifica la miniweb, cambia el headline a "Mis servicios" y la descripción a "Ofrezco desarrollo web"');
  const updateStep = steps.find((s) => s.type === 'update_minisite');
  assert.ok(updateStep, 'Debe haber un paso update_minisite');
  assert.equal(updateStep.params.headline, 'Mis servicios');
  assert.equal(updateStep.params.description, 'Ofrezco desarrollo web');
});

test('plan reconoce bulk schedule', () => {
  const steps = plan('Programa mis enlaces para el 2026-07-01');
  const scheduleStep = steps.find((s) => s.type === 'bulk_schedule');
  assert.ok(scheduleStep);
  assert.ok(scheduleStep.params.startAt.includes('2026-07-01'));
});

test('plan reconoce notificación', () => {
  const steps = plan('Notifica a los usuarios sobre el mantenimiento');
  const notifyStep = steps.find((s) => s.type === 'notify');
  assert.ok(notifyStep);
});
