-- ============================================================
-- Team member session (e.g. 2024-25)
-- Collects the academic session for team members so the college
-- ID-style membership card can show it. Mirrors the students
-- table. Admin-only, like roll and registration_no.
-- ============================================================

alter table public.team_members
  add column if not exists session text;
