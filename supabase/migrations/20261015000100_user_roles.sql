-- Desato App: dois tipos de acesso. Administrador vê tudo, inclusive recursos ainda não lançados,
-- e não precisa de assinatura. Usuário comum precisa de assinatura ativa.
begin;

create table public.desato_user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.desato_user_roles enable row level security;
alter table public.desato_user_roles force row level security;
revoke all on table public.desato_user_roles from public, anon, authenticated;
-- Cada pessoa só lê o próprio papel; ninguém altera pelo app (só pelo painel/SQL).
grant select on table public.desato_user_roles to authenticated;
create policy desato_owner_read on public.desato_user_roles for select to authenticated using ((select auth.uid()) = user_id);

create trigger desato_updated_at before update on public.desato_user_roles
for each row execute function public.desato_touch_updated_at();

create function public.desato_is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.desato_user_roles r where r.user_id = auth.uid() and r.role = 'admin');
$$;
revoke all on function public.desato_is_admin() from public, anon, authenticated;
grant execute on function public.desato_is_admin() to authenticated;

-- Administrador tem acesso sem assinatura.
create or replace function public.desato_has_access()
returns boolean language sql stable security definer set search_path = '' as $$
  select public.desato_is_admin() or exists (
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

-- Novos cadastros entram como usuário comum.
create function public.desato_on_signup_role()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.desato_user_roles (user_id, role) values (new.id, 'user') on conflict do nothing;
  return new;
end;
$$;
revoke all on function public.desato_on_signup_role() from public, anon, authenticated;
create trigger desato_user_role_created after insert on auth.users
for each row execute function public.desato_on_signup_role();

-- Contas existentes: todas como usuário; o dono do app como administrador.
insert into public.desato_user_roles (user_id, role) select id, 'user' from auth.users on conflict do nothing;
update public.desato_user_roles set role = 'admin'
where user_id in (select id from auth.users where lower(email) = 'halissonsantos13@gmail.com');

commit;
