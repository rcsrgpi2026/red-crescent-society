-- ============================================================
-- Storage: public "logos" bucket
-- Used by the admin logo manager (RPI + Red Crescent Society
-- logos). Anyone can read; only admins can upload, update or
-- delete objects.
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'logos',
  'logos',
  true,
  5242880, -- 5 MB
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
on conflict (id) do nothing;

-- Public read
create policy "logos_public_read" on storage.objects
  for select using (bucket_id = 'logos');

-- Write access for admins only (logos are official site identity).
create policy "logos_admin_insert" on storage.objects
  for insert with check (
    bucket_id = 'logos'
    and public.is_admin(auth.uid())
  );

create policy "logos_admin_update" on storage.objects
  for update using (
    bucket_id = 'logos'
    and public.is_admin(auth.uid())
  )
  with check (
    bucket_id = 'logos'
    and public.is_admin(auth.uid())
  );

create policy "logos_admin_delete" on storage.objects
  for delete using (
    bucket_id = 'logos'
    and public.is_admin(auth.uid())
  );
