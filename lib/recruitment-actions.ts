"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured, isServiceRoleConfigured } from "@/lib/supabase/config";
import {
  getCurrentUser,
  getProfile,
  getCurrentStudent,
  requireAdmin,
  logAudit,
} from "@/lib/auth";
import {
  volunteerApplicationSchema,
  recruitmentCampaignSchema,
} from "@/lib/validation";
import { isSemesterEligible } from "@/lib/constants";
import { createAndDispatchNotification } from "@/lib/notifications/notification-service";
import type { ActionResult } from "@/lib/actions";

function zodErrors(error: import("zod").ZodError): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    (result[key] ??= []).push(issue.message);
  }
  return result;
}

function guardConfig() {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured. Add your credentials (see README).");
  }
}

async function guardAdmin() {
  guardConfig();
  const profile = await requireAdmin();
  if (!profile) {
    throw new Error("You are not authorized to perform this action.");
  }
  return profile;
}

// ------------------------------------------------------------
// Student: Submit Volunteer Application
// ------------------------------------------------------------

export async function submitVolunteerApplication(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  guardConfig();

  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      message: "You must be signed in with a student account to apply.",
    };
  }

  const profile = await getProfile();
  if (!profile || (profile.role !== "STUDENT" && profile.role !== "USER")) {
    if (profile?.role === "VOLUNTEER") {
      return {
        success: false,
        message: "You are already an approved volunteer.",
      };
    }
    return {
      success: false,
      message: "Only verified student accounts can apply for volunteer recruitment.",
    };
  }

  const student = await getCurrentStudent();
  if (!student) {
    return {
      success: false,
      message: "Student record not found. Please complete your student profile first.",
    };
  }

  const campaignId = String(formData.get("campaignId") || "");
  const skillsRaw = formData.get("skills");
  let skills: string[] = [];
  if (typeof skillsRaw === "string") {
    skills = skillsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  } else if (Array.isArray(skillsRaw)) {
    skills = skillsRaw;
  }

  const rawSemesterInput = formData.get("semester");
  const studentSemester =
    typeof rawSemesterInput === "string" && rawSemesterInput.trim()
      ? rawSemesterInput.trim()
      : student.semester || "";

  const parsed = volunteerApplicationSchema.safeParse({
    campaignId,
    phone: formData.get("phone") || student.phone,
    bloodGroup: formData.get("bloodGroup") || student.blood_group || "",
    emergencyContactName: formData.get("emergencyContactName"),
    emergencyContactPhone: formData.get("emergencyContactPhone"),
    previousVolunteerExperience: formData.get("previousVolunteerExperience"),
    motivation: formData.get("motivation"),
    skills,
    agreement: formData.get("agreement") === "true" || formData.get("agreement") === "on",
  });

  if (!parsed.success) {
    return { success: false, errors: zodErrors(parsed.error) };
  }

  const admin = createAdminClient();

  // 1. Validate Campaign Status
  const { data: campaign, error: campErr } = await admin
    .from("recruitment_campaigns")
    .select("*")
    .eq("id", campaignId)
    .maybeSingle();

  if (campErr || !campaign) {
    return {
      success: false,
      message: "The selected recruitment campaign could not be found.",
    };
  }

  if (!campaign.is_active) {
    return {
      success: false,
      message: "Recruitment has closed. Applications are no longer being accepted.",
    };
  }

  // 2. Validate Semester Eligibility
  if (!studentSemester) {
    return {
      success: false,
      message: "Please specify your current semester in your application.",
    };
  }

  if (!isSemesterEligible(studentSemester, campaign.allowed_semesters)) {
    return {
      success: false,
      message: `Sorry, your current semester (${studentSemester}) is not eligible for the ongoing volunteer recruitment.`,
    };
  }

  // 3. Check for Existing Applications (Duplicate prevention)
  const { data: existingApps } = await admin
    .from("volunteer_applications")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("campaign_id", campaignId);

  const pendingApp = existingApps?.find((a) => a.status === "PENDING");
  if (pendingApp) {
    return {
      success: false,
      message: "You already have a volunteer application under review for this recruitment campaign.",
    };
  }

  const approvedApp = existingApps?.find((a) => a.status === "APPROVED");
  if (approvedApp) {
    return {
      success: false,
      message: "You are already an approved volunteer.",
    };
  }

  const v = parsed.data;

  // If student updated semester/phone/blood group in this form, sync it back to student table
  if (
    studentSemester !== student.semester ||
    v.phone !== student.phone ||
    (v.bloodGroup && v.bloodGroup !== student.blood_group)
  ) {
    await admin
      .from("students")
      .update({
        semester: studentSemester,
        phone: v.phone,
        blood_group: v.bloodGroup || student.blood_group,
      })
      .eq("id", student.id);
  }

  // Insert application row
  const { data: createdApp, error: insertErr } = await admin
    .from("volunteer_applications")
    .insert({
      user_id: user.id,
      campaign_id: campaign.id,
      student_id: student.id,
      name: student.name,
      roll: student.roll,
      registration_no: (student as any).registration_no || null,
      session: student.session,
      department: student.department,
      semester: studentSemester,
      email: student.email,
      phone: v.phone,
      blood_group: v.bloodGroup,
      emergency_contact_name: v.emergencyContactName,
      emergency_contact_phone: v.emergencyContactPhone,
      previous_volunteer_experience: v.previousVolunteerExperience || null,
      motivation: v.motivation,
      skills: v.skills,
      status: "PENDING",
    })
    .select("id")
    .single();

  if (insertErr || !createdApp) {
    console.error("submitVolunteerApplication error:", insertErr);
    return {
      success: false,
      message: "Could not submit your application. Please try again.",
    };
  }

  // Send smart notification to applicant
  try {
    await createAndDispatchNotification(
      {
        title: "📋 Volunteer Application Submitted",
        body: `Thank you ${student.name}! Your application for ${campaign.title} has been received and is currently under review by the society leadership.`,
        type: "system",
        priority: "normal",
        actionUrl: "/student",
      },
      {
        specificUserIds: [user.id],
      }
    );
  } catch (notifErr) {
    console.warn("Notification error after application submission:", notifErr);
  }

  // Also dispatch push notification to Admins for application review
  try {
    await createAndDispatchNotification(
      {
        title: `📋 নতুন ভলান্টিয়ার আবেদন: ${student.name}`,
        body: `${student.name} (${student.department}) "${campaign.title}"-এ আবেদন করেছেন। অনুমোদনের জন্য ক্লিক করুন।`,
        type: "system",
        priority: "high",
        actionUrl: "/admin/recruitment/applications",
      },
      {
        roles: ["SUPER_ADMIN", "ADMIN", "VOLUNTEER_MANAGER"],
      }
    );
  } catch (adminNotifErr) {
    console.warn("Admin notification error after application submission:", adminNotifErr);
  }

  await logAudit("volunteer_application_submitted", "volunteer_application", createdApp.id, {
    campaign_id: campaign.id,
    roll: student.roll,
    department: student.department,
  });

  revalidatePath("/student");
  revalidatePath("/apply-volunteer");
  revalidatePath("/admin/recruitment/applications");
  revalidatePath("/admin/recruitment");

  return {
    success: true,
    message: "Application submitted successfully! Your application is now under review.",
  };
}

