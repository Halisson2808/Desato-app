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
    ['/api/sos-session','POST',{ intensity: 3, action: 'completed-flow' }],
    ['/api/situations/festa','PUT',{ drink: 'Água', refuse: 'Hoje não', leaveAt: '22h' }]
  ];
  for (const [route, method, body] of mutations) await cloud.mutate(alice, route, method, body, date, { situationIds: ['festa'] });
  assert.equal(writes.length, mutations.length);
  for (const route of ['/api/groceries', '/api/routine/tasks', '/api/support/plan']) await assert.rejects(cloud.mutate(alice, route, 'POST', {}, date, {}), error => error.status === 404);
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
    if (table === 'situation_plans') return response([{ situation_id: 'festa', drink: 'Água', refuse: 'Hoje não', leave_at: '22h', updated_at: 'agora' }]);
    assert.ok(!['routine_tasks', 'routine_completions', 'groceries', 'recipe_favorites', 'support_plans', 'support_favorites', 'quiz_answers'].includes(table), table);
    return response([]);
  } });
  const store = await cloud.state(bob, defaults);
  assert.equal(store.profile.email, bob.user.email);
  assert.equal(store.money.spendPerOuting, 80);
  assert.equal(Object.keys(store.checkins).length, 1001);
  assert.equal(store.situations.festa.leaveAt, '22h');
});

test('entrada inválida não chega ao banco e erros SQL não vazam dados pessoais', async () => {
  let calls = 0;
  const cloud = createCloud({ url: 'https://example.test', key: 'public', fetchImpl: async () => { calls++; return response({ message: 'SQL com dados privados' }, 400); } });
  for (const [route, method, body] of [
    ['/api/checkin','POST',{ status: 'bad' }],
    ['/api/profile','PUT',{ email: 'bob@example.test' }],
    ['/api/situations/festa','PUT',{ drink: ' ', refuse: 'a', leaveAt: 'b' }],
    ['/api/situations/missing','PUT',{ drink: 'a', refuse: 'b', leaveAt: 'c' }],
    ['/api/journey','POST',{ day: 31, answer: 'x' }]
  ]) await assert.rejects(cloud.mutate(alice, route, method, body, date, { situationIds: ['festa'] }));
  assert.equal(calls, 0);
  await assert.rejects(cloud.mutate(alice, '/api/checkin', 'POST', { status: 'clean' }, date, {}), error => error.status === 400 && !error.message.includes('privados'));
});
