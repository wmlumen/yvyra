import {
  CLASSIFIED_CATEGORIES,
  parseTrafficAttribution,
  recordEvent,
  saveState
} from './core.mjs';

import { searchClassifieds } from './api.mjs';

const attribution = parseTrafficAttribution(location.search);
const searchInput = document.querySelector('#classified-search');
const categoryInput = document.querySelector('#classified-category');
const sortInput = document.querySelector('#classified-sort');
const state = { events: [] };

for (const category of CLASSIFIED_CATEGORIES) {
  const option = document.createElement('option');
  option.value = category;
  option.textContent = category;
  categoryInput.append(option);
}

let debounceTimer;
searchInput.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(fetchAndRender, 300);
});

categoryInput.addEventListener('change', fetchAndRender);
sortInput.addEventListener('change', fetchAndRender);

fetchAndRender();

async function fetchAndRender() {
  const query = searchInput.value.trim();
  const category = categoryInput.value;
  const sort = sortInput.value;

  const params = {};
  if (query) params.q = query;
  if (category) params.category = category;
  if (sort === 'price-asc') params.sortBy = 'price_asc';
  if (sort === 'price-desc') params.sortBy = 'price_desc';

  try {
    const items = await searchClassifieds(params);
    renderItems(items);
  } catch (error) {
    console.error('Error fetching classifieds:', error);
    document.querySelector('#classified-list').innerHTML = '<div class="empty catalog-empty notice error">Error al conectar con el servidor de búsqueda.</div>';
  }
}

function renderItems(items) {
  document.querySelector('#classified-count').textContent = `${items.length} ${items.length === 1 ? 'anuncio disponible' : 'anuncios disponibles'}`;
  const container = document.querySelector('#classified-list');
  if (!items.length) {
    container.innerHTML = '<div class="empty catalog-empty">No hay anuncios que coincidan con los filtros.</div>';
    return;
  }
  container.replaceChildren(...items.map(createCard));
}

function createCard(item) {
  const article = document.createElement('article');
  article.className = `classified-card${item.featured ? ' featured' : ''}`;

  const media = document.createElement('div');
  media.className = 'classified-media';
  if (item.imageUrl) {
    const image = document.createElement('img');
    image.src = item.imageUrl;
    image.alt = '';
    image.loading = 'lazy';
    image.referrerPolicy = 'no-referrer';
    image.addEventListener('error', () => image.remove());
    media.append(image);
  }
  const initials = document.createElement('span');
  initials.textContent = item.category.slice(0, 2).toUpperCase();
  initials.setAttribute('aria-hidden', 'true');
  media.append(initials);

  const body = document.createElement('div');
  body.className = 'classified-body';
  const meta = document.createElement('div');
  meta.className = 'classified-meta';
  meta.append(badge(item.category));
  if (item.featured) meta.append(badge('Destacado'));

  const title = document.createElement('h2');
  title.textContent = item.title;
  const description = document.createElement('p');
  description.className = 'muted clamp-text';
  description.textContent = item.description;

  const facts = document.createElement('div');
  facts.className = 'classified-facts';
  const price = document.createElement('strong');
  price.textContent = formatPrice(item);
  const location = document.createElement('span');
  location.className = 'muted';
  location.textContent = item.location || 'Ubicación no indicada';
  facts.append(price, location);

  const contact = document.createElement('a');
  contact.className = 'button primary';
  contact.href = item.contactUrl || '#';
  contact.target = '_blank';
  contact.rel = 'noopener noreferrer nofollow';
  contact.textContent = item.contactUrl ? 'Contactar' : 'Sin enlace';
  if (!item.contactUrl) {
    contact.setAttribute('aria-disabled', 'true');
  } else {
    contact.addEventListener('click', () => {
      recordEvent(state, 'classified_contact', item.id, new Date(), attribution);
      saveState(state);
    });
  }

  body.append(meta, title, description, facts, contact);
  article.append(media, body);
  return article;
}

function badge(text) {
  const element = document.createElement('span');
  element.className = 'badge';
  element.textContent = text;
  return element;
}

function formatPrice(item) {
  if (item.price === null || item.price === '' || !Number.isFinite(Number(item.price))) return 'Consultar precio';
  try {
    return new Intl.NumberFormat('es', { style: 'currency', currency: item.currency || 'USD' }).format(Number(item.price));
  } catch {
    return `${Number(item.price).toFixed(2)} ${item.currency || 'USD'}`;
  }
}
