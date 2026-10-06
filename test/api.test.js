const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
let child, directory, base;
const localDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};
async function request(route, method = 'GET', body) {
  const response = await fetch(base + route, { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: response.status, data: await response.json() };
}
before(async () => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'companheiro-test-'));
  const probe = net.createServer();
  await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve));
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  base = `http://127.0.0.1:${port}`;
  child = spawn(process.execPath, ['server.js'], { cwd: path.join(__dirname, '..'), env: { ...process.env, PORT: String(port), DATA_DIR: directory }, stdio: ['ignore', 'pipe', 'pipe'] });
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Servidor não iniciou')), 60000);
    child.once('error', reject);
    child.once('exit', code => { clearTimeout(timeout); reject(new Error(`Servidor encerrou: ${code}`)); });
    child.stdout.once('data', () => { clearTimeout(timeout); resolve(); });
  });
});
after(async () => {
  if (child && child.exitCode === null) {
    const exited = new Promise(resolve => child.once('exit', resolve));
    child.kill(); await exited;
  }
  if (directory) fs.rmSync(directory, { recursive: true, force: true });
});
test('cadastro novo não inventa registros nem economia', async () => {
  const { data } = await request('/api/state');
  assert.equal(data.summary.cleanDaysTotal, 0);
  assert.equal(data.summary.money.saved, 0);
  assert.equal(data.summary.month.elapsed, 1);
});
test('perfil valida campos e ignora propriedades desconhecidas', async () => {
  assert.equal((await request('/api/profile', 'PUT', { name: '' })).status, 400);
  assert.equal((await request('/api/profile', 'PUT', { email: 'invalido' })).status, 400);
  assert.equal((await request('/api/profile', 'PUT', { startDate: '2026-02-30' })).status, 400);
  const { data } = await request('/api/profile', 'PUT', { name: 'Ana', admin: true });
  assert.equal(data.profile.name, 'Ana'); assert.equal(data.profile.admin, undefined);
});
test('datas, status, números e booleanos inválidos são rejeitados', async () => {
  for (const body of [{ status: 'other' }, { status: 'clean', date: '2999-01-01' }, { status: 'clean', date: '__proto__' }]) {
    assert.equal((await request('/api/checkin', 'POST', body)).status, 400);
  }
  assert.equal((await request('/api/hydration', 'POST', { cups: 1.5 })).status, 400);
  assert.equal((await request('/api/money', 'PUT', { spendPerOuting: 'Infinity', outingsPerWeek: 2 })).status, 400);
  assert.equal((await request('/api/routine/complete', 'POST', { taskId: 'agua', completed: 'false' })).status, 400);
  assert.equal((await request('/api/checkin', 'POST', null)).status, 400);
  const malformed = await fetch(base + '/api/profile', { method: 'PUT', body: '{' });
  assert.equal(malformed.status, 400);
});
test('registros e economia têm resultados consistentes', async () => {
  await request('/api/money', 'PUT', { spendPerOuting: 80, outingsPerWeek: 2 });
  const clean = await request('/api/checkin', 'POST', { status: 'clean', date: localDate() });
  assert.equal(clean.data.summary.streak, 1);
  assert.equal(clean.data.summary.money.weekly, 160);
  assert.ok(Math.abs(clean.data.summary.money.saved - 8320/365) < 0.0001);
  const used = await request('/api/checkin', 'POST', { status: 'used', note: 'Teste' });
  assert.equal(used.data.summary.streak, 0);
  assert.equal(used.data.summary.month.used, 1);
});
test('mutações concorrentes preservam todos os itens e geram IDs únicos', async () => {
  const results = await Promise.all(Array.from({ length: 20 }, (_, i) => request('/api/groceries', 'POST', { text: `Item ${i}` })));
  assert.ok(results.every(result => result.status === 200));
  const ids = results.map(result => result.data.item.id);
  assert.equal(new Set(ids).size, 20);
  const { data } = await request('/api/state');
  assert.ok(ids.every(id => data.store.groceries.some(item => item.id === id)));
});
test('rotina: criar, concluir, pausar, editar e excluir', async () => {
  const created = await request('/api/routine/tasks', 'POST', { title: 'Teste', period: 'noite' });
  const id = created.data.task.id;
  assert.equal((await request('/api/routine/complete', 'POST', { taskId: id, completed: true })).data.summary.routine.done, 1);
  assert.equal((await request(`/api/routine/tasks/${id}`, 'PATCH', { active: false })).data.summary.routine.done, 0);
  await request(`/api/routine/tasks/${id}`, 'PATCH', { title: 'Editado' });
  const removed = await request(`/api/routine/tasks/${id}`, 'DELETE');
  assert.equal(removed.data.routine.tasks.some(task => task.id === id), false);
  assert.equal(removed.data.routine.completions[localDate()][id], undefined);
});
test('hidratação, compras e SOS persistem', async () => {
  assert.equal((await request('/api/hydration', 'POST', { cups: 8 })).data.cups, 8);
  const grocery = await request('/api/groceries', 'POST', { text: 'Maçã' });
  const id = grocery.data.item.id;
  assert.equal((await request(`/api/groceries/${id}`, 'PATCH', { checked: true })).data.item.checked, true);
  await request(`/api/groceries/${id}`, 'DELETE');
  assert.equal((await request('/api/sos-session', 'POST', { action: 'completed-flow' })).data.session.action, 'completed-flow');
  const saved = JSON.parse(fs.readFileSync(path.join(directory, 'store.json')));
  assert.equal(saved.hydration[localDate()], 8);
  assert.ok(fs.existsSync(path.join(directory, 'store.json.bak')));
});
test('recursos inexistentes, rotas removidas e origens externas são rejeitados', async () => {
  assert.equal((await fetch(base + '/missing.js')).status, 404);
  assert.equal((await request('/api/reset', 'POST', {})).status, 404);
  assert.equal((await fetch(base + '/api/checkin', { method: 'POST', headers: { Origin: 'https://external.example' }, body: '{}' })).status, 403);
});
test('limite de payload responde 413 sem derrubar o servidor', async () => {
  const response = await fetch(base + '/api/checkin', { method: 'POST', body: JSON.stringify({ note: 'á'.repeat(600000), status: 'clean' }) });
  assert.equal(response.status, 413);
  assert.equal((await request('/api/state')).status, 200);
});
test('arquivo corrompido é preservado', async () => {
  const file = path.join(directory, 'store.json');
  const previous = fs.readFileSync(file);
  fs.writeFileSync(file, '{quebrado');
  assert.equal((await request('/api/state')).status, 500);
  assert.equal(fs.readFileSync(file, 'utf8'), '{quebrado');
  fs.writeFileSync(file, previous);
});


