-- The portal-notification function is meant for logged-in users
-- only. Functions default to PUBLIC execute, which is unnecessary
-- here — revoke it (anon gets nothing back anyway, but this closes
-- the surface completely).
revoke execute on function public.get_my_donor_contact_requests() from public;
