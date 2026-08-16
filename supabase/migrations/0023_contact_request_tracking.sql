-- ============================================================
-- Contact request tracking (self-service)
--
-- A non-registered requester asks for a donor's contact via the
-- "Request Contact" flow. blood_contact_requests intentionally has
-- no public SELECT policy (requester contact info stays private),
-- so the requester can never read their own request back — which
-- also means they can never receive the donor's number through the
-- site. These two security-definer functions close that loop:
--
--  1. submit_contact_request — inserts the request and returns its
--     id (plain insert + select("id") would need a SELECT policy).
--     Mirrors submit_blood_request (0022).
--
--  2. get_my_contact_request — lets the requester track their
--     request using the id from the tracking link plus the contact
--     number they submitted (the number doubles as the credential,
--     same as the donor self-service functions in 0018). The
--     donor's phone is returned ONLY when the admin has approved
--     the request; otherwise it is null. The requester's own stored
--     contact number is never returned.
-- ============================================================

-- Insert a contact request and return the new id.
create or replace function public.submit_contact_request(
  p_donor_id uuid,
  p_requester_name text,
  p_requester_contact text,
  p_message text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.blood_contact_requests (
    donor_id, requester_name, requester_contact, message, status
  ) values (
    p_donor_id, p_requester_name, p_requester_contact,
    nullif(p_message, ''), 'PENDING'
  )
  returning id into v_id;

  return v_id;
end;
$$;

-- Track a contact request. Returns the status and the donor's
-- public info, plus the donor's phone — only once APPROVED.
create or replace function public.get_my_contact_request(
  p_request_id uuid,
  p_contact text
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
set search_path = public
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
  limit 1;
$$;

grant execute on function public.submit_contact_request(uuid, text, text, text) to anon, authenticated;
grant execute on function public.get_my_contact_request(uuid, text) to anon, authenticated;
