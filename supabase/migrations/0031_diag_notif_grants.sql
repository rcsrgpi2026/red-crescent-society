-- TEMPORARY diagnostic — removed by 0032.
create or replace function public.debug_notif_grants()
returns table (role_name text, can_execute boolean)
language sql
stable
security definer
set search_path = public
as $$
  select 'anon', has_function_privilege('anon', 'public.get_my_donor_contact_requests()', 'EXECUTE')
  union all
  select 'authenticated', has_function_privilege('authenticated', 'public.get_my_donor_contact_requests()', 'EXECUTE');
$$;

grant execute on function public.debug_notif_grants() to anon, authenticated;
