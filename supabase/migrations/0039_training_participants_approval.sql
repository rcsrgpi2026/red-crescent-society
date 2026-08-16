-- ============================================================
-- Training participants: fix RLS + approval workflow
--
-- 1. The 0013 rename (volunteers → team_members) left the
--    training participant policies referencing the old
--    `public.volunteers` table, so joins/approvals would fail.
--    Recreate them against the current table names and let
--    VOLUNTEER_MANAGER manage participants.
-- 2. Add an approval flow: members request to join (PENDING),
--    admins approve/reject (APPROVED/REJECTED), and later mark
--    COMPLETED or DROPPED. The old statuses were
--    ENROLLED/COMPLETED/DROPPED.
-- ============================================================

-- 1. RLS policies (current table names)
drop policy if exists "training_part_select_own_or_admin" on public.training_participants;
create policy "training_part_select_own_or_admin" on public.training_participants
  for select using (
    volunteer_id = (select id from public.team_members where user_id = auth.uid())
    or public.is_admin(auth.uid())
  );

drop policy if exists "training_part_insert_own" on public.training_participants;
create policy "training_part_insert_own" on public.training_participants
  for insert with check (
    volunteer_id = (select id from public.team_members where user_id = auth.uid())
  );

drop policy if exists "training_part_admin_all" on public.training_participants;
create policy "training_part_admin_all" on public.training_participants
  for all using (public.is_admin(auth.uid()) or public.has_role(auth.uid(), array['VOLUNTEER_MANAGER']))
  with check (public.is_admin(auth.uid()) or public.has_role(auth.uid(), array['VOLUNTEER_MANAGER']));

-- 2. Approval workflow statuses
alter table public.training_participants
  drop constraint if exists training_participants_status_check;
alter table public.training_participants
  add constraint training_participants_status_check
  check (status in ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'DROPPED'));
