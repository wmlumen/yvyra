import {
  BIG_CLASSIFIED_THEMES,
  buildMapDirectionsUrl,
  buildMapEmbedUrl,
  CLASSIFIED_CATEGORIES,
  CLASSIFIED_KINDS,
  parseTrafficAttribution,
  recordEvent,
  saveState
} from './core.mjs';

import { searchClassifieds } from './api.mjs';
import { buildTenantPageUrl, getExplicitTenant } from './surfaces.mjs';

const attribution = parseTrafficAttribution(location.search);
const explicitTenant = getExplicitTenant(location.search);
const searchInput = document.querySelector('#classified-search');
const categoryInput = document.querySelector('#classified-category');
const kindInput = document.querySelector('#classified-kind');
const sortInput = document.querySelector('#classified-sort');
const categoryChipRow = document.querySelector('#category-chip-row');
const state = { events: [] };

syncTenantLinks();

for (const category of CLASSIFIED_CATEGORIES) {
  const option = document.createElement('option');
  option.value = category;
  option.textContent = category;
  categoryInput.append(option);
}

for (const kind of CLASSIFIED_KINDS) {
  const option = document.createElement('option');
  option.value = kind.value;
  option.textContent = kind.label;
  kindInput.append(option);
}

let debounceTimer;
searchInput.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(fetchAndRender, 300);
});

categoryInput.addEventListener('change', fetchAndRender);
kindInput.addEventListener('change', fetchAndRender);
sortInput.addEventListener('change', fetchAndRender);

fetchAndRender();

async function fetchAndRender() {
  const query = searchInput.value.trim();
  const category = categoryInput.value;
  const kind = kindInput.value;
  const sort = sortInput.value;

  const params = {};
  if (query) params.q = query;
  if (category) params.category = category;
  if (kind) params.kind = kind;
  if (sort === 'price-asc') params.sortBy = 'price_asc';
  if (sort === 'price-desc') params.sortBy = 'price_desc';

  try {
    const items = sortClientSide(await searchClassifieds(params), sort);
    renderSummary(items, { query, category, kind });
    renderCategoryChips(items, category);
    renderBigThemeSections(items);
    renderItems(items);
  } catch (error) {
    console.error('Error fetching classifieds:', error);
    document.querySelector('#classified-list').innerHTML = '<div class="empty catalog-empty notice error">Error al conectar con el servidor de búsqueda.</div>';
  }
}

