import {
  aggregateAnalytics,
  buildTenantUrls,
  buildTrackedUrl,
  buildWhatsAppShareUrl,
  isValidHttpUrl,
  isValidSubdomain,
  normalizeSubdomain,
  recordEvent,
  saveState
} from './core.mjs';

import { checkSession, logout as authLogout } from './auth.mjs';
import {
  createBlock,
  deleteBlock,
  getPrivateBlocks,
  getPrivateProfile,
  reorderBlocks,
  updateBlock,
  updateProfile
} from './api.mjs';

if (!(await checkSession())) {
  window.location.href = 'login.html';
}

const $ = (selector) => document.querySelector(selector);
const SOCIAL_FIELDS = ['instagram', 'facebook', 'tiktok', 'youtube', 'whatsapp', 'telegram'];
const SHEET_COUNT = 3;

let state = {
  profile: {},
  links: [],
  miniSite: {},
  profileExperience: getDefaultProfileExperience()
};

try {
  const profileData = await getPrivateProfile();
  const blocksData = await getPrivateBlocks();

  state.profile = {
    name: profileData.name || '',
    handle: profileData.handle || '',
    bio: profileData.bio || '',
    avatar: profileData.avatar || 'EH',
    theme: profileData.theme || 'clean',
    subdomain: profileData.domainMappings?.[0]?.hostname || ''
  };

  state.links = normalizeLinkOrders(blocksData
    .filter((block) => block.type === 'link')
    .map((block) => ({
      id: block.id,
      type: block.type,
      title: block.title,
      url: block.payload?.url || '',
      active: block.isActive,
      startAt: block.payload?.startAt || '',
      endAt: block.payload?.endAt || '',
      order: typeof block.order === 'number' ? block.order : 0
    })));

  state.miniSite = profileData.miniSite || {};
  state.profileExperience = normalizeProfileExperience(state.miniSite.profileExperience);

  const welcomeBanner = $('#welcome-banner');
  const welcomeName = $('#welcome-name');
  if (welcomeBanner && welcomeName && state.profile.name) {
    welcomeName.textContent = state.profile.name;
    // Mostrar bienvenida si aún no ha añadido enlaces propios (> 2 porque por defecto se crean 2)
    const hasCustomLinks = state.links.length > 2;
    const hasCustomBio = state.profile.bio && !state.profile.bio.includes('Bienvenido');
    if (!hasCustomLinks && !hasCustomBio) {
      welcomeBanner.style.display = 'block';
    }
  }
} catch (error) {
  console.error('Error cargando dashboard:', error);
}

// Renderizar identidad del usuario incluso si falló la carga del perfil (no deja el badge en "Mi cuenta")
renderHeaderIdentity();

hydrateProfile();
hydrateProfileDesigner();
renderLinks();
renderMetrics();
refreshTrackedLink();
renderTenantUrls();
renderProgress();

$('#profile-form')?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const submitButton = event.target.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = 'Guardando...';

  const newProfileData = {
    name: $('#name').value.trim(),
    handle: $('#handle').value.trim(),
    bio: $('#bio').value.trim(),
    avatar: $('#avatar').value.trim() || 'EH',
    theme: $('#theme').value
  };

  try {
    await persistProfile({
      ...newProfileData,
      miniSite: buildMiniSitePayload()
    });

    state.profile = { ...state.profile, ...newProfileData };
    renderHeaderIdentity();
    flash('Perfil guardado exitosamente en el servidor.', 'success');
    renderTenantUrls();
    refreshTrackedLink();
    renderProgress();
  } catch {
    flash('Error al actualizar perfil.', 'error');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Guardar perfil';
  }
});

$('#profile-design-form')?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const submitButton = event.target.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = 'Guardando...';

  try {
    state.profileExperience = readProfileExperienceForm();
    await persistProfile({
      ...state.profile,
      miniSite: buildMiniSitePayload()
    });
    flash('Plantilla pública guardada. Ya puedes verla en tu perfil.', 'success', '#profile-design-message');
    renderProgress();
  } catch (error) {
    flash(error.message || 'Error guardando la personalización del perfil.', 'error', '#profile-design-message');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Guardar diseño del perfil';
  }
});

