"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured, isServiceRoleConfigured } from "@/lib/supabase/config";
import { isAdminRole, homeForRole } from "@/lib/auth";
import { z } from "zod";
import { studentSignupSchema, teamMemberSignupSchema } from "@/lib/validation";
import { sendPasswordResetEmail } from "@/lib/email/resend";
import { createAndDispatchNotification } from "@/lib/notifications/notification-service";
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
    semester: formData.get("semester") || "",
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
    semester: v.semester || "",
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
  const parsed = teamMemberSignupSchema.safeParse({
    name: formData.get("name"),
    roll: formData.get("roll"),
    registrationNo: formData.get("registrationNo"),
    session: formData.get("session"),
    department: formData.get("department"),
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

  // Team member applications start PENDING — the admin approves them in the
  // admin panel before the team member portal unlocks.
  const { error: insertError } = await admin.from("team_members").insert({
    user_id: userId,
    name: v.name,
    roll: v.roll,
    registration_no: v.registrationNo,
    session: v.session,
    department: v.department,
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
    position: "General Member",
  });
  if (insertError) {
    console.error("teamMemberSignUp insert error:", insertError);
    return {
      success: false,
      message: "Something went wrong while submitting your application. Please try again.",
    };
  }

  // Instant push & in-app notification to Admins for approval
  try {
    await createAndDispatchNotification(
      {
        title: `👤 নতুন মেম্বার আবেদন: ${v.name}`,
        body: `${v.name} (${v.department || "ভলান্টিয়ার"}) মেম্বারশিপের জন্য রেজিস্ট্রেশন করেছেন। অনুমোদনের জন্য ক্লিক করুন।`,
        type: "system",
        priority: "high",
        actionUrl: "/admin/team",
      },
      {
        roles: ["SUPER_ADMIN", "ADMIN", "VOLUNTEER_MANAGER"],
      }
    );
  } catch (notifErr) {
    console.warn("Could not dispatch volunteer signup admin notification:", notifErr);
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

/**
 * Initiates a password reset. First attempts to generate an action link and
 * send a custom branded email via Resend if configured; otherwise falls back
 * to Supabase's native auth mailer (which also routes through custom SMTP).
 */
export async function requestPasswordReset(email: string): Promise<ActionResult> {
  const cleanEmail = email.trim().toLowerCase();
  const parsed = z.string().email("Please provide a valid email address").safeParse(cleanEmail);
  if (!parsed.success) {
    return { success: false, message: "Please provide a valid email address." };
  }

  if (!isSupabaseConfigured) {
    return {
      success: false,
      message: "Authentication service is not configured. Please contact the administrator.",
    };
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  const redirectTo = `${appUrl}/auth/callback?next=/reset-password`;

  // 1. Direct email delivery via Gmail SMTP or Resend using admin generateLink
  const hasCustomMailer = !!(process.env.SMTP_PASS || process.env.RESEND_API_KEY);
  if (hasCustomMailer && isServiceRoleConfigured) {
    try {
      const admin = createAdminClient();
      const { data, error } = await admin.auth.admin.generateLink({
        type: "recovery",
        email: cleanEmail,
        options: {
          redirectTo,
        },
      });

      if (!error && data?.properties?.action_link) {
        const { data: profile } = await admin
          .from("profiles")
          .select("full_name")
          .eq("id", data.user.id)
          .maybeSingle();

        const emailResult = await sendPasswordResetEmail({
          to: cleanEmail,
          resetLink: data.properties.action_link,
          recipientName: profile?.full_name || null,
        });

        if (emailResult.success) {
          return {
            success: true,
            message: "Password reset link sent! Please check your email inbox and spam folder.",
          };
        } else {
          console.warn("[requestPasswordReset] Email delivery failed, falling back to Supabase auth:", emailResult.error);
        }
      }
    } catch (adminErr) {
      console.warn("[requestPasswordReset] Admin generateLink error, falling back to Supabase auth:", adminErr);
    }
  }

  // 2. Fallback: Supabase native resetPasswordForEmail
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo,
    });

    if (error) {
      console.error("[requestPasswordReset] Supabase reset error:", error);
      return { success: false, message: error.message };
    }

    return {
      success: true,
      message: "Password reset link sent! Please check your email inbox and spam folder.",
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to send reset link.";
    return { success: false, message: msg };
  }
}

/**
 * Updates the user's password once they have authenticated via the password recovery link.
 */
export async function updatePassword(newPassword: string): Promise<LoginResult> {
  if (!newPassword || newPassword.length < 8) {
    return {
      success: false,
      message: "Password must be at least 8 characters long.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    return {
      success: false,
      message: "Your reset session has expired or is invalid. Please request a new reset link.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    return { success: false, message: error.message };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role ?? null;
  const destination = isAdminRole(role) ? "/admin" : homeForRole(role);

  return {
    success: true,
    message: "Password updated successfully! Welcome back.",
    redirectTo: destination,
  };
}

