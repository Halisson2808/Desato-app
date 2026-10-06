const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const { randomUUID } = require('crypto');
const { createCloud } = require('./lib/supabase.cjs');
const cloudConfig = require('./config/supabase.json');
const STORAGE_MODE = process.env.STORAGE_MODE || 'supabase';
if (!['supabase', 'json'].includes(STORAGE_MODE)) throw new Error('STORAGE_MODE inválido.');
const SUPABASE_URL = process.env.SUPABASE_URL || cloudConfig.url;
const SUPABASE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || cloudConfig.publishableKey;
if (!SUPABASE_KEY.startsWith('sb_publishable_')) throw new Error('Use apenas a chave pública publishable do Supabase.');
const cloud = createCloud({ url: SUPABASE_URL, key: SUPABASE_KEY });

const PORT = process.env.PORT || 4173;
const HOST = process.env.HOST || '127.0.0.1';
if (STORAGE_MODE === 'json' && !['127.0.0.1', 'localhost', '::1'].includes(HOST)) throw new Error('Modo JSON permitido apenas em endereço local.');
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(__dirname, 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');
// Carrega o mesmo conteúdo ESM do navegador sem alterar o servidor CommonJS.
const supportGuidesSource = fs.readFileSync(path.join(PUBLIC_DIR, 'js/content/support-guides.js'), 'utf8');
const supportGuidesModule = import('data:text/javascript;base64,' + Buffer.from(supportGuidesSource).toString('base64'));

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json; charset=utf-8'
};

function localISO(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(date, delta) {
  const d = new Date(date);
  d.setDate(d.getDate() + delta);
  return d;
}

function defaultStore() {
  const today = new Date();
  const start = today;
  const checkins = {};

  return {
    version: 3,
    profile: {
      name: 'Você',
      email: '',
      startDate: localISO(start),
      goal: 'Ficar sem álcool, um dia de cada vez.'
    },
    money: {
      spendPerOuting: 0,
      outingsPerWeek: 0,
      currency: 'BRL'
    },
    checkins,
    routine: {
      tasks: [
        { id: 'agua', title: 'Beber um copo de água ao acordar', period: 'manha', icon: '💧', active: true },
        { id: 'cafe', title: 'Tomar um café da manhã simples', period: 'manha', icon: '🍌', active: true },
        { id: 'caminhada', title: 'Caminhar por 15 minutos', period: 'tarde', icon: '🚶', active: true },
        { id: 'atividade', title: 'Fazer algo que ocupe a mente', period: 'tarde', icon: '🎯', active: true },
        { id: 'jantar', title: 'Jantar no horário', period: 'noite', icon: '🍲', active: true },
        { id: 'desacelerar', title: 'Desacelerar antes de dormir', period: 'noite', icon: '🌙', active: true }
      ],
      completions: {}
    },
    hydration: {},
    groceries: [
      { id: 'banana', text: 'Banana', checked: false },
      { id: 'aveia', text: 'Aveia', checked: false },
      { id: 'ovos', text: 'Ovos', checked: false },
      { id: 'arroz', text: 'Arroz', checked: false },
      { id: 'feijao', text: 'Feijão', checked: false },
      { id: 'frango', text: 'Frango', checked: false }
    ],
    recipes: {
      favorites: []
    },
    sos: {
      sessions: []
    },
    support: { plan: null, favoriteGuideIds: [] }
  };
}

function ensureStore() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(STORE_FILE)) {
    fs.writeFileSync(STORE_FILE, JSON.stringify(defaultStore(), null, 2));
    return;
  }
  const parsed = JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'));
  if (!parsed || !parsed.profile || !parsed.money || !parsed.checkins ||
      !Array.isArray(parsed.routine?.tasks) || !parsed.routine.completions ||
      !parsed.hydration || !Array.isArray(parsed.groceries) || !Array.isArray(parsed.sos?.sessions)) {
    throw new Error('Arquivo de dados inválido. Restaure uma cópia válida; o original foi preservado.');
  }
}

