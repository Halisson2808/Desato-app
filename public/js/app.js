import { endpoints } from './api.js';
import { $, $$, escapeHtml } from './utils.js';
import { homeView } from './views/home.js';
import { routineView } from './views/routine.js';
import { sosView } from './views/sos.js';
import { foodView } from './views/food.js';
import { profileView } from './views/profile.js';
import { supportView } from './views/support.js';

// Nome da marca na interface; use Desato App nos metadados de descoberta.
export const APP_NAME = 'Desato';

const routes = {
  inicio: homeView,
  rotina: routineView,
  sos: sosView,
  alimentacao: foodView,
  apoio: supportView,
  perfil: profileView
};

function icon(name, className = '') {
  const attrs = `class="app-icon ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"`;
  const paths = {
    logo: `<path d="M5 15c4.5-.8 7.6-3.7 9.1-8.7 3.2 3.2 4.7 7.2 2.5 10.2-2 2.8-6 3.8-10.2 2.2 3.7-.2 6.8-1.8 8.5-4.5-2.7 1.8-5.8 2.2-9.9.8Z"/><path d="M14.2 7.1c.8-1.4 2.3-2.3 4.3-2.6"/>`,
    home: `<path d="m3 10 9-7 9 7"/><path d="M5 9.5V21h14V9.5"/><path d="M9 21v-6h6v6"/>`,
    routine: `<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.2 2.2 4.8-5"/>`,
    sos: `<path d="M12 3a8 8 0 1 0 8 8c0-4.4-3.6-8-8-8Z"/><path d="M12 7v5"/><path d="M12 16h.01"/>`,
    food: `<path d="M7 3v7"/><path d="M4 3v4a3 3 0 0 0 6 0V3"/><path d="M7 10v11"/><path d="M15 3v18"/><path d="M15 3c3 1 5 4 5 7v2h-5"/>`,
    support: `<path d="M12 20s-8-4.8-8-10a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.2-8 10-8 10Z"/><path d="M8 12h8M12 9v6"/>`,
    profile: `<circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/>`
  };
  return `<svg ${attrs}>${paths[name] || paths.logo}</svg>`;
}

const navItems = [
  ['inicio', 'home', 'Início'],
  ['rotina', 'routine', 'Rotina'],
  ['sos', 'sos', 'SOS'],
  ['alimentacao', 'food', 'Alimentação'],
  ['apoio', 'support', 'Apoio']
];

const appState = {
  route: localStorage.getItem('meu-caminho-route') || 'inicio',
  store: null,
  summary: null,
  loading: true,
  error: null,
  ui: { foodTab: 'hoje', routinePeriod: 'manha', supportGuideId: null, supportFavoritesOnly: false }
};

