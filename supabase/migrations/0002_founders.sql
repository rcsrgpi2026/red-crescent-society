-- ============================================================
-- Founders & Principal (About page)
-- People who founded the society (FOUNDER) and the institute
-- principal (PRINCIPAL). Managed from the admin panel.
-- ============================================================

create table public.founders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  photo_url text,
  title text,
  bio text,
  category text not null default 'FOUNDER'
    check (category in ('FOUNDER', 'PRINCIPAL')),
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index founders_category_order_idx on public.founders (category, display_order);

create trigger founders_updated_at
  before update on public.founders
  for each row execute function public.set_updated_at();

alter table public.founders enable row level security;

create policy "founders_select_public" on public.founders
  for select using (is_active = true);
create policy "founders_admin_all" on public.founders
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
