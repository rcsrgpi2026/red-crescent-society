-- ============================================================
-- Student & volunteer portals
-- Adds STUDENT / VOLUNTEER profile roles and a `students` table
-- for the student portal. Volunteers reuse the existing
-- `volunteers` table (signup inserts a PENDING row that admins
-- approve or reject in the admin panel).
-- ============================================================

-- ---------- profiles: allow the new roles ----------
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in (
    'SUPER_ADMIN', 'ADMIN',
    'VOLUNTEER_MANAGER', 'EVENT_MANAGER', 'CONTENT_MANAGER',
    'USER', 'STUDENT', 'VOLUNTEER'
  ));

-- ---------- students ----------
create table public.students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users (id) on delete set null,
  session text not null,
  semester text not null,
  roll text not null,
  department text not null,
  phone text not null,
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index students_department_idx on public.students (department);

create trigger students_updated_at
  before update on public.students
  for each row execute function public.set_updated_at();

-- ---------- students RLS ----------
alter table public.students enable row level security;

-- Students can read their own record; admins read everything.
create policy "students_select_own_or_admin" on public.students
  for select using (user_id = auth.uid() or public.is_admin(auth.uid()));

-- Registration inserts run server-side with the service role, but allow an
-- authenticated student to insert their own row too.
create policy "students_insert_own" on public.students
  for insert with check (user_id = auth.uid());

-- Students may edit their own profile.
create policy "students_update_own" on public.students
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "students_admin_all" on public.students
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
