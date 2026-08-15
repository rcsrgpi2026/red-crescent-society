-- ============================================================
-- Volunteer participation requests for events & activities.
--
-- A logged-in volunteer requests to participate in an event or an
-- activity. The society leadership (admin) approves or rejects the
-- request. Only APPROVED requests count as participants on the
-- public event / activity pages.
-- ============================================================

create table public.participation_requests (
  id uuid primary key default gen_random_uuid(),
  volunteer_id uuid not null references public.volunteers (id) on delete cascade,
  event_id uuid references public.events (id) on delete cascade,
  activity_id uuid references public.activities (id) on delete cascade,
  status text not null default 'PENDING'
    check (status in ('PENDING', 'APPROVED', 'REJECTED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Exactly one target: an event OR an activity, never both / neither.
  check (num_nonnulls(event_id, activity_id) = 1),
  unique (volunteer_id, event_id),
  unique (volunteer_id, activity_id)
);

create index participation_requests_volunteer_idx on public.participation_requests (volunteer_id);
create index participation_requests_event_idx on public.participation_requests (event_id);
create index participation_requests_activity_idx on public.participation_requests (activity_id);

create trigger participation_requests_updated_at
  before update on public.participation_requests
  for each row execute function public.set_updated_at();

alter table public.participation_requests enable row level security;

-- Volunteers can view and create their own requests.
create policy "participation_own_select" on public.participation_requests
  for select using (
    auth.uid() = (select user_id from public.volunteers where id = volunteer_id)
  );

create policy "participation_own_insert" on public.participation_requests
  for insert with check (
    auth.uid() = (select user_id from public.volunteers where id = volunteer_id)
  );

-- Admins and event managers review all requests.
create policy "participation_admin_all" on public.participation_requests
  for all using (public.is_admin(auth.uid()) or public.has_role(auth.uid(), array['EVENT_MANAGER']))
  with check (public.is_admin(auth.uid()) or public.has_role(auth.uid(), array['EVENT_MANAGER']));

-- Approved participant counts for the public pages. The view runs with the
-- owner's privileges (no security_invoker), so anonymous visitors can read
-- the approved counts without ever seeing the base table.
create or replace view public.public_participation_counts as
  select event_id, activity_id, count(*)::int as approved_count
  from public.participation_requests
  where status = 'APPROVED'
  group by event_id, activity_id;

grant select on public.public_participation_counts to anon, authenticated;
