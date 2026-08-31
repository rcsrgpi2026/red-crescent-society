-- ============================================================
-- Make students.semester optional with a default empty string
-- ============================================================

alter table public.students
  alter column semester set default '',
  alter column semester drop not null;
