-- Supabase's default ACL grants EXECUTE on new functions directly to
-- `anon` (not just via PUBLIC), so 0030's revoke from PUBLIC was not
-- enough. Revoke from anon explicitly and keep authenticated.
revoke execute on function public.get_my_donor_contact_requests() from public, anon;

grant execute on function public.get_my_donor_contact_requests() to authenticated;

-- Removes the temporary diagnostic function added by 0031.
drop function if exists public.debug_notif_grants();
