import test from 'node:test';
import assert from 'node:assert/strict';

// Mock global fetch
const mockResponses = new Map();
let fetchCalls = [];

globalThis.fetch = async (url, options = {}) => {
  fetchCalls.push({ url, options });
  const mock = mockResponses.get(url) || { ok: true, data: {} };
  return {
    ok: mock.ok,
    json: async () => mock.data,
    status: mock.status || 200
  };
};

// Mock location.search for tenant tests
globalThis.location = { search: '' };

// Mock config
const API_URL = 'http://localhost:3000/api';

// Re-import after mocks
const api = await import('../src/api.mjs');

function resetMocks() {
  mockResponses.clear();
  fetchCalls = [];
}

// ========== Blocks ==========

test('getPublicBlocks hace GET a /api/blocks', async () => {
  resetMocks();
  mockResponses.set(`${API_URL}/blocks`, { ok: true, data: [{ id: '1', title: 'Test' }] });

  const result = await api.getPublicBlocks();
  assert.equal(fetchCalls.length, 1);
  assert.ok(fetchCalls[0].url.endsWith('/blocks'));
  assert.deepEqual(result, [{ id: '1', title: 'Test' }]);
});

test('getPublicBlocks con tenant en URL', async () => {
  resetMocks();
  globalThis.location.search = '?tenant=mi-negocio';
  mockResponses.set(`${API_URL}/blocks`, { ok: true, data: [] });

  await api.getPublicBlocks();
  assert.equal(fetchCalls[0].options.headers['x-tenant-subdomain'], 'mi-negocio');
  globalThis.location.search = '';
});

test('getPrivateBlocks hace GET a /api/blocks/me', async () => {
  resetMocks();
  mockResponses.set(`${API_URL}/blocks/me`, { ok: true, data: [{ id: '1' }] });

  const result = await api.getPrivateBlocks();
  assert.ok(fetchCalls[0].url.endsWith('/blocks/me'));
  assert.ok(fetchCalls[0].options.credentials === 'include');
  assert.deepEqual(result, [{ id: '1' }]);
});

test('createBlock hace POST a /api/blocks', async () => {
  resetMocks();
  mockResponses.set(`${API_URL}/blocks`, { ok: true, data: { id: 'new' } });

  const result = await api.createBlock({ type: 'link', title: 'Test' });
  assert.equal(fetchCalls[0].options.method, 'POST');
  assert.equal(JSON.parse(fetchCalls[0].options.body).title, 'Test');
  assert.deepEqual(result, { id: 'new' });
});

test('createBlock lanza error si falla', async () => {
  resetMocks();
  mockResponses.set(`${API_URL}/blocks`, {
    ok: false,
    status: 400,
    data: { error: 'Error de validación' }
  });

  await assert.rejects(
    () => api.createBlock({ type: 'link' }),
    /Error de validación/
  );
});

// ========== Classifieds ==========

test('searchClassifieds con query string', async () => {
  resetMocks();
  mockResponses.set(`${API_URL}/classifieds/search?q=laptop&category=Tecnología`, {
    ok: true,
    data: [{ id: '1' }]
  });

  const result = await api.searchClassifieds('laptop', 'Tecnología');
  assert.ok(result);
});

test('searchClassifieds con objeto de opciones', async () => {
  resetMocks();
  mockResponses.set(`${API_URL}/classifieds/search?q=servicio`, {
    ok: true,
    data: []
  });

  const result = await api.searchClassifieds({ q: 'servicio' });
  assert.ok(Array.isArray(result));
});

// ========== Profile ==========

test('getPublicProfile hace GET a /api/workspace/public', async () => {
  resetMocks();
  mockResponses.set(`${API_URL}/workspace/public`, {
    ok: true,
    data: { name: 'Test' }
  });

  const result = await api.getPublicProfile();
  assert.ok(fetchCalls[0].url.includes('/workspace/public'));
  assert.equal(result.name, 'Test');
});

test('getPrivateProfile requiere credentials', async () => {
  resetMocks();
  mockResponses.set(`${API_URL}/workspace/me`, { ok: true, data: {} });

  await api.getPrivateProfile();
  assert.equal(fetchCalls[0].options.credentials, 'include');
});

test('updateProfile hace PUT', async () => {
  resetMocks();
  mockResponses.set(`${API_URL}/workspace/me`, { ok: true, data: { name: 'Updated' } });

  const result = await api.updateProfile({ name: 'Updated' });
  assert.equal(fetchCalls[0].options.method, 'PUT');
  assert.deepEqual(result, { name: 'Updated' });
});

// ========== Short Links ==========

