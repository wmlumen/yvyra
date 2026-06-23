import {
  buildWhatsAppShareUrl,
  isClassifiedVisible,
  isValidHttpUrl,
  parseTrafficAttribution,
  recordEvent,
  saveState
} from './core.mjs';

import { getPublicProfile, getPublicBlocks } from './api.mjs';
import { buildTenantPageUrl, getExplicitTenant } from './surfaces.mjs';

let state = { profile: {}, miniSite: {}, classifieds: [] };
const explicitTenant = getExplicitTenant(location.search);

try {
  const profileData = await getPublicProfile();
  state.profile = profileData;
  state.miniSite = profileData.miniSite || {};
  
  const blocksData = await getPublicBlocks();
  state.classifieds = blocksData.filter(b => b.classified).map(b => b.classified);
} catch (e) {
  console.error("No se pudo cargar la configuración de la miniweb", e);
}

const site = state.miniSite;
const attribution = parseTrafficAttribution(location.search);
const $ = (selector) => document.querySelector(selector);

if (!site.published) {
  document.body.innerHTML = `<main class="profile-page"><h1>Miniweb no publicada</h1><p class="muted">El propietario ha desactivado temporalmente esta página.</p><a class="button" href="${buildTenantPageUrl('profile.html', explicitTenant)}">Ver árbol principal</a></main>`;
} else {
  render();
}

function render() {
  document.body.dataset.theme = state.profile.theme || 'clean';
  document.title = `${site.businessName || state.profile.name} · Miniweb`;
  $('#mini-handle').textContent = state.profile.handle || 'Página oficial';
  $('#mini-business-name').textContent = site.businessName || state.profile.name;
  $('#mini-headline').textContent = site.headline || '';
  $('#mini-description').textContent = site.description || '';
  $('#mini-address').textContent = site.address || '';

  const primaryCta = $('#mini-primary-cta');
  primaryCta.textContent = site.primaryCtaLabel || 'Ver árbol';
  primaryCta.href = resolveInternalOrHttp(site.primaryCtaUrl || buildTenantPageUrl('profile.html', explicitTenant));
  primaryCta.addEventListener('click', () => saveCtaEvent('primary'));

  const whatsappNumber = String(site.whatsapp || '').replace(/\D+/g, '');
  if (whatsappNumber) {
    const whatsappUrl = buildWhatsAppShareUrl({
      phone: whatsappNumber,
      text: `Hola, vi la miniweb de ${site.businessName || state.profile.name} y deseo más información.`
    });
    const whatsappCta = $('#mini-whatsapp-cta');
    whatsappCta.href = whatsappUrl;
    whatsappCta.hidden = false;
    whatsappCta.addEventListener('click', () => saveCtaEvent('whatsapp'));
    addContactLink('WhatsApp', whatsappUrl);
  }

  if (site.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(site.email)) {
    addContactLink('Correo', `mailto:${site.email}`);
  }

  renderServices();
  renderClassifieds();
  recordEvent(state, 'mini_site_view', null, new Date(), attribution);
  saveState(state);
}

function renderServices() {
  const services = Array.isArray(site.services) ? site.services.filter(Boolean) : [];
  if (!services.length) {
    $('#mini-services-section').hidden = true;
    return;
  }
  $('#mini-services').replaceChildren(...services.map((service) => {
    const item = document.createElement('li');
    item.textContent = service;
    return item;
  }));
}

function renderClassifieds() {
  if (!site.showClassifieds) {
    $('#mini-classifieds-section').hidden = true;
    return;
  }
  const items = state.classifieds.filter((item) => isClassifiedVisible(item)).slice(0, 3);
  if (!items.length) {
    $('#mini-classifieds-section').hidden = true;
    return;
  }
  $('#mini-classifieds').replaceChildren(...items.map((item) => {
    const article = document.createElement('article');
    article.className = 'classified-card compact-card';
    const body = document.createElement('div');
    body.className = 'classified-body';
    const category = document.createElement('span');
    category.className = 'badge';
    category.textContent = item.category;
    const title = document.createElement('h3');
    title.textContent = item.title;
    const description = document.createElement('p');
    description.className = 'muted clamp-text';
    description.textContent = item.description;
    const anchor = document.createElement('a');
    anchor.className = 'button';
    anchor.href = item.contactUrl;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer nofollow';
    anchor.textContent = 'Consultar';
    anchor.addEventListener('click', () => {
      recordEvent(state, 'classified_contact', item.id, new Date(), attribution);
      saveState(state);
    });
    body.append(category, title, description, anchor);
    article.append(body);
    return article;
  }));
}

function addContactLink(label, href) {
  const anchor = document.createElement('a');
  anchor.className = 'button';
  anchor.href = href;
  anchor.textContent = label;
  if (isValidHttpUrl(href)) {
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
  }
  $('#mini-contact-links').append(anchor);
}

function resolveInternalOrHttp(value) {
  try {
    const url = new URL(value, location.href);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : buildTenantPageUrl('profile.html', explicitTenant);
  } catch {
    return buildTenantPageUrl('profile.html', explicitTenant);
  }
}

function saveCtaEvent(target) {
  recordEvent(state, 'mini_site_cta', target, new Date(), attribution);
  saveState(state);
}
