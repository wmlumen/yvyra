import { API_URL } from './config.mjs';

/**
 * Registra un nuevo usuario en el backend
 */
export async function register(email, password, name, subdomain) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password, name, subdomain })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error en registro');
  return data;
}

/**
 * Inicia sesión con el backend
 */
export async function login(email, password) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error en login');
  return data;
}

/**
 * Cierra sesión (elimina cookie HTTP-only en el servidor)
 */
export async function logout() {
  await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include'
  });
}

/**
 * Comprueba si la sesión es válida
 */
export async function checkSession() {
  try {
    const session = await getSession();
    return session.user !== undefined;
  } catch (e) {
    return false;
  }
}

export async function getSession() {
  const res = await fetch(`${API_URL}/auth/me`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Sesión inválida');
  return res.json();
}
