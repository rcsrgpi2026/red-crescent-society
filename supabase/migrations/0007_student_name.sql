-- ============================================================
-- Student name
-- Adds a `name` column to the students table so student
-- registrations (and PDF exports) include the student's name.
-- ============================================================

alter table public.students
  add column if not exists name text not null default '';

-- Backfill existing rows from the auth profile's full name.
update public.students s
set name = coalesce(p.full_name, '')
from auth.users u
left join public.profiles p on p.id = u.id
where s.user_id = u.id
  and s.name = '';
