-- ============================================================
-- Fix public donor registration
--
-- Anonymous inserts into blood_donors were being rejected by RLS
-- (the policy from 0001 was missing on the remote), which silently
-- broke the public "Register as donor" form. Recreate the policy
-- so anyone can register with just name + phone, and grant the
-- insert privilege explicitly.
-- ============================================================

drop policy if exists "blood_donors_insert_public" on public.blood_donors;

create policy "blood_donors_insert_public" on public.blood_donors
  for insert with check (true);

grant insert on public.blood_donors to anon, authenticated;