$('#link-form')?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const editingId = $('#editing-id').value;
  const title = $('#link-title').value.trim();
  const url = $('#link-url').value.trim();
  const startAt = $('#start-at').value;
  const endAt = $('#end-at').value;
  const active = $('#active').checked;

  if (!title || !isValidHttpUrl(url)) {
    flash('Escribe un título y una URL válida con http:// o https://.', 'error', '#form-message');
    return;
  }

  const submitButton = event.target.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = 'Guardando...';

  try {
    const payload = { url, startAt, endAt };

    if (editingId) {
      const current = state.links.find((link) => link.id === editingId);
      const updated = await updateBlock(editingId, {
        title,
        isActive: active,
        payload
      });

      state.links = state.links.map((link) => link.id === editingId ? {
        ...link,
        id: updated.id,
        title,
        url,
        active: updated.isActive,
        startAt,
        endAt,
        order: current?.order ?? link.order
      } : link);
    } else {
      const created = await createBlock({
        type: 'link',
        title,
        order: state.links.length,
        payload
      });

      state.links.push({
        id: created.id,
        type: 'link',
        title,
        url,
        active: created.isActive ?? active,
        startAt,
        endAt,
        order: typeof created.order === 'number' ? created.order : state.links.length
      });
    }

    state.links = normalizeLinkOrders(state.links);
    saveState(state);
    resetLinkForm();
    renderLinks();
    renderMetrics();
    renderProgress();
    flash(editingId ? 'Enlace actualizado en BD.' : 'Enlace creado en BD.', 'success', '#form-message');
  } catch (error) {
    flash(error.message || 'Hubo un error al comunicarse con el servidor', 'error', '#form-message');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Guardar enlace';
  }
});

$('#campaign-name')?.addEventListener('input', refreshTrackedLink);
$('#subdomain')?.addEventListener('input', () => {
  const normalized = normalizeSubdomain($('#subdomain').value);
  if ($('#subdomain').value !== normalized) $('#subdomain').value = normalized;
  renderTenantUrls(normalized);
});
$('#cancel-edit')?.addEventListener('click', resetLinkForm);

$('#whatsapp-form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const trackedUrl = refreshTrackedLink();
  const whatsappUrl = buildWhatsAppShareUrl({
    url: trackedUrl,
    text: $('#share-message').value
  });
  recordEvent(state, 'whatsapp_share', 'tree', new Date(), {
    source: 'dashboard',
    medium: 'share',
    campaign: $('#campaign-name').value
  });
  saveState(state);
  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  flash('Se abrió WhatsApp con el enlace rastreable.', 'success', '#whatsapp-message');
  renderMetrics();
});

$('#copy-tracked-link')?.addEventListener('click', async () => {
  const trackedUrl = refreshTrackedLink();
  try {
    await navigator.clipboard.writeText(trackedUrl);
    flash('Enlace copiado.', 'success', '#whatsapp-message');
  } catch {
    $('#tracked-link').select();
    flash('Selecciona y copia el enlace mostrado.', 'error', '#whatsapp-message');
  }
});

