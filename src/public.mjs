import {
  buildTrackedUrl,
  buildWhatsAppShareUrl,
  isLinkVisible,
  parseTrafficAttribution,
  recordEvent,
  resolveShortLink,
  saveState
} from './core.mjs';

import { getPublicBlocks, getPublicProfile } from './api.mjs';

const SOCIAL_META = {
  instagram: { label: 'Instagram', short: 'IG' },
  facebook: { label: 'Facebook', short: 'FB' },
  tiktok: { label: 'TikTok', short: 'TT' },
  youtube: { label: 'YouTube', short: 'YT' },
  whatsapp: { label: 'WhatsApp', short: 'WA' },
  telegram: { label: 'Telegram', short: 'TG' }
};

let activeSheetIndex = 0;
let state = { profile: {}, miniSite: {}, links: [], profileExperience: getDefaultProfileExperience() };
let canRenderProfile = false;

try {
  const profileData = await getPublicProfile();
  const blocksData = await getPublicBlocks();

  state.profile = profileData;
  state.miniSite = profileData.miniSite || {};
  state.profileExperience = normalizeProfileExperience(state.miniSite.profileExperience);
  state.links = blocksData.map((block) => ({
    id: block.id,
    title: block.title,
    url: block.payload?.url || '',
    active: block.isActive,
    startAt: block.payload?.startAt || '',
    endAt: block.payload?.endAt || ''
  }));
  canRenderProfile = true;
} catch (error) {
  console.error('No se pudo cargar el perfil público', error);
  document.body.innerHTML = '<main class="profile-page"><h1>Página no encontrada</h1><p class="muted">Este enlace no existe o el subdominio no es válido.</p></main>';
}

