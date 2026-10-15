-- Desato App: Jornada de 30 dias e planos para situações difíceis.
begin;

create table public.desato_journey_days (
  user_id uuid not null references auth.users(id) on delete cascade,
  day smallint not null check (day between 1 and 30),
  answer text not null default '' check (char_length(answer) <= 500),
  completed_at timestamptz not null default now(),
  primary key (user_id, day)
);

create table public.desato_situation_plans (
  user_id uuid not null references auth.users(id) on delete cascade,
  situation_id text not null check (situation_id in ('festa', 'sexta', 'briga', 'solidao', 'estresse', 'familia')),
  drink text not null check (char_length(btrim(drink)) between 1 and 160),
  refuse text not null check (char_length(btrim(refuse)) between 1 and 160),
  leave_at text not null check (char_length(btrim(leave_at)) between 1 and 160),
  updated_at timestamptz not null default now(),
  primary key (user_id, situation_id)
);

do $$
declare table_name text;
begin
  foreach table_name in array array['desato_journey_days', 'desato_situation_plans'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('alter table public.%I force row level security', table_name);
    execute format('revoke all on table public.%I from public, anon, authenticated', table_name);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', table_name);
    execute format('create policy desato_owner on public.%I for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', table_name);
  end loop;
end $$;

create trigger desato_updated_at before update on public.desato_situation_plans
  for each row execute function public.desato_touch_updated_at();

commit;
