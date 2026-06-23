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
import { resolveHeroBg } from './heroBackgrounds.mjs';
import { buildTenantPageUrl, getExplicitTenant } from './surfaces.mjs';

const SOCIAL_META = {
  instagram: { label: 'Instagram', short: 'IG' },
  facebook: { label: 'Facebook', short: 'FB' },
  tiktok: { label: 'TikTok', short: 'TT' },
  youtube: { label: 'YouTube', short: 'YT' },
  whatsapp: { label: 'WhatsApp', short: 'WA' },
  telegram: { label: 'Telegram', short: 'TG' }
};
const explicitTenant = getExplicitTenant(location.search);
const publicProfileUrl = new URL(buildTenantPageUrl('profile.html', explicitTenant), location.href).toString();

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
    document.body.innerHTML = `<main class="profile-page"><h1>Enlace no disponible</h1><p class="muted">El enlace corto no existe o está desactivado.</p><a class="button" href="${publicProfileUrl}">Volver</a></main>`;
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

// ── Map de handles → imágenes de fondo Unsplash ──
// Fuente única: src/heroBackgrounds.mjs (compartido con servidor) - usar resolveHeroBg()

function renderPage() {
  document.body.dataset.theme = state.profile.theme || 'clean';
  document.title = `${state.profile.name || 'Perfil'} · EnlaceHub`;
  document.querySelector('#avatar').textContent = state.profile.avatar || 'EH';
  document.querySelector('#profile-name').textContent = state.profile.name || 'EnlaceHub';
  document.querySelector('#handle').textContent = state.profile.handle || '';
  document.querySelector('#bio').textContent = state.profile.bio || '';

  // Fondo del hero según el handle (sobre el div .hero-bg dedicado)
  const heroBg = document.querySelector('#hero-bg');
  if (heroBg) {
    const handle = (state.profile.handle || '').toLowerCase();
    const customImage = state.miniSite?.heroImage;
    const bgUrl = resolveHeroBg(handle, customImage);
    heroBg.style.backgroundImage = `url('${bgUrl}')`;
    // opacidad inicial 0 → transición suave cuando cargue
    heroBg.style.opacity = '0';
    const img = new Image();
    img.onload = () => { heroBg.style.opacity = '1'; };
    img.onerror = () => { heroBg.style.opacity = '0.6'; heroBg.style.backgroundColor = 'var(--surface)'; };
    img.src = bgUrl;
  }

  const intro = document.querySelector('#profile-intro');
  if (state.profileExperience.intro) {
    intro.textContent = state.profileExperience.intro;
    intro.hidden = false;
  } else {
    intro.hidden = true;
  }

  renderSocials();
  renderIdentityStrip();
  renderSheets();
  renderHubGrid();

  const miniSiteLink = document.querySelector('#mini-site-link');
  if (!state.miniSite?.published) miniSiteLink.hidden = true;
  miniSiteLink.href = buildTenantPageUrl('miniweb.html');
  document.querySelector('#classifieds-link').href = buildTenantPageUrl('clasificados.html');

  setupDirectContact();
  setupVcardDownload();

  recordEvent(state, 'page_view', null, new Date(), attribution);
  saveState(state);

  document.querySelector('#whatsapp-share-button').addEventListener('click', () => {
    const shareUrl = buildTrackedUrl(publicProfileUrl, {
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

function renderIdentityStrip() {
  const container = document.querySelector('#identity-strip');
  const items = [];
  const businessName = String(state.miniSite?.businessName || '').trim();
  const address = String(state.miniSite?.address || '').trim();
  const email = String(state.miniSite?.email || '').trim();
  const whatsapp = String(state.miniSite?.whatsapp || '').replace(/\D+/g, '');

  if (businessName && businessName !== state.profile.name) items.push({ label: 'Marca', value: businessName });
  if (address) items.push({ label: 'Ubicación', value: address });
  if (email) items.push({ label: 'Correo', value: email });
  if (whatsapp) items.push({ label: 'WhatsApp', value: `+${whatsapp}` });

  if (!items.length) {
    container.hidden = true;
    container.replaceChildren();
    return;
  }

  container.hidden = false;
  container.replaceChildren(...items.map((item) => {
    const article = document.createElement('article');
    article.className = 'identity-pill';

    const label = document.createElement('span');
    label.className = 'identity-label';
    label.textContent = item.label;

    const value = document.createElement('strong');
    value.className = 'identity-value';
    value.textContent = item.value;

    article.append(label, value);
    return article;
  }));
}

function setupDirectContact() {
  const button = document.querySelector('#direct-contact-button');
  const whatsapp = String(state.miniSite?.whatsapp || '').replace(/\D+/g, '');
  const email = String(state.miniSite?.email || '').trim();

  if (whatsapp) {
    button.hidden = false;
    button.href = buildWhatsAppShareUrl({
      phone: whatsapp,
      text: `Hola, vi el perfil de ${state.profile.name || state.miniSite?.businessName || 'este perfil'} y quiero más información.`
    });
    button.target = '_blank';
    button.rel = 'noopener noreferrer';
    button.textContent = 'Escribir por WhatsApp';
    return;
  }

  if (email) {
    button.hidden = false;
    button.href = `mailto:${encodeURIComponent(email)}`;
    button.removeAttribute('target');
    button.removeAttribute('rel');
    button.textContent = 'Enviar correo';
    return;
  }

  button.hidden = true;
}

function setupVcardDownload() {
  const button = document.querySelector('#download-contact-button');
  const email = String(state.miniSite?.email || '').trim();
  const whatsapp = String(state.miniSite?.whatsapp || '').replace(/\D+/g, '');
  const address = String(state.miniSite?.address || '').trim();

  if (!email && !whatsapp && !address) {
    button.hidden = true;
    return;
  }

  button.hidden = false;
  button.addEventListener('click', () => {
    const lines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${escapeVCard(state.profile.name || state.miniSite?.businessName || 'Contacto EnlaceHub')}`,
      `N:${escapeVCard(state.profile.name || state.miniSite?.businessName || 'Contacto EnlaceHub')};;;;`
    ];

    if (state.profile.bio) lines.push(`NOTE:${escapeVCard(state.profile.bio)}`);
    if (email) lines.push(`EMAIL;TYPE=INTERNET:${escapeVCard(email)}`);
    if (whatsapp) lines.push(`TEL;TYPE=CELL:+${whatsapp}`);
    if (address) lines.push(`ADR:;;${escapeVCard(address)};;;;`);
    lines.push('END:VCARD');

    const blob = new Blob([`${lines.join('\n')}\n`], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${slugifyFilename(state.profile.name || state.miniSite?.businessName || 'contacto')}.vcf`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  });
}

function renderHubGrid() {
  const container = document.querySelector('#hub-grid');
  const links = getVisibleLinks();
  const items = [
    {
      eyebrow: 'Árbol principal',
      title: 'Identidad y accesos',
      description: `${links.length} enlace${links.length === 1 ? '' : 's'} visible${links.length === 1 ? '' : 's'} desde esta tarjeta digital.`,
      href: '#sheet-stack-principal',
      actionLabel: 'Ver hoja principal'
    },
    {
      eyebrow: 'Clasificados',
      title: 'Publicación y descubrimiento',
      description: 'Explora anuncios conectados a este perfil con filtros, categorías y contacto directo.',
      href: buildTenantPageUrl('clasificados.html'),
      actionLabel: 'Abrir clasificados'
    },
    {
      eyebrow: 'Miniweb',
      title: 'Contenido y conversión',
      description: state.miniSite?.published
        ? 'Presentación extendida con servicios, contacto y CTA del negocio.'
        : 'La miniweb todavía no está publicada para este perfil.',
      href: state.miniSite?.published ? buildTenantPageUrl('miniweb.html') : 'dashboard.html',
      actionLabel: state.miniSite?.published ? 'Abrir miniweb' : 'Ir al panel'
    }
  ];

  container.replaceChildren(...items.map((item) => {
    const article = document.createElement('article');
    article.className = 'hub-card';

    const eyebrow = document.createElement('p');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = item.eyebrow;

    const title = document.createElement('h3');
    title.textContent = item.title;

    const description = document.createElement('p');
    description.textContent = item.description;

    const action = document.createElement('a');
    action.className = 'button';
    action.href = item.href;
    action.textContent = item.actionLabel;

    article.append(eyebrow, title, description, action);
    return article;
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

function escapeVCard(value) {
  return String(value ?? '')
    .replaceAll('\\', '\\\\')
    .replaceAll(';', '\\;')
    .replaceAll(',', '\\,')
    .replaceAll('\n', '\\n');
}

function slugifyFilename(value) {
  return String(value ?? 'contacto')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'contacto';
}
