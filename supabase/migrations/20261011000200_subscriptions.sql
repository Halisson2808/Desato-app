-- Assinaturas da Cakto. Escritas só pela Edge Function cakto-webhook (service role).
-- A chave é o e-mail da compra: a pessoa pode pagar antes de criar a conta no app.
begin;

create table public.desato_subscriptions (
  email text primary key check (email = lower(btrim(email)) and char_length(email) between 3 and 254),
  status text not null check (status in ('active', 'canceled', 'refunded', 'chargeback')),
  cakto_subscription_id text,
  cakto_order_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index desato_subscriptions_cakto_id on public.desato_subscriptions (cakto_subscription_id);

-- Deduplica reenvios da Cakto (até 5 tentativas por evento).
create table public.desato_cakto_events (
  event_key text primary key,
  event_type text not null,
  received_at timestamptz not null default now()
);

alter table public.desato_subscriptions enable row level security;
alter table public.desato_subscriptions force row level security;
alter table public.desato_cakto_events enable row level security;
alter table public.desato_cakto_events force row level security;
revoke all on table public.desato_subscriptions from public, anon, authenticated;
revoke all on table public.desato_cakto_events from public, anon, authenticated;

create trigger desato_updated_at before update on public.desato_subscriptions
for each row execute function public.desato_touch_updated_at();

-- Acesso: assinatura ativa (com 3 dias de tolerância para renovação atrasar)
-- ou cancelada ainda dentro do período já pago. Reembolso e chargeback cortam na hora.
create function public.desato_has_access()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.desato_subscriptions s
    join auth.users u on lower(u.email) = s.email
    where u.id = auth.uid()
      and (
        (s.status = 'active' and (s.current_period_end is null or s.current_period_end > now() - interval '3 days'))
        or (s.status = 'canceled' and s.current_period_end > now())
      )
  );
$$;
revoke all on function public.desato_has_access() from public, anon, authenticated;
grant execute on function public.desato_has_access() to authenticated;

comment on table public.desato_subscriptions is 'Assinaturas Cakto por e-mail; sem acesso direto de clientes.';

commit;
