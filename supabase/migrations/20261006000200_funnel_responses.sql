-- Respostas de visitantes: sem leitura pública e sem vínculo automático a contas.
create table public.desato_funnel_responses (
  id uuid primary key,
  write_token_hash bytea not null,
  quiz_version text not null check (quiz_version in ('consumo-v2','vontade-v2','gatilhos-v2','impacto-v2','retomada-v2')),
  answers jsonb not null default '{}'::jsonb check (jsonb_typeof(answers) = 'object' and octet_length(answers::text) <= 4096),
  revision integer not null check (revision between 1 and 10000),
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.desato_funnel_responses enable row level security;
revoke all on public.desato_funnel_responses from public, anon, authenticated;
grant all on public.desato_funnel_responses to service_role;

create function public.desato_record_funnel(p_id uuid, p_token text, p_version text, p_answers jsonb, p_completed boolean, p_revision integer)
returns boolean language plpgsql security definer set search_path = '' as $$
declare accepted uuid;
begin
  if p_token is null or p_token !~ '^[a-f0-9]{64}$' or p_answers is null or p_completed is null then
    raise exception 'Invalid response' using errcode = '22023';
  end if;
  insert into public.desato_funnel_responses(id,write_token_hash,quiz_version,answers,completed,revision)
  values (p_id,pg_catalog.sha256(pg_catalog.convert_to(p_token,'UTF8')),p_version,p_answers,p_completed,p_revision)
  on conflict (id) do update set answers = excluded.answers, completed = excluded.completed, revision = excluded.revision, updated_at = now()
  where desato_funnel_responses.write_token_hash = excluded.write_token_hash
    and desato_funnel_responses.quiz_version = excluded.quiz_version
    and desato_funnel_responses.revision < excluded.revision
  returning id into accepted;
  -- Reenvio da mesma versão é idempotente; token errado nunca acessa respostas.
  if accepted is not null then return true; end if;
  return exists(select 1 from public.desato_funnel_responses where id = p_id
    and write_token_hash = pg_catalog.sha256(pg_catalog.convert_to(p_token,'UTF8')) and quiz_version = p_version);
end;
$$;
revoke all on function public.desato_record_funnel(uuid,text,text,jsonb,boolean,integer) from public;
grant execute on function public.desato_record_funnel(uuid,text,text,jsonb,boolean,integer) to anon,authenticated;
