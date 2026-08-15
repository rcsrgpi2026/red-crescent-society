import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile, Student, TeamMember, UserRole } from "@/types/database";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(): Promise<Profile | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return data;
}

export async function getCurrentTeamMember(): Promise<TeamMember | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("team_members")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return data;
}

export async function getCurrentStudent(): Promise<Student | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("students")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return data;
}

/** The default landing area for each profile role (admin, portal or home). */
export function homeForRole(role: UserRole | null | undefined): string {
  switch (role) {
    case "SUPER_ADMIN":
    case "ADMIN":
    case "VOLUNTEER_MANAGER":
    case "EVENT_MANAGER":
    case "CONTENT_MANAGER":
      return "/admin";
    case "STUDENT":
      return "/student";
    case "VOLUNTEER":
      return "/volunteer";
    default:
      return "/";
  }
}

/** Roles that are allowed into the /admin dashboard. */
export function isAdminRole(role: UserRole | null | undefined): boolean {
  return (
    role === "SUPER_ADMIN" ||
    role === "ADMIN" ||
    role === "VOLUNTEER_MANAGER" ||
    role === "EVENT_MANAGER" ||
    role === "CONTENT_MANAGER"
  );
}

const ADMIN_ONLY: UserRole[] = ["SUPER_ADMIN", "ADMIN"];

/**
 * Returns the admin profile, or `null` when there is no session or the user is
 * not an admin. Callers decide what to do with `null`: pages redirect, route
 * handlers return an HTTP error (redirects from route handlers can collide
 * with the middleware's login interception and produce confusing responses).
 */
export async function requireAdmin(): Promise<Profile | null> {
  const profile = await getProfile();
  if (!profile || !isAdminRole(profile.role)) {
    return null;
  }
  return profile;
}

/** Redirects when the user lacks one of the required roles. */
export async function requireAnyRole(roles: UserRole[]) {
  const profile = await getProfile();
  if (!profile || !roles.includes(profile.role)) {
    redirect("/admin");
  }
  return profile;
}

/** Redirects to the student login when there is no student session. */
export async function requireStudent() {
  const profile = await getProfile();
  if (!profile || profile.role !== "STUDENT") {
    redirect("/student/login");
  }
  const student = await getCurrentStudent();
  if (!student) {
    redirect("/student/login");
  }
  return { profile, student };
}

/**
 * Redirects to the team member login when there is no team member session.
 * Pending/rejected team members still land here — the page itself shows the
 * approval notice (login is allowed, access is gated by admin approval).
 */
export async function requireTeamMember() {
  const profile = await getProfile();
  if (!profile || profile.role !== "VOLUNTEER") {
    redirect("/volunteer/login");
  }
  const teamMember = await getCurrentTeamMember();
  if (!teamMember) {
    redirect("/volunteer/login");
  }
  return { profile, teamMember };
}

export function canAccessAdmin(profile: Profile | null): boolean {
  return !!profile && isAdminRole(profile.role);
}

/**
 * Records an administrative action in the audit log. Uses the service-role
 * client because audit entries must never be blocked by RLS.
 */
export async function logAudit(
  action: string,
  targetType?: string,
  targetId?: string,
  details?: Record<string, unknown>
) {
  try {
    const user = await getCurrentUser();
    const admin = createAdminClient();
    await admin.from("audit_logs").insert({
      user_id: user?.id ?? null,
      action,
      target_type: targetType,
      target_id: targetId,
      details: details ?? null,
    });
  } catch {
    // Audit logging must never break the primary action.
  }
}