function readStore() {
  ensureStore();
  const store = JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'));
  if (!Object.hasOwn(store, 'support')) {
    store.support = { plan: null, favoriteGuideIds: [] };
    store.version = Math.max(Number(store.version) || 1, 3);
    writeStore(store);
  }
  if (!store.support || typeof store.support !== 'object' || Array.isArray(store.support) ||
      !Array.isArray(store.support.favoriteGuideIds) ||
      !(store.support.plan === null || (typeof store.support.plan === 'object' && !Array.isArray(store.support.plan)))) {
    throw new Error('Dados de apoio inválidos. O arquivo foi preservado.');
  }
  return store;
}

function writeStore(store) {
  const temporary = `${STORE_FILE}.tmp`;
  if (fs.existsSync(STORE_FILE)) fs.copyFileSync(STORE_FILE, `${STORE_FILE}.bak`);
  fs.writeFileSync(temporary, JSON.stringify(store, null, 2), { mode: 0o600 });
  fs.renameSync(temporary, STORE_FILE);
  return store;
}

function invalid(message) {
  const error = new Error(message);
  error.status = 400;
  throw error;
}

function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
      Number.isNaN(Date.parse(value)) || new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) !== value || value > localISO()) {
    invalid('Informe uma data válida, até hoje.');
  }
  return value;
}

function finiteNumber(value, min, max, label, integer = false) {
  if ((typeof value !== 'number' && typeof value !== 'string') || value === '' ||
      !Number.isFinite(Number(value)) || Number(value) < min || Number(value) > max ||
      (integer && !Number.isInteger(Number(value)))) invalid(`${label} inválido.`);
  return Number(value);
}

function boolean(value) {
  if (typeof value !== 'boolean') invalid('Informe verdadeiro ou falso.');
  return value;
}

function json(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let bytes = 0, exceeded = false;
    req.on('data', chunk => {
      bytes += chunk.length;
      if (bytes > 1_000_000) {
        if (!exceeded) {
          exceeded = true;
          const error = new Error('Payload muito grande');
          error.status = 413;
          reject(error);
        }
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (exceeded) return;
      const body = Buffer.concat(chunks).toString('utf8');
      if (!body) return resolve({});
      try { resolve(JSON.parse(body)); }
      catch {
        const error = new Error('JSON inválido');
        error.status = 400;
        reject(error);
      }
    });
    req.on('error', reject);
    req.on('aborted', () => reject(new Error('Requisição interrompida')));
  });
}

function monthStats(store, ref = new Date()) {
  const year = ref.getFullYear();
  const month = ref.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  let clean = 0;
  let used = 0;
  let unmarked = 0;
  for (let d = new Date(first); d <= last && d <= ref; d = addDays(d, 1)) {
    if (localISO(d) < store.profile.startDate) continue;
    const item = store.checkins[localISO(d)];
    if (!item) unmarked += 1;
    else if (item.status === 'clean') clean += 1;
    else used += 1;
  }
  return { clean, used, unmarked, elapsed: clean + used + unmarked };
}

function currentStreak(store) {
  let streak = 0;
  let d = new Date();
  const todayKey = localISO(d);
  const today = store.checkins[todayKey];
  if (!today) d = addDays(d, -1);
  while (true) {
    const item = store.checkins[localISO(d)];
    if (!item || item.status !== 'clean') break;
    streak += 1;
    d = addDays(d, -1);
  }
  return streak;
}

function cleanDaysTotal(store) {
  return Object.entries(store.checkins).filter(([date, x]) => date <= localISO() && x && x.status === 'clean').length;
}

function computeMoney(store) {
  const perOuting = Number(store.money.spendPerOuting) || 0;
  const timesWeek = Number(store.money.outingsPerWeek) || 0;
  const weekly = perOuting * timesWeek;
  const monthly = weekly * 52 / 12;
  const annual = weekly * 52;
  const dailyEquivalent = annual / 365;
  const cleanDays = cleanDaysTotal(store);
  const saved = dailyEquivalent * cleanDays;
  return { weekly, monthly, annual, dailyEquivalent, saved, cleanDays };
}