// ------------------------------------------------------------
// Admin: Toggle Recruitment (ON / OFF)
// ------------------------------------------------------------

export async function adminToggleRecruitment(
  campaignId: string,
  isActive: boolean
): Promise<ActionResult> {
  const profile = await guardAdmin();
  const admin = createAdminClient();

  // If activating this campaign, deactivate any other campaigns
  if (isActive) {
    await admin
      .from("recruitment_campaigns")
      .update({ is_active: false })
      .neq("id", campaignId);
  }

  const { error } = await admin
    .from("recruitment_campaigns")
    .update({ is_active: isActive })
    .eq("id", campaignId);

  if (error) {
    console.error("adminToggleRecruitment error:", error);
    return { success: false, message: "Failed to update recruitment status." };
  }

  await logAudit("recruitment_toggled", "recruitment_campaign", campaignId, {
    is_active: isActive,
    toggled_by: profile.id,
  });

  updateTag("recruitment");
  updateTag("home");
  revalidatePath("/");
  revalidatePath("/apply-volunteer");
  revalidatePath("/admin/recruitment");

  return {
    success: true,
    message: isActive
      ? "Volunteer recruitment is now OPEN. The homepage popup and banner are active."
      : "Volunteer recruitment is now CLOSED. Public registration access has been disabled.",
  };
}

// ------------------------------------------------------------
// Admin: Save / Create Recruitment Campaign
// ------------------------------------------------------------

