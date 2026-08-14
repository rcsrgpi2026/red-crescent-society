-- ============================================================
-- Storage: public "images" bucket
-- Used by the admin image upload fields (founders, team, events).
-- Anyone can read; only admins and content/event managers can
-- upload, update or delete objects.
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'images',
  'images',
  true,
  5242880, -- 5 MB
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif']
)
on conflict (id) do nothing;

-- Public read
create policy "images_public_read" on storage.objects
  for select using (bucket_id = 'images');

-- Write access for admins and content/event managers (who can already
-- edit events, activities and gallery albums that reference images).
create policy "images_admin_insert" on storage.objects
  for insert with check (
    bucket_id = 'images'
    and (public.is_admin(auth.uid()) or public.has_role(auth.uid(), array['EVENT_MANAGER', 'CONTENT_MANAGER']))
  );

create policy "images_admin_update" on storage.objects
  for update using (
    bucket_id = 'images'
    and (public.is_admin(auth.uid()) or public.has_role(auth.uid(), array['EVENT_MANAGER', 'CONTENT_MANAGER']))
  )
  with check (
    bucket_id = 'images'
    and (public.is_admin(auth.uid()) or public.has_role(auth.uid(), array['EVENT_MANAGER', 'CONTENT_MANAGER']))
  );

create policy "images_admin_delete" on storage.objects
  for delete using (
    bucket_id = 'images'
    and (public.is_admin(auth.uid()) or public.has_role(auth.uid(), array['EVENT_MANAGER', 'CONTENT_MANAGER']))
  );
