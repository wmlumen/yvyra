import { getSession, logout } from './auth.mjs';
import {
  deleteUserAsAdmin, getAdminStats, getAdminDetailedStats, getAdminUsers,
  getAdminUser, updateUserRole, getAdminAudit, getAdminAgentExecutions
} from './api.mjs';

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

// ─── Estado ──────────────────────────────────────────────────

const state = {
  users: { page: 0, limit: 50, search: '', total: 0 },
  audit: { page: 0, limit: 50, total: 0 },
  agents: { page: 0, limit: 50, total: 0 },
  currentTab: 'users'
};

// ─── Utilidades ──────────────────────────────────────────────

function showError(msg, container) {
  const el = container || $('#admin-message');
  el.textContent = msg;
  el.className = 'notice error';
  el.hidden = false;
}

function hideError(container) {
  const el = container || $('#admin-message');
  el.hidden = true;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

// ─── Pestañas ────────────────────────────────────────────────

const TABS = [
  { id: 'users', label: '👥 Usuarios' },
  { id: 'audit', label: '📋 Auditoría' },
  { id: 'agents', label: '🤖 Agentes' }
];

function initTabs() {
  const tabBar = $('#tab-bar');
  tabBar.replaceChildren(...TABS.map(tab => {
    const btn = document.createElement('button');
    btn.className = `tab${state.currentTab === tab.id ? ' active' : ''}`;
    btn.textContent = tab.label;
    btn.dataset.tab = tab.id;
    btn.addEventListener('click', () => switchTab(tab.id));
    return btn;
  }));
}

function switchTab(tabId) {
  state.currentTab = tabId;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`.tab[data-tab="${tabId}"]`)?.classList.add('active');
  document.querySelectorAll('.tab-panel').forEach(p => p.hidden = true);
  const panel = $(`#panel-${tabId}`);
  if (panel) panel.hidden = false;

  if (tabId === 'users') renderUsers();
  else if (tabId === 'audit') renderAudit();
  else if (tabId === 'agents') renderAgents();
}

// ─── Métricas ────────────────────────────────────────────────

async function renderStats() {
  try {
    const stats = await getAdminStats();
    const detailed = await getAdminDetailedStats();
    const container = $('#admin-stats');
    container.innerHTML = `
      <div class="metric"><strong>${stats.users}</strong><span>Usuarios</span></div>
      <div class="metric"><strong>${stats.workspaces}</strong><span>Subdominios</span></div>
      <div class="metric"><strong>${stats.blocks}</strong><span>Bloques</span></div>
      <div class="metric"><strong>${stats.classifieds}</strong><span>Clasificados</span></div>
      <div class="metric"><strong>${detailed.shortLinks}</strong><span>Enlaces Cortos</span></div>
      <div class="metric"><strong>${detailed.analyticsEvents}</strong><span>Eventos</span></div>
      <div class="metric"><strong>${detailed.auditLogs}</strong><span>Auditoría</span></div>
      <div class="metric"><strong>${detailed.agentExecutions}</strong><span>Ejecuciones IA</span></div>
      <div class="metric"><strong>+${detailed.recentSignups}</strong><span>Registros (7d)</span></div>
    `;
  } catch (error) {
    showError(error.message);
  }
}

// ─── Panel de Usuarios ───────────────────────────────────────

function buildSearchBar() {
  const bar = document.createElement('div');
  bar.className = 'search-bar';
  bar.style.cssText = 'display:flex; gap:8px; margin-bottom:16px; align-items:center;';

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Buscar por nombre o email...';
  input.value = state.users.search;
  input.className = 'input';
  input.style.cssText = 'flex:1;';

  const btn = document.createElement('button');
  btn.className = 'button';
  btn.textContent = 'Buscar';
  btn.addEventListener('click', () => {
    state.users.search = input.value.trim();
    state.users.page = 0;
    renderUsers();
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') btn.click();
  });

  bar.append(input, btn);
  return bar;
}

function buildPagination(total, limit, page, onPage) {
  const pages = Math.ceil(total / limit);
  if (pages <= 1) return document.createDocumentFragment();

  const nav = document.createElement('div');
  nav.className = 'pagination';
  nav.style.cssText = 'display:flex; gap:8px; justify-content:center; margin-top:16px; align-items:center;';

  const prev = document.createElement('button');
  prev.className = 'button';
  prev.textContent = '‹ Anterior';
  prev.disabled = page <= 0;
  prev.addEventListener('click', () => onPage(page - 1));

  const span = document.createElement('span');
  span.textContent = `Página ${page + 1} de ${pages} (${total} total)`;

  const next = document.createElement('button');
  next.className = 'button';
  next.textContent = 'Siguiente ›';
  next.disabled = page >= pages - 1;
  next.addEventListener('click', () => onPage(page + 1));

  nav.append(prev, span, next);
  return nav;
}

