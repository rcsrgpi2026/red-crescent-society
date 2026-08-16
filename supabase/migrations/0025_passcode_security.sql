-- ============================================================
-- Passcode security (second factor alongside name + number)
--
-- Until now "name + phone" was the only credential for donor
-- self-service and contact-request tracking. A phone number can be
-- known by others, so it is not truly secret. This migration adds a
-- self-chosen 4-6 digit passcode as a second factor:
--
--   * blood_donors.passcode_hash        — set at registration
--   * blood_contact_requests.passcode_hash — set when the request is
--     submitted
--
-- Passcodes are stored ONLY as bcrypt hashes (pgcrypto crypt()/
-- gen_salt('bf')) and never returned by any function.
--
-- Legacy rows (no passcode):
--   * Donors without a passcode must set one via set_my_donor_passcode
--     (verified by name + phone) before they can manage the listing.
--   * Contact requests without a passcode keep working with the old
--     name/contact check so existing requesters are not locked out.
--     All new submissions require a passcode.
-- ============================================================

create extension if not exists pgcrypto;

alter table public.blood_donors add column passcode_hash text;

alter table public.blood_contact_requests add column passcode_hash text;

-- ------------------------------------------------------------
-- Donor registration (replaces the anonymous table insert so the
-- passcode can be hashed before storage; also returns the id).
-- ------------------------------------------------------------
create or replace function public.register_donor(
  p_name text,
  p_blood_group text,
  p_area text,
  p_phone text,
  p_last_donation_date date,
  p_passcode text,
  p_volunteer_id uuid
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
    volunteer_id, name, blood_group, area, phone,
    last_donation_date, availability, is_active, passcode_hash
  ) values (
    p_volunteer_id, trim(p_name), p_blood_group, nullif(trim(p_area), ''),
    trim(p_phone), p_last_donation_date, 'AVAILABLE', true,
    crypt(p_passcode, gen_salt('bf'))
  )
  returning id into v_id;

  return v_id;
end;
$$;

-- ------------------------------------------------------------
-- Donor self-service
-- ------------------------------------------------------------