test('createShortLink hace POST', async () => {
  resetMocks();
  mockResponses.set(`${API_URL}/links`, {
    ok: true,
    data: { slug: 'test', url: 'https://example.com' }
  });

  const result = await api.createShortLink({ slug: 'test', url: 'https://example.com' });
  assert.equal(fetchCalls[0].options.method, 'POST');
  assert.equal(result.slug, 'test');
});

test('createShortLink lanza error con mensaje del server', async () => {
  resetMocks();
  mockResponses.set(`${API_URL}/links`, {
    ok: false,
    data: { error: 'Ese slug ya existe' }
  });

  await assert.rejects(
    () => api.createShortLink({ slug: 'test', url: 'https://example.com' }),
    /Ese slug ya existe/
  );
});

// ========== Admin ==========

test('getAdminStats hace GET a /api/admin/stats', async () => {
  resetMocks();
  mockResponses.set(`${API_URL}/admin/stats`, {
    ok: true,
    data: { users: 10, workspaces: 5 }
  });

  const result = await api.getAdminStats();
  assert.equal(result.users, 10);
});

test('getAdminUsers requiere credentials', async () => {
  resetMocks();
  mockResponses.set(`${API_URL}/admin/users?limit=50&offset=0`, { ok: true, data: { users: [], total: 0 } });

  await api.getAdminUsers();
  assert.equal(fetchCalls[0].options.credentials, 'include');
});

test('getAdminUsers pasa search como query', async () => {
  resetMocks();
  mockResponses.set(`${API_URL}/admin/users?limit=50&offset=0&search=test`, { ok: true, data: { users: [], total: 0 } });

  await api.getAdminUsers(50, 0, 'test');
  assert.ok(fetchCalls[0].url.includes('search=test'));
});

test('getAdminDetailedStats hace GET', async () => {
  resetMocks();
  mockResponses.set(`${API_URL}/admin/stats/detailed`, {
    ok: true,
    data: { users: 5, shortLinks: 12, analyticsEvents: 300, recentSignups: 2 }
  });

  const result = await api.getAdminDetailedStats();
  assert.equal(result.shortLinks, 12);
  assert.equal(result.recentSignups, 2);
});

test('getAdminUser pasa id en URL', async () => {
  resetMocks();
  mockResponses.set(`${API_URL}/admin/users/abc123`, { ok: true, data: { id: 'abc123', name: 'Test' } });

  const result = await api.getAdminUser('abc123');
  assert.equal(result.id, 'abc123');
});

test('updateUserRole hace PUT con role', async () => {
  resetMocks();
  mockResponses.set(`${API_URL}/admin/users/user1/role`, { ok: true, data: { id: 'user1', role: 'ADMIN' } });

  const result = await api.updateUserRole('user1', 'ADMIN');
  assert.equal(fetchCalls[0].options.method, 'PUT');
  assert.equal(JSON.parse(fetchCalls[0].options.body).role, 'ADMIN');
  assert.equal(result.role, 'ADMIN');
});

test('getAdminAudit hace GET paginado', async () => {
  resetMocks();
  mockResponses.set(`${API_URL}/admin/audit?limit=10&offset=0`, { ok: true, data: { logs: [], total: 0 } });

  await api.getAdminAudit(10, 0);
  assert.ok(fetchCalls[0].url.includes('limit=10'));
});

test('getAdminAgentExecutions hace GET paginado', async () => {
  resetMocks();
  mockResponses.set(`${API_URL}/admin/agents?limit=20&offset=0`, { ok: true, data: { executions: [], total: 0 } });

  await api.getAdminAgentExecutions(20, 0);
  assert.ok(fetchCalls[0].url.includes('limit=20'));
});

// ========== Analytics ==========

test('getAnalytics pasa días como query', async () => {
  resetMocks();
  mockResponses.set(`${API_URL}/analytics?days=7`, { ok: true, data: {} });

  await api.getAnalytics(7);
  assert.ok(fetchCalls[0].url.includes('days=7'));
});

test('recordEvent hace POST', async () => {
  resetMocks();
  mockResponses.set(`${API_URL}/analytics/event`, { ok: true, data: { id: 'evt1' } });

  const result = await api.recordEvent({ type: 'page_view' });
  assert.equal(fetchCalls[0].options.method, 'POST');
  assert.equal(result.id, 'evt1');
});

// ========== Reorder ==========

test('reorderBlocks hace PUT con items', async () => {
  resetMocks();
  mockResponses.set(`${API_URL}/blocks/reorder/all`, { ok: true, data: [] });

  await api.reorderBlocks([{ id: '1', order: 0 }]);
  const body = JSON.parse(fetchCalls[0].options.body);
  assert.ok(Array.isArray(body.items));
  assert.equal(body.items[0].id, '1');
});
