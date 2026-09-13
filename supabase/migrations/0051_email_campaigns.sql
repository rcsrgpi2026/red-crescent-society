-- Migration 0051: Email Campaigns Manager
create table if not exists public.email_campaigns (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  category text not null default 'announcement',
  badge text,
  heading text not null,
  body text not null,
  button_text text,
  button_url text,
  target_audiences text[] not null default '{}',
  total_recipients integer not null default 0,
  sent_count integer not null default 0,
  failed_count integer not null default 0,
  status text not null default 'COMPLETED',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.email_campaigns enable row level security;

-- Only admins / authorized roles can read and write campaigns
create policy "Admins can view email campaigns"
  on public.email_campaigns
  for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER', 'EVENT_MANAGER')
    )
  );

create policy "Admins can create email campaigns"
  on public.email_campaigns
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER', 'EVENT_MANAGER')
    )
  );

create policy "Admins can update email campaigns"
  on public.email_campaigns
  for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER', 'EVENT_MANAGER')
    )
  );

-- Indexes for performance
create index if not exists idx_email_campaigns_created_at on public.email_campaigns(created_at desc);
create index if not exists idx_email_campaigns_category on public.email_campaigns(category);
