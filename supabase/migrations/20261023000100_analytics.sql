-- Desato App: rastreamento anônimo de visitas e do funil do quiz + painel de admin.
-- Sem nome, e-mail ou IP: só um id aleatório do navegador, a sessão e de onde a pessoa veio.
begin;

create table public.desato_events (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  visitor_id text not null check (char_length(visitor_id) between 8 and 64),
  session_id text not null check (char_length(session_id) between 8 and 64),
  event text not null check (event in (
    'page_view', 'quiz_start', 'question_view', 'answer', 'bridge_view', 'result_view',
    'offer_view', 'checkout_click', 'login_view', 'login_success', 'login_denied'
  )),
  path text not null default '' check (char_length(path) <= 200),
  step smallint check (step between 0 and 50),
  detail text not null default '' check (char_length(detail) <= 120),
  referrer_host text not null default '' check (char_length(referrer_host) <= 120),
  utm_source text not null default '' check (char_length(utm_source) <= 120),
  utm_medium text not null default '' check (char_length(utm_medium) <= 120),
  utm_campaign text not null default '' check (char_length(utm_campaign) <= 120),
  utm_content text not null default '' check (char_length(utm_content) <= 120),
  utm_term text not null default '' check (char_length(utm_term) <= 120),
  src text not null default '' check (char_length(src) <= 120),
  landing text not null default '' check (char_length(landing) <= 300),
  device text not null default 'desktop' check (device in ('mobile', 'tablet', 'desktop'))
);
create index desato_events_at on public.desato_events (at desc);
create index desato_events_session on public.desato_events (session_id, at);

alter table public.desato_events enable row level security;
alter table public.desato_events force row level security;
revoke all on table public.desato_events from public, anon, authenticated;

-- Única porta de escrita: valida e grava um evento. Ninguém lê a tabela diretamente.
create function public.desato_track(
  p_visitor text, p_session text, p_event text, p_path text default '', p_step int default null, p_detail text default '',
  p_referrer text default '', p_utm_source text default '', p_utm_medium text default '', p_utm_campaign text default '',
  p_utm_content text default '', p_utm_term text default '', p_src text default '', p_landing text default '', p_device text default 'desktop'
) returns void language plpgsql security definer set search_path = '' as $$
begin
  insert into public.desato_events (visitor_id, session_id, event, path, step, detail, referrer_host,
    utm_source, utm_medium, utm_campaign, utm_content, utm_term, src, landing, device)
  values (left(p_visitor, 64), left(p_session, 64), p_event, left(coalesce(p_path, ''), 200), p_step, left(coalesce(p_detail, ''), 120),
    left(lower(coalesce(p_referrer, '')), 120), left(lower(coalesce(p_utm_source, '')), 120), left(lower(coalesce(p_utm_medium, '')), 120),
    left(coalesce(p_utm_campaign, ''), 120), left(coalesce(p_utm_content, ''), 120), left(coalesce(p_utm_term, ''), 120),
    left(coalesce(p_src, ''), 120), left(coalesce(p_landing, ''), 300),
    case when p_device in ('mobile', 'tablet', 'desktop') then p_device else 'desktop' end);
end;
$$;
revoke all on function public.desato_track(text, text, text, text, int, text, text, text, text, text, text, text, text, text, text) from public;
grant execute on function public.desato_track(text, text, text, text, int, text, text, text, text, text, text, text, text, text, text) to anon, authenticated;

-- Origem legível: utm_source vence; senão o site de onde veio; senão "direto".
create function public.desato_source(p_utm text, p_ref text)
returns text language sql immutable set search_path = '' as $$
  select case
    when p_utm <> '' then p_utm
    when p_ref ~ '(^|\.)google\.' then 'google'
    when p_ref ~ '(^|\.)(instagram\.com|l\.instagram\.com)$' then 'instagram'
    when p_ref ~ '(^|\.)(facebook\.com|fb\.com|m\.facebook\.com|l\.facebook\.com)$' then 'facebook'
    when p_ref ~ '(^|\.)tiktok\.com$' then 'tiktok'
    when p_ref ~ '(^|\.)(youtube\.com|youtu\.be)$' then 'youtube'
    when p_ref ~ '(^|\.)(whatsapp\.com|wa\.me)$' then 'whatsapp'
    when p_ref ~ '(^|\.)bing\.com$' then 'bing'
    when p_ref <> '' then p_ref
    else 'direto'
  end;
$$;

