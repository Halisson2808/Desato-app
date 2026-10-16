const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseHTML } = require('linkedom');
const { build } = require('esbuild');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
async function boot(session = null, recovery = false, search = '') {
  const { document } = parseHTML('<html><body><div id="app"><header id="app-header"></header><main id="view" tabindex="-1"></main><nav id="bottom-nav"></nav></div><div id="modal-root"></div><div id="toast-root"></div></body></html>');
  const entries = new Map();
  const storage = { getItem: key => entries.get(key) || null, setItem: (key, value) => entries.set(key, String(value)), removeItem: key => entries.delete(key) };
  let active = session;
  const listeners = [];
  const timers = [];
  const redirects = [];
  const store = id => ({ profile: { name: id === 'alice' ? 'Alice' : 'Bob', email: `${id}@example.test`, startDate: '2026-10-06', goal: '' }, money: { spendPerOuting: 0, outingsPerWeek: 0 }, checkins: {}, routine: { tasks: [], completions: {} }, hydration: {}, groceries: [], sos: { sessions: [] }, support: { plan: null, favoriteGuideIds: [] } });
  const context = vm.createContext({ document, localStorage: storage, sessionStorage: storage, URLSearchParams, URL, console,
    location: { origin: 'http://localhost:4173', hash: '', search, reload() {}, assign: value => redirects.push(value) },
    history: { replaceState() {} }, window: { scrollTo() {}, addEventListener() {} }, navigator: {},
    setTimeout: fn => { timers.push(fn); return 1; }, setInterval() {},
    __init: async onChange => { listeners.push(onChange); return { config: { mode: 'supabase' }, session: active, recovery }; },
    __session: async () => active,
    __auth: { signOut: async () => { active = null; listeners.forEach(listener => listener('SIGNED_OUT', null)); } },
    __message: error => error.message,
    fetch: async () => { const captured = active; return { ok: Boolean(captured), status: captured ? 200 : 401, json: async () => captured ? { store: store(captured.user.id), summary: { streak: 0, todayCheckin: null, month: { clean: 0, used: 0, elapsed: 1 }, money: { saved: 0, cleanDays: 0 }, routine: { done: 0, total: 0 }, cleanDaysTotal: 0 } } : { error: 'Entre' } }; }
  });
  // Empacota o código real; substitui somente o serviço externo de Auth.
  const authStub = `export const initializeAuth = globalThis.__init; export const accessSession = globalThis.__session; export const auth = globalThis.__auth; export const authMessage = globalThis.__message;`;
  const authFile = path.join(root, 'public/js/auth.js');
  const output = await build({ entryPoints: [path.join(root, 'public/js/app.js')], bundle: true, write: false, format: 'iife', platform: 'browser',
    plugins: [{ name: 'fake-auth', setup(builder) { builder.onLoad({ filter: /auth\.js$/ }, args => args.path === authFile ? { contents: authStub, loader: 'js' } : undefined); } }]
  });
  document.defaultView.HTMLElement.prototype.focus = function () {};
  vm.runInContext(output.outputFiles[0].text, context);
  const flush = () => new Promise(resolve => setImmediate(resolve));
  await flush(); await flush();
  const click = selector => document.querySelector(selector).dispatchEvent(new document.defaultView.Event('click'));
  return { document, entries, listeners, timers, redirects, context, click, flush, setSession(value) { active = value; } };

}

test('sem sessão abre a entrada só com e-mail, sem senha nem cadastro', async () => {
  const app = await boot();
  assert.ok(app.document.querySelector('#app').classList.contains('auth-shell'));
  assert.ok(app.document.querySelector('#auth-email'));
  assert.equal(app.document.querySelector('input[type="password"]'), null);
  assert.equal(app.document.querySelector('[data-auth-mode]'), null);
  assert.equal(app.document.querySelector('#bottom-nav').textContent, '');
  assert.doesNotMatch(app.document.querySelector('#view').textContent, /senha|Criar conta|Precisa de apoio|Abrir SOS/i);
});

test('login solicitado pelo quiz volta ao resultado após restaurar ou iniciar sessão', async () => {
  const session = { user:{id:'alice',email:'alice@example.test'},access_token:'token' };
  const restored = await boot(session,false,'?next=quiz');
  assert.deepEqual(restored.redirects,['/quiz?retomar=1']);
  const signedOut = await boot(null,false,'?next=quiz');
  assert.equal(signedOut.redirects.length,0);
  signedOut.setSession(session); signedOut.listeners.forEach(listener => listener('SIGNED_IN',session));
  await signedOut.flush(); assert.deepEqual(signedOut.redirects,['/quiz?retomar=1']);
});

test('sessão restaurada abre painel; sair e trocar conta não reutiliza dados', async () => {
  const app = await boot({ user: { id: 'alice' }, access_token: 'token-alice' });
  assert.equal(app.document.querySelector('#app').classList.contains('auth-shell'), false);
  app.click('#header-profile');
  assert.ok(app.document.querySelector('#view').textContent.includes('Alice'));
  app.setSession(null); app.listeners[0]('SIGNED_OUT', null);
  await app.flush();
  assert.ok(app.document.querySelector('#auth-form'));
  assert.equal(app.document.querySelector('#view').textContent.includes('Alice'), false);
  app.setSession({ user: { id: 'bob' }, access_token: 'token-bob' });
  app.listeners[0]('SIGNED_IN', { user: { id: 'bob' }, access_token: 'token-bob' });
  await app.flush(); await app.flush();
  app.click('#header-profile');
  assert.ok(app.document.querySelector('#view').textContent.includes('Bob'));
  assert.equal(app.document.querySelector('#view').textContent.includes('Alice'), false);
});

test('formulário envia só o e-mail, valida o formato e mostra o erro do servidor', async () => {
  const app = await boot();
  const email = app.document.querySelector('#auth-email');
  const sent = [];
  app.context.__auth.emailLogin = async mail => { sent.push(mail); if (mail === 'sem-compra@example.test') throw new Error('Não encontramos uma compra com este e-mail.'); };
  const submit = async value => { email.value = value; app.document.querySelector('#auth-form').dispatchEvent(new app.document.defaultView.Event('submit', { cancelable: true })); await app.flush(); await app.flush(); };
  await submit('nao-e-email');
  assert.equal(sent.length, 0);
  assert.match(app.document.querySelector('#auth-feedback').textContent, /e-mail válido/);
  await submit('sem-compra@example.test');
  assert.match(app.document.querySelector('#auth-feedback').textContent, /Não encontramos uma compra/);
  await submit('  Alice@Example.test ');
  assert.deepEqual(sent, ['sem-compra@example.test', 'alice@example.test']);
  assert.equal(app.entries.get('desato-remember-email'), 'alice@example.test');
});
