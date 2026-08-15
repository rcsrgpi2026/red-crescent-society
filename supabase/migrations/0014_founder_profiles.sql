-- ============================================================
-- Founder / Principal profiles
-- Adds a personal "message to students & volunteers" and a
-- "working background" so each person gets a profile page.
-- ============================================================

alter table public.founders
  add column if not exists message text,
  add column if not exists background text;
