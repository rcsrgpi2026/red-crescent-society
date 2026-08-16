-- ============================================================
-- Event registrations: link signed-in team members & students
--
-- 1. event_registrations.student_id — links a registration to the
--    student's account (like volunteer_id links a team member),
--    recorded when a logged-in student registers for an event.
--
-- 2. The public insert policy is tightened so a registration can
--    only be tagged with the caller's OWN team member / student
--    profile (or left untagged). Previously the policy allowed any
--    volunteer_id to be set, which would let a visitor misattribute
--    a registration to someone else's account.
-- ============================================================

alter table public.event_registrations
  add column student_id uuid references public.students (id) on delete set null;

drop policy if exists "event_reg_insert_public" on public.event_registrations;

create policy "event_reg_insert_public" on public.event_registrations
  for insert with check (
    (
      volunteer_id is null
      or volunteer_id = (
        select id from public.team_members where user_id = auth.uid()
      )
    )
    and (
      student_id is null
      or student_id = (
        select id from public.students where user_id = auth.uid()
      )
    )
  );
