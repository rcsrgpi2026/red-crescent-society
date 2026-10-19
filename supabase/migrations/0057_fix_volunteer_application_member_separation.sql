-- ============================================================
-- Migration 0057: Separate Volunteer Application from RCY Team Membership
--
-- Volunteer applications are for prospective candidates seeking admission.
-- When approved, they receive their Admit Card (online-reg-1, etc.)
-- and remain as students. They do NOT become RCY team members until
-- passing the physical recruitment interview and volunteer training.
-- ============================================================

-- 1. Safely replace team_members delete trigger so it does NOT delete volunteer applications
CREATE OR REPLACE FUNCTION public.sync_cleanup_on_team_member_delete()
RETURNS trigger AS $$
BEGIN
  -- Deleting a team member does not delete an academic volunteer application
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Safely replace volunteer application delete trigger so it does not delete team members
CREATE OR REPLACE FUNCTION public.sync_cleanup_on_volunteer_application_delete()
RETURNS trigger AS $$
BEGIN
  -- When an application is deleted, its serial_no is deleted with the row
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Clean up any premature team_members rows created with online-reg rolls
DELETE FROM public.team_members
WHERE roll ILIKE 'online-reg-%' OR roll ILIKE 'reg-online-%';

-- 4. Revert profile role to STUDENT for volunteer applicants who are not active team members
UPDATE public.profiles p
SET role = 'STUDENT'
FROM public.volunteer_applications v
WHERE p.id = v.user_id
  AND p.role = 'VOLUNTEER'
  AND NOT EXISTS (
    SELECT 1 FROM public.team_members tm WHERE tm.user_id = p.id
  );
