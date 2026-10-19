-- ============================================================
-- Migration 0056: Cascade Delete and Automatic Roll Release
--
-- Ensures that when any user, student, or volunteer application is
-- deleted (via the application or directly in the Supabase database),
-- all linked volunteer applications, team member records, and assigned
-- registration roll numbers (online-reg-1, online-reg-2, etc.) are
-- automatically deleted and released so the number can be re-assigned.
-- ============================================================

-- 1. Update foreign key on volunteer_applications.student_id to ON DELETE CASCADE
ALTER TABLE public.volunteer_applications
  DROP CONSTRAINT IF EXISTS volunteer_applications_student_id_fkey;

ALTER TABLE public.volunteer_applications
  ADD CONSTRAINT volunteer_applications_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES public.students (id) ON DELETE CASCADE;

-- 2. Trigger on students deletion: clean up volunteer_applications & team_members
CREATE OR REPLACE FUNCTION public.sync_cleanup_on_student_delete()
RETURNS trigger AS $$
BEGIN
  -- Remove volunteer applications so their serial_no / roll is completely freed
  DELETE FROM public.volunteer_applications
  WHERE student_id = OLD.id
     OR (OLD.user_id IS NOT NULL AND user_id = OLD.user_id);

  -- Remove team_members created for this student
  DELETE FROM public.team_members
  WHERE student_id = OLD.id::text
     OR (OLD.user_id IS NOT NULL AND user_id = OLD.user_id);

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_cleanup_on_student_delete ON public.students;
CREATE TRIGGER trg_cleanup_on_student_delete
  AFTER DELETE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_cleanup_on_student_delete();

-- 3. Trigger on team_members deletion: clean up volunteer_applications
CREATE OR REPLACE FUNCTION public.sync_cleanup_on_team_member_delete()
RETURNS trigger AS $$
BEGIN
  -- If this team member had an online registration roll, delete the application so roll is freed
  IF OLD.roll IS NOT NULL AND (OLD.roll ILIKE 'online-reg-%' OR OLD.roll ILIKE 'reg-online-%') THEN
    DELETE FROM public.volunteer_applications WHERE serial_no = OLD.roll;
  END IF;

  IF OLD.user_id IS NOT NULL THEN
    DELETE FROM public.volunteer_applications WHERE user_id = OLD.user_id;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_cleanup_on_team_member_delete ON public.team_members;
CREATE TRIGGER trg_cleanup_on_team_member_delete
  AFTER DELETE ON public.team_members
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_cleanup_on_team_member_delete();

-- 4. Trigger on volunteer_applications deletion: clean up team_members & reset profile
CREATE OR REPLACE FUNCTION public.sync_cleanup_on_volunteer_application_delete()
RETURNS trigger AS $$
BEGIN
  IF OLD.serial_no IS NOT NULL AND (OLD.serial_no ILIKE 'online-reg-%' OR OLD.serial_no ILIKE 'reg-online-%') THEN
    DELETE FROM public.team_members WHERE roll = OLD.serial_no;
  END IF;

  IF OLD.user_id IS NOT NULL THEN
    DELETE FROM public.team_members
    WHERE user_id = OLD.user_id
      AND (roll ILIKE 'online-reg-%' OR roll ILIKE 'reg-online-%');

    -- Revert profile role from VOLUNTEER to STUDENT if they have no other team membership
    IF NOT EXISTS (SELECT 1 FROM public.team_members WHERE user_id = OLD.user_id) THEN
      UPDATE public.profiles
      SET role = 'STUDENT'
      WHERE id = OLD.user_id AND role = 'VOLUNTEER';
    END IF;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_cleanup_on_volunteer_app_delete ON public.volunteer_applications;
CREATE TRIGGER trg_cleanup_on_volunteer_app_delete
  AFTER DELETE ON public.volunteer_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_cleanup_on_volunteer_application_delete();
