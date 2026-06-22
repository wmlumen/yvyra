const test = require('node:test');
const assert = require('node:assert/strict');
const { AppError, errorHandler } = require('../middleware/errorHandler');

function mockResponse() {
  const res = {};
  res.status = (code) => { res._status = code; return res; };
  res.json = (data) => { res._json = data; return res; };
  return res;
}

test('AppError crea error con mensaje y status', () => {
  const err = new AppError('Algo salió mal', 400, 'TEST_ERROR');
  assert.equal(err.message, 'Algo salió mal');
  assert.equal(err.status, 400);
  assert.equal(err.code, 'TEST_ERROR');
  assert(err instanceof Error);
});

test('AppError usa status 400 por defecto', () => {
  const err = new AppError('Error de validación');
  assert.equal(err.status, 400);
  assert.equal(err.code, undefined);
});

test('errorHandler responde con AppError correctamente', () => {
  const err = new AppError('Recurso no encontrado', 404, 'NOT_FOUND');
  const res = mockResponse();
  errorHandler(err, {}, res, () => {});

  assert.equal(res._status, 404);
  assert.equal(res._json.error, 'Recurso no encontrado');
  assert.equal(res._json.code, 'NOT_FOUND');
});

test('errorHandler responde 500 para errores desconocidos', () => {
  const err = new Error('Algo inesperado');
  const res = mockResponse();
  errorHandler(err, {}, res, () => {});

  assert.equal(res._status, 500);
  assert.equal(res._json.code, 'INTERNAL_ERROR');
});

test('errorHandler maneja errores de parseo JSON', () => {
  const err = { type: 'entity.parse.failed', status: 400, message: 'Unexpected token' };
  const res = mockResponse();
  errorHandler(err, {}, res, () => {});

  assert.equal(res._status, 400);
  assert.equal(res._json.code, 'INVALID_JSON');
});

test('errorHandler oculta mensaje interno en producción', () => {
  const origEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  const err = new Error('secreto interno');
  const res = mockResponse();
  errorHandler(err, {}, res, () => {});
  process.env.NODE_ENV = origEnv;

  assert.equal(res._status, 500);
  assert.equal(res._json.error, 'Error interno del servidor');
});
