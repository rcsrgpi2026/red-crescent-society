-- ============================================================
-- Team member RCY department (society wing)
-- Group leaders, assistant group leaders and general members
-- belong to one of the Red Crescent Youth internal departments
-- (e.g. Health & Services, ICT Media & Communication). The
-- college `department` column stays untouched. Admin-only, like
-- roll and registration_no.
-- ============================================================

alter table public.team_members
  add column if not exists rcy_department text;