async function renderUsers() {
  const container = $('#admin-users-list');
  container.innerHTML = '<div class="empty">Cargando usuarios...</div>';

  try {
    const { users, total, limit } = await getAdminUsers(state.users.limit, state.users.page * state.users.limit, state.users.search);
    state.users.total = total;

    hideError();

    if (users.length === 0) {
      container.innerHTML = '<div class="empty">No se encontraron usuarios</div>';
      return;
    }

    const searchBar = buildSearchBar();

    const list = document.createElement('div');
    list.className = 'stack';

    list.append(...users.map((user) => {
      const item = document.createElement('div');
      item.className = 'item';

      const head = document.createElement('div');
      head.className = 'item-head';
      head.innerHTML = `
        <div>
          <div class="item-title">
            ${user.name}
            <span class="badge" style="background: transparent; color: var(--muted);">${user.role === 'ADMIN' ? 'SUPERADMIN' : 'CLIENTE'}</span>
          </div>
          <div class="item-url">
            ${user.email} · Registrado: ${new Date(user.createdAt).toLocaleDateString()} ·
            Workspace: ${user.workspaces?.[0]?.name || 'Sin workspace'} ·
            Handle: ${user.workspaces?.[0]?.handle || 'Sin handle'}
          </div>
        </div>
      `;

      const actions = document.createElement('div');
      actions.className = 'actions';

      if (user.id !== session.user.userId && user.role !== 'ADMIN') {
        const delBtn = document.createElement('button');
        delBtn.className = 'button danger';
        delBtn.textContent = 'Eliminar';
        delBtn.addEventListener('click', () => deleteUser(user.id, user.name));
        actions.appendChild(delBtn);
      }

      item.append(head, actions);
      return item;
    }));

    const pagination = buildPagination(
      total, limit, state.users.page,
      (p) => { state.users.page = p; renderUsers(); }
    );

    container.replaceChildren(searchBar, list, pagination);
  } catch (error) {
    showError(error.message);
    container.innerHTML = '<div class="empty">Error al cargar usuarios</div>';
  }
}

async function changeRole(id, name, newRole) {
  const action = newRole === 'ADMIN' ? 'ASCENDER a superadmin' : 'DEGRADAR a cliente';
  if (!confirm(`¿Estás seguro de ${action} a ${name}?`)) return;
  try {
    await updateUserRole(id, newRole);
    renderUsers();
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
}

async function deleteUser(id, name) {
  if (!confirm(`¿Estás completamente seguro de que deseas ELIMINAR a ${name} y TODO su contenido? Esta acción no se puede deshacer.`)) return;
  try {
    await deleteUserAsAdmin(id);
    renderUsers();
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
}

// ─── Panel de Auditoría ──────────────────────────────────────

async function renderAudit() {
  const container = $('#panel-audit');
  container.innerHTML = '<div class="empty">Cargando auditoría...</div>';

  try {
    const { logs, total, limit } = await getAdminAudit(state.audit.limit, state.audit.page * state.audit.limit);
    state.audit.total = total;

    if (logs.length === 0) {
      container.innerHTML = '<div class="empty">No hay registros de auditoría</div>';
      return;
    }

    const list = document.createElement('div');
    list.className = 'stack';

    list.append(...logs.map(log => {
      const item = document.createElement('div');
      item.className = 'item';
      item.innerHTML = `
        <div class="item-head">
          <div>
            <div class="item-title">
              <span class="badge">${log.action}</span>
              ${log.entity} ${log.entityId ? `#${log.entityId.slice(0, 8)}` : ''}
            </div>
            <div class="item-url">
              ${formatDate(log.createdAt)} ·
              Workspace: ${log.workspaceId ? log.workspaceId.slice(0, 8) + '…' : 'global'} ·
              User: ${log.userId ? log.userId.slice(0, 8) + '…' : 'N/A'}
            </div>
          </div>
        </div>
      `;
      return item;
    }));

    const pagination = buildPagination(
      total, limit, state.audit.page,
      (p) => { state.audit.page = p; renderAudit(); }
    );

    container.replaceChildren(list, pagination);
  } catch (error) {
    showError(error.message);
    container.innerHTML = '<div class="empty">Error al cargar auditoría</div>';
  }
}

// ─── Panel de Agentes ────────────────────────────────────────

async function renderAgents() {
  const container = $('#panel-agents');
  container.innerHTML = '<div class="empty">Cargando ejecuciones...</div>';

  try {
    const { executions, total, limit } = await getAdminAgentExecutions(state.agents.limit, state.agents.page * state.agents.limit);
    state.agents.total = total;

    if (executions.length === 0) {
      container.innerHTML = '<div class="empty">No hay ejecuciones de agentes</div>';
      return;
    }

    const list = document.createElement('div');
    list.className = 'stack';

    list.append(...executions.map(exec => {
      const item = document.createElement('div');
      item.className = 'item';
      const scoreColor = exec.score >= 80 ? 'var(--success)' : exec.score >= 50 ? 'var(--warning)' : 'var(--danger)';
      item.innerHTML = `
        <div class="item-head">
          <div>
            <div class="item-title">
              <span class="badge" style="background: ${exec.status === 'completed' ? 'var(--success)' : exec.status === 'rolled_back' ? 'var(--danger)' : 'var(--warning)'}; color: #000;">
                ${exec.status}
              </span>
              ${exec.task.slice(0, 80)}${exec.task.length > 80 ? '…' : ''}
            </div>
            <div class="item-url">
              ${formatDate(exec.createdAt)} ·
              Workspace: ${exec.workspaceId.slice(0, 8)}…
              ${exec.score !== null ? `· Puntuación: <strong style="color:${scoreColor}">${exec.score}</strong>` : ''}
              ${exec.completedAt ? `· Completado: ${formatDate(exec.completedAt)}` : ''}
            </div>
          </div>
        </div>
      `;
      return item;
    }));

    const pagination = buildPagination(
      total, limit, state.agents.page,
      (p) => { state.agents.page = p; renderAgents(); }
    );

    container.replaceChildren(list, pagination);
  } catch (error) {
    showError(error.message);
    container.innerHTML = '<div class="empty">Error al cargar ejecuciones</div>';
  }
}

// ─── Inicialización ──────────────────────────────────────────

function initPanels() {
  const panelsContainer = $('#panel-container');
  panelsContainer.innerHTML = `
    <div id="panel-users" class="tab-panel"></div>
    <div id="panel-audit" class="tab-panel" hidden></div>
    <div id="panel-agents" class="tab-panel" hidden></div>
  `;
}

renderStats();
initTabs();
initPanels();
renderUsers();
