-- ============================================================
-- Privacy and Security Hardening
--
-- 1. Remove blood_group from public_volunteers view.
--    Only administrators are authorized to access volunteer
--    blood group information. Public volunteer directory and profiles
--    must NOT expose volunteer blood groups.
-- ============================================================

drop view if exists public.public_volunteers cascade;

create view public.public_volunteers
with (security_invoker = off)
as
  select
    id,
    member_id,
    name,
    department,
    semester,
    area,
    photo_url,
    position,
    points,
    joined_at
  from public.volunteers
  where status = 'APPROVED' and public_profile = true;

grant select on public.public_volunteers to anon, authenticated;
