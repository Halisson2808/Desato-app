import { initializeAuth, auth } from './auth.js';
import { authView } from './views/auth.js';
import { endpoints, setAccountId } from './api.js';
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
  authMode: new URLSearchParams(location.search).has('reset') ? 'reset' : 'login',
  authFeedback: '',
  authUser: null,
  storageMode: 'supabase',
  authReady: false,
  error: null,
  ui: { foodTab: 'hoje', routinePeriod: 'manha', supportGuideId: null, supportFavoritesOnly: false }
};

let accountGeneration = 0;
let closeActiveModal = null;
const returnToQuiz = new URLSearchParams(location.search).get('next') === 'quiz';
function showAuth(mode = 'login', message = '') {
  appState.authMode = mode; appState.authFeedback = message;
  appState.route = 'inicio'; render();
}
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
  const signedOut = appState.storageMode === 'supabase' && !appState.authUser;
  $('#app-header').innerHTML = `
    <div class="header-row">
      <button class="desato-brand" id="header-home" aria-label="Desato — ir para o início">
        <img class="desato-brand-mark" src="/icon.svg" width="40" height="40" alt="" aria-hidden="true">
        <span class="desato-wordmark">${APP_NAME}</span>
      </button>
      <button class="profile-avatar-btn" id="header-profile" aria-label="${signedOut ? 'Entrar na conta' : 'Abrir perfil'}" title="${signedOut ? 'Entrar' : 'Meu perfil'}">
        ${signedOut ? icon('profile') : initial ? escapeHtml(initial) : icon('profile')}
      </button>
    </div>
  `;
  $('#header-home')?.addEventListener('click', () => setRoute('inicio'));
  $('#header-profile')?.addEventListener('click', () => signedOut ? showAuth() : setRoute('perfil'));
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
  closeActiveModal?.();
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
    if (closeActiveModal === close) closeActiveModal = null;
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
  closeActiveModal = close;
  if (onOpen) onOpen({ close, root });
  return close;
}

async function refresh(silent = true) {
  const generation = accountGeneration;
  try {
    const data = await endpoints.state();
    if (generation !== accountGeneration) return;
    appState.store = data.store;
    appState.summary = data.summary;
    appState.loading = false;
    appState.error = null;
    render();
  } catch (error) {
    if (generation !== accountGeneration) return;
    if (error.status === 401) appState.store = null;
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
  const generation = accountGeneration;
  let committed = false;
  try {
    await action();
    committed = true;
    const data = await endpoints.state();
    if (generation !== accountGeneration) return false;
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
  const loginVisible = appState.storageMode === 'supabase' && (!appState.authReady || appState.authMode === 'reset' || !appState.authUser);
  $('#app').classList.toggle('auth-shell', loginVisible);
  if (loginVisible) {
    $('#app-header').innerHTML = ''; $('#bottom-nav').innerHTML = '';
    if (!appState.authReady) {
      $('#view').innerHTML = `<div class="auth-loading"><img src="/icon.svg" width="48" height="48" alt="Desato"><p>${escapeHtml(appState.error || 'Preparando seu acesso…')}</p>${appState.error ? '<button class="primary-btn" id="auth-retry">Tentar novamente</button>' : ''}</div>`;
      $('#auth-retry')?.addEventListener('click', () => location.reload());
      return;
    }
    const ctx = { state: appState, auth, email: localStorage.getItem('desato-remember-email') || '', showAuth, navigate: setRoute, passwordChanged: async () => {
      appState.authMode = 'login'; sessionStorage.removeItem('desato-password-recovery'); history.replaceState(null, '', '/app#inicio');
      appState.route = 'inicio'; await refresh(false); toast('Senha atualizada.');
    } };
    $('#view').innerHTML = authView.html(ctx); authView.bind(ctx); return;
  }
  renderNav();
  renderHeader();
  if ((appState.loading && !['sos', 'apoio'].includes(appState.route)) || (!appState.store && !['sos', 'apoio'].includes(appState.route))) {
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
    appName: APP_NAME,
    auth,
    signOut: () => auth.signOut(),
    showAuth
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
async function start() {
  render();
  try {
    const result = await initializeAuth((event, session) => {
      if (!appState.authReady || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') return;
      if (event === 'PASSWORD_RECOVERY') { appState.authMode = 'reset'; render(); return; }
      const nextId = session?.user?.id;
      if (nextId === appState.authUser?.id && event === 'USER_UPDATED') { appState.authUser = session.user; refresh(false); return; }
      if (nextId === appState.authUser?.id && event !== 'SIGNED_OUT') return;
      accountGeneration += 1;
      appState.store = null; appState.summary = null; appState.error = null;
      appState.authUser = session?.user || null; setAccountId(session?.user?.id); appState.loading = Boolean(session);
      appState.ui.supportGuideId = null; appState.ui.supportFavoritesOnly = false;
      if (!session) { appState.route = 'inicio'; appState.authMode = 'login'; closeActiveModal?.(); $('#modal-root').innerHTML = ''; $('#toast-root').innerHTML = ''; $('#app').inert = false; render(); }
      else { if (returnToQuiz) { location.assign('/quiz?retomar=1'); return; } appState.authMode = 'login'; appState.route = 'inicio'; refresh(false); }
    });
    appState.storageMode = result.config.mode; appState.authUser = result.session?.user || null; setAccountId(result.session?.user?.id); appState.authReady = true;
    if (returnToQuiz && result.session && !result.recovery) { location.assign('/quiz?retomar=1'); return; }
    if (result.recovery) appState.authMode = 'reset';
    if (appState.authMode === 'reset' && !result.session) showAuth('login', 'O link de recuperação é inválido ou expirou. Solicite outro link.');
    else if (result.config.mode === 'json' || result.session) await refresh(false);
    else { appState.loading = false; render(); }
  } catch (error) { appState.error = error.message; render(); }
}
start();
window.addEventListener('online', () => { if (appState.storageMode === 'json' || appState.authUser) refresh(); });
let currentDay = new Date().toDateString();
setInterval(() => {
  const nextDay = new Date().toDateString();
  if (nextDay !== currentDay) { currentDay = nextDay; if (appState.storageMode === 'json' || appState.authUser) refresh(); }
}, 30000);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}
