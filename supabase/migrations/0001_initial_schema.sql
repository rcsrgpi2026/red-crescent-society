-- ============================================================
-- Rajshahi Polytechnic Institute Red Crescent Society
-- Initial schema: tables, views, RLS, indexes, triggers
-- Run this in the Supabase SQL editor or via `supabase db push`.
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- Helper: updated_at trigger
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ------------------------------------------------------------
-- profiles
-- ------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'USER'
    check (role in ('SUPER_ADMIN', 'ADMIN', 'VOLUNTEER_MANAGER', 'EVENT_MANAGER', 'CONTENT_MANAGER', 'USER')),
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- Helper: role checks used by RLS policies
-- ------------------------------------------------------------
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = uid and role in ('SUPER_ADMIN', 'ADMIN')
  );
$$;

create or replace function public.has_role(uid uuid, roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = uid and role = any(roles)
  );
$$;

-- Auto-create a profile whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- volunteers
-- ------------------------------------------------------------
create table public.volunteers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users (id) on delete set null,
  member_id text unique,
  name text not null,
  student_id text,
  department text,
  semester text,
  phone text,
  email text,
  blood_group text,
  area text,
  emergency_contact_name text,
  emergency_contact_phone text,
  skills text[] default '{}',
  experience text,
  motivation text,
  photo_url text,
  position text default 'Volunteer',
  status text not null default 'PENDING'
    check (status in ('PENDING', 'APPROVED', 'REJECTED')),
  public_profile boolean not null default true,
  points integer not null default 0,
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index volunteers_status_idx on public.volunteers (status);
create index volunteers_department_idx on public.volunteers (department);
create index volunteers_blood_group_idx on public.volunteers (blood_group);

