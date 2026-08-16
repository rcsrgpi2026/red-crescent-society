-- ============================================================
-- Donor identity tags + portal notifications
--
-- 1. blood_donors.student_id — links a donor to their student
--    account (like volunteer_id links a team member), recorded when
--    a logged-in student registers as a donor.
--
-- 2. public_blood_donors now exposes a computed `donor_type` tag so
--    the public donor directory can show whether someone is a team
--    member, a student or a community (non-registered) donor.
--    Team member wins when both apply.
--
-- 3. get_my_donor_contact_requests() — a security-definer function
--    for the donor's own portal. Given the session user it returns
--    the PENDING "Request Contact" submissions for their donor
--    listing(s), so team member / student donors get a notification
--    in their profile. The requester's phone and email are never
--    included, and only the current user's own rows are returned.
--
-- Contact requests still always go to the admin for review — this
-- only adds a heads-up to the donor's portal.
-- ============================================================

alter table public.blood_donors
  add column student_id uuid references public.students (id) on delete set null;

-- ------------------------------------------------------------
-- register_donor with student link (new signature)
-- ------------------------------------------------------------
drop function if exists public.register_donor(text, text, text, text, date, text, uuid);

create or replace function public.register_donor(
  p_name text,
  p_blood_group text,
  p_area text,
  p_phone text,
  p_last_donation_date date,
  p_passcode text,
  p_volunteer_id uuid,
  p_student_id uuid
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
    last_donation_date, availability, is_active, passcode_hash
  ) values (
    p_volunteer_id, p_student_id, trim(p_name), p_blood_group, nullif(trim(p_area), ''),
    trim(p_phone), p_last_donation_date, 'AVAILABLE', true,
    crypt(p_passcode, gen_salt('bf'))
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.register_donor(text, text, text, text, date, text, uuid, uuid) to anon, authenticated;

-- ------------------------------------------------------------
-- Public donor view with the identity tag (stays security_invoker
-- = off, matching 0009, so anonymous visitors can read it).
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
    end as donor_type
  from public.blood_donors
  where is_active = true;

grant select on public.public_blood_donors to anon, authenticated;

-- ------------------------------------------------------------
-- Donor portal notification: pending contact requests for the
-- current user's own donor listing(s).
-- ------------------------------------------------------------
create or replace function public.get_my_donor_contact_requests()
returns table (
  request_id uuid,
  requester_name text,
  patient_name text,
  blood_group text,
  hospital text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    r.id,
    r.requester_name,
    r.patient_name,
    r.blood_group,
    r.hospital,
    r.created_at
  from public.blood_contact_requests r
  where r.status = 'PENDING'
    and r.donor_id in (
      select d.id
      from public.blood_donors d
      left join public.team_members t on t.id = d.volunteer_id
      left join public.students s on s.id = d.student_id
      where t.user_id = auth.uid() or s.user_id = auth.uid()
    )
  order by r.created_at desc;
$$;

grant execute on function public.get_my_donor_contact_requests() to authenticated;
