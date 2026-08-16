-- ============================================================
-- Optional public phone number for donors
--
-- Donors can opt in to showing their number publicly. When
-- `phone_public` is true, the public donor view exposes the phone
-- so the donor card can display it directly (no contact request
-- needed). It stays private by default, and contact requests remain
-- the path for everyone else.
-- ============================================================

alter table public.blood_donors
  add column phone_public boolean not null default false;

-- ------------------------------------------------------------
-- Public donor view: expose the phone only when the donor opted in.
-- ------------------------------------------------------------
drop view if exists public.public_blood_donors;

create view public.public_blood_donors
with (security_invoker = off)
as
  select
    id,
    name,
    blood_group,
    area,
    availability,
    last_donation_date,
    case
      when volunteer_id is not null then 'TEAM_MEMBER'
      when student_id is not null then 'STUDENT'
      else 'COMMUNITY'
    end as donor_type,
    case
      when phone_public then phone
      else null
    end as phone
  from public.blood_donors
  where is_active = true;

grant select on public.public_blood_donors to anon, authenticated;

-- ------------------------------------------------------------
-- Self-service: find_my_donor also reports the current public-phone
-- setting (same return-shape change → drop + recreate).
-- ------------------------------------------------------------
drop function if exists public.find_my_donor(text, text, text);

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
language sql
stable
security definer
set search_path = public, extensions
as $$
  select d.id, d.name, d.blood_group, d.area, d.availability,
         (d.passcode_hash is null) as needs_passcode,
         d.phone_public
  from public.blood_donors d
  where right(regexp_replace(d.phone, '[^0-9]', '', 'g'), 11)
          = right(regexp_replace(p_phone, '[^0-9]', '', 'g'), 11)
    and lower(trim(d.name)) = lower(trim(p_name))
    and (d.passcode_hash is null or d.passcode_hash = crypt(p_passcode, d.passcode_hash))
  limit 1;
$$;

grant execute on function public.find_my_donor(text, text, text) to anon, authenticated;

-- ------------------------------------------------------------
-- Self-service toggle: opt in / out of showing the number publicly.
-- Returns the new state, or null when the credentials don't match.
-- ------------------------------------------------------------
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
  v_current boolean;
begin
  select d.phone_public into v_current
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

  update public.blood_donors
  set phone_public = not v_current
  where id = p_donor_id;

  return not v_current;
end;
$$;

grant execute on function public.toggle_my_donor_phone_public(uuid, text, text, text) to anon, authenticated;
