-- ============================================================
-- Notices publish instantly (no scheduling / expiration)
--
-- The publish_at / expires_at timers (enforced via RLS) are removed.
-- A notice is live the moment `published` is checked — no future
-- scheduling, no auto-expiry. Admins remove notices by deleting
-- them, which clears them from the database as before.
-- ============================================================

-- The RLS policies reference the columns being dropped, so they
-- must be recreated first (policies create column dependencies).
drop policy if exists "notices_select_public" on public.notices;
drop policy if exists "notice_att_select_public" on public.notice_attachments;

alter table public.notices
  drop column publish_at,
  drop column expires_at;

-- Published notices are visible immediately.
create policy "notices_select_public" on public.notices
  for select using (published = true);

create policy "notice_att_select_public" on public.notice_attachments
  for select using (
    exists (
      select 1 from public.notices n
      where n.id = notice_id and n.published = true
    )
  );
