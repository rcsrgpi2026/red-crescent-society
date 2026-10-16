-- ============================================================
-- Migration 0053: Recruitment Application Documents
--
-- Adds verification document fields to public.volunteer_applications:
-- - photo_url: Passport size photo
-- - nid_or_birth_cert_url: Applicant's NID or Birth Certificate
-- - father_nid_url: Father's NID
-- - mother_nid_url: Mother's NID
-- - college_reg_card_url: College registration card / Student ID
-- ============================================================

ALTER TABLE public.volunteer_applications
  ADD COLUMN IF NOT EXISTS photo_url text,
  ADD COLUMN IF NOT EXISTS nid_or_birth_cert_url text,
  ADD COLUMN IF NOT EXISTS father_nid_url text,
  ADD COLUMN IF NOT EXISTS mother_nid_url text,
  ADD COLUMN IF NOT EXISTS college_reg_card_url text;