function todayRoutine(store) {
  const key = localISO();
  const completed = store.routine.completions[key] || {};
  const active = store.routine.tasks.filter(t => t.active !== false);
  const done = active.filter(t => completed[t.id]).length;
  return { done, total: active.length };
}

function summary(store) {
  return {
    today: localISO(),
    streak: currentStreak(store),
    cleanDaysTotal: cleanDaysTotal(store),
    month: monthStats(store),
    money: computeMoney(store),
    routine: todayRoutine(store),
    todayCheckin: store.checkins[localISO()] || null
  };
}

async function handleApi(req, res, pathname) {
  const { supportGuides } = await supportGuidesModule;
  const method = req.method || 'GET';
  const body = ['POST', 'PUT', 'PATCH'].includes(method) ? await readBody(req) : {};
  if (!body || Array.isArray(body) || typeof body !== 'object') invalid('Envie um objeto JSON.');
  if (pathname === '/api/config' && method === 'GET') return json(res, 200, { mode: STORAGE_MODE, supabaseUrl: SUPABASE_URL, publishableKey: SUPABASE_KEY });
  if (pathname === '/api/health' && method === 'GET') return json(res, 200, { app: 'desato', mode: STORAGE_MODE });
  if (STORAGE_MODE === 'supabase') {
    const session = await cloud.authenticate(req);
    if (method === 'GET' && ['/api/state', '/api/summary', '/api/support'].includes(pathname)) {
      const store = await cloud.state(session, defaultStore);
      if (pathname === '/api/state') return json(res, 200, { store, summary: summary(store) });
      return json(res, 200, pathname === '/api/summary' ? summary(store) : { support: store.support });
    }
    await cloud.mutate(session, pathname, method, body, value => validDate(value ?? localISO()), supportGuides.map(guide => guide.id));
    return json(res, 200, { ok: true });
  }
  let store = readStore();

  if (pathname === '/api/state' && method === 'GET') {
    return json(res, 200, { store, summary: summary(store) });
  }

  if (pathname === '/api/summary' && method === 'GET') {
    return json(res, 200, summary(store));
  }

  if (pathname === '/api/support' && method === 'GET') {
    return json(res, 200, { support: store.support });
  }

  if (pathname === '/api/support/plan' && method === 'PUT') {
    const plan = {};
    for (const key of ['situation', 'firstAction', 'exit', 'help']) {
      const value = Object.hasOwn(body, key) ? body[key] : '';
      if (typeof value !== 'string' || value.trim().length > 500) invalid('Use textos de até 500 caracteres no plano.');
      plan[key] = value.trim();
    }
    if (!plan.situation || !plan.firstAction) invalid('Preencha a situação e sua primeira ação.');
    plan.updatedAt = new Date().toISOString();
    store.support.plan = plan;
    writeStore(store);
    return json(res, 200, { support: store.support });
  }

  if (pathname.startsWith('/api/support/favorites/') && method === 'PATCH') {
    const id = decodeURIComponent(pathname.slice('/api/support/favorites/'.length));
    if (!supportGuides.some(guide => guide.id === id)) return json(res, 404, { error: 'Guia não encontrado.' });
    const favorite = boolean(body.favorite);
    const ids = new Set(store.support.favoriteGuideIds);
    if (favorite) ids.add(id);
    else ids.delete(id);
    store.support.favoriteGuideIds = [...ids];
    writeStore(store);
    return json(res, 200, { support: store.support });
  }

  if (pathname === '/api/profile' && method === 'PUT') {
    const next = { ...store.profile };
    for (const [key, limit] of [['name', 80], ['email', 254], ['goal', 240]]) {
      if (!(key in body)) continue;
      if (typeof body[key] !== 'string' || body[key].trim().length > limit) invalid('Dados do perfil inválidos.');
      next[key] = body[key].trim();
    }
    if (!next.name) invalid('Informe seu nome.');
    if (next.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next.email)) invalid('Informe um e-mail válido.');
    if ('startDate' in body) next.startDate = validDate(body.startDate);
    store.profile = next;
    writeStore(store);
    return json(res, 200, { profile: store.profile, summary: summary(store) });
  }

  if (pathname === '/api/money' && method === 'PUT') {
    store.money = {
      ...store.money,
      spendPerOuting: finiteNumber(body.spendPerOuting, 0, 1000000, 'Gasto'),
      outingsPerWeek: finiteNumber(body.outingsPerWeek, 0, 14, 'Frequência')
    };
    writeStore(store);
    return json(res, 200, { money: store.money, computed: computeMoney(store), summary: summary(store) });
  }

  if (pathname === '/api/checkin' && method === 'POST') {
    const date = validDate(body.date ?? localISO());
    if (!['clean', 'used'].includes(body.status)) invalid('Registro inválido.');
    const status = body.status;
    store.checkins[date] = { status, note: String(body.note || '').slice(0, 500) };
    writeStore(store);
    return json(res, 200, { checkin: store.checkins[date], date, summary: summary(store) });
  }

  if (pathname === '/api/hydration' && method === 'POST') {
    const date = validDate(body.date ?? localISO());
    const next = finiteNumber(body.cups, 0, 8, 'Quantidade de copos', true);
    store.hydration[date] = next;
    writeStore(store);
    return json(res, 200, { date, cups: next });
  }

  if (pathname === '/api/sos-session' && method === 'POST') {
    const session = {
      id: `sos_${randomUUID()}`,
      createdAt: new Date().toISOString(),
      intensity: finiteNumber(body.intensity ?? 3, 1, 5, 'Intensidade', true),
      action: String(body.action || 'opened').slice(0, 80)
    };
    store.sos.sessions.unshift(session);
    store.sos.sessions = store.sos.sessions.slice(0, 100);
    writeStore(store);
    return json(res, 200, { session });
  }

  if (pathname === '/api/groceries' && method === 'POST') {
    const text = String(body.text || '').trim();
    if (!text) return json(res, 400, { error: 'Informe um item.' });
    const item = { id: `g_${randomUUID()}`, text: text.slice(0, 80), checked: false };
    store.groceries.push(item);
    writeStore(store);
    return json(res, 200, { item, groceries: store.groceries });
  }

  if (pathname.startsWith('/api/groceries/') && method === 'PATCH') {
    const id = decodeURIComponent(pathname.split('/').pop());
    const item = store.groceries.find(g => g.id === id);
    if (!item) return json(res, 404, { error: 'Item não encontrado.' });
    if ('checked' in body) item.checked = boolean(body.checked);
    if ('text' in body) item.text = String(body.text).trim().slice(0, 80) || item.text;
    writeStore(store);
    return json(res, 200, { item, groceries: store.groceries });
  }

  if (pathname.startsWith('/api/groceries/') && method === 'DELETE') {
    const id = decodeURIComponent(pathname.split('/').pop());
    store.groceries = store.groceries.filter(g => g.id !== id);
    writeStore(store);
    return json(res, 200, { groceries: store.groceries });
  }

  if (pathname === '/api/routine/tasks' && method === 'POST') {
    const title = String(body.title || '').trim();
    if (!title) return json(res, 400, { error: 'Informe uma tarefa.' });
    const task = {
      id: `t_${randomUUID()}`,
      title: title.slice(0, 100),
      period: ['manha', 'tarde', 'noite'].includes(body.period) ? body.period : 'tarde',
      icon: String(body.icon || '✓').slice(0, 4),
      active: true
    };
    store.routine.tasks.push(task);
    writeStore(store);
    return json(res, 200, { task, routine: store.routine, summary: summary(store) });
  }

  if (pathname.startsWith('/api/routine/tasks/') && method === 'PATCH') {
    const id = decodeURIComponent(pathname.split('/').pop());
    const task = store.routine.tasks.find(t => t.id === id);
    if (!task) return json(res, 404, { error: 'Tarefa não encontrada.' });
    if ('title' in body) task.title = String(body.title).trim().slice(0, 100) || task.title;
    if ('period' in body && ['manha', 'tarde', 'noite'].includes(body.period)) task.period = body.period;
    if ('active' in body) task.active = boolean(body.active);
    if ('icon' in body) task.icon = String(body.icon).slice(0, 4) || task.icon;
    writeStore(store);
    return json(res, 200, { task, routine: store.routine, summary: summary(store) });
  }

  if (pathname.startsWith('/api/routine/tasks/') && method === 'DELETE') {
    const id = decodeURIComponent(pathname.split('/').pop());
    store.routine.tasks = store.routine.tasks.filter(t => t.id !== id);
    for (const date of Object.keys(store.routine.completions)) {
      delete store.routine.completions[date][id];
    }
    writeStore(store);
    return json(res, 200, { routine: store.routine, summary: summary(store) });
  }

  if (pathname === '/api/routine/complete' && method === 'POST') {
    const date = validDate(body.date ?? localISO());
    const taskId = String(body.taskId || '');
    if (!store.routine.tasks.some(t => t.id === taskId)) {
      return json(res, 404, { error: 'Tarefa não encontrada.' });
    }
    if (!store.routine.completions[date]) store.routine.completions[date] = {};
    store.routine.completions[date][taskId] = boolean(body.completed);
    writeStore(store);
    return json(res, 200, { completions: store.routine.completions[date], summary: summary(store) });
  }

  return json(res, 404, { error: 'Rota não encontrada.' });
}

