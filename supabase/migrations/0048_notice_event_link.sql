-- ============================================================
-- Migration: 0048_notice_event_link.sql
-- Links notices with events to allow official event circulars
-- ============================================================

alter table public.notices
  add column if not exists event_id uuid references public.events(id) on delete set null;

create index if not exists notices_event_id_idx
  on public.notices (event_id);
