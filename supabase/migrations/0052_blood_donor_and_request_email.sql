-- ============================================================
-- Migration 0052: Add Email to Blood Donors and Blood Requests
--
-- Adds mandatory email tracking support for blood donors and
-- blood requesters so administrative email updates and campaigns
-- can reliably contact them.
-- ============================================================

-- 1. Add email columns to base tables
alter table public.blood_donors
  add column if not exists email text;

create index if not exists blood_donors_email_idx
  on public.blood_donors (email);

alter table public.blood_requests
  add column if not exists email text;

create index if not exists blood_requests_email_idx
  on public.blood_requests (email);

-- 2. Update register_donor function with email support
create or replace function public.register_donor(
  p_name text,
  p_blood_group text,
  p_area text,
  p_phone text,
  p_last_donation_date date,
  p_passcode text,
  p_volunteer_id uuid,
  p_student_id uuid,
  p_phone_public boolean,
  p_email text default null
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
  if nullif(trim(p_name), '') is null or nullif(trim(p_phone), '') is null then
    raise exception 'name and phone are required';
  end if;

  insert into public.blood_donors (
    volunteer_id, student_id, name, blood_group, area, phone, email,
    last_donation_date, availability, is_active, passcode_hash, phone_public
  ) values (
    p_volunteer_id, p_student_id, trim(p_name), p_blood_group, nullif(trim(p_area), ''),
    trim(p_phone), nullif(trim(p_email), ''), p_last_donation_date, 'AVAILABLE', true,
    crypt(p_passcode, gen_salt('bf')), coalesce(p_phone_public, false)
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.register_donor(text, text, text, text, date, text, uuid, uuid, boolean, text) to anon, authenticated;

-- 3. Backward compatible 9-argument register_donor wrapper
create or replace function public.register_donor(
  p_name text,
  p_blood_group text,
  p_area text,
  p_phone text,
  p_last_donation_date date,
  p_passcode text,
  p_volunteer_id uuid,
  p_student_id uuid,
  p_phone_public boolean
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  return public.register_donor(
    p_name, p_blood_group, p_area, p_phone, p_last_donation_date,
    p_passcode, p_volunteer_id, p_student_id, p_phone_public, null
  );
end;
$$;

grant execute on function public.register_donor(text, text, text, text, date, text, uuid, uuid, boolean) to anon, authenticated;

-- 4. Update submit_blood_request function with email support
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
  p_additional_info text,
  p_email text default null
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
    required_date, required_time, requester_name, contact, email,
    emergency_level, additional_info, status
  ) values (
    p_patient_name, p_blood_group, p_units, nullif(p_hospital, ''),
    nullif(p_location, ''), p_required_date, nullif(p_required_time, ''),
    p_requester_name, p_contact, nullif(trim(p_email), ''),
    p_emergency_level, nullif(p_additional_info, ''),
    'PENDING'
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.submit_blood_request(text, text, integer, text, text, date, text, text, text, text, text, text) to anon, authenticated;

-- 5. Backward compatible 11-argument submit_blood_request wrapper
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
begin
  return public.submit_blood_request(
    p_patient_name, p_blood_group, p_units, p_hospital, p_location,
    p_required_date, p_required_time, p_requester_name, p_contact,
    p_emergency_level, p_additional_info, null
  );
end;
$$;

grant execute on function public.submit_blood_request(text, text, integer, text, text, date, text, text, text, text, text) to anon, authenticated;
