-- ============================================================
-- Migration 0055: Volunteer Application Serial Number
--
-- Adds serial_no column to public.volunteer_applications
-- for auto-generated online registration serial (reg-online-XXXX)
-- ============================================================

ALTER TABLE public.volunteer_applications
  ADD COLUMN IF NOT EXISTS serial_no text;

CREATE INDEX IF NOT EXISTS volunteer_applications_serial_no_idx
  ON public.volunteer_applications (serial_no);
