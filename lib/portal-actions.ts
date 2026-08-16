"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionResult } from "@/lib/actions";

const studentProfileSchema = z.object({
  name: z.string().trim().min(2, "Full name must be at least 2 characters"),
  session: z.string().trim().min(4, "Session is required (e.g. 2024-25)"),
  semester: z.string().trim().min(1, "Semester is required"),
  roll: z.string().trim().min(1, "Roll number is required"),
  department: z.string().trim().min(1, "Department is required"),
  phone: z
    .string()
    .trim()
    .regex(/^(\+?8801|01)[3-9]\d{8}$/, "Provide a valid Bangladeshi mobile number"),
  bloodGroup: z.string().trim().optional(),
  address: z.string().trim().optional(),
});

const volunteerProfileSchema = z.object({
  name: z.string().trim().min(2, "Full name must be at least 2 characters"),
  session: z
    .string()
    .trim()
    .min(1, "Select your session")
    .max(20)
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .trim()
    .regex(/^(\+?8801|01)[3-9]\d{8}$/, "Provide a valid Bangladeshi mobile number"),
  area: z.string().trim().min(2, "Area/address is required"),
  emergencyContactName: z.string().trim().min(2, "Emergency contact name is required"),
  emergencyContactPhone: z
    .string()
    .trim()
    .regex(/^(\+?8801|01)[3-9]\d{8}$/, "Provide a valid emergency mobile number"),
  skills: z.string().trim().optional(),
  experience: z.string().trim().optional(),
  motivation: z.string().trim().optional(),
  publicProfile: z.coerce.boolean().optional(),
});

function zodErrors(error: z.ZodError): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    (result[key] ??= []).push(issue.message);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Student Profile Actions
// ---------------------------------------------------------------------------

export async function updateStudentProfile(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = studentProfileSchema.safeParse({
    name: formData.get("name"),
    session: formData.get("session"),
    semester: formData.get("semester"),
    roll: formData.get("roll"),
    department: formData.get("department"),
    phone: formData.get("phone"),
    bloodGroup: formData.get("bloodGroup") || undefined,
    address: formData.get("address") || undefined,
  });

  if (!parsed.success) {
    return { success: false, errors: zodErrors(parsed.error) };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "You must be signed in to update your profile." };
  }

  const v = parsed.data;

  // Update student table
  const { error: studentError } = await supabase
    .from("students")
    .update({
      name: v.name,
      session: v.session,
      semester: v.semester,
      roll: v.roll,
      department: v.department,
      phone: v.phone,
      blood_group: v.bloodGroup || null,
      address: v.address || null,
    })
    .eq("user_id", user.id);

  if (studentError) {
    console.error("updateStudentProfile error:", studentError);
    return { success: false, message: "Failed to update profile. Please try again." };
  }

  // Sync profile name
  await supabase.from("profiles").update({ full_name: v.name }).eq("id", user.id);

  revalidatePath("/student");
  return { success: true, message: "Student profile details updated successfully!" };
}

export async function updateStudentPhoto(photoUrl: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "You must be signed in." };
  }

  const { error } = await supabase
    .from("students")
    .update({ photo_url: photoUrl })
    .eq("user_id", user.id);

  if (error) {
    console.error("updateStudentPhoto error:", error);
    return { success: false, message: "Failed to save profile photo." };
  }

  // Sync to profiles avatar
  await supabase.from("profiles").update({ avatar_url: photoUrl }).eq("id", user.id);

  revalidatePath("/student");
  return { success: true, message: "Profile picture updated successfully!" };
}

// ---------------------------------------------------------------------------
// Team Member Profile Actions
// ---------------------------------------------------------------------------

export async function updateTeamMemberProfile(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = volunteerProfileSchema.safeParse({
    name: formData.get("name"),
    session: formData.get("session") || undefined,
    phone: formData.get("phone"),
    area: formData.get("area"),
    emergencyContactName: formData.get("emergencyContactName"),
    emergencyContactPhone: formData.get("emergencyContactPhone"),
    skills: formData.get("skills") || undefined,
    experience: formData.get("experience") || undefined,
    motivation: formData.get("motivation") || undefined,
    publicProfile: formData.get("publicProfile") === "true",
  });

  if (!parsed.success) {
    return { success: false, errors: zodErrors(parsed.error) };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "You must be signed in to update your profile." };
  }

  const v = parsed.data;
  const skillsArray = v.skills
    ? v.skills.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const { error: volError } = await supabase
    .from("team_members")
    .update({
      name: v.name,
      session: v.session || null,
      phone: v.phone,
      area: v.area,
      emergency_contact_name: v.emergencyContactName,
      emergency_contact_phone: v.emergencyContactPhone,
      skills: skillsArray,
      experience: v.experience || null,
      motivation: v.motivation || null,
      public_profile: v.publicProfile ?? true,
    })
    .eq("user_id", user.id);

  if (volError) {
    console.error("updateTeamMemberProfile error:", volError);
    return { success: false, message: "Failed to update profile. Please try again." };
  }

  // Sync profile name
  await supabase.from("profiles").update({ full_name: v.name }).eq("id", user.id);

  revalidatePath("/volunteer");
  revalidatePath("/team");
  return { success: true, message: "Team member profile details updated successfully!" };
}

export async function updateTeamMemberPhoto(photoUrl: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "You must be signed in." };
  }

  const { error } = await supabase
    .from("team_members")
    .update({ photo_url: photoUrl })
    .eq("user_id", user.id);

  if (error) {
    console.error("updateTeamMemberPhoto error:", error);
    return { success: false, message: "Failed to save profile photo." };
  }

  // Sync to profiles avatar
  await supabase.from("profiles").update({ avatar_url: photoUrl }).eq("id", user.id);

  revalidatePath("/volunteer");
  revalidatePath("/team");
  return { success: true, message: "Profile picture updated successfully!" };
}
