"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured, isServiceRoleConfigured } from "@/lib/supabase/config";
import { isAdminRole, homeForRole } from "@/lib/auth";
import { studentSignupSchema, volunteerSignupSchema } from "@/lib/validation";
import type { ActionResult } from "@/lib/actions";

export interface LoginResult extends ActionResult {
  redirectTo?: string;
}

function zodErrors(error: import("zod").ZodError): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    (result[key] ??= []).push(issue.message);
  }
  return result;
}

/**
 * Portal login shared by the student and volunteer forms. Sign-in is plain
 * Supabase email/password; where the user goes afterwards depends on their
 * profile role — admins always land on the admin dashboard, students on the
 * student portal, and volunteers on the volunteer portal (which shows their
 * approval state).
 */
export async function portalLogin(
  email: string,
  password: string
): Promise<LoginResult> {
  if (!isSupabaseConfigured) {
    return {
      success: false,
      message:
        "Authentication is not configured yet. Add your Supabase credentials (see README) before logging in.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { success: false, message: "Invalid credentials. Check your email and password." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  const role = profile?.role ?? null;

  // Admins can sign in from both the student and volunteer login options.
  if (isAdminRole(role)) {
    return { success: true, message: "Signed in", redirectTo: "/admin" };
  }

  // Unknown roles (e.g. a legacy USER) have no portal yet.
  if (!role || role === "USER") {
    return {
      success: false,
      message:
        "This account has no portal access. If you are a student or volunteer, create an account through the correct portal.",
    };
  }

  return { success: true, message: "Signed in", redirectTo: homeForRole(role) };
}

export async function studentSignUp(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = studentSignupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    session: formData.get("session"),
    semester: formData.get("semester"),
    roll: formData.get("roll"),
    department: formData.get("department"),
    phone: formData.get("phone"),
  });

  if (!parsed.success) {
    return { success: false, errors: zodErrors(parsed.error) };
  }

  if (!isSupabaseConfigured || !isServiceRoleConfigured) {
    return {
      success: false,
      message: "Registration is not available right now. Please try again later.",
    };
  }

  const v = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: v.email,
    password: v.password,
    options: { data: { full_name: v.name } },
  });

  if (error) {
    if (error.code === "user_already_exists" || /already registered/i.test(error.message)) {
      return {
        success: false,
        message: "An account with this email already exists. Try signing in instead.",
      };
    }
    return { success: false, message: error.message };
  }

  const userId = data.user?.id;
  if (!userId) {
    return { success: false, message: "Something went wrong while creating the account. Please try again." };
  }

  // Service role: assign the STUDENT role and create the student record.
  // (Bypasses RLS — the profile trigger and email confirmation settings
  // shouldn't decide whether the record is created.)
  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({ role: "STUDENT", full_name: v.name })
    .eq("id", userId);

  const { error: insertError } = await admin.from("students").insert({
    user_id: userId,
    name: v.name,
    session: v.session,
    semester: v.semester,
    roll: v.roll,
    department: v.department,
    phone: v.phone,
    email: v.email,
  });
  if (insertError) {
    console.error("studentSignUp insert error:", insertError);
    return {
      success: false,
      message: "Something went wrong while saving your profile. Please try again.",
    };
  }

  // No admin approval is required for students — if Supabase returned a
  // session (email confirmation disabled) go straight to the portal.
  if (data.session) {
    redirect("/student");
  }
  return {
    success: true,
    message:
      "Account created! Please confirm your email address before signing in — the confirmation link was sent to your inbox.",
  };
}

export async function volunteerSignUp(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = volunteerSignupSchema.safeParse({
    name: formData.get("name"),
    roll: formData.get("roll"),
    registrationNo: formData.get("registrationNo"),
    department: formData.get("department"),
    semester: formData.get("semester"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    password: formData.get("password"),
    bloodGroup: formData.get("bloodGroup"),
    area: formData.get("area"),
    emergencyContactName: formData.get("emergencyContactName"),
    emergencyContactPhone: formData.get("emergencyContactPhone"),
    skills: (formData.get("skills") as string)
      ?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? [],
    experience: formData.get("experience"),
    motivation: formData.get("motivation"),
  });

  if (!parsed.success) {
    return { success: false, errors: zodErrors(parsed.error) };
  }

  if (!isSupabaseConfigured || !isServiceRoleConfigured) {
    return {
      success: false,
      message: "Registration is not available right now. Please try again later.",
    };
  }

  const v = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: v.email,
    password: v.password,
    options: { data: { full_name: v.name } },
  });

  if (error) {
    if (error.code === "user_already_exists" || /already registered/i.test(error.message)) {
      return {
        success: false,
        message: "An account with this email already exists. Try signing in instead.",
      };
    }
    return { success: false, message: error.message };
  }

  const userId = data.user?.id;
  if (!userId) {
    return { success: false, message: "Something went wrong while creating the account. Please try again." };
  }

  const admin = createAdminClient();
  await admin.from("profiles").update({ role: "VOLUNTEER", full_name: v.name }).eq("id", userId);

  // Volunteer applications start PENDING — the admin approves them in the
  // admin panel before the volunteer portal unlocks.
  const { error: insertError } = await admin.from("volunteers").insert({
    user_id: userId,
    name: v.name,
    roll: v.roll,
    registration_no: v.registrationNo,
    department: v.department,
    semester: v.semester,
    phone: v.phone,
    email: v.email,
    blood_group: v.bloodGroup,
    area: v.area,
    emergency_contact_name: v.emergencyContactName,
    emergency_contact_phone: v.emergencyContactPhone,
    skills: v.skills,
    experience: v.experience,
    motivation: v.motivation,
    status: "PENDING",
    position: "Volunteer",
  });
  if (insertError) {
    console.error("volunteerSignUp insert error:", insertError);
    return {
      success: false,
      message: "Something went wrong while submitting your application. Please try again.",
    };
  }

  if (data.session) {
    redirect("/volunteer");
  }
  return {
    success: true,
    message:
      "Application submitted! The society leadership will review it and approve your membership. You can sign in anytime to check your status.",
  };
}
