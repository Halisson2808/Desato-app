const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const net = require('node:net');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
let fake, child, base, directory;
const records = new Map();
const root = path.join(__dirname, '..');
function answer(res, status, data) { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); }
async function request(route, method = 'GET', body, token) {
  const response = await fetch(base + route, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: response.status, data: await response.json(), headers: response.headers };
}
before(async () => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'desato-cloud-test-'));
  // Se a configuração tentar ler JSON por engano, este conteúdo deve causar falha.
  fs.writeFileSync(path.join(directory, 'store.json'), '{dados locais não devem ser lidos');
  fake = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/rest/v1/rpc/desato_record_funnel' && req.method === 'POST') {
      assert.equal(req.headers.apikey,'sb_publishable_test');
      assert.equal(req.headers.authorization,undefined);
      let text='';for await(const chunk of req) text+=chunk;
      const body=JSON.parse(text);records.set('last-funnel',body);
      return answer(res,200,true);
    }
    const token = req.headers.authorization;
    const owner = token === 'Bearer valid-alice' ? 'alice' : token === 'Bearer valid-bob' ? 'bob' : null;
    if (!owner) return answer(res, 401, { error: 'Invalid token' });
    if (url.pathname === '/auth/v1/user') return answer(res, 200, { id: owner, email: `${owner}@example.test` });
    if (url.searchParams.get('user_id') !== `eq.${owner}`) return answer(res, 403, {});
    const table = url.pathname.split('desato_')[1];
    const rows = records.get(table) || [];
    const owned = rows.filter(row => row.user_id === owner);
    if (req.method === 'GET') {
      if (table === 'profiles') return answer(res, 200, [{ user_id: owner, name: owner === 'alice' ? 'Alice' : 'Bob', start_date: '2026-10-06', goal: '' }]);
      return answer(res, 200, owned);
    }
    let text = ''; for await (const chunk of req) text += chunk;
    const body = text ? JSON.parse(text) : {};
    if (req.method === 'POST') {
      if (body.user_id !== owner) return answer(res, 403, {});
      const keys = (url.searchParams.get('on_conflict') || 'user_id,id').split(',');
      const existing = rows.find(row => keys.every(key => row[key] === body[key]));
      if (existing) Object.assign(existing, body); else rows.push(body);
      records.set(table, rows); return answer(res, 200, [body]);
    }
    return answer(res, 200, []);
  });
  await new Promise(resolve => fake.listen(0, '127.0.0.1', resolve));
  const probe = net.createServer(); await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve));
  const port = probe.address().port; await new Promise(resolve => probe.close(resolve));
  base = `http://127.0.0.1:${port}`;
  child = spawn(process.execPath, ['server.js'], { cwd: root, env: { ...process.env, PORT: String(port), DATA_DIR: directory, STORAGE_MODE: 'supabase', FUNNEL_ENABLED:'true', SUPABASE_URL: `http://127.0.0.1:${fake.address().port}`, SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test' }, stdio: ['ignore','pipe','pipe'] });
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Servidor não iniciou')), 60000);
    child.once('error', reject);
    child.once('exit', code => { clearTimeout(timeout); reject(new Error(`Servidor encerrou: ${code}`)); });
    child.stdout.once('data', () => { clearTimeout(timeout); resolve(); });
  });
});
after(async () => {
  if (child?.exitCode === null) { const exited = new Promise(resolve => child.once('exit', resolve)); child.kill(); await exited; }
  if (fake) await new Promise(resolve => fake.close(resolve));
  if (directory) fs.rmSync(directory, { recursive: true, force: true });
});

test('configuração e health públicos funcionam; estado exige autenticação', async () => {
  const health = await request('/api/health'); assert.equal(health.status, 200); assert.equal(health.data.mode, 'supabase');
  const config = await request('/api/config'); assert.equal(config.status, 200); assert.equal(config.data.publishableKey, 'sb_publishable_test');
  assert.equal((await request('/api/state')).status, 401);
  assert.equal((await request('/api/state', 'GET', undefined, 'forged')).status, 401);
  assert.equal((await request('/api/checkin', 'POST', { status: 'clean' })).status, 401);
  assert.equal(fs.readFileSync(path.join(directory, 'store.json'), 'utf8'), '{dados locais não devem ser lidos');
});

test('contas salvam no Supabase e não recebem estado de outra conta', async () => {
  assert.equal((await request('/api/checkin','POST',{ status: 'clean', date: '2026-10-06', note: 'Privado', user_id: 'bob' },'valid-alice')).status, 200);
  const alice = await request('/api/state','GET',undefined,'valid-alice');
  const bob = await request('/api/state','GET',undefined,'valid-bob');
  assert.equal(alice.data.store.profile.name, 'Alice'); assert.equal(alice.data.store.checkins['2026-10-06'].note, 'Privado');
  assert.equal(bob.data.store.profile.name, 'Bob'); assert.deepEqual(bob.data.store.checkins, {});
  assert.equal((await request('/api/checkin','POST',{ status: 'used', date: '2026-10-06' },'valid-bob')).status, 200);
  assert.equal((await request('/api/state','GET',undefined,'valid-alice')).data.store.checkins['2026-10-06'].status, 'clean');
});

test('quiz exige conta, valida respostas e não permite acesso ao resultado de outro usuário', async () => {
  const model = await import('data:text/javascript;base64,' + Buffer.from(fs.readFileSync(path.join(root,'public/js/quiz-model.js'),'utf8')).toString('base64'));
  const quiz = model.QUIZZES[0];
  const answers = Object.fromEntries(quiz.questions.map(q => [q.id,q.options ? q.options[0].value : 0]));
  assert.equal((await request('/api/quiz')).status,401);
  assert.equal((await request('/api/quiz','POST',{quizId:quiz.id,answers})).status,401);
  assert.equal((await request('/api/quiz','POST',{quizId:quiz.id,answers:{}},'valid-alice')).status,400);
  assert.equal((await request('/api/quiz','POST',{quizId:quiz.id,answers,user_id:'bob'},'valid-alice')).status,200);
  assert.equal((await request('/api/quiz','GET',undefined,'valid-alice')).data.quizzes.length,1);
  assert.equal((await request('/api/quiz','GET',undefined,'valid-bob')).data.quizzes.length,0);
});

test('interface, SDK e login são servidos localmente como JavaScript', async () => {
  for (const asset of ['/vendor/supabase.js','/js/auth.js','/js/views/auth.js']) {
    const response = await fetch(base+asset); assert.equal(response.status, 200);
    assert.ok(response.headers.get('content-type').startsWith('application/javascript'));
    assert.ok(response.headers.get('content-security-policy').includes("script-src 'self'"));
  }
});

test('funil recebe respostas sem login e grava somente pelo RPC, sem expor leitura',async()=>{
  const body={id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',token:'a'.repeat(64),quizId:'consumo',answers:{goal:'reduce'},completed:false,revision:1};
  assert.equal((await request('/api/funnel','POST',body)).status,200);
  assert.deepEqual(records.get('last-funnel').p_answers,{goal:'reduce'});
  assert.equal(records.get('last-funnel').p_version,'consumo-v2');
  assert.equal((await request('/api/funnel')).status,404);
  assert.equal((await request('/api/funnel','POST',{...body,completed:true})).status,400);
  assert.equal((await request('/api/funnel','POST',{...body,token:'short'})).status,400);
});
