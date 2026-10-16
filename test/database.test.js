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
    create role service_role nologin bypassrls;
    create schema auth;
    grant usage on schema auth to authenticated;
    create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}'::jsonb);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
    $$;
  `);
  await db.exec(sql);
  await db.exec(fs.readFileSync(path.join(root,'supabase/migrations/20261006000200_funnel_responses.sql'),'utf8'));
  await db.exec(fs.readFileSync(path.join(root,'supabase/migrations/20261011000100_journey_situations.sql'),'utf8'));
  await db.exec(fs.readFileSync(path.join(root,'supabase/migrations/20261011000200_subscriptions.sql'),'utf8'));
  await db.exec(fs.readFileSync(path.join(root,'supabase/migrations/20261015000100_user_roles.sql'),'utf8'));
  await db.exec(fs.readFileSync(path.join(root,'supabase/migrations/20261015000200_drop_legacy_tables.sql'),'utf8'));
  await db.exec(fs.readFileSync(path.join(root,'supabase/migrations/20261015000300_one_time_purchase.sql'),'utf8'));
  await db.query('insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3), ($4, $5, $6)', [alice, 'alice@example.test', { name: 'Alice' }, bob, 'bob@example.test', { name: 'Bob' }]);
});
after(async () => { if (db) await db.close(); });

test('13 tabelas possuem RLS: 7 por conta, papéis só leitura, compras, assinaturas e funil sem leitura pública', async () => {
  const { rows } = await db.query("select c.relname, c.relrowsecurity, c.relforcerowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname like 'desato_%' and c.relkind = 'r'");
  assert.equal(rows.length, 13);
  assert.ok(!rows.some(row => /routine|groceries|recipe|support|quiz_answers/.test(row.relname)));
  assert.ok(rows.every(row => row.relrowsecurity && (row.relname === 'desato_funnel_responses' || row.relforcerowsecurity)));
  const policies = await db.query("select tablename, qual, with_check from pg_policies where schemaname = 'public' and policyname = 'desato_owner'");
  assert.equal(policies.rows.length, 7);
  assert.ok(policies.rows.every(row => row.qual.includes('auth.uid()') && row.with_check.includes('auth.uid()')));
});

test('visitante registra o próprio funil sem ler respostas e token errado não sobrescreve dados', async () => {
  const id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',token='a'.repeat(64);
  const record=async(secret,revision,answers)=>db.query('select public.desato_record_funnel($1,$2,$3,$4,$5,$6) as accepted',[id,secret,'consumo-v2',answers,false,revision]);
  await db.exec('set role anon');
  try {
    assert.equal((await record(token,1,{goal:'reduce'})).rows[0].accepted,true);
    assert.equal((await record('b'.repeat(64),2,{goal:'quit'})).rows[0].accepted,false);
    await assert.rejects(db.query('select * from public.desato_funnel_responses'),error=>error.code==='42501');
    await assert.rejects(db.query('delete from public.desato_funnel_responses'),error=>error.code==='42501');
    assert.equal((await record(token,3,{goal:'reduce',spend:80})).rows[0].accepted,true);
    assert.equal((await record(token,2,{goal:'quit'})).rows[0].accepted,true);
    await assert.rejects(record('short',4,{}));
  } finally {await db.exec('reset role');}
  const row=(await db.query('select * from public.desato_funnel_responses where id=$1',[id])).rows[0];
  assert.equal(row.revision,3);assert.equal(row.answers.spend,80);assert.equal(row.write_token,undefined);
  await asUser(alice,()=>assert.rejects(db.query('select * from public.desato_funnel_responses'),error=>error.code==='42501'));
});

test('cadastro cria perfil, gastos zerados e papel de usuário, sem inventar consumo', async () => {
  await asUser(alice, async () => {
    assert.equal((await db.query('select name from public.desato_profiles')).rows[0].name, 'Alice');
    assert.equal((await db.query('select role from public.desato_user_roles')).rows[0].role, 'user');
    assert.equal(Number((await db.query('select spend_per_outing from public.desato_money')).rows[0].spend_per_outing), 0);
    assert.equal((await db.query('select * from public.desato_checkins')).rows.length, 0);
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

test('hidratação e SOS ficam isolados por usuário', async () => {
  await asUser(alice, async () => {
    await db.query("insert into public.desato_hydration (user_id, day, cups) values ($1, '2026-10-06', 3)", [alice]);
    await db.query("insert into public.desato_sos_sessions (user_id, action) values ($1, 'completed-flow')", [alice]);
  });
  const tables = ['hydration', 'sos_sessions'];
  for (const name of tables) {
    await asUser(bob, async () => assert.equal((await db.query(`select * from public.desato_${name}`)).rows.length, 0));
    await asUser(alice, async () => assert.equal((await db.query(`select * from public.desato_${name}`)).rows.length, 1));
  }
});

test('anon não tem acesso às tabelas nem às funções privilegiadas', async () => {
  await db.exec('set role anon');
  try {
    for (const name of ['profiles', 'money', 'checkins', 'hydration', 'sos_sessions', 'journey_days', 'situation_plans']) {
      await assert.rejects(db.query(`select * from public.desato_${name}`), error => error.code === '42501');
    }
    await assert.rejects(db.query('select public.desato_on_signup()'), error => error.code === '42501');
  } finally { await db.exec('reset role'); }
});

test('banco rejeita status e valores inválidos', async () => {
  await asUser(alice, async () => {
    await assert.rejects(db.query("insert into public.desato_checkins (user_id, day, status) values ($1, '2026-10-08', 'invalid')", [alice]), error => error.code === '23514');
    await assert.rejects(db.query('update public.desato_money set spend_per_outing = -1'), error => error.code === '23514');
    await assert.rejects(db.query("insert into public.desato_hydration (user_id, day, cups) values ($1, '2026-10-07', 9)", [alice]), error => error.code === '23514');
  });
});

test('excluir uma conta elimina apenas os dados dela', async () => {
  await db.query('delete from auth.users where id = $1', [alice]);
  for (const name of ['profiles', 'money', 'checkins', 'hydration', 'sos_sessions', 'journey_days', 'situation_plans']) {
    assert.equal((await db.query(`select * from public.desato_${name} where user_id = $1`, [alice])).rows.length, 0);
  }
  assert.equal((await db.query('select * from public.desato_profiles where user_id = $1', [bob])).rows.length, 1);
});

test('jornada e situações ficam isoladas por usuário e validam valores', async () => {
  await db.query('insert into auth.users (id, email) values ($1, $2), ($3, $4) on conflict do nothing', [alice, 'alice@example.test', bob, 'bob@example.test']);
  await asUser(alice, async () => {
    await db.query("insert into public.desato_journey_days (user_id, day, answer) values ($1, 1, 'Meu motivo')", [alice]);
    await db.query("insert into public.desato_situation_plans (user_id, situation_id, drink, refuse, leave_at) values ($1, 'festa', 'Água', 'Hoje não', '22h')", [alice]);
    await assert.rejects(db.query("insert into public.desato_journey_days (user_id, day) values ($1, 31)", [alice]));
    await assert.rejects(db.query("insert into public.desato_situation_plans (user_id, situation_id, drink, refuse, leave_at) values ($1, 'outra', 'a', 'b', 'c')", [alice]));
    await assert.rejects(db.query("insert into public.desato_journey_days (user_id, day) values ($1, 2)", [bob]));
  });
  await asUser(bob, async () => {
    assert.equal((await db.query('select * from public.desato_journey_days')).rows.length, 0);
    assert.equal((await db.query('select * from public.desato_situation_plans')).rows.length, 0);
  });
});

test('assinatura: só a ativa ou cancelada no período libera, e clientes não leem a tabela', async () => {
  const access = id => asUser(id, async () => (await db.query('select public.desato_has_access() as ok')).rows[0].ok);
  assert.equal(await access(alice), false);
  await db.query("insert into public.desato_subscriptions (email, status, current_period_end) values ('alice@example.test', 'active', now() + interval '30 days')");
  assert.equal(await access(alice), true);
  assert.equal(await access(bob), false);
  await asUser(alice, () => assert.rejects(db.query('select * from public.desato_subscriptions'), error => error.code === '42501'));
  await asUser(alice, () => assert.rejects(db.query("insert into public.desato_subscriptions (email, status) values ('bob@example.test', 'active')"), error => error.code === '42501'));
  await db.query("update public.desato_subscriptions set status = 'canceled' where email = 'alice@example.test'");
  assert.equal(await access(alice), true);
  await db.query("update public.desato_subscriptions set current_period_end = now() - interval '1 day'");
  assert.equal(await access(alice), false);
  await db.query("update public.desato_subscriptions set status = 'refunded', current_period_end = now() + interval '9 days'");
  assert.equal(await access(alice), false);
  await assert.rejects(db.query("insert into public.desato_subscriptions (email, status) values ('Bob@Example.test', 'active')"));
});

test('papéis: novo cadastro vira usuário, administrador acessa sem assinatura e ninguém se promove', async () => {
  const carol = '33333333-3333-4333-8333-333333333333', owner = '44444444-4444-4444-8444-444444444444';
  await db.query('insert into auth.users (id, email) values ($1, $2), ($3, $4) on conflict do nothing', [carol, 'carol@example.test', owner, 'halissonsantos13@gmail.com']);
  assert.equal((await db.query('select role from public.desato_user_roles where user_id = $1', [carol])).rows[0].role, 'user');
  await db.query("update public.desato_user_roles set role = 'admin' where user_id = $1", [owner]);
  await asUser(owner, async () => {
    assert.equal((await db.query('select public.desato_is_admin() as admin')).rows[0].admin, true);
    assert.equal((await db.query('select public.desato_has_access() as access')).rows[0].access, true);
  });
  await asUser(carol, async () => {
    assert.equal((await db.query('select public.desato_is_admin() as admin')).rows[0].admin, false);
    assert.equal((await db.query('select public.desato_has_access() as access')).rows[0].access, false);
    assert.equal((await db.query('select * from public.desato_user_roles')).rows.length, 1);
    await assert.rejects(db.query("update public.desato_user_roles set role = 'admin' where user_id = $1", [carol]));
  });
});

test('compra única libera o e-mail; reembolso corta; app não consegue consultar e-mails de terceiros', async () => {
  const dave = '55555555-5555-4555-8555-555555555555';
  await db.query('insert into auth.users (id, email) values ($1, $2) on conflict do nothing', [dave, 'dave@example.test']);
  const check = async email => (await db.query('select public.desato_email_has_access($1) as ok', [email])).rows[0].ok;
  assert.equal(await check('dave@example.test'), false);
  await db.query("insert into public.desato_purchases (email, status) values ('dave@example.test', 'paid')");
  assert.equal(await check('  DAVE@example.test '), true);
  await asUser(dave, async () => {
    assert.equal((await db.query('select public.desato_has_access() as ok')).rows[0].ok, true);
    await assert.rejects(db.query("select public.desato_email_has_access('dave@example.test')"), error => error.code === '42501');
    await assert.rejects(db.query('select * from public.desato_purchases'), error => error.code === '42501');
    await assert.rejects(db.query('select * from public.desato_login_attempts'), error => error.code === '42501');
  });
  await db.query("update public.desato_purchases set status = 'refunded' where email = 'dave@example.test'");
  assert.equal(await check('dave@example.test'), false);
  await asUser(dave, async () => assert.equal((await db.query('select public.desato_has_access() as ok')).rows[0].ok, false));
});
