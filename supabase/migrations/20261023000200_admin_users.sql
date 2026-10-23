-- Desato App: aba "Usuários" do painel (só administrador).
begin;

create function public.desato_admin_users()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
  if not public.desato_is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  select jsonb_build_object(
    'totals', jsonb_build_object(
      'accounts', (select count(*) from auth.users),
      'buyers', (select count(*) from public.desato_purchases where status = 'paid'),
      'refunded', (select count(*) from public.desato_purchases where status in ('refunded', 'chargeback')),
      'subscribers', (select count(*) from public.desato_subscriptions
        where (status = 'active' and (current_period_end is null or current_period_end > now() - interval '3 days'))
           or (status = 'canceled' and current_period_end > now())),
      'active_7d', (select count(*) from auth.users where last_sign_in_at > now() - interval '7 days'),
      'checkins_7d', (select count(distinct user_id) from public.desato_checkins where updated_at > now() - interval '7 days')
    ),
    'users', coalesce((select jsonb_agg(row_to_json(x) order by x.last_sign_in_at desc nulls last) from (
      select u.email, u.created_at, u.last_sign_in_at,
        coalesce(r.role, 'user') as role,
        p.status as purchase, p.created_at as purchased_at,
        s.status as subscription,
        (select count(*) from public.desato_checkins c where c.user_id = u.id) as checkins,
        (select max(c.day) from public.desato_checkins c where c.user_id = u.id) as last_checkin
      from auth.users u
      left join public.desato_user_roles r on r.user_id = u.id
      left join public.desato_purchases p on p.email = lower(u.email)
      left join public.desato_subscriptions s on s.email = lower(u.email)
      limit 500) x), '[]'::jsonb),
    'buyers_without_account', (select count(*) from public.desato_purchases p
      where p.status = 'paid' and not exists (select 1 from auth.users u where lower(u.email) = p.email))
  ) into result;
  return result;
end;
$$;
revoke all on function public.desato_admin_users() from public, anon, authenticated;
grant execute on function public.desato_admin_users() to authenticated;

commit;
