-- ============================================================
-- Backfill: confirm donations that were already completed before
-- the donation-confirmation feature shipped (migration 0015).
--
-- Requests marked COMPLETED before then were the society's record
-- that the donation happened, so they get the confirmation flag
-- set. New requests are never auto-confirmed — the admin must
-- confirm each one from the blood requests table.
-- ============================================================

update public.blood_requests
set donation_confirmed = true
where status = 'COMPLETED'
  and donation_confirmed = false;