function setRoute(route) {
  if (!routes[route]) route = 'inicio';
  appState.route = route;
  localStorage.setItem('meu-caminho-route', route);
  history.replaceState(null, '', `#${route}`);
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderHeader() {
  const name = appState.store?.profile?.name || '';
  const initial = name.trim().slice(0, 1).toUpperCase();
  $('#app-header').innerHTML = `
    <div class="header-row">
      <button class="desato-brand" id="header-home" aria-label="Desato — ir para o início">
        <img class="desato-brand-mark" src="/icon.svg" width="40" height="40" alt="" aria-hidden="true">
        <span class="desato-wordmark">${APP_NAME}</span>
      </button>
      <button class="profile-avatar-btn" id="header-profile" aria-label="Abrir perfil" title="Meu perfil">
        ${initial ? escapeHtml(initial) : icon('profile')}
      </button>
    </div>
  `;
  $('#header-home')?.addEventListener('click', () => setRoute('inicio'));
  $('#header-profile')?.addEventListener('click', () => setRoute('perfil'));
}

function renderNav() {
  $('#bottom-nav').innerHTML = `
    <div class="sidebar-brand" aria-label="${APP_NAME}">
      <img class="sidebar-logo desato-sidebar-mark" src="/icon.svg" width="42" height="42" alt="" aria-hidden="true">
      <div><strong>${APP_NAME}</strong></div>
    </div>
    <div class="nav-list">
      ${navItems.map(([id, iconName, label]) => `
        <button class="nav-btn ${id === appState.route ? 'active' : ''} ${id === 'sos' ? 'sos' : ''}" data-route="${id}" ${id === appState.route ? 'aria-current="page"' : ''}>
          <span class="nav-icon">${icon(iconName)}</span>
          <span class="nav-label">${label}</span>
        </button>
      `).join('')}
    </div>
    <div class="sidebar-foot">Um dia de cada vez.</div>
  `;
  $$('.nav-btn').forEach(btn => btn.addEventListener('click', () => setRoute(btn.dataset.route)));
}

export function toast(message) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  $('#toast-root').appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

export function openModal({ title, subtitle = '', content = '', onOpen }) {
  const root = $('#modal-root');
  root.innerHTML = `
    <div class="modal-backdrop" id="modal-backdrop">
      <section class="modal" role="dialog" aria-modal="true" aria-label="${title}">
        <div class="modal-grabber"></div>
        <div class="modal-head">
          <div><h3>${title}</h3>${subtitle ? `<p>${subtitle}</p>` : ''}</div>
          <button class="modal-close" id="modal-close" aria-label="Fechar">×</button>
        </div>
        <div class="modal-body">${content}</div>
      </section>
    </div>
  `;
  const previousFocus = document.activeElement;
  const app = $('#app');
  app.inert = true;
  const close = () => {
    document.removeEventListener('keydown', handleKeys);
    app.inert = false;
    root.innerHTML = '';
    if (previousFocus?.isConnected) previousFocus.focus();
    else $('#view').focus();
  };
  const handleKeys = e => {
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    if (e.key !== 'Tab') return;
    const focusable = [...root.querySelectorAll('button:not([disabled]), input, select, textarea, [tabindex="0"]')];
    const first = focusable[0], last = focusable.at(-1);
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
  };
  $('#modal-close')?.addEventListener('click', close);
  $('#modal-backdrop')?.addEventListener('click', e => { if (e.target.id === 'modal-backdrop') close(); });
  document.addEventListener('keydown', handleKeys);
  root.querySelectorAll('.field label').forEach(label => {
    const control = label.parentElement.querySelector('input, textarea, select');
    if (control?.id) label.htmlFor = control.id;
  });
  root.querySelector('input, textarea, select, button')?.focus();
  if (onOpen) onOpen({ close, root });
  return close;
}

async function refresh(silent = true) {
  try {
    const data = await endpoints.state();
    appState.store = data.store;
    appState.summary = data.summary;
    appState.loading = false;
    appState.error = null;
    render();
  } catch (error) {
    appState.loading = false;
    appState.error = error.message;
    render();
    if (!silent) toast(error.message);
  }
}

let saving = false;
export async function mutate(action, successMessage = '') {
  if (saving) return false;
  saving = true;
  const buttons = [...document.querySelectorAll('button:not([disabled])')];
  buttons.forEach(button => button.disabled = true);
  let committed = false;
  try {
    await action();
    committed = true;
    const data = await endpoints.state();
    appState.store = data.store;
    appState.summary = data.summary;
    render();
    if (successMessage) toast(successMessage);
    return true;
  } catch (error) {
    toast(committed ? 'Salvo, mas não consegui atualizar a tela. Recarregue o aplicativo.' : error.message || 'Não foi possível salvar.');
    return false;
  } finally {
    saving = false;
    buttons.forEach(button => button.disabled = false);
  }
}

function render() {
  renderNav();
  renderHeader();
  if (appState.loading || (!appState.store && !['sos', 'apoio'].includes(appState.route))) {
    $('#view').innerHTML = appState.loading
      ? `<div class="card text-center"><p>Carregando...</p></div>`
      : `<div class="card"><h3>Não consegui carregar seus dados</h3><p>${escapeHtml(appState.error || 'Verifique a conexão com o servidor.')}</p><p>SOS e os guias de Apoio continuam disponíveis na navegação.</p><button class="primary-btn" id="retry">Tentar novamente</button></div>`;
    $('#retry')?.addEventListener('click', () => refresh(false));
    return;
  }
  const view = routes[appState.route] || homeView;
  const ctx = {
    state: appState,
    endpoints,
    mutate,
    toast,
    openModal,
    navigate: setRoute,
    refresh,
    appName: APP_NAME
  };
  $('#view').innerHTML = view.html(ctx);
  view.bind?.(ctx);
}

window.addEventListener('hashchange', () => {
  const route = location.hash.replace('#','');
  if (routes[route] && route !== appState.route) {
    appState.route = route;
    localStorage.setItem('meu-caminho-route', route);
    render();
  }
});

if (location.hash.replace('#','') in routes) appState.route = location.hash.replace('#','');
refresh();
window.addEventListener('online', () => refresh());
let currentDay = new Date().toDateString();
setInterval(() => {
  const nextDay = new Date().toDateString();
  if (nextDay !== currentDay) { currentDay = nextDay; refresh(); }
}, 30000);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}
