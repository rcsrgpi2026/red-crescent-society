import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile, UserRole, Volunteer } from "@/types/database";

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

export async function getCurrentVolunteer(): Promise<Volunteer | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("volunteers")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return data;
}

const ADMIN_ONLY: UserRole[] = ["SUPER_ADMIN", "ADMIN"];

/** Redirects to the login page when there is no session or the user is not an admin. */
export async function requireAdmin() {
  const profile = await getProfile();
  if (!profile || !ADMIN_ONLY.includes(profile.role)) {
    redirect("/admin/login");
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

export function canAccessAdmin(profile: Profile | null): boolean {
  return !!profile && ADMIN_ONLY.includes(profile.role);
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
