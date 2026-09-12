-- ============================================================
-- Migration: 0050_event_date_range.sql
-- Adds end_date column to events table to support multi-day events
-- ============================================================

alter table public.events
  add column if not exists end_date date;

create index if not exists events_date_range_idx
  on public.events (date, end_date);