-- Painel: só administrador. Devolve tudo de uma vez para o período pedido.
create function public.desato_admin_overview(p_from timestamptz, p_to timestamptz)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
  if not public.desato_is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  with ev as (
    select e.*, public.desato_source(e.utm_source, e.referrer_host) as source
    from public.desato_events e where e.at >= p_from and e.at < p_to
  ),
  first_touch as (
    select distinct on (session_id) session_id, source, utm_source, utm_medium, utm_campaign, utm_content, src, landing, device, referrer_host, at
    from ev order by session_id, at
  ),
  reached as (
    select session_id,
      bool_or(event = 'quiz_start') as started, bool_or(event = 'offer_view') as offer,
      bool_or(event = 'checkout_click') as checkout, bool_or(event = 'result_view') as result
    from ev group by session_id
  )
  select jsonb_build_object(
    'totals', (select jsonb_build_object(
      'visitors', count(distinct visitor_id), 'sessions', count(distinct session_id),
      'pageviews', count(*) filter (where event = 'page_view')) from ev),
    'funnel', (select jsonb_build_object(
      'visits', count(distinct session_id) filter (where event = 'page_view' and path in ('/', '/quiz')),
      'started', count(distinct session_id) filter (where event = 'quiz_start'),
      'bridge', count(distinct session_id) filter (where event = 'bridge_view'),
      'result', count(distinct session_id) filter (where event = 'result_view'),
      'offer', count(distinct session_id) filter (where event = 'offer_view'),
      'checkout', count(distinct session_id) filter (where event = 'checkout_click')) from ev),
    'steps', coalesce((select jsonb_agg(jsonb_build_object('step', step, 'question', question, 'viewed', viewed, 'answered', answered) order by step)
      from (select step, max(detail) filter (where event = 'question_view') as question,
              count(distinct session_id) filter (where event = 'question_view') as viewed,
              count(distinct session_id) filter (where event = 'answer') as answered
            from ev where event in ('question_view', 'answer') and step is not null group by step) s), '[]'::jsonb),
    'answers', coalesce((select jsonb_agg(jsonb_build_object('step', step, 'answer', detail, 'count', n) order by step, n desc)
      from (select step, detail, count(distinct session_id) as n from ev where event = 'answer' and step is not null group by step, detail) a), '[]'::jsonb),
    'sources', coalesce((select jsonb_agg(row_to_json(x) order by x.sessions desc)
      from (select f.source, count(*) as sessions, count(*) filter (where r.started) as started,
              count(*) filter (where r.offer) as offer, count(*) filter (where r.checkout) as checkout
            from first_touch f join reached r using (session_id) group by f.source) x), '[]'::jsonb),
    'campaigns', coalesce((select jsonb_agg(row_to_json(x) order by x.sessions desc)
      from (select f.utm_source, f.utm_medium, f.utm_campaign, f.utm_content, f.src, count(*) as sessions,
              count(*) filter (where r.offer) as offer, count(*) filter (where r.checkout) as checkout
            from first_touch f join reached r using (session_id)
            where f.utm_source <> '' or f.utm_campaign <> '' or f.src <> ''
            group by 1, 2, 3, 4, 5 limit 50) x), '[]'::jsonb),
    'landings', coalesce((select jsonb_agg(row_to_json(x) order by x.sessions desc)
      from (select landing, count(*) as sessions from first_touch group by landing order by count(*) desc limit 30) x), '[]'::jsonb),
    'referrers', coalesce((select jsonb_agg(row_to_json(x) order by x.sessions desc)
      from (select coalesce(nullif(referrer_host, ''), '(direto)') as referrer, count(*) as sessions from first_touch group by 1 order by 2 desc limit 30) x), '[]'::jsonb),
    'devices', coalesce((select jsonb_object_agg(device, n) from (select device, count(*) as n from first_touch group by device) d), '{}'::jsonb),
    'daily', coalesce((select jsonb_agg(row_to_json(x) order by x.day)
      from (select (at at time zone 'America/Sao_Paulo')::date as day, count(distinct visitor_id) as visitors,
              count(distinct session_id) filter (where event = 'quiz_start') as started,
              count(distinct session_id) filter (where event = 'offer_view') as offer,
              count(distinct session_id) filter (where event = 'checkout_click') as checkout
            from ev group by 1) x), '[]'::jsonb),
    'app', (select jsonb_build_object(
      'login_views', count(distinct session_id) filter (where event = 'login_view'),
      'logins', count(*) filter (where event = 'login_success'),
      'denied', count(*) filter (where event = 'login_denied')) from ev),
    'sessions', coalesce((select jsonb_agg(row_to_json(x) order by x.started_at desc)
      from (select f.session_id, f.at as started_at, f.source, f.device, f.landing, f.utm_campaign,
              (select jsonb_agg(jsonb_build_object('event', e.event, 'step', e.step, 'detail', e.detail, 'path', e.path, 'at', e.at) order by e.at)
               from ev e where e.session_id = f.session_id) as events
            from first_touch f order by f.at desc limit 40) x), '[]'::jsonb)
  ) into result;
  return result;
end;
$$;
revoke all on function public.desato_admin_overview(timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.desato_admin_overview(timestamptz, timestamptz) to authenticated;

comment on table public.desato_events is 'Eventos anônimos de navegação e funil; leitura só pelo painel de admin.';

commit;