create trigger volunteers_updated_at
  before update on public.volunteers
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- team_members
-- ------------------------------------------------------------
create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  photo_url text,
  position text not null,
  department text,
  semester text,
  bio text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger team_members_updated_at
  before update on public.team_members
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- blood_donors
-- ------------------------------------------------------------
create table public.blood_donors (
  id uuid primary key default gen_random_uuid(),
  volunteer_id uuid references public.volunteers (id) on delete set null,
  name text not null,
  blood_group text not null,
  area text,
  availability text not null default 'AVAILABLE'
    check (availability in ('AVAILABLE', 'UNAVAILABLE')),
  last_donation_date date,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index blood_donors_blood_group_idx on public.blood_donors (blood_group);
create index blood_donors_area_idx on public.blood_donors (area);

create trigger blood_donors_updated_at
  before update on public.blood_donors
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- blood_requests
-- ------------------------------------------------------------
create table public.blood_requests (
  id uuid primary key default gen_random_uuid(),
  patient_name text not null,
  blood_group text not null,
  units integer not null default 1,
  hospital text,
  location text,
  required_date date,
  required_time text,
  requester_name text not null,
  contact text not null,
  emergency_level text not null default 'NORMAL'
    check (emergency_level in ('EMERGENCY', 'URGENT', 'NORMAL')),
  additional_info text,
  status text not null default 'PENDING'
    check (status in ('PENDING', 'CONTACTING_DONOR', 'DONOR_FOUND', 'COMPLETED', 'CANCELLED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index blood_requests_status_idx on public.blood_requests (status);
create index blood_requests_blood_group_idx on public.blood_requests (blood_group);

create trigger blood_requests_updated_at
  before update on public.blood_requests
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- blood_contact_requests ("Request Contact" flow)
-- ------------------------------------------------------------
create table public.blood_contact_requests (
  id uuid primary key default gen_random_uuid(),
  donor_id uuid not null references public.blood_donors (id) on delete cascade,
  requester_name text not null,
  requester_contact text not null,
  message text,
  status text not null default 'PENDING'
    check (status in ('PENDING', 'APPROVED', 'REJECTED')),
  created_at timestamptz not null default now()
);

create index blood_contact_requests_status_idx on public.blood_contact_requests (status);

-- ------------------------------------------------------------
-- events
-- ------------------------------------------------------------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  cover_image text,
  description text,
  date date,
  time text,
  location text,
  category text,
  organizer text,
  registration_enabled boolean not null default false,
  max_participants integer,
  status text not null default 'UPCOMING'
    check (status in ('UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED', 'DRAFT')),
  report text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index events_status_date_idx on public.events (status, date);

create trigger events_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- event_registrations
-- ------------------------------------------------------------
create table public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  volunteer_id uuid references public.volunteers (id) on delete set null,
  name text not null,
  phone text not null,
  department text,
  status text not null default 'REGISTERED'
    check (status in ('REGISTERED', 'ATTENDED', 'CANCELLED')),
  created_at timestamptz not null default now(),
  unique (event_id, phone)
);

create index event_registrations_event_idx on public.event_registrations (event_id);

-- ------------------------------------------------------------
-- activities
-- ------------------------------------------------------------
create table public.activities (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  date date,
  category text,
  description text,
  images text[] default '{}',
  participants integer not null default 0,
  impact text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger activities_updated_at
  before update on public.activities
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- notices
-- ------------------------------------------------------------
create table public.notices (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  content text,
  category text,
  pinned boolean not null default false,
  published boolean not null default false,
  publish_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index notices_published_idx on public.notices (published, pinned desc, created_at desc);

create trigger notices_updated_at
  before update on public.notices
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- notice_attachments
-- ------------------------------------------------------------
create table public.notice_attachments (
  id uuid primary key default gen_random_uuid(),
  notice_id uuid not null references public.notices (id) on delete cascade,
  name text not null,
  url text not null,
  size integer,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- gallery_albums / gallery_images
-- ------------------------------------------------------------
create table public.gallery_albums (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text,
  cover_image text,
  event_id uuid references public.events (id) on delete set null,
  date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger gallery_albums_updated_at
  before update on public.gallery_albums
  for each row execute function public.set_updated_at();

create table public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.gallery_albums (id) on delete cascade,
  url text not null,
  caption text,
  sort integer not null default 0,
  created_at timestamptz not null default now()
);

create index gallery_images_album_idx on public.gallery_images (album_id, sort);

-- ------------------------------------------------------------
-- training / training_participants
-- ------------------------------------------------------------
create table public.training (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  date date,
  trainer text,
  location text,
  description text,
  category text,
  status text not null default 'UPCOMING'
    check (status in ('UPCOMING', 'ONGOING', 'COMPLETED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger training_updated_at
  before update on public.training
  for each row execute function public.set_updated_at();

create table public.training_participants (
  id uuid primary key default gen_random_uuid(),
  training_id uuid not null references public.training (id) on delete cascade,
  volunteer_id uuid not null references public.volunteers (id) on delete cascade,
  status text not null default 'ENROLLED'
    check (status in ('ENROLLED', 'COMPLETED', 'DROPPED')),
  created_at timestamptz not null default now(),
  unique (training_id, volunteer_id)
);

-- ------------------------------------------------------------
-- certificates
-- ------------------------------------------------------------
create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  volunteer_id uuid not null references public.volunteers (id) on delete cascade,
  title text not null,
  issued_at date,
  file_url text,
  verify_token text unique not null,
  created_at timestamptz not null default now()
);

create index certificates_volunteer_idx on public.certificates (volunteer_id);

-- Public verification lookup — returns only safe fields, by token.
create or replace function public.verify_certificate(p_token text)
returns table (
  certificate_title text,
  issued_at date,
  volunteer_name text,
  member_id text,
  valid boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.title,
    c.issued_at,
    v.name,
    v.member_id,
    true
  from public.certificates c
  join public.volunteers v on v.id = c.volunteer_id
  where c.verify_token = p_token and v.status = 'APPROVED';
$$;

-- ------------------------------------------------------------
-- attendance
-- ------------------------------------------------------------
create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  volunteer_id uuid not null references public.volunteers (id) on delete cascade,
  status text not null default 'PRESENT'
    check (status in ('PRESENT', 'ABSENT')),
  scanned_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (event_id, volunteer_id)
);

create index attendance_event_idx on public.attendance (event_id);

-- ------------------------------------------------------------
-- volunteer_points / achievements
-- ------------------------------------------------------------
create table public.volunteer_points (
  id uuid primary key default gen_random_uuid(),
  volunteer_id uuid not null references public.volunteers (id) on delete cascade,
  points integer not null,
  reason text,
  category text,
  created_at timestamptz not null default now()
);

create index volunteer_points_volunteer_idx on public.volunteer_points (volunteer_id);

create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  volunteer_id uuid not null references public.volunteers (id) on delete cascade,
  title text not null,
  description text,
  date date,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- website_settings (key / jsonb value)
-- ------------------------------------------------------------
create table public.website_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- contact_messages
-- ------------------------------------------------------------
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  subject text,
  message text not null,
  status text not null default 'NEW'
    check (status in ('NEW', 'READ', 'ARCHIVED')),
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- audit_logs
-- ------------------------------------------------------------
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  action text not null,
  target_type text,
  target_id text,
  details jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_created_idx on public.audit_logs (created_at desc);

-- ============================================================
-- PUBLIC VIEWS (safe, no sensitive columns)
-- ============================================================

create view public.public_volunteers
with (security_invoker = on)
as
  select
    id, member_id, name, department, semester, blood_group, area,
    photo_url, position, points, joined_at
  from public.volunteers
  where status = 'APPROVED' and public_profile = true;

create view public.public_blood_donors
with (security_invoker = on)
as
  select
    id, name, blood_group, area, availability, last_donation_date
  from public.blood_donors
  where is_active = true;

create view public.public_blood_requests
with (security_invoker = on)
as
  select
    id, patient_name, blood_group, units, hospital, location,
    required_date, required_time, emergency_level, status, created_at
  from public.blood_requests
  where status <> 'CANCELLED';

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.volunteers enable row level security;
alter table public.team_members enable row level security;
alter table public.blood_donors enable row level security;
alter table public.blood_requests enable row level security;
alter table public.blood_contact_requests enable row level security;
alter table public.events enable row level security;
alter table public.event_registrations enable row level security;
alter table public.activities enable row level security;
alter table public.notices enable row level security;
alter table public.notice_attachments enable row level security;
alter table public.gallery_albums enable row level security;
alter table public.gallery_images enable row level security;
alter table public.training enable row level security;
alter table public.training_participants enable row level security;
alter table public.certificates enable row level security;
alter table public.attendance enable row level security;
alter table public.volunteer_points enable row level security;
alter table public.achievements enable row level security;
alter table public.website_settings enable row level security;
alter table public.contact_messages enable row level security;
alter table public.audit_logs enable row level security;

-- ---------- profiles ----------
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin(auth.uid()));
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));
create policy "profiles_admin_all" on public.profiles
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- ---------- volunteers ----------
-- Anyone may submit a pending registration (public join form).
create policy "volunteers_insert_public" on public.volunteers
  for insert with check (status = 'PENDING' and (user_id is null or user_id = auth.uid()));
-- Volunteers can read their own full record; admins read everything.
create policy "volunteers_select_own_or_admin" on public.volunteers
  for select using (user_id = auth.uid() or public.is_admin(auth.uid()));
create policy "volunteers_update_own" on public.volunteers
  for update using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    -- Volunteers may edit their own profile but never their own status.
    and status = (select status from public.volunteers where user_id = auth.uid())
  );
create policy "volunteers_admin_all" on public.volunteers
  for all using (public.is_admin(auth.uid()) or public.has_role(auth.uid(), array['VOLUNTEER_MANAGER']))
  with check (public.is_admin(auth.uid()) or public.has_role(auth.uid(), array['VOLUNTEER_MANAGER']));

-- ---------- team_members ----------
create policy "team_members_select_public" on public.team_members
  for select using (is_active = true);
create policy "team_members_admin_all" on public.team_members
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- ---------- blood_donors ----------
-- Public registration via the donor form.
create policy "blood_donors_insert_public" on public.blood_donors
  for insert with check (true);
-- Full records (incl. phone) are admin-only; public listing goes through the view.
create policy "blood_donors_admin_all" on public.blood_donors
  for all using (public.is_admin(auth.uid()) or public.has_role(auth.uid(), array['VOLUNTEER_MANAGER']))
  with check (public.is_admin(auth.uid()) or public.has_role(auth.uid(), array['VOLUNTEER_MANAGER']));

-- ---------- blood_requests ----------
create policy "blood_requests_insert_public" on public.blood_requests
  for insert with check (true);
create policy "blood_requests_admin_all" on public.blood_requests
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- ---------- blood_contact_requests ----------
create policy "blood_contact_insert_public" on public.blood_contact_requests
  for insert with check (true);
create policy "blood_contact_admin_all" on public.blood_contact_requests
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- ---------- events ----------
create policy "events_select_public" on public.events
  for select using (status <> 'DRAFT');
create policy "events_admin_all" on public.events
  for all using (public.is_admin(auth.uid()) or public.has_role(auth.uid(), array['EVENT_MANAGER']))
  with check (public.is_admin(auth.uid()) or public.has_role(auth.uid(), array['EVENT_MANAGER']));

-- ---------- event_registrations ----------
create policy "event_reg_insert_public" on public.event_registrations
  for insert with check (true);
create policy "event_reg_admin_all" on public.event_registrations
  for all using (public.is_admin(auth.uid()) or public.has_role(auth.uid(), array['EVENT_MANAGER']))
  with check (public.is_admin(auth.uid()) or public.has_role(auth.uid(), array['EVENT_MANAGER']));

-- ---------- activities ----------
create policy "activities_select_public" on public.activities
  for select using (true);
create policy "activities_admin_all" on public.activities
  for all using (public.is_admin(auth.uid()) or public.has_role(auth.uid(), array['CONTENT_MANAGER', 'EVENT_MANAGER']))
  with check (public.is_admin(auth.uid()) or public.has_role(auth.uid(), array['CONTENT_MANAGER', 'EVENT_MANAGER']));

-- ---------- notices ----------
create policy "notices_select_public" on public.notices
  for select using (
    published = true
    and (publish_at is null or publish_at <= now())
    and (expires_at is null or expires_at > now())
  );
create policy "notices_admin_all" on public.notices
  for all using (public.is_admin(auth.uid()) or public.has_role(auth.uid(), array['CONTENT_MANAGER']))
  with check (public.is_admin(auth.uid()) or public.has_role(auth.uid(), array['CONTENT_MANAGER']));

-- ---------- notice_attachments ----------
create policy "notice_att_select_public" on public.notice_attachments
  for select using (
    exists (
      select 1 from public.notices n
      where n.id = notice_id
        and n.published = true
        and (n.publish_at is null or n.publish_at <= now())
        and (n.expires_at is null or n.expires_at > now())
    )
  );
create policy "notice_att_admin_all" on public.notice_attachments
  for all using (public.is_admin(auth.uid()) or public.has_role(auth.uid(), array['CONTENT_MANAGER']))
  with check (public.is_admin(auth.uid()) or public.has_role(auth.uid(), array['CONTENT_MANAGER']));

-- ---------- gallery ----------
create policy "gallery_albums_select_public" on public.gallery_albums
  for select using (true);
create policy "gallery_albums_admin_all" on public.gallery_albums
  for all using (public.is_admin(auth.uid()) or public.has_role(auth.uid(), array['CONTENT_MANAGER']))
  with check (public.is_admin(auth.uid()) or public.has_role(auth.uid(), array['CONTENT_MANAGER']));
create policy "gallery_images_select_public" on public.gallery_images
  for select using (true);
create policy "gallery_images_admin_all" on public.gallery_images
  for all using (public.is_admin(auth.uid()) or public.has_role(auth.uid(), array['CONTENT_MANAGER']))
  with check (public.is_admin(auth.uid()) or public.has_role(auth.uid(), array['CONTENT_MANAGER']));

-- ---------- training ----------
create policy "training_select_public" on public.training
  for select using (true);
create policy "training_admin_all" on public.training
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "training_part_select_own_or_admin" on public.training_participants
  for select using (
    volunteer_id = (select id from public.volunteers where user_id = auth.uid())
    or public.is_admin(auth.uid())
  );
create policy "training_part_insert_own" on public.training_participants
  for insert with check (
    volunteer_id = (select id from public.volunteers where user_id = auth.uid())
  );
create policy "training_part_admin_all" on public.training_participants
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- ---------- certificates ----------
create policy "certificates_select_own_or_admin" on public.certificates
  for select using (
    volunteer_id = (select id from public.volunteers where user_id = auth.uid())
    or public.is_admin(auth.uid())
  );
create policy "certificates_admin_all" on public.certificates
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- ---------- attendance ----------
create policy "attendance_admin_all" on public.attendance
  for all using (public.is_admin(auth.uid()) or public.has_role(auth.uid(), array['EVENT_MANAGER']))
  with check (public.is_admin(auth.uid()) or public.has_role(auth.uid(), array['EVENT_MANAGER']));

-- ---------- volunteer_points ----------
create policy "points_select_own_or_admin" on public.volunteer_points
  for select using (
    volunteer_id = (select id from public.volunteers where user_id = auth.uid())
    or public.is_admin(auth.uid())
  );
create policy "points_admin_all" on public.volunteer_points
  for all using (public.is_admin(auth.uid()) or public.has_role(auth.uid(), array['VOLUNTEER_MANAGER']))
  with check (public.is_admin(auth.uid()) or public.has_role(auth.uid(), array['VOLUNTEER_MANAGER']));

-- ---------- achievements ----------
create policy "achievements_select_public" on public.achievements
  for select using (true);
create policy "achievements_admin_all" on public.achievements
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- ---------- website_settings ----------
-- Settings are site content; readable by everyone, writable by admins.
create policy "settings_select_public" on public.website_settings
  for select using (true);
create policy "settings_admin_all" on public.website_settings
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- ---------- contact_messages ----------
create policy "contact_insert_public" on public.contact_messages
  for insert with check (true);
create policy "contact_admin_all" on public.contact_messages
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- ---------- audit_logs ----------
create policy "audit_admin_all" on public.audit_logs
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- ============================================================
-- DEFAULT SETTINGS
-- ============================================================
insert into public.website_settings (key, value) values
  ('society', '{"name":"Rajshahi Polytechnic Institute Red Crescent Society","shortName":"RPI Red Crescent Society","tagline":"Serve. Respond. Make a Difference.","description":"The Red Crescent Society unit of Rajshahi Polytechnic Institute — a student volunteer organization committed to humanity, service and community welfare."}'::jsonb),
  ('contact', '{"email":"","phone":"","address":"Rajshahi Polytechnic Institute, Rajshahi, Bangladesh","officeHours":""}'::jsonb),
  ('social', '{"facebook":"","youtube":"","instagram":"","twitter":""}'::jsonb),
  ('emergency', '{"bloodHelpline":"","societyContact":"","message":"In an emergency, contact the society helpline or the nearest blood bank immediately."}'::jsonb),
  ('points', '{"eventParticipation":5,"training":10,"bloodDonation":20,"campaignParticipation":5,"leadership":15}'::jsonb),
  ('homepage', '{"heroTitle":"Serve. Respond. Make a Difference.","heroSubtitle":"We are the Red Crescent Society of Rajshahi Polytechnic Institute — student volunteers dedicated to humanity, blood support, first aid and disaster response in our community."}'::jsonb)
on conflict (key) do nothing;
