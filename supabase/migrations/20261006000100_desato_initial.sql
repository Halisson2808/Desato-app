-- Desato App: estrutura inicial. Sem importação do histórico local.
-- Projeto: szvxlhubtvhazlzohpse
-- Aplicar via CLI autenticada ou SQL Editor do próprio projeto.
begin;

create table public.desato_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'Você' check (char_length(btrim(name)) between 1 and 80),
  email text not null default '' check (char_length(email) <= 254),
  start_date date not null default ((now() at time zone 'America/Cuiaba')::date),
  goal text not null default '' check (char_length(goal) <= 240),
  timezone text not null default 'America/Cuiaba' check (char_length(timezone) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.desato_money (
  user_id uuid primary key references auth.users(id) on delete cascade,
  spend_per_outing numeric(12,2) not null default 0 check (spend_per_outing between 0 and 1000000),
  outings_per_week numeric(5,2) not null default 0 check (outings_per_week between 0 and 14),
  currency text not null default 'BRL' check (currency = 'BRL'),
  updated_at timestamptz not null default now()
);

create table public.desato_checkins (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  status text not null check (status in ('clean', 'used')),
  note text not null default '' check (char_length(note) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

create table public.desato_routine_tasks (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null default gen_random_uuid()::text check (char_length(id) between 1 and 80),
  title text not null check (char_length(btrim(title)) between 1 and 100),
  period text not null check (period in ('manha', 'tarde', 'noite')),
  icon text not null default '✓' check (char_length(icon) between 1 and 4),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table public.desato_routine_completions (
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id text not null,
  day date not null,
  completed boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (user_id, task_id, day),
  foreign key (user_id, task_id) references public.desato_routine_tasks(user_id, id) on delete cascade
);

create table public.desato_hydration (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  cups smallint not null default 0 check (cups between 0 and 8),
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

create table public.desato_groceries (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null default gen_random_uuid()::text check (char_length(id) between 1 and 80),
  text text not null check (char_length(btrim(text)) between 1 and 80),
  checked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table public.desato_sos_sessions (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null default gen_random_uuid()::text check (char_length(id) between 1 and 80),
  intensity smallint not null default 3 check (intensity between 1 and 5),
  action text not null check (char_length(btrim(action)) between 1 and 80),
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);
create index desato_sos_user_created_idx on public.desato_sos_sessions(user_id, created_at desc);

create table public.desato_support_plans (
  user_id uuid primary key references auth.users(id) on delete cascade,
  situation text not null check (char_length(btrim(situation)) between 1 and 500),
  first_action text not null check (char_length(btrim(first_action)) between 1 and 500),
  exit text not null default '' check (char_length(exit) <= 500),
  help text not null default '' check (char_length(help) <= 500),
  updated_at timestamptz not null default now()
);

create table public.desato_support_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  guide_id text not null check (guide_id in ('pressao-amigos', 'festa-encontro', 'depois-trabalho', 'momento-dificil', 'retomar', 'pedir-ajuda', 'meus-gatilhos', 'minha-decisao', 'acompanhamento')),
  created_at timestamptz not null default now(),
  primary key (user_id, guide_id)
);

create table public.desato_recipe_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  recipe_id text not null check (char_length(btrim(recipe_id)) between 1 and 80),
  created_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);

-- Reserva de armazenamento para o quiz planejado; não cria respostas por conta própria.
create table public.desato_quiz_answers (
  user_id uuid not null references auth.users(id) on delete cascade,
  quiz_version text not null check (char_length(btrim(quiz_version)) between 1 and 40),
  answers jsonb not null default '{}'::jsonb check (jsonb_typeof(answers) = 'object' and octet_length(answers::text) <= 50000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, quiz_version)
);

create function public.desato_touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function public.desato_touch_updated_at() from public, anon, authenticated;

-- Cada tabela recebe a mesma política de propriedade, sem acesso anônimo.
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'desato_profiles', 'desato_money', 'desato_checkins', 'desato_routine_tasks',
    'desato_routine_completions', 'desato_hydration', 'desato_groceries',
    'desato_sos_sessions', 'desato_support_plans', 'desato_support_favorites',
    'desato_recipe_favorites', 'desato_quiz_answers'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('alter table public.%I force row level security', table_name);
    execute format('revoke all on table public.%I from public, anon, authenticated', table_name);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', table_name);
    execute format('create policy desato_owner on public.%I for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', table_name);
    if table_name not in ('desato_sos_sessions', 'desato_support_favorites', 'desato_recipe_favorites') then
      execute format('create trigger desato_updated_at before update on public.%I for each row execute function public.desato_touch_updated_at()', table_name);
    end if;
  end loop;
end;
$$;

-- Cadastros futuros recebem dados vazios e hábitos iniciais, sem histórico fictício.
create function public.desato_on_signup()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.desato_profiles (user_id, name, email, goal)
  values (new.id, coalesce(nullif(left(btrim(new.raw_user_meta_data->>'name'), 80), ''), 'Você'), coalesce(new.email, ''), 'Ficar sem álcool, um dia de cada vez.');
  insert into public.desato_money (user_id) values (new.id);
  insert into public.desato_routine_tasks (user_id, id, title, period, icon) values
    (new.id, 'agua', 'Beber um copo de água ao acordar', 'manha', '💧'),
    (new.id, 'cafe', 'Tomar um café da manhã simples', 'manha', '🍌'),
    (new.id, 'caminhada', 'Caminhar por 15 minutos', 'tarde', '🚶'),
    (new.id, 'atividade', 'Fazer algo que ocupe a mente', 'tarde', '🎯'),
    (new.id, 'jantar', 'Jantar no horário', 'noite', '🍲'),
    (new.id, 'desacelerar', 'Desacelerar antes de dormir', 'noite', '🌙');
  return new;
end;
$$;
revoke all on function public.desato_on_signup() from public, anon, authenticated;
create trigger desato_user_created after insert on auth.users
for each row execute function public.desato_on_signup();

comment on table public.desato_checkins is 'Registros pessoais de consumo: acesso apenas pelo proprietário autenticado.';
comment on table public.desato_support_plans is 'Plano pessoal de Apoio; não publicar nem incluir em logs.';

commit;
