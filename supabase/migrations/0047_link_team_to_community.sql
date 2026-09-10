-- ============================================================
-- Migration: 0047_link_team_to_community.sql
-- Links community_members with team_members for executive committee hierarchy
-- ============================================================

alter table public.community_members
  add column if not exists team_member_id uuid references public.team_members(id) on delete cascade;

create index if not exists community_members_team_member_id_idx
  on public.community_members (team_member_id);
