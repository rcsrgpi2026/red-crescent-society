-- ============================================================
-- Migration 0046: Legacy Members (Hall of Fame)
--
-- Adds fields to honor outgoing seniors and former leaders:
-- - is_legacy: boolean flag
-- - legacy_tenure: text (e.g. "2023 - 2025" or "7th Semester / Session 21-22")
-- - legacy_designation: text (e.g. "Former Team Leader", "Former Deputy Leader")
-- - legacy_note: text (farewell quote or message)
--
-- Excludes legacy members from the active public_team_members view
-- and creates public_legacy_members view for the /legacy-members page.
-- ============================================================

alter table public.team_members
  add column if not exists is_legacy boolean not null default false,
  add column if not exists legacy_tenure text,
  add column if not exists legacy_designation text,
  add column if not exists legacy_note text;

create index if not exists team_members_is_legacy_idx
  on public.team_members (is_legacy, status);

-- Update public_team_members view to only show non-legacy members
drop view if exists public.public_team_members cascade;

create view public.public_team_members
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
    joined_at,
    session,
    rcy_department
  from public.team_members
  where status = 'APPROVED'
    and public_profile = true
    and is_legacy = false;

grant select on public.public_team_members to anon, authenticated;

-- Create public_legacy_members view for safe public display of former leaders
drop view if exists public.public_legacy_members cascade;

create view public.public_legacy_members
with (security_invoker = off)
as
  select
    id,
    member_id,
    name,
    department,
    session,
    area,
    photo_url,
    position,
    legacy_designation,
    legacy_tenure,
    legacy_note,
    joined_at,
    points
  from public.team_members
  where status = 'APPROVED'
    and public_profile = true
    and is_legacy = true;

grant select on public.public_legacy_members to anon, authenticated;
