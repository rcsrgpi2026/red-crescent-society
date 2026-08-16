-- ============================================================
-- Detailed contact requests
--
-- The "Request Contact" form now collects more context so the
-- society team can evaluate a request properly: who the blood is
-- for (patient name), which blood group is needed, the hospital /
-- location, and an optional email. These columns are admin-only
-- (the table has no public SELECT policy).
-- ============================================================

alter table public.blood_contact_requests
  add column patient_name text,
  add column blood_group text,
  add column hospital text,
  add column email text;

-- Replace submit_contact_request with the wider signature. The old
-- one is dropped explicitly so no orphaned function remains.
drop function if exists public.submit_contact_request(uuid, text, text, text, text);

create or replace function public.submit_contact_request(
  p_donor_id uuid,
  p_requester_name text,
  p_requester_contact text,
  p_patient_name text,
  p_blood_group text,
  p_hospital text,
  p_email text,
  p_message text,
  p_passcode text
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_id uuid;
begin
  if p_passcode !~ '^[0-9]{4,6}$' then
    raise exception 'passcode must be 4-6 digits';
  end if;
  if nullif(trim(p_patient_name), '') is null then
    raise exception 'patient name is required';
  end if;
  if nullif(trim(p_blood_group), '') is null then
    raise exception 'blood group is required';
  end if;

  insert into public.blood_contact_requests (
    donor_id, requester_name, requester_contact, patient_name,
    blood_group, hospital, email, message, status, passcode_hash
  ) values (
    p_donor_id, p_requester_name, p_requester_contact,
    trim(p_patient_name), trim(p_blood_group), nullif(trim(p_hospital), ''),
    nullif(trim(p_email), ''), nullif(p_message, ''), 'PENDING',
    crypt(p_passcode, gen_salt('bf'))
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.submit_contact_request(uuid, text, text, text, text, text, text, text, text) to anon, authenticated;
