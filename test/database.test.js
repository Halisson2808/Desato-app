const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PGlite } = require('@electric-sql/pglite');
let db;
const alice = '11111111-1111-4111-8111-111111111111';
const bob = '22222222-2222-4222-8222-222222222222';
const root = path.join(__dirname, '..');
const sql = fs.readFileSync(path.join(root, 'supabase/migrations/20261006000100_desato_initial.sql'), 'utf8');
async function asUser(id, action) {
  await db.exec('set role authenticated');
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id]);
  try { return await action(); }
  finally { await db.exec('reset role'); }
}
before(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create schema auth;
    grant usage on schema auth to authenticated;
    create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}'::jsonb);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
    $$;
  `);
  await db.exec(sql);
  await db.query('insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3), ($4, $5, $6)', [alice, 'alice@example.test', { name: 'Alice' }, bob, 'bob@example.test', { name: 'Bob' }]);
});
after(async () => { if (db) await db.close(); });

test('migração SQL executa e todas as 12 tabelas possuem RLS e política de propriedade', async () => {
  const { rows } = await db.query("select c.relname, c.relrowsecurity, c.relforcerowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname like 'desato_%' and c.relkind = 'r'");
  assert.equal(rows.length, 12);
  assert.ok(rows.every(row => row.relrowsecurity && row.relforcerowsecurity));
  const policies = await db.query("select tablename, qual, with_check from pg_policies where schemaname = 'public' and policyname = 'desato_owner'");
  assert.equal(policies.rows.length, 12);
  assert.ok(policies.rows.every(row => row.qual.includes('auth.uid()') && row.with_check.includes('auth.uid()')));
});

test('cadastro cria perfil e rotina, sem inventar consumo, gastos ou respostas do quiz', async () => {
  await asUser(alice, async () => {
    assert.equal((await db.query('select name from public.desato_profiles')).rows[0].name, 'Alice');
    assert.equal((await db.query('select * from public.desato_routine_tasks')).rows.length, 6);
    assert.equal(Number((await db.query('select spend_per_outing from public.desato_money')).rows[0].spend_per_outing), 0);
    assert.equal((await db.query('select * from public.desato_checkins')).rows.length, 0);
    assert.equal((await db.query('select * from public.desato_quiz_answers')).rows.length, 0);
  });
});

test('usuário grava e lê seus registros; outro usuário não consegue ler, alterar ou apagar', async () => {
  await asUser(alice, () => db.query("insert into public.desato_checkins (user_id, day, status, note) values ($1, '2026-10-06', 'clean', 'Privado')", [alice]));
  await asUser(bob, async () => {
    assert.equal((await db.query('select * from public.desato_checkins')).rows.length, 0);
    assert.equal((await db.query("update public.desato_checkins set note = 'Mudado' returning *")).rows.length, 0);
    assert.equal((await db.query('delete from public.desato_checkins returning *')).rows.length, 0);
    await assert.rejects(db.query("insert into public.desato_checkins (user_id, day, status) values ($1, '2026-10-07', 'used')", [alice]), error => error.code === '42501');
  });
  await asUser(alice, async () => {
    assert.equal((await db.query('select note from public.desato_checkins')).rows[0].note, 'Privado');
    await db.query("update public.desato_checkins set note = 'Revisado' where user_id = $1", [alice]);
    assert.equal((await db.query('select note from public.desato_checkins')).rows[0].note, 'Revisado');
  });
});

test('dados de Apoio, hidratação, compras, SOS e quiz ficam isolados por usuário', async () => {
  await asUser(alice, async () => {
    await db.query("insert into public.desato_support_plans (user_id, situation, first_action) values ($1, 'Encontro', 'Dizer minha decisão')", [alice]);
    await db.query("insert into public.desato_support_favorites (user_id, guide_id) values ($1, 'retomar')", [alice]);
    await db.query("insert into public.desato_recipe_favorites (user_id, recipe_id) values ($1, 'omelete')", [alice]);
    await db.query("insert into public.desato_hydration (user_id, day, cups) values ($1, '2026-10-06', 3)", [alice]);
    await db.query("insert into public.desato_groceries (user_id, text) values ($1, 'Maçã')", [alice]);
    await db.query("insert into public.desato_sos_sessions (user_id, action) values ($1, 'completed-flow')", [alice]);
    await db.query("insert into public.desato_quiz_answers (user_id, quiz_version, answers) values ($1, 'v1', $2)", [alice, { spendPerOuting: 80, outingsPerWeek: 2 }]);
  });
  const tables = ['support_plans', 'support_favorites', 'recipe_favorites', 'hydration', 'groceries', 'sos_sessions', 'quiz_answers'];
  for (const name of tables) {
    await asUser(bob, async () => assert.equal((await db.query(`select * from public.desato_${name}`)).rows.length, 0));
    await asUser(alice, async () => assert.equal((await db.query(`select * from public.desato_${name}`)).rows.length, 1));
  }
});

test('anon não tem acesso às tabelas nem às funções privilegiadas', async () => {
  await db.exec('set role anon');
  try {
    for (const name of ['profiles', 'money', 'checkins', 'routine_tasks', 'routine_completions', 'hydration', 'groceries', 'sos_sessions', 'support_plans', 'support_favorites', 'recipe_favorites', 'quiz_answers']) {
      await assert.rejects(db.query(`select * from public.desato_${name}`), error => error.code === '42501');
    }
    await assert.rejects(db.query('select public.desato_on_signup()'), error => error.code === '42501');
  } finally { await db.exec('reset role'); }
});

test('chave composta impede concluir tarefa pertencente a outro usuário', async () => {
  await asUser(alice, () => db.query("insert into public.desato_routine_tasks (user_id, id, title, period) values ($1, 'somente-alice', 'Caminhar', 'tarde')", [alice]));
  await asUser(bob, async () => {
    await assert.rejects(db.query("insert into public.desato_routine_completions (user_id, task_id, day) values ($1, 'somente-alice', '2026-10-06')", [bob]), error => error.code === '23503');
  });
  await asUser(alice, async () => {
    await db.query("insert into public.desato_routine_completions (user_id, task_id, day) values ($1, 'somente-alice', '2026-10-06')", [alice]);
    await db.query("delete from public.desato_routine_tasks where id = 'somente-alice'");
    assert.equal((await db.query("select * from public.desato_routine_completions where task_id = 'somente-alice'")).rows.length, 0);
  });
});

test('banco rejeita status, valores, favoritos e planos inválidos', async () => {
  await asUser(alice, async () => {
    await assert.rejects(db.query("insert into public.desato_checkins (user_id, day, status) values ($1, '2026-10-08', 'invalid')", [alice]), error => error.code === '23514');
    await assert.rejects(db.query('update public.desato_money set spend_per_outing = -1'), error => error.code === '23514');
    await assert.rejects(db.query("insert into public.desato_hydration (user_id, day, cups) values ($1, '2026-10-07', 9)", [alice]), error => error.code === '23514');
    await assert.rejects(db.query("insert into public.desato_support_favorites (user_id, guide_id) values ($1, 'invalid')", [alice]), error => error.code === '23514');
    await assert.rejects(db.query("update public.desato_support_plans set first_action = ' '"), error => error.code === '23514');
    await assert.rejects(db.query("insert into public.desato_quiz_answers (user_id, quiz_version, answers) values ($1, 'v2', '[]')", [alice]), error => error.code === '23514');
  });
});

test('excluir uma conta elimina apenas os dados dela', async () => {
  await db.query('delete from auth.users where id = $1', [alice]);
  for (const name of ['profiles', 'money', 'checkins', 'routine_tasks', 'routine_completions', 'hydration', 'groceries', 'sos_sessions', 'support_plans', 'support_favorites', 'recipe_favorites', 'quiz_answers']) {
    assert.equal((await db.query(`select * from public.desato_${name} where user_id = $1`, [alice])).rows.length, 0);
  }
  assert.equal((await db.query('select * from public.desato_profiles where user_id = $1', [bob])).rows.length, 1);
});
