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
  const countEl = document.querySelector('#classified-count');
  countEl.textContent = `${items.length} ${items.length === 1 ? 'anuncio disponible' : 'anuncios disponibles'}`;
  countEl.dataset.count = items.length;
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

  // ── Media / Image ──
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
  initials.className = 'classified-initials';
  media.append(initials);

  // ── Body ──
  const body = document.createElement('div');
  body.className = 'classified-body';

  // Meta (badges row)
  const meta = document.createElement('div');
  meta.className = 'classified-meta';
  meta.append(badge(item.category));
  if (item.featured) meta.append(badge('Destacado', 'featured'));

  // Title
  const title = document.createElement('h2');
  title.className = 'classified-title';
  title.textContent = item.title;

  // Description
  const description = document.createElement('p');
  description.className = 'muted clamp-text';
  description.textContent = item.description;

  // Facts row: price + location
  const facts = document.createElement('div');
  facts.className = 'classified-facts';
  const price = document.createElement('strong');
  price.innerHTML = formatPrice(item);
  const location = document.createElement('span');
  location.className = 'muted classified-location';
  location.innerHTML = `<span class="loc-icon">📍</span> ${item.city || item.department || item.location || 'Ubicación no indicada'}`;
  facts.append(price, location);

  // Date
  const dateEl = document.createElement('div');
  dateEl.className = 'classified-date muted';
  if (item.createdAt) {
    const d = new Date(item.createdAt);
    dateEl.textContent = `Publicado ${d.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  }

  body.append(meta, title, description, facts, dateEl);

  // ── Contact button ──
  const contact = document.createElement('a');
  contact.className = `button primary${item.contactUrl ? '' : ' disabled-btn'}`;
  contact.href = item.contactUrl || '#';
  if (item.contactUrl) {
    contact.target = '_blank';
    contact.rel = 'noopener noreferrer nofollow';
    contact.textContent = 'Contactar';
    contact.addEventListener('click', () => {
      recordEvent(state, 'classified_contact', item.id, new Date(), attribution);
      saveState(state);
    });
  } else {
    contact.textContent = 'Consultar';
    contact.setAttribute('aria-disabled', 'true');
    contact.addEventListener('click', (e) => {
      e.preventDefault();
      // Fallback: if there's a poster link, offer to message them
      const posterLink = article.querySelector('.poster-link');
      if (posterLink && posterLink.href && posterLink.href !== '#') {
        window.open(posterLink.href, '_blank');
      }
    });
  }

  // ── Poster info & trust ──
  const poster = document.createElement('div');
  poster.className = 'classified-poster';
  if (item.workspace && item.workspace.name) {
    const tenant = item.workspace.domainMappings?.[0]?.hostname;
    const profileUrl = tenant ? `profile.html?tenant=${tenant}` : '#';
    const authorLink = document.createElement('a');
    authorLink.className = 'poster-link';
    authorLink.href = profileUrl;
    authorLink.textContent = `Publicado por ${item.workspace.name}`;
    if (tenant) {
      authorLink.target = '_blank';
      authorLink.rel = 'noopener noreferrer';
    }
    poster.append(authorLink);

    // Trust badge
    if (item.workspace.email) {
      const verified = document.createElement('span');
      verified.className = 'trust-badge verified';
      verified.textContent = '✓ Verificado';
      verified.title = 'Anunciante verificado';
      poster.append(verified);
    }
  }

  // ── Report link ──
  const report = document.createElement('button');
  report.className = 'report-btn';
  report.textContent = 'Reportar';
  report.addEventListener('click', () => {
    alert('Gracias por tu reporte. Un moderador revisará este anuncio.');
  });

  article.append(media, body, contact, poster, report);
  article.setAttribute('data-category', item.category || '');
  return article;
}

function badge(text, type) {
  const element = document.createElement('span');
  element.className = `badge${type ? ' badge-' + type : ''}`;
  element.textContent = text;
  return element;
}

function formatPrice(item) {
  if (item.price === null || item.price === '' || !Number.isFinite(Number(item.price))) return 'Consultar precio';
  try {
    const currency = (item.currency || 'USD').replace(/^Gs\.?$/, 'PYG');
    const locale = currency === 'PYG' ? 'es-PY' : 'es';
    const formatted = new Intl.NumberFormat(locale, { style: 'currency', currency }).format(Number(item.price));
    return formatted;
  } catch {
    return `${Number(item.price).toLocaleString('es')} ${item.currency || 'USD'}`;
  }
}
