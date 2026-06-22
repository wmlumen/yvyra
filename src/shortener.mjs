/**
 * Acortador de enlaces — versión simple con precarga.
 * Guarda todo en localStorage. No necesita servidor.
 */
import { createShortLink, loadState, saveState, randomSlug } from './core.mjs';

// ─── Estado ──────────────────────────────────────────────────

const DEMOS = [
  { slug: 'whatsapp', url: 'https://wa.me/5491123456789?text=Hola%20vi%20tu%20web' },
  { slug: 'instagram', url: 'https://instagram.com/tuusuario' },
  { slug: 'ubicacion', url: 'https://www.google.com/maps/place/Tu+Negocio' },
  { slug: 'links',     url: 'https://linktr.ee/tuusuario' }
];

let state = loadState();

// Precargar demos solo si no hay ningún enlace todavía
if (state.shortLinks.length === 0) {
  DEMOS.forEach(demo => {
    try { createShortLink(state, demo); } catch { /* si el slug ya existe, ignorar */ }
  });
  saveState(state);
}

// ─── Referencias DOM ─────────────────────────────────────────

const $ = s => document.querySelector(s);
const form = $('#short-form');
const inputUrl = $('#destination');
const inputSlug = $('#slug');
const preview = $('#short-preview');
const previewUrl = $('#preview-url');
const copyPreviewBtn = $('#copy-preview-btn');
const container = $('#short-list-container');
const countBadge = $('#count-badge');

// ─── Renderizar lista ───────────────────────────────────────

function render() {
  if (state.shortLinks.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="icon">✂️</span>
        <p>Todavía no hay enlaces. Pega una URL arriba y empieza.</p>
      </div>`;
    countBadge.textContent = '';
    return;
  }

  countBadge.textContent = `(${state.shortLinks.length})`;

  const items = state.shortLinks.map(item => {
    const shortUrl = buildShortUrl(item.slug);
    const isActive = item.active !== false;
    const clicks = item.clicks || 0;

    const div = document.createElement('div');
    div.className = `short-item${isActive ? '' : ' inactive'}`;

    div.innerHTML = `
      <div class="info">
        <div class="short-url" data-slug="${item.slug}">
          <span>${shortUrl}</span>
          <span class="badge-copy">copiar</span>
        </div>
        <div class="destination" title="${escapeHtml(item.url)}">${escapeHtml(item.url)}</div>
        <div class="meta">
          <span>${clicks} clics</span>
          <span>·</span>
          <span>${item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'hoy'}</span>
          <span>·</span>
          <span>/${item.slug}</span>
        </div>
      </div>
      <div class="actions">
        <button class="button" data-copy="${item.slug}" style="padding:8px 12px;min-height:32px;font-size:0.75rem;">📋 Copiar</button>
        <button class="button" data-toggle="${item.slug}" style="padding:8px 12px;min-height:32px;font-size:0.75rem;">${isActive ? '⏸' : '▶'}</button>
        <button class="button danger" data-delete="${item.slug}" style="padding:8px 12px;min-height:32px;font-size:0.75rem;">🗑</button>
      </div>
    `;

    // Click en la URL corta → copiar
    div.querySelector('.short-url').addEventListener('click', () => copy(shortUrl));

    // Botón copiar
    div.querySelector('[data-copy]').addEventListener('click', () => copy(shortUrl));

    // Botón activar/desactivar
    div.querySelector('[data-toggle]').addEventListener('click', () => {
      item.active = !isActive;
      saveState(state);
      render();
    });

    // Botón eliminar
    div.querySelector('[data-delete]').addEventListener('click', () => {
      if (!confirm(`¿Eliminar /${item.slug}?`)) return;
      state.shortLinks = state.shortLinks.filter(e => e.id !== item.id);
      saveState(state);
      render();
    });

    return div;
  });

  container.replaceChildren(...items);
}

// ─── Crear enlace ────────────────────────────────────────────

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const url = inputUrl.value.trim();
  if (!url) return;

  const slug = inputSlug.value.trim() || randomSlug();

  try {
    const item = createShortLink(state, { slug, url });
    saveState(state);
    form.reset();
    mostrarPreview(item);
    render();
    inputUrl.focus();
  } catch (err) {
    alert(err.message);
  }
});

// ─── Accesos rápidos ─────────────────────────────────────────

document.querySelectorAll('.shortcuts .button[data-url]').forEach(btn => {
  btn.addEventListener('click', () => {
    inputUrl.value = btn.dataset.url;
    if (btn.dataset.slug) inputSlug.value = btn.dataset.slug;
    inputUrl.focus();
    form.dispatchEvent(new Event('submit'));
  });
});

// ─── Preview ─────────────────────────────────────────────────

function mostrarPreview(item) {
  const url = buildShortUrl(item.slug);
  previewUrl.textContent = url;
  preview.classList.add('show');

  copyPreviewBtn.onclick = () => copy(url);
}

// ─── Utilidades ──────────────────────────────────────────────

function buildShortUrl(slug) {
  return `${location.origin}${location.pathname.replace(/shortener\.html$/, '')}index.html#go=${encodeURIComponent(slug)}`;
}

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    mensaje(`✅ Copiado: ${text}`, 'success');
  } catch {
    // Fallback: seleccionar texto
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.left = '-9999px';
    document.body.appendChild(ta); ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    mensaje(`✅ Copiado`, 'success');
  }
}

function mensaje(text, type = 'success') {
  const old = document.querySelector('.float-msg');
  if (old) old.remove();

  const msg = document.createElement('div');
  msg.className = `float-msg notice ${type}`;
  msg.textContent = text;
  msg.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:999;padding:14px 24px;border-radius:var(--radius-sm);background:var(--surface);backdrop-filter:blur(24px);border:1px solid var(--border);font-weight:600;box-shadow:var(--shadow-hover);animation:fadeInUp 0.3s var(--elastic) forwards;max-width:90vw;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
  document.body.appendChild(msg);
  setTimeout(() => msg.remove(), 3000);
}

function escapeHtml(v) {
  return String(v ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

// ─── Iniciar ─────────────────────────────────────────────────

render();

// Si hay preview pendiente, auto-copiar
setTimeout(() => {
  if (preview.classList.contains('show')) {
    copy(previewUrl.textContent);
  }
}, 500);
