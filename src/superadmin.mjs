import { getSession, logout } from './auth.mjs';
import { deleteUserAsAdmin, getAdminStats, getAdminUsers } from './api.mjs';

let session;

try {
  session = await getSession();
} catch {
  window.location.href = 'login.html';
}

if (!session?.user || session.user.role !== 'ADMIN') {
  window.location.href = 'dashboard.html';
}

const $ = (selector) => document.querySelector(selector);

$('#logout-btn').addEventListener('click', async () => {
  await logout();
  window.location.href = 'login.html';
});

async function render() {
  try {
    const stats = await getAdminStats();
    const statsContainer = $('#admin-stats');
    statsContainer.innerHTML = `
      <div class="metric"><strong>${stats.users}</strong><span>Usuarios</span></div>
      <div class="metric"><strong>${stats.workspaces}</strong><span>Subdominios</span></div>
      <div class="metric"><strong>${stats.blocks}</strong><span>Bloques</span></div>
      <div class="metric"><strong>${stats.classifieds}</strong><span>Clasificados</span></div>
    `;

    const users = await getAdminUsers();
    const usersContainer = $('#admin-users-list');

    if (users.length === 0) {
      usersContainer.innerHTML = '<div class="empty">No hay usuarios registrados</div>';
      return;
    }

    usersContainer.replaceChildren(...users.map((user) => {
      const item = document.createElement('div');
      item.className = 'item';

      const head = document.createElement('div');
      head.className = 'item-head';
      head.innerHTML = `
        <div>
          <div class="item-title">${user.name} <span class="badge" style="background: transparent; color: var(--muted);">${user.role}</span></div>
          <div class="item-url">${user.email} · Registrado: ${new Date(user.createdAt).toLocaleDateString()} · Workspace: ${user.workspaces?.[0]?.name || 'Sin workspace'} · Handle: ${user.workspaces?.[0]?.handle || 'Sin handle'}</div>
        </div>
      `;

      const actions = document.createElement('div');
      actions.className = 'actions';

      if (user.role !== 'ADMIN') {
        const delBtn = document.createElement('button');
        delBtn.className = 'button danger';
        delBtn.textContent = 'Eliminar';
        delBtn.addEventListener('click', () => deleteUser(user.id, user.name));
        actions.appendChild(delBtn);
      }

      item.append(head, actions);
      return item;
    }));
  } catch (error) {
    console.error(error);
    const msg = $('#admin-message');
    msg.textContent = error.message;
    msg.className = 'notice error';
    msg.hidden = false;
  }
}

async function deleteUser(id, name) {
  if (!confirm(`¿Estás completamente seguro de que deseas ELIMINAR a ${name} y TODO su contenido? Esta acción no se puede deshacer.`)) return;
  try {
    await deleteUserAsAdmin(id);
    render();
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
}

render();
