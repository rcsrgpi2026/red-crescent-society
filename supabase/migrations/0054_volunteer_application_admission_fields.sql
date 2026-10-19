-- ============================================================
-- Migration 0054: Volunteer Application Admission Form Fields
--
-- Adds fields from the physical admission form to public.volunteer_applications:
-- - name_bn: নাম (বাংলায়)
-- - father_name: পিতার নাম
-- - mother_name: মাতার নাম
-- - dob: জন্ম তারিখ
-- - nationality: জাতীয়তা
-- - shift: শিফট (১ম / ২য়)
-- - group_name: গ্রুপ (A / B)
-- - marital_status: বৈবাহিক অবস্থা
-- - permanent_address: স্থায়ী ঠিকানা
-- - present_address: বর্তমান ঠিকানা
-- - latest_gpa: সর্বশেষ পরীক্ষায় প্রাপ্ত জিপিএ
-- - form_data: Any additional dynamic fields as JSONB
-- ============================================================

ALTER TABLE public.volunteer_applications
  ADD COLUMN IF NOT EXISTS name_bn text,
  ADD COLUMN IF NOT EXISTS father_name text,
  ADD COLUMN IF NOT EXISTS mother_name text,
  ADD COLUMN IF NOT EXISTS dob text,
  ADD COLUMN IF NOT EXISTS nationality text,
  ADD COLUMN IF NOT EXISTS shift text,
  ADD COLUMN IF NOT EXISTS group_name text,
  ADD COLUMN IF NOT EXISTS marital_status text,
  ADD COLUMN IF NOT EXISTS permanent_address text,
  ADD COLUMN IF NOT EXISTS present_address text,
  ADD COLUMN IF NOT EXISTS latest_gpa text,
  ADD COLUMN IF NOT EXISTS form_data jsonb DEFAULT '{}'::jsonb;