const hashParams = new URLSearchParams(location.hash.replace(/^#/, ''));
const shortSlug = hashParams.get('go');
const attribution = parseTrafficAttribution(location.search);

if (shortSlug) {
  const item = resolveShortLink(state, shortSlug);
  if (item) {
    recordEvent(state, 'short_click', item.id, new Date(), attribution);
    saveState(state);
    location.replace(item.url);
  } else {
    document.body.innerHTML = '<main class="profile-page"><h1>Enlace no disponible</h1><p class="muted">El enlace corto no existe o está desactivado.</p><a class="button" href="index.html">Volver</a></main>';
  }
} else if (canRenderProfile) {
  renderPage();
  // Scroll a la sección indicada en el hash (ej: #sheet-stack-principal)
  scrollToHash();
}

// Escuchar cambios de hash para navegación entre hojas
window.addEventListener('hashchange', () => {
  if (!canRenderProfile) return;
  const hash = location.hash.replace(/^#/, '');
  if (hash.startsWith('sheet-stack-')) {
    const id = hash.replace('sheet-stack-', '');
    const sheets = getSheets();
    const idx = sheets.findIndex(s => s.id === id);
    if (idx >= 0) {
      activeSheetIndex = idx;
      renderSheets();
    }
    // Scroll suave a la sección
    const target = document.getElementById(hash);
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  }
});

function scrollToHash() {
  const hash = location.hash.replace(/^#/, '');
  if (!hash) return;
  const target = document.getElementById(hash);
  if (target) setTimeout(() => target.scrollIntoView({ behavior: 'smooth' }), 100);
}

function getDefaultProfileExperience() {
  return {
    intro: '',
    socials: {
      instagram: '',
      facebook: '',
      tiktok: '',
      youtube: '',
      whatsapp: '',
      telegram: ''
    },
    sheets: Array.from({ length: 3 }, (_, index) => ({
      title: '',
      body: '',
      ctaLabel: '',
      ctaUrl: '',
      order: index + 1
    }))
  };
}

function normalizeProfileExperience(value) {
  const base = getDefaultProfileExperience();
  const incoming = value && typeof value === 'object' ? value : {};
  const socials = { ...base.socials };
  for (const key of Object.keys(socials)) {
    socials[key] = String(incoming.socials?.[key] ?? '').trim();
  }

  return {
    intro: String(incoming.intro ?? '').trim().slice(0, 260),
    socials,
    sheets: Array.from({ length: 3 }, (_, index) => {
      const sheet = Array.isArray(incoming.sheets) ? incoming.sheets[index] ?? {} : {};
      return {
        title: String(sheet.title ?? '').trim().slice(0, 60),
        body: String(sheet.body ?? '').trim().slice(0, 240),
        ctaLabel: String(sheet.ctaLabel ?? '').trim().slice(0, 40),
        ctaUrl: String(sheet.ctaUrl ?? '').trim(),
        order: index + 1
      };
    })
  };
}

function getVisibleLinks() {
  return state.links.filter((link) => isLinkVisible(link));
}

function getSheets() {
  const visibleLinks = getVisibleLinks();
  const extraSheets = state.profileExperience.sheets.filter((sheet) => sheet.title || sheet.body || sheet.ctaLabel || sheet.ctaUrl);

  return [
    {
      id: 'principal',
      title: 'Principal',
      body: state.profileExperience.intro || state.profile.bio || 'Todos tus accesos directos en un solo lugar.',
      ctaLabel: '',
      ctaUrl: '',
      links: visibleLinks,
      isMain: true
    },
    ...extraSheets.map((sheet, index) => ({
      ...sheet,
      id: `extra-${index + 1}`,
      links: [],
      isMain: false
    }))
  ];
}

function renderPage() {
  document.body.dataset.theme = state.profile.theme || 'clean';
  document.title = `${state.profile.name || 'Perfil'} · EnlaceHub`;
  document.querySelector('#avatar').textContent = state.profile.avatar || 'EH';
  document.querySelector('#profile-name').textContent = state.profile.name || 'EnlaceHub';
  document.querySelector('#handle').textContent = state.profile.handle || '';
  document.querySelector('#bio').textContent = state.profile.bio || '';

  const intro = document.querySelector('#profile-intro');
  if (state.profileExperience.intro) {
    intro.textContent = state.profileExperience.intro;
    intro.hidden = false;
  } else {
    intro.hidden = true;
  }

  renderSocials();
  renderSheets();

  const miniSiteLink = document.querySelector('#mini-site-link');
  if (!state.miniSite?.published) miniSiteLink.hidden = true;

  recordEvent(state, 'page_view', null, new Date(), attribution);
  saveState(state);

  document.querySelector('#whatsapp-share-button').addEventListener('click', () => {
    const shareUrl = buildTrackedUrl(new URL('index.html', location.href).toString(), {
      source: 'whatsapp',
      medium: 'messaging',
      campaign: 'profile-share'
    });
    const whatsappUrl = buildWhatsAppShareUrl({
      url: shareUrl,
      text: `Visita la página de ${state.profile.name}: ${state.profile.bio}`
    });
    recordEvent(state, 'whatsapp_share', 'tree', new Date(), {
      source: attribution.source || 'profile',
      medium: 'share',
      campaign: 'profile-share'
    });
    saveState(state);
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  });

  document.querySelector('#share-button').addEventListener('click', async () => {
    const data = { title: state.profile.name, text: state.profile.bio, url: location.href };
    try {
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(location.href);
        alert('Enlace copiado.');
      }
    } catch (error) {
      if (error?.name !== 'AbortError') alert('No se pudo compartir el enlace.');
    }
  });
}

function renderSocials() {
  const container = document.querySelector('#social-strip');
  const items = Object.entries(state.profileExperience.socials)
    .filter(([, url]) => url)
    .map(([platform, url]) => ({ platform, url, ...SOCIAL_META[platform] }));

  if (!items.length) {
    container.hidden = true;
    container.replaceChildren();
    return;
  }

  container.hidden = false;
  container.replaceChildren(...items.map((item) => {
    const anchor = document.createElement('a');
    anchor.className = 'social-pill';
    anchor.href = item.url;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';

    const icon = document.createElement('span');
    icon.className = 'social-icon';
    icon.textContent = item.short;

    const text = document.createElement('span');
    text.textContent = item.label;

    anchor.append(icon, text);
    return anchor;
  }));
}

function renderSheets() {
  const sheets = getSheets();
  activeSheetIndex = Math.min(activeSheetIndex, sheets.length - 1);

  renderSheetTabs(sheets);
  renderSheetStage(sheets);
  renderSheetDots(sheets);
  renderScrollLinks(sheets);
  renderSheetStack(sheets);

  document.querySelector('#sheet-prev').onclick = () => {
    activeSheetIndex = (activeSheetIndex - 1 + sheets.length) % sheets.length;
    renderSheets();
  };
  document.querySelector('#sheet-next').onclick = () => {
    activeSheetIndex = (activeSheetIndex + 1) % sheets.length;
    renderSheets();
  };
}

function renderSheetTabs(sheets) {
  const container = document.querySelector('#sheet-tab-list');
  container.replaceChildren(...sheets.map((sheet, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `button sheet-tab${index === activeSheetIndex ? ' is-active' : ''}`;
    button.textContent = sheet.title;
    button.addEventListener('click', () => {
      activeSheetIndex = index;
      renderSheets();
    });
    return button;
  }));
}

function renderSheetStage(sheets) {
  const stage = document.querySelector('#sheet-stage');
  stage.replaceChildren(createSheetPanel(sheets[activeSheetIndex], { compact: true }));
  // Touch swipe: cambiar hoja deslizando
  setupSheetSwipe(stage);
}

function setupSheetSwipe(stage) {
  let startX = 0;
  let startY = 0;
  stage.addEventListener('touchstart', (e) => {
    startX = e.changedTouches[0].screenX;
    startY = e.changedTouches[0].screenY;
  }, { passive: true });
  stage.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].screenX - startX;
    const dy = e.changedTouches[0].screenY - startY;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      const sheets = getSheets();
      if (dx < 0) {
        activeSheetIndex = (activeSheetIndex + 1) % sheets.length;
      } else {
        activeSheetIndex = (activeSheetIndex - 1 + sheets.length) % sheets.length;
      }
      renderSheets();
    }
  }, { passive: true });
}