-- Find the caller's own listing. Matches name + phone; a passcode is
-- required only when one has been set (legacy rows return
-- needs_passcode = true so the UI can prompt to set one).
create or replace function public.find_my_donor(
  p_phone text,
  p_name text,
  p_passcode text
)
returns table (
  id uuid,
  name text,
  blood_group text,
  area text,
  availability text,
  needs_passcode boolean
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select d.id, d.name, d.blood_group, d.area, d.availability,
         (d.passcode_hash is null) as needs_passcode
  from public.blood_donors d
  where right(regexp_replace(d.phone, '[^0-9]', '', 'g'), 11)
          = right(regexp_replace(p_phone, '[^0-9]', '', 'g'), 11)
    and lower(trim(d.name)) = lower(trim(p_name))
    and (d.passcode_hash is null or d.passcode_hash = crypt(p_passcode, d.passcode_hash))
  limit 1;
$$;

-- Sets a passcode on a listing that does not have one yet (legacy
-- registration). Returns true when it was set.
create or replace function public.set_my_donor_passcode(
  p_donor_id uuid,
  p_phone text,
  p_name text,
  p_passcode text
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if p_passcode !~ '^[0-9]{4,6}$' then
    return false;
  end if;

  update public.blood_donors d
  set passcode_hash = crypt(p_passcode, gen_salt('bf'))
  where d.id = p_donor_id
    and d.passcode_hash is null
    and right(regexp_replace(d.phone, '[^0-9]', '', 'g'), 11)
        = right(regexp_replace(p_phone, '[^0-9]', '', 'g'), 11)
    and lower(trim(d.name)) = lower(trim(p_name));

  return found;
end;
$$;

-- Toggle availability. Requires a matching passcode (legacy rows
-- without one must set a passcode first — returns null otherwise).
create or replace function public.toggle_my_donor_availability(
  p_donor_id uuid,
  p_phone text,
  p_name text,
  p_passcode text
)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_availability text;
begin
  select d.availability into v_availability
  from public.blood_donors d
  where d.id = p_donor_id
    and right(regexp_replace(d.phone, '[^0-9]', '', 'g'), 11)
          = right(regexp_replace(p_phone, '[^0-9]', '', 'g'), 11)
    and lower(trim(d.name)) = lower(trim(p_name))
    and d.passcode_hash is not null
    and d.passcode_hash = crypt(p_passcode, d.passcode_hash);

  if not found then
    return null;
  end if;

  if v_availability = 'AVAILABLE' then
    update public.blood_donors
    set availability = 'UNAVAILABLE', is_active = false
    where id = p_donor_id;
    return 'UNAVAILABLE';
  else
    update public.blood_donors
    set availability = 'AVAILABLE', is_active = true
    where id = p_donor_id;
    return 'AVAILABLE';
  end if;
end;
$$;

-- Permanently removes the listing. Requires a matching passcode.
create or replace function public.remove_my_donor_listing(
  p_donor_id uuid,
  p_phone text,
  p_name text,
  p_passcode text
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  delete from public.blood_donors d
  where d.id = p_donor_id
    and right(regexp_replace(d.phone, '[^0-9]', '', 'g'), 11)
          = right(regexp_replace(p_phone, '[^0-9]', '', 'g'), 11)
    and lower(trim(d.name)) = lower(trim(p_name))
    and d.passcode_hash is not null
    and d.passcode_hash = crypt(p_passcode, d.passcode_hash);
  return found;
end;
$$;

-- ------------------------------------------------------------
-- Contact requests
-- ------------------------------------------------------------

-- Submit a contact request with the requester's chosen passcode.
create or replace function public.submit_contact_request(
  p_donor_id uuid,
  p_requester_name text,
  p_requester_contact text,
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

  insert into public.blood_contact_requests (
    donor_id, requester_name, requester_contact, message, status, passcode_hash
  ) values (
    p_donor_id, p_requester_name, p_requester_contact,
    nullif(p_message, ''), 'PENDING', crypt(p_passcode, gen_salt('bf'))
  )
  returning id into v_id;

  return v_id;
end;
$$;

-- Track a contact request. Legacy rows (no passcode) work with the
-- contact number alone; rows with a passcode require it to match.
create or replace function public.get_my_contact_request(
  p_request_id uuid,
  p_contact text,
  p_passcode text
)
returns table (
  request_id uuid,
  status text,
  donor_name text,
  donor_blood_group text,
  donor_area text,
  donor_phone text
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    r.id,
    r.status,
    d.name,
    d.blood_group,
    d.area,
    case when r.status = 'APPROVED' then d.phone else null end
  from public.blood_contact_requests r
  join public.blood_donors d on d.id = r.donor_id
  where r.id = p_request_id
    and right(regexp_replace(r.requester_contact, '[^0-9]', '', 'g'), 11)
        = right(regexp_replace(p_contact, '[^0-9]', '', 'g'), 11)
    and (r.passcode_hash is null or r.passcode_hash = crypt(p_passcode, r.passcode_hash))
  limit 1;
$$;

-- Recover tracking links after losing them. Same passcode rule as
-- get_my_contact_request.
create or replace function public.find_my_contact_requests(
  p_name text,
  p_contact text,
  p_passcode text
)
returns table (
  request_id uuid,
  donor_name text,
  donor_blood_group text,
  donor_area text,
  status text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    r.id,
    d.name,
    d.blood_group,
    d.area,
    r.status,
    r.created_at
  from public.blood_contact_requests r
  join public.blood_donors d on d.id = r.donor_id
  where right(regexp_replace(r.requester_contact, '[^0-9]', '', 'g'), 11)
        = right(regexp_replace(p_contact, '[^0-9]', '', 'g'), 11)
    and lower(trim(r.requester_name)) = lower(trim(p_name))
    and (r.passcode_hash is null or r.passcode_hash = crypt(p_passcode, r.passcode_hash))
  order by r.created_at desc;
$$;

-- ------------------------------------------------------------
-- Grants (new signatures — replace the old ones)
-- ------------------------------------------------------------
grant execute on function public.register_donor(text, text, text, text, date, text, uuid) to anon, authenticated;
grant execute on function public.find_my_donor(text, text, text) to anon, authenticated;
grant execute on function public.set_my_donor_passcode(uuid, text, text, text) to anon, authenticated;
grant execute on function public.toggle_my_donor_availability(uuid, text, text, text) to anon, authenticated;
grant execute on function public.remove_my_donor_listing(uuid, text, text, text) to anon, authenticated;
grant execute on function public.submit_contact_request(uuid, text, text, text, text) to anon, authenticated;
grant execute on function public.get_my_contact_request(uuid, text, text) to anon, authenticated;
grant execute on function public.find_my_contact_requests(text, text, text) to anon, authenticated;
