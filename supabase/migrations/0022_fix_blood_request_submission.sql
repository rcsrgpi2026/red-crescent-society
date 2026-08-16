-- ============================================================
-- Fix public blood request submission + remove diagnostic artifacts
--
-- 1. The "Request blood" form submits via insert + select("id"),
--    which asks PostgREST to return the inserted row
--    (return=representation). Re-reading the row needs a SELECT
--    policy on blood_requests, which intentionally does not exist
--    (requester contact info stays private; public reads go through
--    the public_blood_requests view), so anonymous submissions were
--    failing with an RLS error. Fix: a security-definer RPC that
--    inserts the row and returns just the id — the same pattern as
--    the donor self-service functions (0018).
-- 2. Drop the temporary diagnostic table/function from 0020/0021.
-- ============================================================

-- --- cleanup of temporary diagnostics ---
drop table if exists public.rls_probe;
drop function if exists public.debug_donor_rls();

-- --- public blood request submission ---
create or replace function public.submit_blood_request(
  p_patient_name text,
  p_blood_group text,
  p_units integer,
  p_hospital text,
  p_location text,
  p_required_date date,
  p_required_time text,
  p_requester_name text,
  p_contact text,
  p_emergency_level text,
  p_additional_info text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.blood_requests (
    patient_name, blood_group, units, hospital, location,
    required_date, required_time, requester_name, contact,
    emergency_level, additional_info, status
  ) values (
    p_patient_name, p_blood_group, p_units, nullif(p_hospital, ''),
    nullif(p_location, ''), p_required_date, nullif(p_required_time, ''),
    p_requester_name, p_contact,
    p_emergency_level, nullif(p_additional_info, ''),
    'PENDING'
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.submit_blood_request(text, text, integer, text, text, date, text, text, text, text, text) to anon, authenticated;
