-- ============================================================
-- Blood donation confirmation
--
-- Marking a blood request COMPLETED only closes the request.
-- The "Blood Units Donated" statistic on the homepage counts a
-- completed request's units only after the admin explicitly
-- confirms the donation actually happened
-- (donation_confirmed = true).
-- ============================================================

alter table public.blood_requests
  add column donation_confirmed boolean not null default false;

-- Expose the flag through the public view so the homepage statistic
-- (read with the anonymous client) can filter on it. Keep the view
-- running with the owner's privileges (security_invoker = off) as set
-- by 0009_public_views_readable.sql.
create or replace view public.public_blood_requests
with (security_invoker = off)
as
  select
    id, patient_name, blood_group, units, hospital, location,
    required_date, required_time, emergency_level, status, created_at,
    donation_confirmed
  from public.blood_requests
  where status <> 'CANCELLED';
