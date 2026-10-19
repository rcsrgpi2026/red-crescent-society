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
import { isSemesterEligible, normalizeSemester } from "@/lib/constants";
import { createAndDispatchNotification } from "@/lib/notifications/notification-service";
import { sendVolunteerApprovalEmail } from "@/lib/email/mailer";
import { generateNextMemberId, generateNextApplicationSerialNo } from "@/lib/member-id";
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

  const rawSemesterInput = formData.get("semester") || formData.get("currentSemester");
  const studentSemester =
    typeof rawSemesterInput === "string" && rawSemesterInput.trim()
      ? normalizeSemester(rawSemesterInput.trim()) || rawSemesterInput.trim()
      : normalizeSemester(student.semester) || student.semester || "";

  const getStr = (val: FormDataEntryValue | null | undefined): string =>
    val !== null && val !== undefined ? String(val).trim() : "";

  const parsed = volunteerApplicationSchema.safeParse({
    campaignId,
    phone: getStr(formData.get("phone")) || student.phone,
    bloodGroup: getStr(formData.get("bloodGroup")) || student.blood_group || "",
    emergencyContactName: getStr(formData.get("emergencyContactName")),
    emergencyContactPhone: getStr(formData.get("emergencyContactPhone")),
    previousVolunteerExperience:
      getStr(formData.get("previousVolunteerExperience")) ||
      getStr(formData.get("previousExperience")),
    motivation: getStr(formData.get("motivation")),
    skills,
    photoUrl: getStr(formData.get("photoUrl")),
    nidOrBirthCertUrl: getStr(formData.get("nidOrBirthCertUrl")),
    fatherNidUrl: getStr(formData.get("fatherNidUrl")),
    motherNidUrl: getStr(formData.get("motherNidUrl")),
    collegeRegCardUrl: getStr(formData.get("collegeRegCardUrl")),
    agreement: formData.get("agreement") === "true" || formData.get("agreement") === "on",
  });

  if (!parsed.success) {
    const errors = zodErrors(parsed.error);
    const firstErrorMessage =
      Object.values(errors).flat()[0] ||
      "অনুগ্রহ করে ফর্মের তথ্যগুলো সঠিকভাবে পূরণ করুন।";
    return { success: false, errors, message: firstErrorMessage };
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

  const appliedName = String(formData.get("name") || student.name).trim() || student.name;
  const appliedRoll = String(formData.get("studentId") || formData.get("roll") || student.roll).trim() || student.roll;
  const appliedSession = String(formData.get("session") || student.session).trim() || student.session;
  const appliedDepartment = String(formData.get("department") || student.department).trim() || student.department;

  // If student updated details in this form, sync it back to student table
  const studentUpdates: Record<string, any> = {};
  if (studentSemester && studentSemester !== student.semester) studentUpdates.semester = studentSemester;
  if (v.phone && v.phone !== student.phone) studentUpdates.phone = v.phone;
  if (v.bloodGroup && v.bloodGroup !== student.blood_group) studentUpdates.blood_group = v.bloodGroup;
  if (appliedRoll && appliedRoll !== student.roll) studentUpdates.roll = appliedRoll;
  if (appliedSession && appliedSession !== student.session) studentUpdates.session = appliedSession;
  if (appliedDepartment && appliedDepartment !== student.department) studentUpdates.department = appliedDepartment;
  if (appliedName && appliedName !== student.name) studentUpdates.name = appliedName;

  if (Object.keys(studentUpdates).length > 0) {
    await admin.from("students").update(studentUpdates).eq("id", student.id);
  }

  // Collect any custom or dynamic fields submitted through Form Editor
  const formDataRecord: Record<string, any> = {};
  formData.forEach((value, key) => {
    if (!["pushEndpoint", "pushP256dh", "pushAuth", "pushPlatform", "pushBrowser"].includes(key)) {
      if (typeof value === "string") {
        formDataRecord[key] = value;
      }
    }
  });

  const nameBn = String(formData.get("nameBn") || formData.get("name_bn") || "").trim() || null;
  const fatherName = String(formData.get("fatherName") || formData.get("father_name") || "").trim() || null;
  const motherName = String(formData.get("motherName") || formData.get("mother_name") || "").trim() || null;
  const dob = String(formData.get("dob") || "").trim() || null;
  const nationality = String(formData.get("nationality") || "বাংলাদেশী").trim() || null;
  const shift = String(formData.get("shift") || "").trim() || null;
  const groupName = String(formData.get("group") || formData.get("group_name") || "").trim() || null;
  const maritalStatus = String(formData.get("maritalStatus") || formData.get("marital_status") || "").trim() || null;
  const permanentAddress = String(formData.get("permanentAddress") || formData.get("permanent_address") || "").trim() || null;
  const presentAddress = String(formData.get("presentAddress") || formData.get("present_address") || "").trim() || null;
  const latestGpa = String(formData.get("latestGpa") || formData.get("latest_gpa") || "").trim() || null;
  const regNo = String(formData.get("registrationNo") || formData.get("registration_no") || (student as any).registration_no || "").trim() || null;
  const prevExp = String(formData.get("previousExperience") || v.previousVolunteerExperience || "").trim() || null;

  const rejectedApp = existingApps?.find((a) => a.status === "REJECTED");

  const applicationPayload = {
    user_id: user.id,
    campaign_id: campaign.id,
    student_id: student.id,
    name: appliedName,
    name_bn: nameBn,
    father_name: fatherName,
    mother_name: motherName,
    dob: dob,
    nationality: nationality,
    shift: shift,
    group_name: groupName,
    marital_status: maritalStatus,
    permanent_address: permanentAddress,
    present_address: presentAddress,
    latest_gpa: latestGpa,
    roll: appliedRoll,
    registration_no: regNo,
    session: appliedSession,
    department: appliedDepartment,
    semester: studentSemester,
    email: String(formData.get("email") || student.email).trim() || student.email,
    phone: v.phone,
    blood_group: v.bloodGroup,
    emergency_contact_name: v.emergencyContactName || fatherName || "অভিভাবক",
    emergency_contact_phone: v.emergencyContactPhone || v.phone,
    previous_volunteer_experience: prevExp,
    motivation: v.motivation || "রেড ক্রিসেন্ট সোসাইটির মানবিক কার্যক্রমে যুক্ত হয়ে আর্তমানবতার সেবায় নিজেকে নিয়োজিত করতে চাই।",
    skills: v.skills,
    photo_url: v.photoUrl || null,
    nid_or_birth_cert_url: v.nidOrBirthCertUrl || null,
    father_nid_url: v.fatherNidUrl || null,
    mother_nid_url: v.motherNidUrl || null,
    college_reg_card_url: v.collegeRegCardUrl || null,
    form_data: formDataRecord,
    status: "PENDING" as const,
    rejection_reason: null,
    reviewed_by: null,
    reviewed_at: null,
    created_at: new Date().toISOString(),
  };

  let createdApp: { id: string } | null = null;

  if (rejectedApp) {
    // Re-applying after previous rejection: update the existing row to PENDING
    const { data: updatedApp, error: updateErr } = await admin
      .from("volunteer_applications")
      .update(applicationPayload)
      .eq("id", rejectedApp.id)
      .select("id")
      .single();

    if (updateErr || !updatedApp) {
      console.error("submitVolunteerApplication reapply update error:", updateErr);
      return {
        success: false,
        message: "Could not update and re-submit your application. Please try again.",
      };
    }
    createdApp = updatedApp;
  } else {
    // Fresh application: insert new application row
    const { data: newApp, error: insertErr } = await admin
      .from("volunteer_applications")
      .insert(applicationPayload)
      .select("id")
      .single();

    if (insertErr || !newApp) {
      console.error("submitVolunteerApplication error:", insertErr);
      return {
        success: false,
        message: "Could not submit your application. Please try again.",
      };
    }
    createdApp = newApp;
  }

  // Capture and register push subscription if provided
  const pushEndpoint = String(formData.get("pushEndpoint") || "").trim();
  const pushP256dh = String(formData.get("pushP256dh") || "").trim();
  const pushAuth = String(formData.get("pushAuth") || "").trim();
  const pushPlatform = String(formData.get("pushPlatform") || "").trim();
  const pushBrowser = String(formData.get("pushBrowser") || "").trim();

  if (pushEndpoint && pushP256dh && pushAuth) {
    try {
      await admin.from("push_subscriptions").upsert(
        {
          user_id: user.id,
          endpoint: pushEndpoint,
          p256dh: pushP256dh,
          auth: pushAuth,
          platform: pushPlatform || null,
          browser: pushBrowser || null,
          is_active: true,
          last_used_at: new Date().toISOString(),
        },
        { onConflict: "endpoint" }
      );
    } catch (pushErr) {
      console.warn("Could not save initial push subscription for recruitment applicant:", pushErr);
    }
  }

  // Send smart notification to applicant
  try {
    await createAndDispatchNotification(
      {
        title: "📋 Volunteer Application Submitted",
        body: `Thank you ${student.name}! Your application for ${campaign.title} has been received and is currently under review by the society leadership.`,
        type: "system",
        priority: "high",
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
  applicationId: string,
  customSerialNo?: string
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

  // 2. Generate sequential Admission Serial No: online-reg-N (or admin custom)
  const serialNo =
    customSerialNo?.trim() ||
    application.serial_no ||
    (await generateNextApplicationSerialNo(admin));
  const now = new Date().toISOString();

  // 3. Update application status with serial number
  const { error: updateAppErr } = await admin
    .from("volunteer_applications")
    .update({
      status: "APPROVED",
      serial_no: serialNo,
      reviewed_by: profile.id,
      reviewed_at: now,
    })
    .eq("id", applicationId);

  if (updateAppErr) {
    console.error("adminApproveVolunteerApplication updateApp error:", updateAppErr);
    return { success: false, message: "Failed to update application status." };
  }

  // 4. Ensure applicant remains as a STUDENT in profiles (does not become RCY member yet)
  if (application.user_id) {
    await admin
      .from("profiles")
      .update({ role: "STUDENT" })
      .eq("id", application.user_id);
  }

  // 5. Sync verified passport photo with student & profile avatar if available
  if (application.photo_url) {
    if (application.student_id) {
      await admin
        .from("students")
        .update({ photo_url: application.photo_url })
        .eq("id", application.student_id);
    }
    if (application.user_id) {
      await admin
        .from("profiles")
        .update({ avatar_url: application.photo_url })
        .eq("id", application.user_id);
    }
  }

  // 6. Dispatch notification to applicant to view their Admit Card in the student portal
  try {
    await createAndDispatchNotification(
      {
        title: "🎉 অভিনন্দন! আপনার স্বেচ্ছাসেবক ভর্তি আবেদন অনুমোদিত হয়েছে",
        body: `Congratulations ${application.name}! আপনার রেড ক্রিসেন্ট সোসাইটি স্বেচ্ছাসেবক আবেদন অনুমোদিত হয়েছে (রোল/ক্রমিক নং: ${serialNo})। স্টুডেন্ট পোর্টাল থেকে আপনার অফিসিয়াল প্রবেশ পত্র (Admit Card) প্রিন্ট বা ডাউনলোড করুন।`,
        type: "system",
        priority: "high",
        actionUrl: "/student",
      },
      {
        specificUserIds: [application.user_id],
      }
    );
  } catch (notifErr) {
    console.warn("Notification error after volunteer application approval:", notifErr);
  }

  await logAudit("volunteer_application_approved", "volunteer_application", applicationId, {
    user_id: application.user_id,
    serial_no: serialNo,
    approved_by: profile.id,
  });

  revalidatePath("/admin/recruitment/applications");
  revalidatePath(`/admin/recruitment/applications/${applicationId}`);
  revalidatePath("/admin/recruitment");
  revalidatePath("/student");

  return {
    success: true,
    message: `আবেদন অনুমোদিত হয়েছে! রোল নম্বর (${serialNo}) ইস্যু করা হয়েছে এবং প্রবেশপত্র (Admit Card) আনলক হয়েছে।`,
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
    const reasonText = reason ? ` Feedback: "${reason}".` : "";
    await createAndDispatchNotification(
      {
        title: "Volunteer Application Update",
        body: `Your volunteer application for ${application.recruitment_campaigns?.title || "RGPI Red Crescent Youth"} was not approved.${reasonText} You are eligible to submit a fresh application with updated details or documents.`,
        type: "system",
        priority: "normal",
        actionUrl: "/apply-volunteer",
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

// ------------------------------------------------------------
// Admin: Delete Volunteer Application (Frees roll number)
// ------------------------------------------------------------

export async function adminDeleteVolunteerApplication(
  applicationId: string
): Promise<ActionResult> {
  const profile = await guardAdmin();
  const admin = createAdminClient();

  const { data: application, error: fetchErr } = await admin
    .from("volunteer_applications")
    .select("id, name, serial_no, roll, user_id, student_id")
    .eq("id", applicationId)
    .maybeSingle();

  if (fetchErr || !application) {
    return { success: false, message: "Application not found." };
  }

  const { error: delErr } = await admin
    .from("volunteer_applications")
    .delete()
    .eq("id", applicationId);

  if (delErr) {
    console.error("adminDeleteVolunteerApplication error:", delErr);
    return { success: false, message: "Could not delete application." };
  }

  // If this application was approved into a team member, remove team membership and revert role
  if (application.user_id) {
    await admin.from("team_members").delete().eq("user_id", application.user_id);
    await admin.from("profiles").update({ role: "STUDENT" }).eq("id", application.user_id);
  }
  if (application.student_id) {
    await admin.from("team_members").delete().eq("student_id", application.student_id);
  }
  if (application.serial_no) {
    await admin.from("team_members").delete().eq("roll", application.serial_no);
  }

  await logAudit("volunteer_application_deleted", "volunteer_application", applicationId, {
    name: application.name,
    roll: application.serial_no || application.roll,
    deleted_by: profile.id,
  });

  revalidatePath("/admin/recruitment/applications");
  revalidatePath(`/admin/recruitment/applications/${applicationId}`);
  revalidatePath("/admin/recruitment");
  revalidatePath("/admin/team");
  revalidatePath("/student");

  return {
    success: true,
    message: "আবেদন ও সম্পর্কিত রোল নম্বর ডাটাবেজ থেকে সম্পূর্ণ মুছে ফেলা হয়েছে।",
  };
}