$('#logout-btn')?.addEventListener('click', async () => {
  await authLogout();
  window.location.href = 'login.html';
});

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
    sheets: Array.from({ length: SHEET_COUNT }, (_, index) => ({
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

  const normalizedSheets = Array.from({ length: SHEET_COUNT }, (_, index) => {
    const sheet = Array.isArray(incoming.sheets) ? incoming.sheets[index] ?? {} : {};
    return {
      title: String(sheet.title ?? '').trim().slice(0, 60),
      body: String(sheet.body ?? '').trim().slice(0, 240),
      ctaLabel: String(sheet.ctaLabel ?? '').trim().slice(0, 40),
      ctaUrl: String(sheet.ctaUrl ?? '').trim(),
      order: index + 1
    };
  });

  const socials = { ...base.socials };
  for (const key of SOCIAL_FIELDS) {
    socials[key] = String(incoming.socials?.[key] ?? '').trim();
  }

  return {
    intro: String(incoming.intro ?? '').trim().slice(0, 260),
    socials,
    sheets: normalizedSheets
  };
}

function readProfileExperienceForm() {
  const profileExperience = normalizeProfileExperience({
    intro: $('#profile-intro-input')?.value,
    socials: Object.fromEntries(SOCIAL_FIELDS.map((key) => [key, $(`#social-${key}`)?.value || ''])),
    sheets: Array.from({ length: SHEET_COUNT }, (_, index) => ({
      title: $(`#sheet-${index + 1}-title`)?.value || '',
      body: $(`#sheet-${index + 1}-body`)?.value || '',
      ctaLabel: $(`#sheet-${index + 1}-cta-label`)?.value || '',
      ctaUrl: $(`#sheet-${index + 1}-cta-url`)?.value || ''
    }))
  });

  for (const key of SOCIAL_FIELDS) {
    const value = profileExperience.socials[key];
    if (value && !isValidHttpUrl(value)) {
      throw new Error(`La URL de ${key} debe empezar con http:// o https://.`);
    }
  }

  for (const sheet of profileExperience.sheets) {
    if (sheet.ctaUrl && !isValidHttpUrl(sheet.ctaUrl)) {
      throw new Error(`La hoja "${sheet.title || 'sin título'}" necesita un enlace válido.`);
    }
  }

  return profileExperience;
}

function hydrateProfileDesigner() {
  const experience = normalizeProfileExperience(state.profileExperience);
  $('#profile-intro-input').value = experience.intro;
  for (const key of SOCIAL_FIELDS) {
    const input = $(`#social-${key}`);
    if (input) input.value = experience.socials[key];
  }
  experience.sheets.forEach((sheet, index) => {
    $(`#sheet-${index + 1}-title`).value = sheet.title;
    $(`#sheet-${index + 1}-body`).value = sheet.body;
    $(`#sheet-${index + 1}-cta-label`).value = sheet.ctaLabel;
    $(`#sheet-${index + 1}-cta-url`).value = sheet.ctaUrl;
  });
}

function buildMiniSitePayload() {
  return {
    ...state.miniSite,
    profileExperience: normalizeProfileExperience(state.profileExperience)
  };
}

async function persistProfile(payload) {
  await updateProfile(payload);
  state.miniSite = payload.miniSite || state.miniSite;
}

function renderProgress() {
  let score = 25;

  if ((state.profile.bio && state.profile.bio !== '¡Hola! Este es mi nuevo espacio en EnlaceHub.') || state.profile.avatar !== 'EH') {
    score += 25;
    $('#check-profile')?.classList.add('done');
  } else {
    $('#check-profile')?.classList.remove('done');
  }

  if (state.links.length > 0) {
    score += 25;
    $('#check-links')?.classList.add('done');
  } else {
    $('#check-links')?.classList.remove('done');
  }

  const hasMiniweb = state.miniSite?.published === true || Object.keys(state.miniSite).length > 0;
  const hasProfileExperience = hasVisibleProfileExperience(state.profileExperience);
  if (hasMiniweb || hasProfileExperience) {
    score += 25;
    $('#check-premium')?.classList.add('done');
  } else {
    $('#check-premium')?.classList.remove('done');
  }

  const fill = $('#progress-bar');
  const text = $('#progress-text');
  if (!fill || !text) return;

  fill.style.width = `${score}%`;
  text.textContent = `${score}%`;

  if (score === 100) {
    fill.classList.add('celebrate');
    text.classList.add('celebrate');
    text.style.color = '#ec4899';
  } else {
    fill.classList.remove('celebrate');
    text.classList.remove('celebrate');
    text.style.color = 'var(--accent)';
  }
}

function hasVisibleProfileExperience(experience) {
  const normalized = normalizeProfileExperience(experience);
  return Boolean(
    normalized.intro
    || SOCIAL_FIELDS.some((key) => normalized.socials[key])
    || normalized.sheets.some((sheet) => sheet.title || sheet.body || sheet.ctaLabel || sheet.ctaUrl)
  );
}

function renderHeaderIdentity() {
  const nameDisplay = $('#user-name-display');
  const subdomainDisplay = $('#user-subdomain-display');
  const avatarDisplay = $('#user-avatar');
  if (nameDisplay) nameDisplay.textContent = state.profile.name || 'Mi cuenta';
  if (subdomainDisplay) subdomainDisplay.textContent = state.profile.subdomain ? `@${state.profile.subdomain}` : '';
  if (avatarDisplay) avatarDisplay.textContent = (state.profile.avatar || 'EH').slice(0, 2);
}

function treePublicUrl() {
  const subdomain = normalizeSubdomain(state.profile.subdomain || '');
  const url = new URL('profile.html', location.href);
  if (subdomain) url.searchParams.set('tenant', subdomain);
  return url.toString();
}

function renderTenantUrls(candidate = state.profile.subdomain) {
  const subdomain = normalizeSubdomain(candidate || 'usuario');
  const message = $('#subdomain-message');
  if (!isValidSubdomain(subdomain)) {
    for (const selector of ['#tenant-tree-url', '#tenant-classifieds-url', '#tenant-web-url']) {
      const element = $(selector);
      element.textContent = 'Completa un subdominio válido';
      element.setAttribute('aria-disabled', 'true');
    }
    message.textContent = 'El nombre todavía no puede usarse como subdominio.';
    message.className = 'notice error';
    message.hidden = false;
    return;
  }

  const urls = buildTenantUrls({ subdomain, baseDomain: 'enlacehub.example' });
  const entries = [
    ['#tenant-tree-url', 'Árbol', urls.tree, `profile.html?tenant=${encodeURIComponent(subdomain)}`],
    ['#tenant-classifieds-url', 'Clasificados', urls.classifieds, `clasificados.html?tenant=${encodeURIComponent(subdomain)}`],
    ['#tenant-web-url', 'Miniweb', urls.miniSite, `miniweb.html?tenant=${encodeURIComponent(subdomain)}`]
  ];
  for (const [selector, label, publicUrl, localHref] of entries) {
    const element = $(selector);
    element.textContent = `${label}: ${publicUrl}`;
    element.href = localHref;
    element.title = `Vista local. URL de producción: ${publicUrl}`;
    element.removeAttribute('aria-disabled');
  }
  message.hidden = true;
}

function refreshTrackedLink() {
  const tracked = buildTrackedUrl(treePublicUrl(), {
    source: 'whatsapp',
    medium: 'messaging',
    campaign: $('#campaign-name').value || 'general'
  });
  $('#tracked-link').value = tracked;
  return tracked;
}

function hydrateProfile() {
  $('#name').value = state.profile.name;
  $('#handle').value = state.profile.handle;
  $('#bio').value = state.profile.bio;
  $('#avatar').value = state.profile.avatar;
  $('#theme').value = state.profile.theme;
  $('#subdomain').value = state.profile.subdomain || 'orlando';
}

function renderLinks() {
  $('#link-count').textContent = `${state.links.length} enlaces`;
  const container = $('#links-admin');
  if (!state.links.length) {
    container.innerHTML = '<div class="empty">Aún no has creado enlaces.</div>';
    return;
  }

  container.replaceChildren(...state.links.map((link, index) => {
    const item = document.createElement('article');
    item.className = 'item';

    const head = document.createElement('div');
    head.className = 'item-head';

    const title = document.createElement('div');
    title.className = 'item-title';
    title.textContent = link.title;

    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = link.active ? 'Activo' : 'Inactivo';
    head.append(title, badge);

    const url = document.createElement('div');
    url.className = 'item-url';
    url.textContent = `${link.url}${link.startAt || link.endAt ? ` · ${buildScheduleSummary(link)}` : ''}`;

    const actions = document.createElement('div');
    actions.className = 'actions';
    actions.append(
      actionButton('Editar', () => editLink(link)),
      actionButton('↑', () => moveLink(index, -1), index === 0, `Subir ${link.title}`),
      actionButton('↓', () => moveLink(index, 1), index === state.links.length - 1, `Bajar ${link.title}`),
      actionButton(link.active ? 'Desactivar' : 'Activar', () => toggleLink(link.id)),
      actionButton('Eliminar', () => removeLink(link.id), false, `Eliminar ${link.title}`, 'danger')
    );

    item.append(head, url, actions);
    return item;
  }));
}

function actionButton(text, handler, disabled = false, label = text, extraClass = '') {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `button ${extraClass}`.trim();
  button.textContent = text;
  button.disabled = disabled;
  button.setAttribute('aria-label', label);
  button.addEventListener('click', handler);
  return button;
}

function editLink(link) {
  $('#editing-id').value = link.id;
  $('#link-title').value = link.title;
  $('#link-url').value = link.url;
  $('#start-at').value = link.startAt || '';
  $('#end-at').value = link.endAt || '';
  $('#active').checked = Boolean(link.active);
  $('#cancel-edit').hidden = false;
  $('#link-title').focus();
}

function resetLinkForm() {
  $('#link-form').reset();
  $('#editing-id').value = '';
  $('#active').checked = true;
  $('#cancel-edit').hidden = true;
}

async function moveLink(index, delta) {
  const target = index + delta;
  if (target < 0 || target >= state.links.length) return;

  const reordered = [...state.links];
  [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
  const normalized = normalizeLinkOrders(reordered);

  try {
    await reorderBlocks(normalized.map((link) => ({ id: link.id, order: link.order })));
    state.links = normalized;
    renderLinks();
    flash('Orden actualizado.', 'success', '#form-message');
  } catch (error) {
    flash(error.message || 'No se pudo reordenar el enlace.', 'error', '#form-message');
  }
}

async function toggleLink(id) {
  const link = state.links.find((item) => item.id === id);
  if (!link) return;

  try {
    const updated = await updateBlock(id, {
      title: link.title,
      isActive: !link.active,
      payload: { url: link.url, startAt: link.startAt, endAt: link.endAt }
    });

    state.links = state.links.map((item) => item.id === id ? { ...item, active: updated.isActive } : item);
    renderLinks();
    flash('Estado del enlace actualizado.', 'success', '#form-message');
  } catch (error) {
    flash(error.message || 'No se pudo cambiar el estado del enlace.', 'error', '#form-message');
  }
}

async function removeLink(id) {
  const link = state.links.find((item) => item.id === id);
  if (!link || !confirm(`¿Eliminar “${link.title}”?`)) return;

  try {
    await deleteBlock(id);
    state.links = normalizeLinkOrders(state.links.filter((item) => item.id !== id));
    renderLinks();
    renderMetrics();
    renderProgress();
    flash('Enlace eliminado.', 'success', '#form-message');
  } catch (error) {
    flash(error.message || 'No se pudo eliminar el enlace.', 'error', '#form-message');
  }
}

function normalizeLinkOrders(links) {
  return links
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((link, index) => ({ ...link, order: index }));
}

function buildScheduleSummary(link) {
  const parts = [];
  if (link.startAt) parts.push(`desde ${formatDateTime(link.startAt)}`);
  if (link.endAt) parts.push(`hasta ${formatDateTime(link.endAt)}`);
  return parts.join(' · ');
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function renderMetrics() {
  const metrics = aggregateAnalytics(state, 30);
  $('#metric-views').textContent = metrics.pageViews;
  $('#metric-clicks').textContent = metrics.clicks;
  $('#metric-visitors').textContent = metrics.uniqueVisitors;
  $('#metric-whatsapp').textContent = metrics.whatsappVisits;
}

function flash(message, type = 'success', selector = '#form-message') {
  const element = $(selector);
  if (!element) {
    alert(message);
    return;
  }
  element.textContent = message;
  element.className = `notice ${type}`;
  element.hidden = false;
}