test('apoio salva plano validado e preserva os demais dados', async () => {
  const before = (await request('/api/state')).data.store;
  const plan = { situation: ' Quando me oferecerem bebida ', firstAction: ' Dizer minha decisão ', exit: 'Ir embora', help: 'Pedir companhia', unexpected: 'ignorar' };
  const result = await request('/api/support/plan', 'PUT', plan);
  assert.equal(result.status, 200);
  assert.equal(result.data.support.plan.situation, 'Quando me oferecerem bebida');
  assert.equal(result.data.support.plan.unexpected, undefined);
  assert.ok(result.data.support.plan.updatedAt);
  const after = (await request('/api/state')).data.store;
  for (const key of ['profile', 'money', 'checkins', 'routine', 'hydration', 'groceries', 'sos']) assert.deepEqual(after[key], before[key]);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(directory, 'store.json'))).support.plan, after.support.plan);
  for (const body of [{ situation: '', firstAction: 'Fazer algo' }, { situation: 'Teste', firstAction: ' ' }, { situation: 'Teste', firstAction: 'x'.repeat(501) }, { situation: 'Teste', firstAction: 'Ação', help: null }, { situation: [], firstAction: 'Ação' }]) {
    assert.equal((await request('/api/support/plan', 'PUT', body)).status, 400);
  }
  assert.deepEqual((await request('/api/support')).data.support.plan, after.support.plan);
});

test('favoritos de apoio são idempotentes e preservados em chamadas concorrentes', async () => {
  const endpoint = '/api/support/favorites/pressao-amigos';
  assert.equal((await request(endpoint, 'PATCH', { favorite: true })).status, 200);
  await request(endpoint, 'PATCH', { favorite: true });
  assert.deepEqual((await request('/api/support')).data.support.favoriteGuideIds, ['pressao-amigos']);
  await Promise.all(['festa-encontro', 'meus-gatilhos', 'acompanhamento'].map(id => request(`/api/support/favorites/${id}`, 'PATCH', { favorite: true })));
  assert.equal((await request('/api/support')).data.support.favoriteGuideIds.length, 4);
  assert.equal((await request(endpoint, 'PATCH', { favorite: 'false' })).status, 400);
  assert.equal((await request('/api/support/favorites/inexistente', 'PATCH', { favorite: true })).status, 404);
  await request(endpoint, 'PATCH', { favorite: false });
  assert.equal((await request('/api/support')).data.support.favoriteGuideIds.includes('pressao-amigos'), false);
});

test('arquivo antigo recebe Apoio sem perder histórico e com backup da versão anterior', async () => {
  const file = path.join(directory, 'store.json');
  const previous = JSON.parse(fs.readFileSync(file));
  const legacy = { ...previous, version: 2 };
  delete legacy.support;
  fs.writeFileSync(file, JSON.stringify(legacy));
  const { data, status } = await request('/api/state');
  assert.equal(status, 200);
  assert.deepEqual(data.store.support, { plan: null, favoriteGuideIds: [] });
  assert.equal(data.store.version, 3);
  for (const key of Object.keys(legacy).filter(key => key !== 'version')) assert.deepEqual(data.store[key], legacy[key]);
  assert.deepEqual(JSON.parse(fs.readFileSync(file + '.bak')), legacy);
  assert.deepEqual(JSON.parse(fs.readFileSync(file)).support, data.store.support);
});

test('dados de Apoio corrompidos não são redefinidos silenciosamente', async () => {
  const file = path.join(directory, 'store.json');
  const previous = fs.readFileSync(file);
  const invalid = JSON.parse(previous);
  invalid.support = { plan: null, favoriteGuideIds: 'incorreto' };
  fs.writeFileSync(file, JSON.stringify(invalid));
  assert.equal((await request('/api/state')).status, 500);
  assert.deepEqual(JSON.parse(fs.readFileSync(file)), invalid);
  fs.writeFileSync(file, previous);
});

test('logo e módulos de Apoio são servidos com tipos aceitos pelo navegador', async () => {
  const logo = await fetch(base + '/icon.svg');
  assert.equal(logo.status, 200);
  assert.ok(logo.headers.get('content-type').startsWith('image/svg+xml'));
  assert.ok((await logo.text()).includes('<svg'));
  for (const asset of ['/js/app.js', '/js/views/support.js', '/js/content/support-guides.js']) {
    const response = await fetch(base + asset);
    assert.equal(response.status, 200);
    assert.ok(response.headers.get('content-type').startsWith('application/javascript'), asset);
    assert.equal((await response.text()).includes('<!doctype html>'), false);
  }
});
