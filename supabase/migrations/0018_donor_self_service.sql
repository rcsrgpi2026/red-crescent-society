-- ============================================================
-- Donor self-service
--
-- Anyone can register as a donor with just name + phone (no
-- account). To let a donor manage their own listing we expose
-- three security-definer functions callable by anonymous
-- visitors. Each one verifies that the supplied name and phone
-- match the stored row *before* returning or changing anything,
-- so the phone number doubles as the credential. The functions
-- never expose the phone number itself.
--
-- Phone matching normalizes both sides: digits only, then the
-- last 11 digits (handles "017…", "+880 17…" and "88017…").
-- ============================================================

-- Look up the caller's own listing (returns only public info + id).
create or replace function public.find_my_donor(
  p_phone text,
  p_name text
)
returns table (
  id uuid,
  name text,
  blood_group text,
  area text,
  availability text
)
language sql
stable
security definer
set search_path = public
as $$
  select d.id, d.name, d.blood_group, d.area, d.availability
  from public.blood_donors d
  where right(regexp_replace(d.phone, '[^0-9]', '', 'g'), 11)
          = right(regexp_replace(p_phone, '[^0-9]', '', 'g'), 11)
    and lower(trim(d.name)) = lower(trim(p_name))
  limit 1;
$$;

-- Toggle availability. Returns the new state ('AVAILABLE' /
-- 'UNAVAILABLE'), or null when the name/phone don't match.
create or replace function public.toggle_my_donor_availability(
  p_donor_id uuid,
  p_phone text,
  p_name text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_availability text;
begin
  select d.availability into v_availability
  from public.blood_donors d
  where d.id = p_donor_id
    and right(regexp_replace(d.phone, '[^0-9]', '', 'g'), 11)
          = right(regexp_replace(p_phone, '[^0-9]', '', 'g'), 11)
    and lower(trim(d.name)) = lower(trim(p_name));

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

-- Permanently removes the listing. Returns true when a row was
-- actually deleted (name/phone matched), false otherwise.
create or replace function public.remove_my_donor_listing(
  p_donor_id uuid,
  p_phone text,
  p_name text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.blood_donors d
  where d.id = p_donor_id
    and right(regexp_replace(d.phone, '[^0-9]', '', 'g'), 11)
          = right(regexp_replace(p_phone, '[^0-9]', '', 'g'), 11)
    and lower(trim(d.name)) = lower(trim(p_name));
  return found;
end;
$$;

-- Anonymous visitors (donor self-service) may execute these.
grant execute on function public.find_my_donor(text, text) to anon, authenticated;
grant execute on function public.toggle_my_donor_availability(uuid, text, text) to anon, authenticated;
grant execute on function public.remove_my_donor_listing(uuid, text, text) to anon, authenticated;
