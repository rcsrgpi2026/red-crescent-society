-- TEMPORARY diagnostic — removed by 0027. Reports the schema that
-- contains the pgcrypto crypt() function, so migration 0025 can
-- reference it correctly.
create or replace function public.debug_crypt_schema()
returns text
language sql
stable
security definer
as $$
  select string_agg(n.nspname || '.' || p.proname, ', ')
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where p.proname in ('crypt', 'gen_salt');
$$;

grant execute on function public.debug_crypt_schema() to anon, authenticated;
