-- Desato App: remove tabelas das telas antigas (Rotina, Alimentação, Apoio e quiz dentro do app).
begin;

-- Cadastro passa a criar só perfil e gastos; os hábitos de rotina deixaram de existir.
create or replace function public.desato_on_signup()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.desato_profiles (user_id, name, email, goal)
  values (new.id, coalesce(nullif(left(btrim(new.raw_user_meta_data->>'name'), 80), ''), 'Você'), coalesce(new.email, ''), 'Ficar sem álcool, um dia de cada vez.');
  insert into public.desato_money (user_id) values (new.id);
  return new;
end;
$$;
revoke all on function public.desato_on_signup() from public, anon, authenticated;

drop table if exists public.desato_routine_completions;
drop table if exists public.desato_routine_tasks;
drop table if exists public.desato_groceries;
drop table if exists public.desato_recipe_favorites;
drop table if exists public.desato_support_favorites;
drop table if exists public.desato_support_plans;
drop table if exists public.desato_quiz_answers;

commit;