function serveStatic(req, res, pathname) {
  let requested = pathname === '/' ? '/index.html' : pathname;
  requested = decodeURIComponent(requested);
  const safe = path.normalize(requested).replace(/^([.][.][\/\\])+/, '');
  let filePath = path.join(PUBLIC_DIR, safe);
  if (path.relative(PUBLIC_DIR, filePath).startsWith('..') || path.isAbsolute(path.relative(PUBLIC_DIR, filePath))) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stat) => {
    if (!err && stat.isDirectory()) filePath = path.join(filePath, 'index.html');
    fs.readFile(filePath, (readErr, data) => {
      if (readErr) {
        if (path.extname(requested)) { res.writeHead(404); res.end('Not found'); return; }
        // SPA fallback
        fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (fallbackErr, fallback) => {
          if (fallbackErr) {
            res.writeHead(404);
            res.end('Not found');
            return;
          }
          res.writeHead(200, { 'Content-Type': mime['.html'] });
          res.end(fallback);
        });
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        'Content-Type': mime[ext] || 'application/octet-stream',
        'Cache-Control': 'no-cache'
      });
      res.end(data);
    });
  });
}

if (STORAGE_MODE === 'json') ensureStore();

const server = http.createServer(async (req, res) => {
  try {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const cloudOrigin = new URL(SUPABASE_URL).origin;
    res.setHeader('Content-Security-Policy', `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' ${cloudOrigin} ${cloudOrigin.replace(/^http/, 'ws')}; img-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'`);
    res.setHeader('Referrer-Policy', 'same-origin');
    if (!['GET', 'HEAD'].includes(req.method) && req.headers.origin && req.headers.origin !== `http://${req.headers.host}`) {
      return json(res, 403, { error: 'Origem não autorizada.' });
    }
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = url.pathname;
    if (pathname.startsWith('/api/')) {
      await handleApi(req, res, pathname);
    } else {
      serveStatic(req, res, pathname);
    }
  } catch (error) {
    console.error(error);
    if (!res.destroyed) json(res, error.status || (error instanceof URIError ? 400 : 500), { error: error.status ? error.message : 'Não foi possível concluir. Verifique os dados e o servidor.' });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`\nDesato App rodando em http://localhost:${PORT}`);
  console.log(STORAGE_MODE === 'supabase' ? 'Dados por conta no Supabase.\n' : `Modo local de desenvolvimento: ${STORE_FILE}\n`);
});
