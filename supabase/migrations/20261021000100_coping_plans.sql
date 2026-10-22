-- Desato App: plano pessoal para a vontade (lista de tarefas que a própria pessoa escolhe).
begin;

create table public.desato_coping_plans (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tasks text[] not null check (cardinality(tasks) between 1 and 5),
  -- Vez em andamento: { startedAt, done: [tarefas] }. Nula quando não há.
  active jsonb,
  uses integer not null default 0 check (uses >= 0),
  wins integer not null default 0 check (wins >= 0 and wins <= uses),
  -- Quantas vezes seguidas cada tarefa foi pulada.
  skips jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.desato_coping_plans enable row level security;
alter table public.desato_coping_plans force row level security;
revoke all on table public.desato_coping_plans from public, anon, authenticated;
grant select, insert, update, delete on table public.desato_coping_plans to authenticated;
create policy desato_owner on public.desato_coping_plans for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create trigger desato_updated_at before update on public.desato_coping_plans
  for each row execute function public.desato_touch_updated_at();

commit;
