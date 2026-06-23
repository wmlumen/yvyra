import {
  generateStaticMiniSiteHTML,
  isValidHttpUrl,
  normalizeWhatsAppNumber
} from './core.mjs';

import { checkSession } from './auth.mjs';
import { getPrivateProfile, getPrivateBlocks, updateProfile } from './api.mjs';

if (!(await checkSession())) {
  window.location.href = 'login.html';
}

let state = { profile: {}, miniSite: {}, classifieds: [] };
const $ = (selector) => document.querySelector(selector);

try {
  const profileData = await getPrivateProfile();
  state.profile = profileData;
  state.miniSite = profileData.miniSite || {};

  const blocksData = await getPrivateBlocks();
  state.classifieds = blocksData.filter(b => b.classified).map(b => b.classified);
} catch (e) {
  console.error("Error cargando perfil:", e);
}

hydrate();

$('#mini-site-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const submitBtn = event.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Guardando...';

  try {
    state.miniSite = readForm();
    await updateProfile({
      name: state.profile.name,
      handle: state.profile.handle,
      bio: state.profile.bio,
      avatar: state.profile.avatar,
      theme: state.profile.theme,
      miniSite: state.miniSite
    });
    flash('Miniweb guardada correctamente en el servidor.');
  } catch (error) {
    flash(error.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Guardar';
  }
});

$('#download-html').addEventListener('click', async () => {
  try {
    state.miniSite = readForm();
    await updateProfile({ ...state.profile, miniSite: state.miniSite });

    const treeUrl = new URL('index.html', location.href).toString();
    const html = generateStaticMiniSiteHTML({
      profile: state.profile,
      miniSite: state.miniSite,
      classifieds: state.classifieds,
      treeUrl
    });
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = 'index.html';
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
    flash('Archivo index.html generado y perfil guardado.');
  } catch (error) {
    flash(error.message, 'error');
  }
});

function hydrate() {
  const site = state.miniSite;
  $('#business-name').value = site.businessName || state.profile.name;
  $('#headline').value = site.headline || '';
  $('#site-description').value = site.description || '';
  $('#services').value = (site.services || []).join('\n');
  $('#site-whatsapp').value = site.whatsapp || '';
  $('#site-email').value = site.email || '';
  $('#site-address').value = site.address || '';
  $('#site-hero-image').value = site.heroImage || '';
  $('#cta-label').value = site.primaryCtaLabel || 'Ver mi árbol de enlaces';
  $('#cta-url').value = site.primaryCtaUrl || 'index.html';
  $('#show-classifieds').checked = Boolean(site.showClassifieds);
  $('#show-map').checked = site.showMap !== false;
  $('#site-published').checked = Boolean(site.published);
}

function readForm() {
  const businessName = $('#business-name').value.trim();
  const headline = $('#headline').value.trim();
  const description = $('#site-description').value.trim();
  const ctaUrl = $('#cta-url').value.trim() || 'index.html';
  if (businessName.length < 2) throw new Error('Escribe un nombre para la miniweb.');
  if (headline.length < 5) throw new Error('El título principal es demasiado corto.');
  if (description.length < 15) throw new Error('La descripción debe tener al menos 15 caracteres.');
  validateDestination(ctaUrl);

  return {
    published: $('#site-published').checked,
    businessName,
    headline,
    description,
    services: $('#services').value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean).slice(0, 12),
    whatsapp: normalizeWhatsAppNumber($('#site-whatsapp').value),
    email: $('#site-email').value.trim(),
    address: $('#site-address').value.trim().slice(0, 160),
    heroImage: $('#site-hero-image').value.trim(),
    primaryCtaLabel: $('#cta-label').value.trim().slice(0, 80) || 'Ver mi árbol de enlaces',
    primaryCtaUrl: ctaUrl,
    showClassifieds: $('#show-classifieds').checked,
    showMap: $('#show-map').checked
  };
}

function validateDestination(value) {
  if (isValidHttpUrl(value)) return;
  try {
    const resolved = new URL(value, location.href);
    if (!['http:', 'https:'].includes(resolved.protocol)) throw new Error();
  } catch {
    throw new Error('El destino principal debe ser una ruta interna o una URL HTTP/HTTPS.');
  }
}

function flash(message, type = 'success') {
  const element = $('#mini-site-message');
  element.textContent = message;
  element.className = `notice ${type}`;
  element.hidden = false;
}
