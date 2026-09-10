-- ============================================================
-- Volunteer Recruitment & Approval System
-- Adds recruitment campaigns, volunteer applications,
-- RLS security policies, and indexes.
-- ============================================================

-- ------------------------------------------------------------
-- recruitment_campaigns
-- ------------------------------------------------------------
create table if not exists public.recruitment_campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  is_active boolean not null default false,
  popup_title text not null default '🤝 Volunteer Recruitment is Open!',
  popup_description text not null default 'Join RGPI Red Crescent Youth and become part of our humanitarian community.',
  banner_title text not null default '🤝 VOLUNTEER RECRUITMENT IS NOW OPEN',
  banner_subtitle text not null default 'Become a volunteer and make a difference with RGPI Red Crescent Youth.',
  allowed_semesters text[] not null default array['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'],
  start_date timestamptz,
  end_date timestamptz,
  max_applications integer,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists recruitment_campaigns_active_idx on public.recruitment_campaigns (is_active);

create trigger recruitment_campaigns_updated_at
  before update on public.recruitment_campaigns
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- volunteer_applications
-- ------------------------------------------------------------
create table if not exists public.volunteer_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  campaign_id uuid not null references public.recruitment_campaigns (id) on delete cascade,
  student_id uuid references public.students (id) on delete set null,
  name text not null,
  roll text not null,
  registration_no text,
  session text not null,
  department text not null,
  semester text not null,
  email text not null,
  phone text not null,
  blood_group text not null,
  emergency_contact_name text not null,
  emergency_contact_phone text not null,
  previous_volunteer_experience text,
  motivation text not null,
  skills text[] not null default '{}',
  status text not null default 'PENDING'
    check (status in ('PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN')),
  rejection_reason text,
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists volunteer_applications_user_id_idx on public.volunteer_applications (user_id);
create index if not exists volunteer_applications_campaign_id_idx on public.volunteer_applications (campaign_id);
create index if not exists volunteer_applications_status_idx on public.volunteer_applications (status);
create index if not exists volunteer_applications_created_at_idx on public.volunteer_applications (created_at desc);

create trigger volunteer_applications_updated_at
  before update on public.volunteer_applications
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- Row Level Security (RLS)
-- ------------------------------------------------------------
alter table public.recruitment_campaigns enable row level security;
alter table public.volunteer_applications enable row level security;

-- Recruitment campaigns: Public can read active campaigns; Admins have full access
drop policy if exists "recruitment_campaigns_select_public" on public.recruitment_campaigns;
create policy "recruitment_campaigns_select_public" on public.recruitment_campaigns
  for select using (is_active = true or public.is_admin(auth.uid()));

drop policy if exists "recruitment_campaigns_admin_all" on public.recruitment_campaigns;
create policy "recruitment_campaigns_admin_all" on public.recruitment_campaigns
  for all using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- Volunteer applications:
-- 1. Applicants can select their own applications; Admins can select all
drop policy if exists "volunteer_applications_select_own_or_admin" on public.volunteer_applications;
create policy "volunteer_applications_select_own_or_admin" on public.volunteer_applications
  for select using (user_id = auth.uid() or public.is_admin(auth.uid()));

-- 2. Authenticated students can insert their own application
drop policy if exists "volunteer_applications_insert_own" on public.volunteer_applications;
create policy "volunteer_applications_insert_own" on public.volunteer_applications
  for insert with check (user_id = auth.uid());

-- 3. Admins can update/manage all applications (approve/reject)
drop policy if exists "volunteer_applications_admin_all" on public.volunteer_applications;
create policy "volunteer_applications_admin_all" on public.volunteer_applications
  for all using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- ------------------------------------------------------------
-- Seed initial recruitment campaign (disabled by default)
-- ------------------------------------------------------------
insert into public.recruitment_campaigns (
  title,
  is_active,
  popup_title,
  popup_description,
  banner_title,
  banner_subtitle,
  allowed_semesters
)
select
  'Volunteer Recruitment 2026',
  false,
  '🤝 Volunteer Recruitment is Open!',
  'Join RGPI Red Crescent Youth and become part of our humanitarian volunteer community.',
  '🤝 VOLUNTEER RECRUITMENT IS NOW OPEN',
  'Become a volunteer and make a difference with RGPI Red Crescent Youth.',
  array['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th']
where not exists (
  select 1 from public.recruitment_campaigns limit 1
);
