-- ============================================================
-- Smart Notification System Schema
--
-- 1. notifications: Global notification log with type, priority, targeting criteria, and metadata
-- 2. user_notifications: User-specific delivery status, scoring, opened & responded tracking
-- 3. notification_preferences: User granular preference toggles and quiet hours
-- 4. push_subscriptions: Multi-device Web Push / PWA subscriptions with active status tracking
-- ============================================================

-- ------------------------------------------------------------
-- 1. notifications
-- ------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  type text not null check (type in ('notice', 'blood_request', 'emergency', 'volunteer', 'event', 'system')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'critical')),
  image_url text,
  action_url text,
  metadata jsonb not null default '{}'::jsonb,
  target_criteria jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  scheduled_at timestamptz,
  expires_at timestamptz
);

create index if not exists notifications_type_priority_idx on public.notifications (type, priority, created_at desc);
create index if not exists notifications_created_at_idx on public.notifications (created_at desc);

-- ------------------------------------------------------------
-- 2. user_notifications
-- ------------------------------------------------------------
create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'sent', 'delivered', 'opened', 'dismissed', 'responded', 'failed')),
  score integer not null default 0,
  sent_at timestamptz,
  delivered_at timestamptz,
  opened_at timestamptz,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  constraint user_notification_unique unique (notification_id, user_id)
);

create index if not exists user_notifications_user_status_idx on public.user_notifications (user_id, status, created_at desc);
create index if not exists user_notifications_notif_id_idx on public.user_notifications (notification_id);
create index if not exists user_notifications_created_at_idx on public.user_notifications (created_at desc);

-- ------------------------------------------------------------
-- 3. notification_preferences
-- ------------------------------------------------------------
create table if not exists public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  general_notice boolean not null default true,
  blood_request boolean not null default true,
  emergency_alert boolean not null default true,
  volunteer_notification boolean not null default true,
  event_notification boolean not null default true,
  system_notification boolean not null default true,
  quiet_hours_enabled boolean not null default false,
  quiet_hours_start text not null default '22:00',
  quiet_hours_end text not null default '07:00',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notif_pref_user_id_idx on public.notification_preferences (user_id);

create or replace trigger notification_preferences_updated_at
  before update on public.notification_preferences
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 4. push_subscriptions
-- ------------------------------------------------------------
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  platform text,
  browser text,
  device_name text,
  user_agent text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  last_used_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_active_idx on public.push_subscriptions (user_id, is_active);
create index if not exists push_subscriptions_endpoint_idx on public.push_subscriptions (endpoint);

-- ------------------------------------------------------------
-- Enable Row Level Security
-- ------------------------------------------------------------
alter table public.notifications enable row level security;
alter table public.user_notifications enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.push_subscriptions enable row level security;

-- ------------------------------------------------------------
-- RLS: notifications
-- ------------------------------------------------------------
drop policy if exists "notifications_select_admin_or_recipient" on public.notifications;
create policy "notifications_select_admin_or_recipient" on public.notifications
  for select using (
    public.is_admin(auth.uid()) or
    exists (
      select 1 from public.user_notifications un
      where un.notification_id = notifications.id and un.user_id = auth.uid()
    )
  );

drop policy if exists "notifications_insert_admin" on public.notifications;
create policy "notifications_insert_admin" on public.notifications
  for insert with check (public.is_admin(auth.uid()) or auth.uid() is not null);

drop policy if exists "notifications_update_admin" on public.notifications;
create policy "notifications_update_admin" on public.notifications
  for update using (public.is_admin(auth.uid()));

drop policy if exists "notifications_delete_admin" on public.notifications;
create policy "notifications_delete_admin" on public.notifications
  for delete using (public.is_admin(auth.uid()));

-- ------------------------------------------------------------
-- RLS: user_notifications
-- ------------------------------------------------------------
drop policy if exists "user_notifications_select_own" on public.user_notifications;
create policy "user_notifications_select_own" on public.user_notifications
  for select using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "user_notifications_update_own" on public.user_notifications;
create policy "user_notifications_update_own" on public.user_notifications
  for update using (user_id = auth.uid() or public.is_admin(auth.uid()))
  with check (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "user_notifications_insert_admin" on public.user_notifications;
create policy "user_notifications_insert_admin" on public.user_notifications
  for insert with check (public.is_admin(auth.uid()) or auth.uid() is not null);

-- ------------------------------------------------------------
-- RLS: notification_preferences
-- ------------------------------------------------------------
drop policy if exists "preferences_select_own" on public.notification_preferences;
create policy "preferences_select_own" on public.notification_preferences
  for select using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "preferences_insert_own" on public.notification_preferences;
create policy "preferences_insert_own" on public.notification_preferences
  for insert with check (user_id = auth.uid());

drop policy if exists "preferences_update_own" on public.notification_preferences;
create policy "preferences_update_own" on public.notification_preferences
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ------------------------------------------------------------
-- RLS: push_subscriptions
-- ------------------------------------------------------------
drop policy if exists "push_sub_select_own" on public.push_subscriptions;
create policy "push_sub_select_own" on public.push_subscriptions
  for select using (user_id = auth.uid() or (auth.uid() is null and user_id is null) or public.is_admin(auth.uid()));

drop policy if exists "push_sub_insert_any" on public.push_subscriptions;
create policy "push_sub_insert_any" on public.push_subscriptions
  for insert with check (true);

drop policy if exists "push_sub_update_any" on public.push_subscriptions;
create policy "push_sub_update_any" on public.push_subscriptions
  for update using (user_id = auth.uid() or (auth.uid() is null and user_id is null) or public.is_admin(auth.uid()));

drop policy if exists "push_sub_delete_own" on public.push_subscriptions;
create policy "push_sub_delete_own" on public.push_subscriptions
  for delete using (user_id = auth.uid() or public.is_admin(auth.uid()));

-- ------------------------------------------------------------
-- Helper Functions
-- ------------------------------------------------------------
create or replace function public.get_or_create_notification_preferences(p_user_id uuid)
returns setof public.notification_preferences
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pref public.notification_preferences%rowtype;
begin
  select * into v_pref from public.notification_preferences where user_id = p_user_id;
  if not found then
    insert into public.notification_preferences (user_id)
    values (p_user_id)
    returning * into v_pref;
  end if;
  return next v_pref;
end;
$$;

grant execute on function public.get_or_create_notification_preferences(uuid) to authenticated, anon;

create or replace function public.mark_all_my_notifications_as_opened()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.user_notifications
  set status = 'opened',
      opened_at = coalesce(opened_at, now())
  where user_id = auth.uid()
    and status in ('pending', 'sent', 'delivered');
end;
$$;

grant execute on function public.mark_all_my_notifications_as_opened() to authenticated;
