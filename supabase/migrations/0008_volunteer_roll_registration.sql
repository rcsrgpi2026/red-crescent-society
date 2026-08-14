-- ============================================================
-- Volunteer roll & college registration number
-- Adds roll and registration_no columns to volunteers. Both are
-- collected in the volunteer signup form (mandatory) and are
-- admin-only — they are not part of the public_volunteers view.
-- ============================================================

alter table public.volunteers
  add column if not exists roll text,
  add column if not exists registration_no text;

-- Backfill: existing student_id values become the registration number.
update public.volunteers
set registration_no = student_id
where registration_no is null and student_id is not null;
