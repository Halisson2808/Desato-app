const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createCloud } = require('../lib/supabase.cjs');
const alice = { user: { id: 'alice', email: 'alice@example.test' }, token: 'token-alice' };
const bob = { user: { id: 'bob', email: 'bob@example.test' }, token: 'token-bob' };
const response = (data, status = 200) => new Response(JSON.stringify(data), { status });
const date = value => value || '2026-10-06';
const defaults = () => ({ profile: { name: 'Você', email: '', goal: '', startDate: '2026-10-06' }, money: { spendPerOuting: 0, outingsPerWeek: 0, currency: 'BRL' }, routine: { tasks: [], completions: {} }, sos: {}, recipes: {}, support: {} });

test('autenticação rejeita token ausente ou inválido e verifica identidade no Supabase', async () => {
  let calls = 0;
  const cloud = createCloud({ url: 'https://example.test', key: 'public', fetchImpl: async (url, options) => {
    calls++; assert.equal(url, 'https://example.test/auth/v1/user');
    return options.headers.Authorization === 'Bearer token-alice' ? response(alice.user) : response({}, 401);
  } });
  await assert.rejects(cloud.authenticate({ headers: {} }), error => error.status === 401);
  assert.equal(calls, 0);
  await assert.rejects(cloud.authenticate({ headers: { authorization: 'Bearer forged' } }), error => error.status === 401);
  assert.equal((await cloud.authenticate({ headers: { authorization: 'Bearer token-alice' } })).user.id, 'alice');
});

test('todas as gravações usam o proprietário verificado e operações específicas', async () => {
  const writes = [];
  const cloud = createCloud({ url: 'https://example.test', key: 'public', fetchImpl: async (url, options) => {
    const parsed = new URL(url); assert.equal(parsed.searchParams.get('user_id'), 'eq.alice');
    assert.equal(options.headers.Authorization, 'Bearer token-alice');
    if (options.method === 'GET') return response([{ id: 'agua' }]);
    const body = options.body ? JSON.parse(options.body) : undefined;
    if (options.method === 'POST') assert.equal(body.user_id, 'alice');
    writes.push({ table: parsed.pathname, method: options.method, body }); return response([{ id: 'item' }]);
  } });
  const mutations = [
    ['/api/profile','PUT',{ name: 'Ana', user_id: 'bob' }],
    ['/api/money','PUT',{ spendPerOuting: 80, outingsPerWeek: 2, user_id: 'bob' }],
    ['/api/checkin','POST',{ status: 'clean', date: '2026-10-06', note: '' }],
    ['/api/hydration','POST',{ cups: 2, date: '2026-10-06' }],
    ['/api/sos-session','POST',{ intensity: 3, action: 'completed-flow' }],
    ['/api/support/plan','PUT',{ situation: 'Encontro', firstAction: 'Dizer não', exit: '', help: '' }],
    ['/api/support/favorites/retomar','PATCH',{ favorite: true }],
    ['/api/support/favorites/retomar','PATCH',{ favorite: false }],
    ['/api/groceries','POST',{ text: 'Maçã' }],
    ['/api/groceries/item','PATCH',{ checked: true }],
    ['/api/groceries/item','DELETE',{}],
    ['/api/routine/tasks','POST',{ title: 'Caminhar', period: 'tarde', icon: '✓' }],
    ['/api/routine/tasks/agua','PATCH',{ active: false }],
    ['/api/routine/tasks/agua','DELETE',{}],
    ['/api/routine/complete','POST',{ taskId: 'agua', completed: true }]
  ];
  for (const [route, method, body] of mutations) await cloud.mutate(alice, route, method, body, date, ['retomar']);
  assert.equal(writes.length, mutations.length);
  assert.ok(writes.some(write => write.method === 'PATCH'));
  assert.ok(writes.every(write => !write.body || !('checkins' in write.body)));
});

test('estado converte registros do banco e pagina históricos com mais de mil dias', async () => {
  const cloud = createCloud({ url: 'https://example.test', key: 'public', fetchImpl: async (url, options) => {
    const parsed = new URL(url); assert.equal(parsed.searchParams.get('user_id'), 'eq.bob');
    assert.equal(options.headers.Authorization, 'Bearer token-bob');
    const table = parsed.pathname.split('desato_')[1];
    if (table === 'profiles') return response([{ name: 'Bob', start_date: '2023-01-01', goal: 'Meu objetivo' }]);
    if (table === 'money') return response([{ spend_per_outing: '80.00', outings_per_week: '2.00', currency: 'BRL' }]);
    if (table === 'checkins') {
      const offset = Number(parsed.searchParams.get('offset'));
      return response(Array.from({ length: offset === 0 ? 1000 : 1 }, (_, index) => ({ day: String(offset + index), status: 'clean', note: '' })));
    }
    if (table === 'routine_tasks') return response([{ id: 'agua', title: 'Água', period: 'manha', icon: '✓', active: true }]);
    if (table === 'routine_completions') return response([{ day: '2026-10-06', task_id: 'agua', completed: true }]);
    if (table === 'hydration') return response([{ day: '2026-10-06', cups: 4 }]);
    if (table === 'support_plans') return response([{ situation: 'Encontro', first_action: 'Minha ação', exit: '', help: '', updated_at: 'agora' }]);
    if (table === 'support_favorites') return response([{ guide_id: 'retomar' }]);
    return response([]);
  } });
  const store = await cloud.state(bob, defaults);
  assert.equal(store.profile.email, bob.user.email);
  assert.equal(store.money.spendPerOuting, 80);
  assert.equal(Object.keys(store.checkins).length, 1001);
  assert.equal(store.routine.completions['2026-10-06'].agua, true);
  assert.equal(store.support.plan.firstAction, 'Minha ação');
  assert.deepEqual(store.support.favoriteGuideIds, ['retomar']);
});

test('entrada inválida não chega ao banco e erros SQL não vazam dados pessoais', async () => {
  let calls = 0;
  const cloud = createCloud({ url: 'https://example.test', key: 'public', fetchImpl: async () => { calls++; return response({ message: 'SQL com dados privados' }, 400); } });
  for (const [route, method, body] of [
    ['/api/checkin','POST',{ status: 'bad' }],
    ['/api/hydration','POST',{ cups: 9 }],
    ['/api/profile','PUT',{ email: 'bob@example.test' }],
    ['/api/support/plan','PUT',{ situation: ' ', firstAction: 'Ação' }],
    ['/api/support/favorites/missing','PATCH',{ favorite: true }],
    ['/api/routine/tasks','POST',{ title: 'Teste', period: 'bad' }]
  ]) await assert.rejects(cloud.mutate(alice, route, method, body, date, ['retomar']));
  assert.equal(calls, 0);
  await assert.rejects(cloud.mutate(alice, '/api/checkin', 'POST', { status: 'clean' }, date, []), error => error.status === 400 && !error.message.includes('privados'));
});