function sortClientSide(items, sort) {
  const ranked = [...items];

  if (sort === 'featured') {
    ranked.sort((a, b) => {
      const featuredScore = Number(Boolean(b.featured)) - Number(Boolean(a.featured));
      if (featuredScore !== 0) return featuredScore;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
    return ranked;
  }

  if (sort === 'newest') {
    ranked.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  return ranked;
}

function renderSummary(items, { query, category, kind }) {
  const summary = document.querySelector('#catalog-summary');
  const featuredCount = items.filter((item) => item.featured).length;
  const categories = new Set(items.map((item) => item.category).filter(Boolean));
  const pills = [
    `${items.length} resultado${items.length === 1 ? '' : 's'}`,
    `${featuredCount} destacado${featuredCount === 1 ? '' : 's'}`,
    `${categories.size} categoría${categories.size === 1 ? '' : 's'}`
  ];

  if (query) pills.push(`búsqueda: ${query}`);
  if (category) pills.push(`filtro: ${category}`);
  if (kind) pills.push(`tipo: ${resolveKindLabel(kind)}`);

  summary.replaceChildren(...pills.map((text) => {
    const span = document.createElement('span');
    span.className = 'summary-pill';
    span.textContent = text;
    return span;
  }));
}

function renderCategoryChips(items, activeCategory) {
  const counts = new Map();
  for (const item of items) {
    counts.set(item.category, (counts.get(item.category) || 0) + 1);
  }

  const chips = CLASSIFIED_CATEGORIES
    .filter((category) => counts.has(category))
    .map((category) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `category-chip${category === activeCategory ? ' is-active' : ''}`;
      button.textContent = `${category} · ${counts.get(category)}`;
      button.addEventListener('click', () => {
        categoryInput.value = category === activeCategory ? '' : category;
        fetchAndRender();
      });
      return button;
    });

  categoryChipRow.replaceChildren(...chips);
}

function syncTenantLinks() {
  if (!explicitTenant) return;
  for (const anchor of document.querySelectorAll('a[href$=".html"]')) {
    const url = new URL(anchor.getAttribute('href'), location.href);
    url.searchParams.set('tenant', explicitTenant);
    anchor.href = `${url.pathname.split('/').pop()}?${url.searchParams.toString()}`;
  }
}

function renderBigThemeSections(items) {
  const section = document.querySelector('#big-theme-sections');
  const grid = document.querySelector('#big-theme-grid');
  const grouped = BIG_CLASSIFIED_THEMES
    .map((theme) => ({
      ...theme,
      items: items.filter((item) => isPromotedThemeProduct(item) && item.bigTheme === theme.value).slice(0, 4)
    }))
    .filter((theme) => theme.items.length);

  if (!grouped.length) {
    section.hidden = true;
    grid.replaceChildren();
    return;
  }

  section.hidden = false;
  grid.replaceChildren(...grouped.map((theme) => {
    const article = document.createElement('article');
    article.className = 'theme-market-card';

    const eyebrow = document.createElement('p');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = theme.label;

    const title = document.createElement('h3');
    title.textContent = `${theme.items.length} producto${theme.items.length === 1 ? '' : 's'} promocionado${theme.items.length === 1 ? '' : 's'}`;

    const list = document.createElement('div');
    list.className = 'theme-market-list';
    list.replaceChildren(...theme.items.map(createThemeProductCard));

    article.append(eyebrow, title, list);
    return article;
  }));
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
  meta.append(badge(item.kindLabel || resolveKindLabel(item.kind), 'kind'));
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

  if (shouldShowProductMap(item)) {
    body.append(createProductMapBlock(item));
  }

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
    const profileUrl = tenant ? buildTenantPageUrl('profile.html', tenant) : '#';
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

function createThemeProductCard(item) {
  const article = document.createElement('article');
  article.className = 'theme-product-card';

  const title = document.createElement('h4');
  title.textContent = item.title;

  const meta = document.createElement('p');
  meta.className = 'muted';
  meta.textContent = `${item.category} · ${formatPriceText(item)}`;

  const action = document.createElement('a');
  action.className = 'button';
  action.href = item.contactUrl || '#';
  action.textContent = item.contactUrl ? 'Ver producto' : 'Consultar';
  if (item.contactUrl) {
    action.target = '_blank';
    action.rel = 'noopener noreferrer nofollow';
  } else {
    action.setAttribute('aria-disabled', 'true');
  }

  article.append(title, meta, action);
  return article;
}

function createProductMapBlock(item) {
  const wrap = document.createElement('div');
  wrap.className = 'classified-map-block';

  const label = document.createElement('p');
  label.className = 'classified-map-label';
  label.textContent = `Punto de venta: ${item.location}`;

  const frameWrap = document.createElement('div');
  frameWrap.className = 'classified-map';

  const frame = document.createElement('iframe');
  frame.src = buildMapEmbedUrl(item.location);
  frame.title = `Mapa de ${item.title}`;
  frame.loading = 'lazy';
  frame.referrerPolicy = 'no-referrer-when-downgrade';
  frame.setAttribute('allowfullscreen', '');
  frameWrap.append(frame);

  const action = document.createElement('a');
  action.className = 'button';
  action.href = buildMapDirectionsUrl(item.location);
  action.target = '_blank';
  action.rel = 'noopener noreferrer';
  action.textContent = 'Ver ubicación';

  wrap.append(label, frameWrap, action);
  return wrap;
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

function formatPriceText(item) {
  return String(formatPrice(item)).replace(/<[^>]+>/g, '');
}

function resolveKindLabel(kind) {
  return CLASSIFIED_KINDS.find((entry) => entry.value === kind)?.label || 'Clasificado tradicional';
}

function isPromotedThemeProduct(item) {
  return item.kind === 'product' && item.featured && item.showInBigTheme && item.bigTheme;
}

function shouldShowProductMap(item) {
  return item.kind === 'product'
    && item.featured
    && Boolean(String(item.location || '').trim())
    && !/remoto/i.test(String(item.location || ''));
}
