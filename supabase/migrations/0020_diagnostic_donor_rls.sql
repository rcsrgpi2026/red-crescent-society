-- TEMPORARY diagnostic — removed by 0021. Inspects the RLS policies on
-- blood_donors and the anon role's privileges, to debug why anonymous
-- inserts are rejected.

create or replace function public.debug_donor_rls()
returns table (
  polname text,
  cmd text,
  qual text,
  withcheck text,
  anon_insert boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.polname,
    p.polcmd::text,
    p.polqual::text,
    p.polwithcheck::text,
    has_table_privilege('anon', 'public.blood_donors', 'INSERT')
  from pg_policy p
  join pg_class c on c.oid = p.polrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname = 'blood_donors';
$$;

grant execute on function public.debug_donor_rls() to anon, authenticated;
