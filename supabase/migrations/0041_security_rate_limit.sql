-- ============================================================
-- Brute-force protection for donor & contact-request self-service
--
-- The donor/contact RPCs (find_my_donor, get_my_contact_request,
-- toggle_my_donor_*, remove_my_donor_listing, set_my_donor_passcode,
-- find_my_contact_requests) verify a 4-6 digit passcode that anyone
-- can call (granted to anon) with no throttling. A 4-digit passcode
-- is ~10k guesses, which is cheap to brute force — and once a contact
-- request is APPROVED, get_my_contact_request returns the donor's
-- phone number, so the whole donor directory is one passcode away.
--
-- This migration adds a per-credential attempt limiter:
--   * 5 failed attempts on the same credential → locked out for 15 min
--   * any successful verification clears the counter
-- Credentials are keyed by normalized phone (donors) or the request id
-- (contact requests), never stored raw beyond the hash they already have.
--
-- The helper functions are NOT granted to anon/authenticated, so they
-- are only reachable through the (security definer) self-service RPCs.
-- ============================================================

-- ------------------------------------------------------------
-- Attempt tracking
-- ------------------------------------------------------------
create table if not exists public.security_attempts (
  identifier text primary key,
  failed_count integer not null default 0,
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);

-- Only the security-definer helpers (which run as the table owner) may touch
-- this table. No policies are created, so no other role can read or clear
-- the attempt counters — otherwise a logged-in user could just reset a
-- target's lockout (or probe it) directly.
alter table public.security_attempts enable row level security;

create index if not exists security_attempts_locked_idx
  on public.security_attempts (locked_until);

