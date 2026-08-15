-- ============================================================
-- Make the public_* views readable by anonymous visitors.
--
-- The views were created with `security_invoker = on`, which means
-- Postgres enforces the *base tables'* RLS policies when the view is
-- queried. The base tables (volunteers, blood_donors, blood_requests)
-- have no public SELECT policy, so anonymous visitors always got 0 rows
-- even when data existed.
--
-- The views already select only safe columns and safe rows, so running
-- them with the view owner's privileges (security invoker off) exposes
-- exactly the intended public data without opening the base tables.
-- ============================================================

alter view public.public_volunteers set (security_invoker = off);
alter view public.public_blood_donors set (security_invoker = off);
alter view public.public_blood_requests set (security_invoker = off);
