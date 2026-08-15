-- ============================================================
-- Rename `volunteers` → `team_members` (table + public view)
--
-- The site now presents volunteers as "team members" everywhere,
-- so the underlying schema should match. The old manual
-- `team_members` table (from 0001) is unused by the app and is
-- dropped so the renamed `volunteers` table can take its name.
-- ============================================================

-- 1. Drop the unused manual team list. It cascades to its RLS
--    policies and its updated_at trigger.
drop table if exists public.team_members cascade;

-- 2. Rename the volunteers table. Postgres rewires foreign keys,
--    indexes, triggers and dependent views automatically.
alter table public.volunteers rename to team_members;

-- 3. Rename the public directory view (grants follow the view).
alter view public.public_volunteers rename to public_team_members;

-- 4. Recreate verify_certificate: SQL function bodies are stored as
--    text, so the old `public.volunteers` reference must be updated.
create or replace function public.verify_certificate(p_token text)
returns table (
  certificate_title text,
  issued_at date,
  volunteer_name text,
  member_id text,
  valid boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.title,
    c.issued_at,
    v.name,
    v.member_id,
    true
  from public.certificates c
  join public.team_members v on v.id = c.volunteer_id
  where c.verify_token = p_token and v.status = 'APPROVED';
$$;

-- 5. Recreate the RLS policies whose expressions explicitly
--    reference `public.volunteers` (stored as text in pg_policy).
drop policy if exists "volunteers_update_own" on public.team_members;
create policy "team_members_update_own" on public.team_members
  for update using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and status = (select v.status from public.team_members v where v.id = team_members.id)
    and points = (select v.points from public.team_members v where v.id = team_members.id)
    and coalesce(member_id, '') = coalesce((select v.member_id from public.team_members v where v.id = team_members.id), '')
  );

drop policy if exists "participation_own_select" on public.participation_requests;
create policy "participation_own_select" on public.participation_requests
  for select using (
    auth.uid() = (select user_id from public.team_members where id = volunteer_id)
  );

drop policy if exists "participation_own_insert" on public.participation_requests;
create policy "participation_own_insert" on public.participation_requests
  for insert with check (
    auth.uid() = (select user_id from public.team_members where id = volunteer_id)
  );

-- 6. Rename the remaining RLS policies on the table for consistency.
alter policy "volunteers_insert_public" on public.team_members rename to "team_members_insert_public";
alter policy "volunteers_select_own_or_admin" on public.team_members rename to "team_members_select_own_or_admin";
alter policy "volunteers_admin_all" on public.team_members rename to "team_members_admin_all";

-- 7. Rename the table's indexes and trigger for consistency.
alter index public.volunteers_status_idx rename to team_members_status_idx;
alter index public.volunteers_department_idx rename to team_members_department_idx;
alter index public.volunteers_blood_group_idx rename to team_members_blood_group_idx;
alter trigger volunteers_updated_at on public.team_members rename to team_members_updated_at;

-- 8. Team members default to the "Team Member" position.
alter table public.team_members alter column position set default 'Team Member';
update public.team_members set position = 'Team Member' where position = 'Volunteer';
