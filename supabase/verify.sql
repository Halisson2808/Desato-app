-- Executar no SQL Editor após aplicar a migração. Não lê dados pessoais.
do $$
declare
  table_count integer;
  protected_count integer;
  policy_count integer;
begin
  select count(*), count(*) filter (where c.relrowsecurity and c.relforcerowsecurity)
    into table_count, protected_count
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and c.relname in (
      'desato_profiles', 'desato_money', 'desato_checkins', 'desato_routine_tasks',
      'desato_routine_completions', 'desato_hydration', 'desato_groceries',
      'desato_sos_sessions', 'desato_support_plans', 'desato_support_favorites',
      'desato_recipe_favorites', 'desato_quiz_answers'
    );
  if table_count <> 12 or protected_count <> 12 then
    raise exception 'Estrutura incompleta: % tabelas, % com RLS.', table_count, protected_count;
  end if;
  select count(*) into policy_count from pg_policies
    where schemaname = 'public' and policyname = 'desato_owner';
  if policy_count <> 12 then
    raise exception 'Esperadas 12 políticas de propriedade; encontradas %.', policy_count;
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'desato_user_created' and tgrelid = 'auth.users'::regclass) then
    raise exception 'Trigger de cadastro não encontrada.';
  end if;
end;
$$;
select 'Estrutura Desato: 12 tabelas com RLS e trigger de cadastro verificadas.' as resultado;