function renderSheetDots(sheets) {
  const container = document.querySelector('#sheet-dots');
  container.replaceChildren(...sheets.map((_, index) => {
    const dot = document.createElement('span');
    dot.className = `sheet-dot${index === activeSheetIndex ? ' is-active' : ''}`;
    return dot;
  }));
}

function renderScrollLinks(sheets) {
  const container = document.querySelector('#scroll-links');
  container.replaceChildren(...sheets.map((sheet) => {
    const anchor = document.createElement('a');
    anchor.className = 'button scroll-link';
    anchor.href = `#sheet-stack-${sheet.id}`;
    anchor.textContent = `Bajar a ${sheet.title}`;
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.getElementById(`sheet-stack-${sheet.id}`);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
      // Actualizar la hoja activa para que coincida
      activeSheetIndex = sheets.indexOf(sheet);
      renderSheets();
    });
    return anchor;
  }));
}

function renderSheetStack(sheets) {
  const container = document.querySelector('#profile-stack');
  container.replaceChildren(...sheets.map((sheet) => {
    const section = document.createElement('section');
    section.className = 'profile-stack-section';
    section.id = `sheet-stack-${sheet.id}`;

    const header = document.createElement('header');
    const textWrap = document.createElement('div');
    const eyebrow = document.createElement('p');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = sheet.isMain ? 'Hoja principal' : 'Hoja extra';
    const title = document.createElement('h3');
    title.textContent = sheet.title;
    textWrap.append(eyebrow, title);
    header.append(textWrap);
    section.append(header);

    if (sheet.body) {
      const description = document.createElement('p');
      description.textContent = sheet.body;
      section.append(description);
    }

    if (sheet.isMain) {
      const listWrap = document.createElement('div');
      listWrap.className = 'sheet-link-list';
      const list = document.createElement('div');
      list.className = 'link-list';
      if (!sheet.links.length) {
        list.innerHTML = '<div class="empty">No hay enlaces disponibles en este momento.</div>';
      } else {
        list.replaceChildren(...sheet.links.map(createLinkNode));
      }
      listWrap.append(list);
      section.append(listWrap);
    } else {
      const panel = createSheetPanel(sheet, { compact: true });
      section.append(panel);
    }

    return section;
  }));
}

function createSheetPanel(sheet, { compact }) {
  const panel = document.createElement('article');
  panel.className = `sheet-panel${sheet.isMain ? ' sheet-panel-main' : ''}`;

  const title = document.createElement('h3');
  title.textContent = sheet.title;
  panel.append(title);

  const description = document.createElement('p');
  description.textContent = sheet.body || (sheet.isMain
    ? 'Tus enlaces principales aparecen aquí y puedes navegar a más hojas usando las pestañas.'
    : 'Agrega un texto breve y un CTA para mostrar más contenido.');
  panel.append(description);

  if (sheet.isMain) {
    const summary = document.createElement('p');
    summary.className = 'muted';
    summary.textContent = `${sheet.links.length} enlace${sheet.links.length === 1 ? '' : 's'} activo${sheet.links.length === 1 ? '' : 's'} en esta hoja.`;
    panel.append(summary);
  }

  if (sheet.ctaLabel && sheet.ctaUrl) {
    const actions = document.createElement('div');
    actions.className = 'sheet-panel-actions';
    const anchor = document.createElement('a');
    anchor.className = 'button primary';
    anchor.href = sheet.ctaUrl;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.textContent = sheet.ctaLabel;
    actions.append(anchor);
    panel.append(actions);
  }

  if (!compact && sheet.isMain) {
    const list = document.createElement('div');
    list.className = 'link-list';
    if (!sheet.links.length) {
      list.innerHTML = '<div class="empty">No hay enlaces disponibles en este momento.</div>';
    } else {
      list.replaceChildren(...sheet.links.map(createLinkNode));
    }
    panel.append(list);
  }

  return panel;
}

function createLinkNode(link) {
  const anchor = document.createElement('a');
  anchor.className = 'bio-link';
  anchor.href = link.url;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';

  const text = document.createElement('span');
  text.textContent = link.title;
  const arrow = document.createElement('span');
  arrow.setAttribute('aria-hidden', 'true');
  arrow.textContent = '↗';
  anchor.append(text, arrow);
  anchor.addEventListener('click', () => {
    recordEvent(state, 'link_click', link.id, new Date(), attribution);
    saveState(state);
  });
  return anchor;
}
