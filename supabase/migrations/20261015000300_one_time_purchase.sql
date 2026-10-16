-- Desato App: app básico por compra única + entrada só com o e-mail da compra.
-- A assinatura (desato_subscriptions) fica reservada para o Premium (upsell).
begin;

-- Compras únicas da Cakto, por e-mail. Escritas só pelo webhook (service role).
create table public.desato_purchases (
  email text primary key check (email = lower(btrim(email)) and char_length(email) between 3 and 254),
  status text not null check (status in ('paid', 'refunded', 'chargeback')),
  cakto_order_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tentativas de entrada, para limitar quem tenta adivinhar e-mails.
create table public.desato_login_attempts (
  id bigint generated always as identity primary key,
  ip text not null default '',
  email text not null default '',
  allowed boolean not null default false,
  at timestamptz not null default now()
);
create index desato_login_attempts_ip_at on public.desato_login_attempts (ip, at desc);
create index desato_login_attempts_email_at on public.desato_login_attempts (email, at desc);

do $$
declare table_name text;
begin
  foreach table_name in array array['desato_purchases', 'desato_login_attempts'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('alter table public.%I force row level security', table_name);
    execute format('revoke all on table public.%I from public, anon, authenticated', table_name);
  end loop;
end $$;

create trigger desato_updated_at before update on public.desato_purchases
for each row execute function public.desato_touch_updated_at();

-- Regra única de acesso por e-mail: compra paga, assinatura válida ou administrador.
create function public.desato_email_has_access(p_email text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.desato_purchases p where p.email = lower(btrim(p_email)) and p.status = 'paid')
    or exists (
      select 1 from public.desato_subscriptions s
      where s.email = lower(btrim(p_email))
        and ((s.status = 'active' and (s.current_period_end is null or s.current_period_end > now() - interval '3 days'))
          or (s.status = 'canceled' and s.current_period_end > now()))
    )
    or exists (
      select 1 from public.desato_user_roles r join auth.users u on u.id = r.user_id
      where lower(u.email) = lower(btrim(p_email)) and r.role = 'admin'
    );
$$;
-- Só a função de login (service role) consulta e-mails; o app não consegue sondar quem comprou.
revoke all on function public.desato_email_has_access(text) from public, anon, authenticated;

create or replace function public.desato_has_access()
returns boolean language sql stable security definer set search_path = '' as $$
  select public.desato_is_admin()
    or public.desato_email_has_access((select u.email from auth.users u where u.id = auth.uid()));
$$;

comment on table public.desato_purchases is 'Compras únicas Cakto por e-mail; sem acesso direto de clientes.';
comment on table public.desato_login_attempts is 'Tentativas de entrada por e-mail, para limite de tentativas.';

commit;