-- May the caller try again? False while locked out.
create or replace function public.attempt_allowed(p_identifier text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_locked_until timestamptz;
begin
  select locked_until into v_locked_until
  from public.security_attempts
  where identifier = p_identifier;

  if v_locked_until is not null and v_locked_until > now() then
    return false;
  end if;

  -- Lock expired (or never locked): clear the slate and allow.
  if v_locked_until is not null then
    update public.security_attempts
    set failed_count = 0, locked_until = null, updated_at = now()
    where identifier = p_identifier;
  end if;
  return true;
end;
$$;

-- Record a failed verification; lock the credential after 5 failures.
create or replace function public.record_attempt_failure(p_identifier text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_max_attempts int := 5;
  v_lock_minutes int := 15;
  v_count int;
begin
  insert into public.security_attempts (identifier, failed_count, locked_until, updated_at)
  values (p_identifier, 1, null, now())
  on conflict (identifier) do update
    set failed_count = public.security_attempts.failed_count + 1,
        updated_at = now();

  select failed_count into v_count
  from public.security_attempts
  where identifier = p_identifier;

  if v_count >= v_max_attempts then
    update public.security_attempts
    set locked_until = now() + interval '15 minutes'
    where identifier = p_identifier;
  end if;
end;
$$;

-- Clear the counter after a successful verification.
create or replace function public.reset_attempts(p_identifier text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.security_attempts where identifier = p_identifier;
end;
$$;

-- ------------------------------------------------------------
-- Donor self-service (all now gated by the attempt limiter)
-- ------------------------------------------------------------

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
  needs_passcode boolean,
  phone_public boolean
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_identifier text := 'donor:' || right(regexp_replace(p_phone, '[^0-9]', '', 'g'), 11);
begin
  if not public.attempt_allowed(v_identifier) then
    return;
  end if;

  return query
    select d.id, d.name, d.blood_group, d.area, d.availability,
           (d.passcode_hash is null) as needs_passcode,
           d.phone_public
    from public.blood_donors d
    where right(regexp_replace(d.phone, '[^0-9]', '', 'g'), 11)
            = right(regexp_replace(p_phone, '[^0-9]', '', 'g'), 11)
      and lower(trim(d.name)) = lower(trim(p_name))
      and (d.passcode_hash is null or d.passcode_hash = crypt(p_passcode, d.passcode_hash))
    limit 1;

  if not found then
    perform public.record_attempt_failure(v_identifier);
  else
    perform public.reset_attempts(v_identifier);
  end if;
end;
$$;

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
declare
  v_identifier text := 'donor:' || right(regexp_replace(p_phone, '[^0-9]', '', 'g'), 11);
begin
  if p_passcode !~ '^[0-9]{4,6}$' then
    return false;
  end if;
  if not public.attempt_allowed(v_identifier) then
    return false;
  end if;

  update public.blood_donors d
  set passcode_hash = crypt(p_passcode, gen_salt('bf'))
  where d.id = p_donor_id
    and d.passcode_hash is null
    and right(regexp_replace(d.phone, '[^0-9]', '', 'g'), 11)
        = right(regexp_replace(p_phone, '[^0-9]', '', 'g'), 11)
    and lower(trim(d.name)) = lower(trim(p_name));

  if not found then
    perform public.record_attempt_failure(v_identifier);
    return false;
  end if;

  perform public.reset_attempts(v_identifier);
  return true;
end;
$$;

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
  v_identifier text := 'donor:' || right(regexp_replace(p_phone, '[^0-9]', '', 'g'), 11);
  v_availability text;
begin
  if not public.attempt_allowed(v_identifier) then
    return null;
  end if;

  select d.availability into v_availability
  from public.blood_donors d
  where d.id = p_donor_id
    and right(regexp_replace(d.phone, '[^0-9]', '', 'g'), 11)
          = right(regexp_replace(p_phone, '[^0-9]', '', 'g'), 11)
    and lower(trim(d.name)) = lower(trim(p_name))
    and d.passcode_hash is not null
    and d.passcode_hash = crypt(p_passcode, d.passcode_hash);

  if not found then
    perform public.record_attempt_failure(v_identifier);
    return null;
  end if;

  perform public.reset_attempts(v_identifier);
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
declare
  v_identifier text := 'donor:' || right(regexp_replace(p_phone, '[^0-9]', '', 'g'), 11);
begin
  if not public.attempt_allowed(v_identifier) then
    return false;
  end if;

  delete from public.blood_donors d
  where d.id = p_donor_id
    and right(regexp_replace(d.phone, '[^0-9]', '', 'g'), 11)
          = right(regexp_replace(p_phone, '[^0-9]', '', 'g'), 11)
    and lower(trim(d.name)) = lower(trim(p_name))
    and d.passcode_hash is not null
    and d.passcode_hash = crypt(p_passcode, d.passcode_hash);

  if not found then
    perform public.record_attempt_failure(v_identifier);
    return false;
  end if;

  perform public.reset_attempts(v_identifier);
  return true;
end;
$$;

create or replace function public.toggle_my_donor_phone_public(
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
declare
  v_identifier text := 'donor:' || right(regexp_replace(p_phone, '[^0-9]', '', 'g'), 11);
  v_current boolean;
begin
  if not public.attempt_allowed(v_identifier) then
    return null;
  end if;

  select d.phone_public into v_current
  from public.blood_donors d
  where d.id = p_donor_id
    and right(regexp_replace(d.phone, '[^0-9]', '', 'g'), 11)
          = right(regexp_replace(p_phone, '[^0-9]', '', 'g'), 11)
    and lower(trim(d.name)) = lower(trim(p_name))
    and d.passcode_hash is not null
    and d.passcode_hash = crypt(p_passcode, d.passcode_hash);

  if not found then
    perform public.record_attempt_failure(v_identifier);
    return null;
  end if;

  perform public.reset_attempts(v_identifier);
  update public.blood_donors
  set phone_public = not v_current
  where id = p_donor_id;

  return not v_current;
end;
$$;

-- ------------------------------------------------------------
-- Contact-request tracking (gated by the attempt limiter)
-- ------------------------------------------------------------

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
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_identifier text := 'req:' || p_request_id;
begin
  if not public.attempt_allowed(v_identifier) then
    return;
  end if;

  return query
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

  if not found then
    perform public.record_attempt_failure(v_identifier);
  else
    perform public.reset_attempts(v_identifier);
  end if;
end;
$$;

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
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_identifier text := 'reqc:' || right(regexp_replace(p_contact, '[^0-9]', '', 'g'), 11);
begin
  if not public.attempt_allowed(v_identifier) then
    return;
  end if;

  return query
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

  if not found then
    perform public.record_attempt_failure(v_identifier);
  else
    perform public.reset_attempts(v_identifier);
  end if;
end;
$$;