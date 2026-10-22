-- Desato App: até 2 planos com nome por pessoa. O plano que já existe vira o Plano 1.
begin;

alter table public.desato_coping_plans
  add column slot smallint not null default 1 check (slot in (1, 2)),
  add column name text not null default '' check (char_length(name) <= 40);

alter table public.desato_coping_plans drop constraint desato_coping_plans_pkey;
alter table public.desato_coping_plans add primary key (user_id, slot);

commit;
