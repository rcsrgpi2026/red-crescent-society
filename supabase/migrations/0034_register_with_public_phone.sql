-- ============================================================
-- Register as a donor with the public-phone choice up front
--
-- The "Request Contact" privacy default is private; this lets a new
-- donor opt in to showing their number publicly at registration
-- time (previously only possible later via Manage your listing).
-- ============================================================

drop function if exists public.register_donor(text, text, text, text, date, text, uuid, uuid);

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
    volunteer_id, student_id, name, blood_group, area, phone,
    last_donation_date, availability, is_active, passcode_hash, phone_public
  ) values (
    p_volunteer_id, p_student_id, trim(p_name), p_blood_group, nullif(trim(p_area), ''),
    trim(p_phone), p_last_donation_date, 'AVAILABLE', true,
    crypt(p_passcode, gen_salt('bf')), coalesce(p_phone_public, false)
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.register_donor(text, text, text, text, date, text, uuid, uuid, boolean) to anon, authenticated;
