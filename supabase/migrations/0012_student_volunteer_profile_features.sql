-- ============================================================
-- Student & Volunteer Profile Enhancements:
-- Picture upload support and profile details updating features.
-- ============================================================

-- 1. Ensure students table has name, photo_url, blood_group, and address
alter table public.students
  add column if not exists name text not null default '',
  add column if not exists photo_url text,
  add column if not exists blood_group text,
  add column if not exists address text;

-- Populate student names from profiles where name was blank
update public.students s
set name = p.full_name
from public.profiles p
where s.user_id = p.id and (s.name = '' or s.name is null) and p.full_name is not null;

-- 2. Storage policies for authenticated user avatar / photo uploads
-- Ensure authenticated students and volunteers can upload/manage their profile photos in the 'images' bucket.

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'images_authenticated_avatar_insert'
  ) then
    create policy "images_authenticated_avatar_insert" on storage.objects
      for insert with check (
        bucket_id = 'images'
        and auth.uid() is not null
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'images_authenticated_avatar_update'
  ) then
    create policy "images_authenticated_avatar_update" on storage.objects
      for update using (
        bucket_id = 'images'
        and auth.uid() is not null
      )
      with check (
        bucket_id = 'images'
        and auth.uid() is not null
      );
  end if;
end $$;

-- 3. Ensure students update RLS policy allows updating own row
drop policy if exists "students_update_own" on public.students;
create policy "students_update_own" on public.students
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- 4. Ensure volunteers update RLS policy allows updating own row (excluding sensitive status/points/member_id changes)
drop policy if exists "volunteers_update_own" on public.volunteers;
create policy "volunteers_update_own" on public.volunteers
  for update using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and status = (select v.status from public.volunteers v where v.id = volunteers.id)
    and points = (select v.points from public.volunteers v where v.id = volunteers.id)
    and coalesce(member_id, '') = coalesce((select v.member_id from public.volunteers v where v.id = volunteers.id), '')
  );
