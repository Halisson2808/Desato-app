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
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'desato-test-'));
  const probe = net.createServer();
  await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve));
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  base = `http://127.0.0.1:${port}`;
  child = spawn(process.execPath, ['server.js'], { cwd: path.join(__dirname, '..'), env: { ...process.env, PORT: String(port), DATA_DIR: directory, STORAGE_MODE: 'json', FUNNEL_ENABLED:'true' }, stdio: ['ignore', 'pipe', 'pipe'] });
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
  const results = await Promise.all(Array.from({ length: 20 }, () => request('/api/sos-session', 'POST', { intensity: 3, action: 'cancelado etapa:1' })));
  assert.ok(results.every(result => result.status === 200));
  const ids = results.map(result => result.data.session.id);
  assert.equal(new Set(ids).size, 20);
  const { data } = await request('/api/state');
  assert.ok(ids.every(id => data.store.sos.sessions.some(item => item.id === id)));
});
test('hidratação e SOS persistem; rotas antigas não existem mais', async () => {
  assert.equal((await request('/api/hydration', 'POST', { cups: 8 })).data.cups, 8);
  for (const [route, method] of [['/api/groceries', 'POST'], ['/api/routine/tasks', 'POST'], ['/api/support/plan', 'PUT'], ['/api/quiz', 'GET']]) assert.equal((await request(route, method, method === 'GET' ? undefined : {})).status, 404, route);
  assert.equal((await request('/api/sos-session', 'POST', { action: 'completed-flow' })).data.session.action, 'completed-flow');
  const saved = JSON.parse(fs.readFileSync(path.join(directory, 'store.json')));
  assert.equal(saved.hydration[localDate()], 8);
  assert.ok(fs.existsSync(path.join(directory, 'store.json.bak')));
});
test('recursos inexistentes, rotas removidas e origens externas são rejeitados', async () => {
  assert.equal((await fetch(base + '/missing.js')).status, 404);
  assert.equal((await request('/api/reset', 'POST', {})).status, 404);
  assert.equal((await fetch(base + '/api/checkin', { method: 'POST', headers: { Origin: 'https://external.example' }, body: '{}' })).status, 403);
  // Mesmo host em https (produção atrás de proxy) é aceito; protocolo estranho não.
  const host = new URL(base).host;
  assert.notEqual((await fetch(base + '/api/checkin', { method: 'POST', headers: { Origin: `https://${host}`, 'Content-Type': 'application/json' }, body: '{}' })).status, 403);
  assert.equal((await fetch(base + '/api/checkin', { method: 'POST', headers: { Origin: `ftp://${host}` }, body: '{}' })).status, 403);
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


test('logo e módulos das telas são servidos com tipos aceitos pelo navegador', async () => {
  const logo = await fetch(base + '/icon.svg');
  assert.equal(logo.status, 200);
  assert.ok(logo.headers.get('content-type').startsWith('image/svg+xml'));
  assert.ok((await logo.text()).includes('<svg'));
  for (const asset of ['/js/app.js', '/js/views/support.js', '/js/content/journey.js']) {
    const response = await fetch(base + asset);
    assert.equal(response.status, 200);
    assert.ok(response.headers.get('content-type').startsWith('application/javascript'), asset);
    assert.equal((await response.text()).includes('<!doctype html>'), false);
  }
});

test('site, app e cinco rotas de quiz públicos servem as páginas corretas', async () => {
  const pages = [['/', '/js/site.js'], ['/app','/js/app.js'], ...['consumo','vontade','gatilhos','impacto','retomada'].map(id => ['/quiz/'+id,'/js/quiz.js']), ['/quiz','/js/quiz.js']];
  for (const [route,script] of pages) { const response = await fetch(base+route); assert.equal(response.status,200); assert.match(response.headers.get('content-type'),/text\/html/); assert.ok((await response.text()).includes(script)); }
});
test('funil local registra visitantes separados, rejeita token errado e não altera contas',async()=>{
  const body={id:'cccccccc-cccc-4ccc-8ccc-cccccccccccc',token:'c'.repeat(64),quizId:'consumo',answers:{goal:'reduce'},completed:false,revision:1};
  const before=(await request('/api/state')).data.store;
  assert.equal((await request('/api/funnel','POST',body)).status,200);
  assert.equal((await request('/api/funnel','POST',{...body,token:'d'.repeat(64),revision:2})).status,409);
  assert.equal((await request('/api/funnel')).status,404);
  const rows=JSON.parse(fs.readFileSync(path.join(directory,'funnel-responses.json'),'utf8'));
  assert.equal(rows[body.id].answers.goal,'reduce');assert.equal(rows[body.id].token,undefined);
  assert.deepEqual((await request('/api/state')).data.store,before);
});

test('jornada exige ordem e resposta; situações validam id e três respostas', async () => {
  assert.equal((await request('/api/journey', 'POST', { day: 2, answer: 'Pular' })).status, 400);
  assert.equal((await request('/api/journey', 'POST', { day: 1, answer: '   ' })).status, 400);
  assert.equal((await request('/api/journey', 'POST', { day: 31, answer: 'Fora' })).status, 400);
  const first = await request('/api/journey', 'POST', { day: 1, answer: 'Acordar bem' });
  assert.equal(first.status, 200);
  const completedAt = first.data.journey[1].completedAt;
  assert.equal((await request('/api/journey', 'POST', { day: 1, answer: 'Editado' })).data.journey[1].completedAt, completedAt);
  assert.equal((await request('/api/journey', 'POST', { day: 2, answer: 'Parar' })).status, 200);
  assert.equal((await request('/api/situations/inexistente', 'PUT', { drink: 'a', refuse: 'b', leaveAt: 'c' })).status, 404);
  assert.equal((await request('/api/situations/festa', 'PUT', { drink: 'Água', refuse: '', leaveAt: '22h' })).status, 400);
  assert.equal((await request('/api/situations/festa', 'PUT', { drink: 'Água', refuse: 'Hoje não', leaveAt: '22h' })).status, 200);
  const { store } = (await request('/api/state')).data;
  assert.equal(store.journey[1].answer, 'Editado');
  assert.deepEqual(Object.keys(store.journey), ['1', '2']);
  assert.equal(store.situations.festa.refuse, 'Hoje não');
});
