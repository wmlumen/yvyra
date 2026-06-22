import { createShortLink, loadState, normalizeSlug, saveState } from './core.mjs';

let state = loadState();
const $ = (selector) => document.querySelector(selector);
render();

$('#short-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const destination = $('#destination').value.trim();
  const slug = normalizeSlug($('#slug').value);
  try {
    const item = createShortLink(state, { slug, url: destination });
    saveState(state);
    $('#short-form').reset();
    render();
    const shortUrl = buildShortUrl(item.slug);
    await navigator.clipboard?.writeText(shortUrl);
    message(`Creado y copiado: ${shortUrl}`, 'success');
  } catch (error) {
    message(error.message || 'No se pudo crear el enlace.', 'error');
  }
});

function render() {
  const container = $('#short-list');
  if (!state.shortLinks.length) {
    container.innerHTML = '<div class="empty">No hay enlaces cortos.</div>';
    return;
  }
  container.replaceChildren(...state.shortLinks.map((item) => {
    const article = document.createElement('article');
    article.className = 'item';
    const title = document.createElement('div');
    title.className = 'item-title';
    title.textContent = buildShortUrl(item.slug);
    const destination = document.createElement('div');
    destination.className = 'item-url';
    destination.textContent = item.url;
    const actions = document.createElement('div');
    actions.className = 'actions';
    const copy = button('Copiar', async () => {
      await navigator.clipboard?.writeText(buildShortUrl(item.slug));
      message('Enlace copiado.', 'success');
    });
    const toggle = button(item.active ? 'Desactivar' : 'Activar', () => {
      item.active = !item.active;
      saveState(state);
      render();
    });
    const remove = button('Eliminar', () => {
      if (!confirm(`¿Eliminar /${item.slug}?`)) return;
      state.shortLinks = state.shortLinks.filter((entry) => entry.id !== item.id);
      saveState(state);
      render();
    }, 'danger');
    actions.append(copy, toggle, remove);
    article.append(title, destination, actions);
    return article;
  }));
}

function buildShortUrl(slug) {
  return `${location.origin}${location.pathname.replace(/shortener\.html$/, '')}index.html#go=${encodeURIComponent(slug)}`;
}

function button(text, handler, extraClass = '') {
  const element = document.createElement('button');
  element.type = 'button';
  element.className = `button ${extraClass}`.trim();
  element.textContent = text;
  element.addEventListener('click', handler);
  return element;
}

function message(text, type) {
  const element = $('#short-message');
  element.textContent = text;
  element.className = `notice ${type}`;
  element.hidden = false;
}
