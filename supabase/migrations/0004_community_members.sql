-- ============================================================
-- Community (Community page)
-- The incharge teacher and executive members shown as an
-- organization tree on the /community page. Each row is one
-- person; `level` decides which row of the tree they sit on
-- (1 = incharge teacher … 5 = assistant group leaders).
-- Names and photos are managed from the admin panel.
-- ============================================================

create table public.community_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  photo_url text,
  position text not null,
  sub_role text,
  level integer not null default 1
    check (level between 1 and 5),
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index community_members_level_order_idx
  on public.community_members (level, display_order);

create trigger community_members_updated_at
  before update on public.community_members
  for each row execute function public.set_updated_at();

alter table public.community_members enable row level security;

create policy "community_members_select_public" on public.community_members
  for select using (is_active = true);
create policy "community_members_admin_all" on public.community_members
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- ------------------------------------------------------------
-- Seed: the current leadership (photos are added via the admin
-- panel — no placeholder images).
-- ------------------------------------------------------------
insert into public.community_members (name, position, sub_role, level, display_order) values
  ('Md. Nurul Amin', 'INCHARGE TEACHER', null, 1, 0),
  ('MD. Rejwan', 'TEAM LEADER', null, 2, 0),
  ('Hossain Mohammad Esam', 'DEPUTY LEADER - 01', null, 3, 0),
  ('Most. Nusrat Jahan', 'DEPUTY LEADER - 02', null, 3, 1),
  ('MD. Sojol', 'GROUP LEADER', 'Administration, Organisation & Recruitment', 4, 0),
  ('Oliullah Shawon', 'GROUP LEADER', 'Training and Co-Curriculum', 4, 1),
  ('Minhajul Abadin Pius', 'GROUP LEADER', 'ICT Media & Communication', 4, 2),
  ('Md. Jakariya', 'GROUP LEADER', 'Disaster & Humanitarian Response', 4, 3),
  ('Saifullah Mansur Noman', 'GROUP LEADER', 'Health & Services', 4, 4),
  ('Md. Istiyak Ahmed Ihan', 'GROUP LEADER', 'Resource Mobilization', 4, 5),
  ('Noor Muhammad Ali', 'ASST. GROUP LEADER', 'Administration, Organisation & Recruitment', 5, 0),
  ('Suraiaya Yasmin Setu', 'ASST. GROUP LEADER', 'Training and Co-Curriculum', 5, 1),
  ('Md. Sayem Shahadat', 'ASST. GROUP LEADER', 'ICT Media & Communication', 5, 2),
  ('Md. Tamim Hossain', 'ASST. GROUP LEADER', 'Disaster & Humanitarian Response', 5, 3),
  ('Md. Abdul Bari', 'ASST. GROUP LEADER', 'Health & Services', 5, 4),
  ('Md. Maruf Islam', 'ASST. GROUP LEADER', 'Resource Mobilization', 5, 5);
