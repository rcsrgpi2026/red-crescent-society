-- ============================================================
-- Contact request recovery (lost tracking link)
--
-- The tracking link for a contact request carries a UUID id, which
-- cannot be guessed. If a requester loses the link there is no way
-- back — until now. This function lets them recover their request
-- ids using the name and contact number they submitted (the same
-- phone-as-credential pattern as 0018 and 0023).
--
-- It returns only the request id, the donor's public info and the
-- status. The donor's phone is NOT returned here — it stays behind
-- the tracking page's own verification (get_my_contact_request),
-- which only reveals it once the admin has approved the request.
-- ============================================================

create or replace function public.find_my_contact_requests(
  p_name text,
  p_contact text
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
set search_path = public
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
  order by r.created_at desc;
$$;

grant execute on function public.find_my_contact_requests(text, text) to anon, authenticated;