export async function adminSaveRecruitmentCampaign(
  formData: FormData
): Promise<ActionResult> {
  const profile = await guardAdmin();

  const id = formData.get("id") ? String(formData.get("id")) : null;
  const rawSemesters = formData.getAll("allowedSemesters");
  let allowedSemesters: string[] = [];
  if (rawSemesters.length > 0) {
    allowedSemesters = rawSemesters.map(String);
  } else if (typeof formData.get("allowedSemesters") === "string") {
    allowedSemesters = String(formData.get("allowedSemesters"))
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const parsed = recruitmentCampaignSchema.safeParse({
    title: formData.get("title"),
    isActive: formData.get("isActive") === "true" || formData.get("isActive") === "on",
    popupTitle: formData.get("popupTitle"),
    popupDescription: formData.get("popupDescription"),
    bannerTitle: formData.get("bannerTitle"),
    bannerSubtitle: formData.get("bannerSubtitle"),
    allowedSemesters: allowedSemesters.length > 0 ? allowedSemesters : ["1st", "2nd", "3rd"],
    startDate: formData.get("startDate") || "",
    endDate: formData.get("endDate") || "",
    maxApplications: formData.get("maxApplications") || null,
  });

  if (!parsed.success) {
    return { success: false, errors: zodErrors(parsed.error) };
  }

  const v = parsed.data;
  const admin = createAdminClient();

  if (v.isActive) {
    // Deactivate other campaigns
    if (id) {
      await admin.from("recruitment_campaigns").update({ is_active: false }).neq("id", id);
    } else {
      await admin.from("recruitment_campaigns").update({ is_active: false });
    }
  }

  const payload: Record<string, unknown> = {
    title: v.title,
    is_active: v.isActive,
    popup_title: v.popupTitle,
    popup_description: v.popupDescription,
    banner_title: v.bannerTitle,
    banner_subtitle: v.bannerSubtitle,
    allowed_semesters: v.allowedSemesters,
    start_date: v.startDate ? new Date(v.startDate).toISOString() : null,
    end_date: v.endDate ? new Date(v.endDate).toISOString() : null,
    max_applications: v.maxApplications ?? null,
  };

  if (id) {
    const { error } = await admin.from("recruitment_campaigns").update(payload).eq("id", id);
    if (error) {
      console.error("adminSaveRecruitmentCampaign update error:", error);
      return { success: false, message: "Could not update campaign settings." };
    }
  } else {
    payload.created_by = profile.id;
    const { error } = await admin.from("recruitment_campaigns").insert(payload);
    if (error) {
      console.error("adminSaveRecruitmentCampaign insert error:", error);
      return { success: false, message: "Could not create recruitment campaign." };
    }
  }

  await logAudit("recruitment_campaign_saved", "recruitment_campaign", id || "new", {
    title: v.title,
    is_active: v.isActive,
  });

  updateTag("recruitment");
  updateTag("home");
  revalidatePath("/");
  revalidatePath("/apply-volunteer");
  revalidatePath("/admin/recruitment");

  return {
    success: true,
    message: "Recruitment campaign settings saved successfully!",
  };
}

// ------------------------------------------------------------
// Admin: Approve Volunteer Application
// ------------------------------------------------------------

export async function adminApproveVolunteerApplication(
  applicationId: string
): Promise<ActionResult> {
  const profile = await guardAdmin();
  const admin = createAdminClient();

  // 1. Fetch application and verify PENDING status
  const { data: application, error: appErr } = await admin
    .from("volunteer_applications")
    .select("*, recruitment_campaigns(title)")
    .eq("id", applicationId)
    .maybeSingle();

  if (appErr || !application) {
    return { success: false, message: "Application not found." };
  }

  if (application.status !== "PENDING") {
    return {
      success: false,
      message: `Cannot approve this application because it is already ${application.status.toLowerCase()}.`,
    };
  }

  // 2. Generate sequential Member ID: RCR-YYYY-NNNN
  const year = new Date().getFullYear();
  const { count } = await admin
    .from("team_members")
    .select("id", { count: "exact", head: true })
    .ilike("member_id", `RCR-${year}-%`);
  const nextNumber = (count ?? 0) + 1;
  const memberId = `RCR-${year}-${String(nextNumber).padStart(4, "0")}`;
  const now = new Date().toISOString();

  // 3. Update application status
  const { error: updateAppErr } = await admin
    .from("volunteer_applications")
    .update({
      status: "APPROVED",
      reviewed_by: profile.id,
      reviewed_at: now,
    })
    .eq("id", applicationId);

  if (updateAppErr) {
    console.error("adminApproveVolunteerApplication updateApp error:", updateAppErr);
    return { success: false, message: "Failed to update application status." };
  }

  // 4. Update Profile Role: STUDENT -> VOLUNTEER
  const { error: profileErr } = await admin
    .from("profiles")
    .update({ role: "VOLUNTEER" })
    .eq("id", application.user_id);

  if (profileErr) {
    console.error("adminApproveVolunteerApplication role update error:", profileErr);
  }

  // 5. Create or Update Team Member Record
  const { data: existingMember } = await admin
    .from("team_members")
    .select("id, member_id")
    .eq("user_id", application.user_id)
    .maybeSingle();

  if (existingMember) {
    await admin
      .from("team_members")
      .update({
        status: "APPROVED",
        member_id: existingMember.member_id || memberId,
        joined_at: now,
        roll: application.roll,
        registration_no: application.registration_no,
        session: application.session,
        department: application.department,
        semester: application.semester,
        phone: application.phone,
        email: application.email,
        blood_group: application.blood_group,
        emergency_contact_name: application.emergency_contact_name,
        emergency_contact_phone: application.emergency_contact_phone,
        skills: application.skills,
        experience: application.previous_volunteer_experience,
        motivation: application.motivation,
      })
      .eq("id", existingMember.id);
  } else {
    await admin.from("team_members").insert({
      user_id: application.user_id,
      name: application.name,
      member_id: memberId,
      roll: application.roll,
      registration_no: application.registration_no,
      session: application.session,
      department: application.department,
      semester: application.semester,
      phone: application.phone,
      email: application.email,
      blood_group: application.blood_group,
      emergency_contact_name: application.emergency_contact_name,
      emergency_contact_phone: application.emergency_contact_phone,
      skills: application.skills,
      experience: application.previous_volunteer_experience,
      motivation: application.motivation,
      position: "General Member",
      status: "APPROVED",
      joined_at: now,
    });
  }

  // 6. Dispatch celebration notification to student user
  try {
    await createAndDispatchNotification(
      {
        title: "🎉 Volunteer Application Approved!",
        body: `Congratulations ${application.name}! Your volunteer application has been approved. Welcome to the RGPI Red Crescent Youth volunteer team! Member ID: ${memberId}. You can now access the volunteer portal.`,
        type: "system",
        priority: "high",
        actionUrl: "/volunteer",
      },
      {
        specificUserIds: [application.user_id],
      }
    );
  } catch (notifErr) {
    console.warn("Notification error after volunteer approval:", notifErr);
  }

  await logAudit("volunteer_application_approved", "volunteer_application", applicationId, {
    user_id: application.user_id,
    member_id: memberId,
    approved_by: profile.id,
  });

  updateTag("volunteers");
  revalidatePath("/admin/recruitment/applications");
  revalidatePath(`/admin/recruitment/applications/${applicationId}`);
  revalidatePath("/admin/recruitment");
  revalidatePath("/admin/team");
  revalidatePath("/team");
  revalidatePath("/volunteer");
  revalidatePath("/student");

  return {
    success: true,
    message: `Application approved! ${application.name} is now an official volunteer (${memberId}).`,
  };
}

// ------------------------------------------------------------
// Admin: Reject Volunteer Application
// ------------------------------------------------------------

export async function adminRejectVolunteerApplication(
  applicationId: string,
  rejectionReason?: string
): Promise<ActionResult> {
  const profile = await guardAdmin();
  const admin = createAdminClient();

  const { data: application, error: appErr } = await admin
    .from("volunteer_applications")
    .select("*, recruitment_campaigns(title)")
    .eq("id", applicationId)
    .maybeSingle();

  if (appErr || !application) {
    return { success: false, message: "Application not found." };
  }

  if (application.status !== "PENDING") {
    return {
      success: false,
      message: `Cannot reject this application because it is already ${application.status.toLowerCase()}.`,
    };
  }

  const now = new Date().toISOString();
  const reason = rejectionReason?.trim() || null;

  const { error: updateErr } = await admin
    .from("volunteer_applications")
    .update({
      status: "REJECTED",
      rejection_reason: reason,
      reviewed_by: profile.id,
      reviewed_at: now,
    })
    .eq("id", applicationId);

  if (updateErr) {
    console.error("adminRejectVolunteerApplication update error:", updateErr);
    return { success: false, message: "Could not update application status." };
  }

  // Send polite notification to student user
  try {
    const reasonText = reason ? ` Note: ${reason}` : "";
    await createAndDispatchNotification(
      {
        title: "Volunteer Application Update",
        body: `Your volunteer application for ${application.recruitment_campaigns?.title || "RGPI Red Crescent Youth"} has been reviewed. Unfortunately, it was not approved at this time.${reasonText}`,
        type: "system",
        priority: "normal",
        actionUrl: "/student",
      },
      {
        specificUserIds: [application.user_id],
      }
    );
  } catch (notifErr) {
    console.warn("Notification error after application rejection:", notifErr);
  }

  await logAudit("volunteer_application_rejected", "volunteer_application", applicationId, {
    user_id: application.user_id,
    rejection_reason: reason,
    rejected_by: profile.id,
  });

  revalidatePath("/admin/recruitment/applications");
  revalidatePath(`/admin/recruitment/applications/${applicationId}`);
  revalidatePath("/admin/recruitment");
  revalidatePath("/student");

  return {
    success: true,
    message: "Application rejected.",
  };
}
