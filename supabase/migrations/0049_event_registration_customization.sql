-- ============================================================
-- Migration: 0049_event_registration_customization.sql
-- Enables external registration links (Google Forms etc.),
-- custom registration instructions, and additional attendee fields
-- ============================================================

alter table public.events
  add column if not exists registration_type text default 'BUILT_IN',
  add column if not exists registration_link text,
  add column if not exists registration_instructions text;

alter table public.event_registrations
  add column if not exists email text,
  add column if not exists roll text,
  add column if not exists note text;

create index if not exists events_registration_type_idx
  on public.events (registration_type);
