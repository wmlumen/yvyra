import { API_URL } from './config.mjs';

function getExplicitTenant() {
  try {
    const params = new URLSearchParams(globalThis.location?.search || '');
    const candidate = params.get('tenant') || params.get('profile') || params.get('subdomain') || '';
    const normalized = candidate.trim().toLowerCase();
    return /^[a-z0-9](?:[a-z0-9-]{1,46}[a-z0-9])?$/.test(normalized) ? normalized : '';
  } catch {
    return '';
  }
}

function buildPublicRequestOptions() {
  const tenant = getExplicitTenant();
  return tenant ? { headers: { 'x-tenant-subdomain': tenant } } : {};
}

export async function getPublicBlocks() {
  const res = await fetch(`${API_URL}/blocks`, buildPublicRequestOptions());
  if (!res.ok) throw new Error('Error al cargar los datos del árbol');
  return res.json();
}

export async function getPrivateBlocks() {
  const res = await fetch(`${API_URL}/blocks/me`, { credentials: 'include' });
  if (!res.ok) throw new Error('Error cargando tus bloques');
  return res.json();
}

export async function createBlock(data) {
  const res = await fetch(`${API_URL}/blocks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error al guardar el bloque');
  }
  return res.json();
}

export async function updateBlock(id, data) {
  const res = await fetch(`${API_URL}/blocks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Error al actualizar bloque');
  return res.json();
}

export async function deleteBlock(id) {
  const res = await fetch(`${API_URL}/blocks/${id}`, {
    method: 'DELETE',
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Error al eliminar bloque');
  return res.json();
}

export async function getPublicProfile() {
  const res = await fetch(`${API_URL}/workspace/public`, buildPublicRequestOptions());
  if (!res.ok) throw new Error('Error cargando perfil');
  return res.json();
}

export async function getPrivateProfile() {
  const res = await fetch(`${API_URL}/workspace/me`, { credentials: 'include' });
  if (!res.ok) throw new Error('Error cargando tu perfil');
  return res.json();
}

export async function updateProfile(data) {
  const res = await fetch(`${API_URL}/workspace/me`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Error actualizando perfil');
  return res.json();
}

export async function searchClassifieds(queryOrOptions = '', category = '') {
  const options = typeof queryOrOptions === 'object' && queryOrOptions !== null
    ? queryOrOptions
    : { q: queryOrOptions, category };

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(options)) {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      params.append(key, String(value));
    }
  }

  const res = await fetch(`${API_URL}/classifieds/search?${params.toString()}`);
  if (!res.ok) throw new Error('Error buscando clasificados');
  return res.json();
}

export async function getAdminStats() {
  const res = await fetch(`${API_URL}/admin/stats`, { credentials: 'include' });
  if (!res.ok) throw new Error('Error cargando métricas');
  return res.json();
}

export async function getAdminUsers() {
  const res = await fetch(`${API_URL}/admin/users`, { credentials: 'include' });
  if (!res.ok) throw new Error('Error cargando usuarios');
  return res.json();
}

export async function deleteUserAsAdmin(id) {
  const res = await fetch(`${API_URL}/admin/users/${id}`, {
    method: 'DELETE',
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Error eliminando usuario');
  return res.json();
}

export async function reorderBlocks(items) {
  const res = await fetch(`${API_URL}/blocks/reorder/all`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ items })
  });
  if (!res.ok) throw new Error('Error al reordenar bloques');
  return res.json();
}

export async function getShortLinks() {
  const res = await fetch(`${API_URL}/links`, { credentials: 'include' });
  if (!res.ok) throw new Error('Error cargando enlaces cortos');
  return res.json();
}

export async function createShortLink(data) {
  const res = await fetch(`${API_URL}/links`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error creando enlace corto');
  }
  return res.json();
}

export async function updateShortLink(id, data) {
  const res = await fetch(`${API_URL}/links/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Error actualizando enlace corto');
  return res.json();
}

export async function deleteShortLink(id) {
  const res = await fetch(`${API_URL}/links/${id}`, {
    method: 'DELETE',
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Error eliminando enlace corto');
  return res.json();
}

export async function getAnalytics(days = 30) {
  const res = await fetch(`${API_URL}/analytics?days=${days}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Error cargando analytics');
  return res.json();
}

export async function recordEvent(data) {
  const res = await fetch(`${API_URL}/analytics/event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Error registrando evento');
  return res.json();
}

export async function generateWhatsAppCampaign(data) {
  const res = await fetch(`${API_URL}/whatsapp/campaign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Error generando campaña');
  return res.json();
}

export async function getWhatsAppStats(days = 30) {
  const res = await fetch(`${API_URL}/whatsapp/stats?days=${days}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Error cargando estadísticas');
  return res.json();
}

export async function getMiniSite() {
  const res = await fetch(`${API_URL}/minisite`, { credentials: 'include' });
  if (!res.ok) throw new Error('Error cargando miniweb');
  return res.json();
}

export async function updateMiniSite(data) {
  const res = await fetch(`${API_URL}/minisite`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Error guardando miniweb');
  return res.json();
}

export async function getAuditLogs(limit = 50, offset = 0) {
  const res = await fetch(`${API_URL}/audit?limit=${limit}&offset=${offset}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Error cargando auditoría');
  return res.json();
}
