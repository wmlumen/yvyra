import { CLASSIFIED_CATEGORIES } from './core.mjs';
import { checkSession } from './auth.mjs';
import { getPrivateBlocks, createBlock, updateBlock, deleteBlock } from './api.mjs';

if (!(await checkSession())) {
  window.location.href = 'login.html';
}

const $ = (selector) => document.querySelector(selector);
let state = { classifieds: [] };

async function loadData() {
  try {
    const blocksData = await getPrivateBlocks();
    state.classifieds = blocksData.filter(b => b.classified).map(b => ({
      id: b.id,
      title: b.title,
      active: b.isActive,
      ...b.classified,
      ...b.payload
    }));
  } catch(e) {
    console.error("Error loading classifieds", e);
  }
}
await loadData();

for (const category of CLASSIFIED_CATEGORIES) {
  const option = document.createElement('option');
  option.value = category;
  option.textContent = category;
  $('#ad-category').append(option);
}

$('#classified-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const submitBtn = event.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Guardando...';

  try {
    const input = readForm();
    const id = $('#classified-editing-id').value;
    
    const blockData = {
      type: 'classified',
      title: input.title,
      isActive: input.active,
      classifiedData: {
         category: input.category,
         description: input.description,
         price: input.price,
         currency: input.currency,
         location: input.location,
         isFeatured: input.featured
      },
      payload: { contactUrl: input.contactUrl, imageUrl: input.imageUrl, expiresAt: input.expiresAt }
    };

    if (id) {
       await updateBlock(id, blockData);
    } else {
       await createBlock(blockData);
    }
    
    await loadData(); // recargar
    resetForm();
    render();
    flash(id ? 'Anuncio actualizado en el servidor.' : 'Anuncio publicado en el servidor.');
  } catch (error) {
    flash(error.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Guardar Anuncio';
  }
});

$('#ad-cancel-edit').addEventListener('click', resetForm);
render();

function readForm() {
  return {
    title: $('#ad-title').value,
    description: $('#ad-description').value,
    category: $('#ad-category').value,
    price: $('#ad-price').value,
    currency: $('#ad-currency').value,
    location: $('#ad-location').value,
    contactUrl: $('#ad-contact').value,
    imageUrl: $('#ad-image').value,
    expiresAt: $('#ad-expires').value,
    active: $('#ad-active').checked,
    featured: $('#ad-featured').checked
  };
}

function render() {
  $('#classified-admin-count').textContent = `${state.classifieds.length} anuncios`;
  const container = $('#classified-admin-list');
  if (!state.classifieds.length) {
    container.innerHTML = '<div class="empty">Aún no hay clasificados.</div>';
    return;
  }
  container.replaceChildren(...state.classifieds.map((item) => {
    const article = document.createElement('article');
    article.className = 'item';
    const head = document.createElement('div');
    head.className = 'item-head';
    const title = document.createElement('div');
    title.className = 'item-title';
    title.textContent = item.title;
    const status = document.createElement('span');
    status.className = 'badge';
    status.textContent = item.active ? 'Activo' : 'Inactivo';
    head.append(title, status);

    const details = document.createElement('div');
    details.className = 'item-url';
    details.textContent = `${item.category} · ${item.location || 'Sin ubicación'} · ${item.price ?? 'Consultar'} ${item.currency || ''}`;

    const actions = document.createElement('div');
    actions.className = 'actions';
    actions.append(
      button('Editar', () => edit(item)),
      button(item.active ? 'Desactivar' : 'Activar', () => toggle(item.id)),
      button('Eliminar', () => remove(item.id), 'danger')
    );
    article.append(head, details, actions);
    return article;
  }));
}

function button(text, handler, extraClass = '') {
  const element = document.createElement('button');
  element.type = 'button';
  element.className = `button ${extraClass}`.trim();
  element.textContent = text;
  element.addEventListener('click', handler);
  return element;
}

function edit(item) {
  $('#classified-editing-id').value = item.id;
  $('#ad-title').value = item.title;
  $('#ad-description').value = item.description;
  $('#ad-category').value = item.category;
  $('#ad-price').value = item.price ?? '';
  $('#ad-currency').value = item.currency || 'USD';
  $('#ad-location').value = item.location || '';
  $('#ad-contact').value = item.contactUrl;
  $('#ad-image').value = item.imageUrl || '';
  $('#ad-expires').value = item.expiresAt || '';
  $('#ad-active').checked = Boolean(item.active);
  $('#ad-featured').checked = Boolean(item.featured);
  $('#ad-cancel-edit').hidden = false;
  $('#ad-title').focus();
}

async function toggle(id) {
  const item = state.classifieds.find((ad) => ad.id === id);
  if (!item) return;
  try {
    await updateBlock(id, {
      title: item.title,
      isActive: !item.active,
      payload: { contactUrl: item.contactUrl, imageUrl: item.imageUrl, expiresAt: item.expiresAt }
    });
    await loadData();
    render();
  } catch(e) {
    flash('Error al actualizar el estado.', 'error');
  }
}

async function remove(id) {
  const item = state.classifieds.find((ad) => ad.id === id);
  if (!item || !confirm(`¿Eliminar “${item.title}”?`)) return;
  try {
    await deleteBlock(id);
    await loadData();
    render();
    flash('Anuncio eliminado.');
  } catch(e) {
    flash('Error al eliminar.', 'error');
  }
}

function resetForm() {
  $('#classified-form').reset();
  $('#classified-editing-id').value = '';
  $('#ad-active').checked = true;
  $('#ad-cancel-edit').hidden = true;
}

function flash(message, type = 'success') {
  const element = $('#classified-form-message');
  element.textContent = message;
  element.className = `notice ${type}`;
  element.hidden = false;
}
