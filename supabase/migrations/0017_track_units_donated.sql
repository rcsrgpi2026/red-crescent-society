-- ============================================================
-- Track units actually donated
--
-- A completed request may have asked for more units than were
-- actually donated. When the admin confirms a donation they now
-- record the real number (units_donated); the homepage
-- "Blood Units Donated" statistic sums that number, falling back
-- to the requested units for requests confirmed before this field
-- existed.
-- ============================================================

alter table public.blood_requests
  add column units_donated integer;

-- Expose the new column through the public view (appended last, as
-- CREATE OR REPLACE VIEW requires). Keep security_invoker = off as
-- set by 0009_public_views_readable.sql.
create or replace view public.public_blood_requests
with (security_invoker = off)
as
  select
    id, patient_name, blood_group, units, hospital, location,
    required_date, required_time, emergency_level, status, created_at,
    donation_confirmed, units_donated
  from public.blood_requests
  where status <> 'CANCELLED';
