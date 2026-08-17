"use server";

import { revalidatePath, updateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { logAudit } from "@/lib/auth";
import { slugify, TEAM_POSITIONS, RCY_DEPARTMENTS, NON_DEPARTMENT_POSITIONS } from "@/lib/constants";
import { ID_CARD_SETTINGS_KEY } from "@/lib/id-card/constants";
import type { ActionResult } from "@/lib/actions";

function guard() {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured. Add your credentials (see README).");
  }
}

// ---------------------------------------------------------------------------
// Team members
// ---------------------------------------------------------------------------

/**
 * Server-action wrapper for the team member detail page's plain <form> buttons.
 * Keeps `updateTeamMemberStatus` returning ActionResult (used by InlineStatus),
 * while this one satisfies the form action's `Promise<void>` contract.
 */
export async function submitTeamMemberStatus(formData: FormData): Promise<void> {
  await updateTeamMemberStatus(formData);
}

export async function updateTeamMemberStatus(formData: FormData): Promise<ActionResult> {
  guard();
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  if (!["APPROVED", "REJECTED"].includes(status)) {
    return { success: false, message: "Invalid status." };
  }

  const supabase = await createClient();
  const patch: Record<string, unknown> = { status };

  if (status === "APPROVED") {
    // Generate a sequential member ID: RCR-YYYY-NNNN. Count only team members
    // that already carry this year's RCR id, so approving several members in
    // a row hands out unique ids — counting all rows would give the same
    // number twice (both records already exist) and the second approval
    // would silently fail on the unique member_id constraint.
    const year = new Date().getFullYear();
    const { count } = await supabase
      .from("team_members")
      .select("id", { count: "exact", head: true })
      .ilike("member_id", `RCR-${year}-%`);
    const next = (count ?? 0) + 1;
    patch.member_id = `RCR-${year}-${String(next).padStart(4, "0")}`;
    patch.joined_at = new Date().toISOString();
  }

  const { error } = await supabase.from("team_members").update(patch).eq("id", id);
  if (error) {
    return { success: false, message: "Could not update the team member." };
  }
  await logAudit(`volunteer_${status.toLowerCase()}`, "volunteer", id);
  revalidatePath("/admin/team");
  revalidatePath("/team");
  updateTag("volunteers");
  return { success: true, message: `Team member ${status.toLowerCase()}.` };
}

export async function deleteTeamMember(id: string): Promise<ActionResult> {
  guard();
  const supabase = await createClient();

  // Grab the linked Supabase auth account id before the profile row is gone.
  const { data: member } = await supabase
    .from("team_members")
    .select("user_id")
    .eq("id", id)
    .maybeSingle();

  // Delete the Supabase authentication account FIRST so we never end up with a
  // deleted profile row whose login account still exists. If the auth deletion
  // fails, abort and keep the member intact — the admin can retry later.
  if (member?.user_id) {
    let admin: ReturnType<typeof createAdminClient>;
    try {
      admin = createAdminClient();
    } catch {
      return {
        success: false,
        message: "Could not delete the login account — SUPABASE_SERVICE_ROLE_KEY is not configured. The team member was NOT deleted.",
      };
    }
    const { error: authError } = await admin.auth.admin.deleteUser(member.user_id);
    if (authError) {
      return {
        success: false,
        message: `Could not delete the login account (${authError.message}). The team member was NOT deleted.`,
      };
    }
  }

  const { error } = await supabase.from("team_members").delete().eq("id", id);
  if (error)    return { success: false, message: "Could not delete the team member." };
  await logAudit("volunteer_deleted", "volunteer", id);
  revalidatePath("/admin/team");
  updateTag("volunteers");
  return { success: true, message: "Team member and their login account deleted." };
}

/**
 * Deletes a student's profile record AND their Supabase authentication
 * account (via the service-role client) so they can no longer sign in to the
 * student portal. The auth account is deleted first — if that fails the
 * student is left intact and the admin gets a clear error instead.
 */
export async function deleteStudent(id: string): Promise<ActionResult> {
  guard();
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("user_id")
    .eq("id", id)
    .maybeSingle();

  if (student?.user_id) {
    let admin: ReturnType<typeof createAdminClient>;
    try {
      admin = createAdminClient();
    } catch {
      return {
        success: false,
        message: "Could not delete the login account — SUPABASE_SERVICE_ROLE_KEY is not configured. The student was NOT deleted.",
      };
    }
    const { error: authError } = await admin.auth.admin.deleteUser(student.user_id);
    if (authError) {
      return {
        success: false,
        message: `Could not delete the login account (${authError.message}). The student was NOT deleted.`,
      };
    }
  }

  const { error } = await supabase.from("students").delete().eq("id", id);
  if (error)    return { success: false, message: "Could not delete the student." };
  await logAudit("student_deleted", "student", id);
  revalidatePath("/admin/students");
  return { success: true, message: "Student and their login account deleted." };
}

/**
 * Declares a member's leadership position from the admin team list. Used by
 * the inline position select — the member sees it on their profile and on
 * the ID-style membership card.
 */
export async function updateTeamMemberPosition(formData: FormData): Promise<ActionResult> {
  guard();
  const id = String(formData.get("id"));
  const position = String(formData.get("position"));
  if (!id) return { success: false, message: "Team member is required." };
  if (!TEAM_POSITIONS.includes(position as (typeof TEAM_POSITIONS)[number])) {
    return { success: false, message: "Invalid position." };
  }

  const supabase = await createClient();
  // Leadership positions are society-wide — they are never tied to an RCY
  // department, so assigning one clears any previous department.
  const isLeader = (NON_DEPARTMENT_POSITIONS as readonly string[]).includes(position);
  const { error } = await supabase
    .from("team_members")
    .update({ position, rcy_department: isLeader ? null : undefined })
    .eq("id", id);
  if (error) return { success: false, message: "Could not update the position." };
  await logAudit("position_changed", "team_member", id, { position, ...(isLeader ? { rcy_department: null } : {}) });
  revalidatePath("/admin/team");
  revalidatePath("/team");
  updateTag("volunteers");
  return { success: true, message: `Position set to ${position}.` };
}

/**
 * Assigns a member's RCY department (society wing) from the admin team list.
 * The sentinel "__none" clears it — the member sees the department on their
 * profile and on the ID-style membership card.
 */
export async function updateTeamMemberRcyDepartment(formData: FormData): Promise<ActionResult> {
  guard();
  const id = String(formData.get("id"));
  const rcyDepartment = String(formData.get("rcyDepartment"));
  if (!id) return { success: false, message: "Team member is required." };

  let value: string | null;
  if (rcyDepartment === "__none") {
    value = null;
  } else if (RCY_DEPARTMENTS.includes(rcyDepartment as (typeof RCY_DEPARTMENTS)[number])) {
    value = rcyDepartment;
  } else {
    return { success: false, message: "Invalid RCY department." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("team_members")
    .update({ rcy_department: value })
    .eq("id", id);
  if (error) return { success: false, message: "Could not update the RCY department." };
  await logAudit("rcy_department_changed", "team_member", id, { rcy_department: value });
  revalidatePath("/admin/team");
  revalidatePath("/team");
  updateTag("volunteers");
  return {
    success: true,
    message: value ? `RCY department set to ${value}.` : "RCY department cleared.",
  };
}

export async function addPoints(formData: FormData): Promise<ActionResult> {
  guard();
  const teamMemberId = String(formData.get("teamMemberId"));
  const points = Number(formData.get("points"));
  const reason = String(formData.get("reason") ?? "");
  const category = String(formData.get("category") ?? "");

  if (!teamMemberId || !Number.isFinite(points) || points === 0) {
    return { success: false, message: "Enter a valid point value." };
  }

  const supabase = await createClient();
  const { error: insertError } = await supabase.from("volunteer_points").insert({
    volunteer_id: teamMemberId,
    points,
    reason: reason || null,
    category: category || null,
  });
  if (insertError) return { success: false, message: "Could not add points." };

  const { data: total } = await supabase
    .from("volunteer_points")
    .select("points")
    .eq("volunteer_id", teamMemberId);
  const sum = (total ?? []).reduce((acc, row) => acc + row.points, 0);
  await supabase.from("team_members").update({ points: sum }).eq("id", teamMemberId);

  await logAudit("points_added", "team_member", teamMemberId, { points, reason });
  revalidatePath("/admin/team");
  updateTag("volunteers");
  return { success: true, message: `Added ${points} points.` };
}

export async function updateTeamMemberPhoto(formData: FormData): Promise<ActionResult> {
  guard();
  const id = String(formData.get("id"));
  const photoUrl = String(formData.get("photoUrl") ?? "").trim();
  if (!id) return { success: false, message: "Team member is required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("team_members")
    .update({ photo_url: photoUrl || null })
    .eq("id", id);
  if (error) return { success: false, message: "Could not update the photo." };
  await logAudit("volunteer_photo_updated", "volunteer", id);
  revalidatePath(`/admin/team/${id}`);
  revalidatePath("/team");
  updateTag("volunteers");
  return { success: true, message: "Photo updated." };
}

// ---------------------------------------------------------------------------
// Founders & Principal
// ---------------------------------------------------------------------------

export async function saveFounder(formData: FormData): Promise<ActionResult> {
  guard();
  const id = formData.get("id") ? String(formData.get("id")) : null;
  const payload = {
    name: String(formData.get("name") ?? "").trim(),
    category: String(formData.get("category") ?? "FOUNDER"),
    title: String(formData.get("title") ?? "") || null,
    bio: String(formData.get("bio") ?? "") || null,
    message: String(formData.get("message") ?? "") || null,
    background: String(formData.get("background") ?? "") || null,
    photo_url: String(formData.get("photoUrl") ?? "") || null,
    display_order: Number(formData.get("displayOrder") ?? 0) || 0,
    is_active: formData.get("isActive") === "on" || formData.get("isActive") === "true",
  };

  if (!payload.name) {
    return { success: false, message: "Name is required." };
  }
  if (!["FOUNDER", "PRINCIPAL"].includes(payload.category)) {
    return { success: false, message: "Invalid category." };
  }

  const supabase = await createClient();
  if (id) {
    const { error } = await supabase.from("founders").update(payload).eq("id", id);
    if (error) return { success: false, message: "Could not update the founder." };
    await logAudit("founder_updated", "founder", id);
  } else {
    const { error } = await supabase.from("founders").insert(payload);
    if (error) return { success: false, message: "Could not create the founder." };
    await logAudit("founder_created", "founder");
  }
  revalidatePath("/admin/founders");
  revalidatePath("/");
  updateTag("founders");
  return { success: true, message: "Founder saved." };
}

export async function deleteFounder(id: string): Promise<ActionResult> {
  guard();
  const supabase = await createClient();
  const { error } = await supabase.from("founders").delete().eq("id", id);
  if (error) return { success: false, message: "Could not delete the founder." };
  await logAudit("founder_deleted", "founder", id);
  revalidatePath("/admin/founders");
  revalidatePath("/");
  updateTag("founders");
  return { success: true, message: "Founder deleted." };
}

// ---------------------------------------------------------------------------
// Community members (Community page)
// ---------------------------------------------------------------------------

export async function saveCommunityMember(formData: FormData): Promise<ActionResult> {
  guard();
  const id = formData.get("id") ? String(formData.get("id")) : null;
  const name = String(formData.get("name") ?? "").trim();
  const position = String(formData.get("position") ?? "").trim();
  const level = Number(formData.get("level") ?? 1);

  if (!name) {
    return { success: false, message: "Name is required." };
  }
  if (!position) {
    return { success: false, message: "Position / role is required." };
  }
  if (!Number.isInteger(level) || level < 1 || level > 5) {
    return { success: false, message: "Level must be between 1 and 5." };
  }

  const payload = {
    name,
    position,
    sub_role: String(formData.get("subRole") ?? "").trim() || null,
    photo_url: String(formData.get("photoUrl") ?? "") || null,
    level,
    display_order: Number(formData.get("displayOrder") ?? 0) || 0,
    is_active: formData.get("isActive") === "on" || formData.get("isActive") === "true",
  };

  const supabase = await createClient();
  if (id) {
    const { error } = await supabase.from("community_members").update(payload).eq("id", id);
    if (error) return { success: false, message: "Could not update the member." };
    await logAudit("community_updated", "community_member", id);
  } else {
    const { error } = await supabase.from("community_members").insert(payload);
    if (error) return { success: false, message: "Could not create the member." };
    await logAudit("community_created", "community_member");
  }
  revalidatePath("/admin/community");
  revalidatePath("/");
  updateTag("community");
  return { success: true, message: "Community member saved." };
}

export async function deleteCommunityMember(id: string): Promise<ActionResult> {
  guard();
  const supabase = await createClient();
  const { error } = await supabase.from("community_members").delete().eq("id", id);
  if (error) return { success: false, message: "Could not delete the member." };
  await logAudit("community_deleted", "community_member", id);
  revalidatePath("/admin/community");
  revalidatePath("/");
  updateTag("community");
  return { success: true, message: "Community member deleted." };
}

// ---------------------------------------------------------------------------
// Blood donors & contact requests
// ---------------------------------------------------------------------------

export async function updateDonor(formData: FormData): Promise<ActionResult> {
  guard();
  const id = String(formData.get("id"));
  const availability = String(formData.get("availability"));
  const isActive = formData.get("isActive") === "on" || formData.get("isActive") === "true";

  const supabase = await createClient();
  const { error } = await supabase
    .from("blood_donors")
    .update({ availability, is_active: isActive })
    .eq("id", id);
  if (error) return { success: false, message: "Could not update the donor." };
  await logAudit("donor_updated", "blood_donor", id);
  revalidatePath("/admin/donors");
  revalidatePath("/blood-support");
  updateTag("blood");
  return { success: true, message: "Donor updated." };
}

export async function deleteDonor(id: string): Promise<ActionResult> {
  guard();
  const supabase = await createClient();
  const { error } = await supabase.from("blood_donors").delete().eq("id", id);
  if (error) return { success: false, message: "Could not delete the donor." };
  await logAudit("donor_deleted", "blood_donor", id);
  revalidatePath("/admin/donors");
  updateTag("blood");
  return { success: true, message: "Donor deleted." };
}

export async function updateContactRequestStatus(formData: FormData): Promise<ActionResult> {
  guard();
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  const supabase = await createClient();
  const { error } = await supabase.from("blood_contact_requests").update({ status }).eq("id", id);
  if (error) return { success: false, message: "Could not update the request." };
  await logAudit("contact_request_status", "blood_contact_request", id, { status });
  revalidatePath("/admin/donors");
  updateTag("blood");
  return { success: true, message: "Contact request updated." };
}

// ---------------------------------------------------------------------------
// Blood requests
// ---------------------------------------------------------------------------

export async function updateBloodRequestStatus(formData: FormData): Promise<ActionResult> {
  guard();
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  const supabase = await createClient();
  const { error } = await supabase.from("blood_requests").update({ status }).eq("id", id);
  if (error) return { success: false, message: "Could not update the request." };
  await logAudit("blood_request_status", "blood_request", id, { status });
  revalidatePath("/admin/blood-requests");
  revalidatePath("/blood-support");
  updateTag("blood");
  return { success: true, message: "Request status updated." };
}

/**
 * Server-action wrappers for the blood requests table's plain <form> buttons —
 * same pattern as `submitTeamMemberStatus`. Keeps the actions returning
 * ActionResult while these satisfy the form action's Promise<void>.
 */
export async function submitConfirmBloodDonation(formData: FormData): Promise<void> {
  await confirmBloodDonation(formData);
}

export async function submitUnconfirmBloodDonation(formData: FormData): Promise<void> {
  await unconfirmBloodDonation(formData);
}

/**
 * Confirms a donation on a COMPLETED blood request, recording how many units
 * were actually donated. A confirmed request counts toward the homepage
 * "Blood Units Donated" statistic using `units_donated`.
 */
export async function confirmBloodDonation(formData: FormData): Promise<ActionResult> {
  guard();
  const id = String(formData.get("id"));
  if (!id) return { success: false, message: "Blood request is required." };

  const unitsDonated = Number(formData.get("unitsDonated"));
  if (!Number.isInteger(unitsDonated) || unitsDonated < 1) {
    return {
      success: false,
      message: "Enter the number of units actually donated (at least 1).",
    };
  }

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("blood_requests")
    .select("units")
    .eq("id", id)
    .maybeSingle();
  if (!current) return { success: false, message: "Blood request not found." };
  if (unitsDonated > current.units) {
    return {
      success: false,
      message: `Units donated cannot exceed the ${current.units} requested.`,
    };
  }

  const { error } = await supabase
    .from("blood_requests")
    .update({ donation_confirmed: true, units_donated: unitsDonated })
    .eq("id", id);
  if (error) {
    return { success: false, message: "Could not confirm the donation." };
  }
  await logAudit("blood_donation_confirmed", "blood_request", id, { units_donated: unitsDonated });
  revalidatePath("/admin/blood-requests");
  revalidatePath("/blood-support");
  updateTag("blood");
  return {
    success: true,
    message: `Donation confirmed — ${unitsDonated} unit${unitsDonated === 1 ? "" : "s"} now count${unitsDonated === 1 ? "s" : ""} toward Blood Units Donated.`,
  };
}

/** Removes the confirmation (keeps the recorded units for reference). */
export async function unconfirmBloodDonation(formData: FormData): Promise<ActionResult> {
  guard();
  const id = String(formData.get("id"));
  if (!id) return { success: false, message: "Blood request is required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("blood_requests")
    .update({ donation_confirmed: false })
    .eq("id", id);
  if (error) {
    return { success: false, message: "Could not remove the donation confirmation." };
  }
  await logAudit("blood_donation_unconfirmed", "blood_request", id);
  revalidatePath("/admin/blood-requests");
  revalidatePath("/blood-support");
  updateTag("blood");
  return { success: true, message: "Donation confirmation removed." };
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export async function saveEvent(formData: FormData): Promise<ActionResult> {
  guard();
  const id = formData.get("id") ? String(formData.get("id")) : null;
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { success: false, message: "Title is required." };

  const payload = {
    title,
    slug: String(formData.get("slug") ?? "") ? String(formData.get("slug")) : slugify(title),
    cover_image: String(formData.get("coverImage") ?? "") || null,
    description: String(formData.get("description") ?? "") || null,
    date: String(formData.get("date") ?? "") || null,
    time: String(formData.get("time") ?? "") || null,
    location: String(formData.get("location") ?? "") || null,
    category: String(formData.get("category") ?? "") || null,
    organizer: String(formData.get("organizer") ?? "") || null,
    registration_enabled: formData.get("registrationEnabled") === "on",
    max_participants: Number(formData.get("maxParticipants") ?? 0) || null,
    status: String(formData.get("status") ?? "UPCOMING"),
    report: String(formData.get("report") ?? "") || null,
  };

  const supabase = await createClient();
  if (id) {
    const { error } = await supabase.from("events").update(payload).eq("id", id);
    if (error) return { success: false, message: "Could not update the event." };
    await logAudit("event_updated", "event", id);
  } else {
    const { error } = await supabase.from("events").insert(payload);
    if (error) return { success: false, message: "Could not create the event." };
    await logAudit("event_created", "event", payload.title);
  }
  revalidatePath("/admin/events");
  revalidatePath("/events");
  updateTag("events");
  return { success: true, message: "Event saved." };
}

export async function deleteEvent(id: string): Promise<ActionResult> {
  guard();
  const supabase = await createClient();
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) return { success: false, message: "Could not delete the event." };
  await logAudit("event_deleted", "event", id);
  revalidatePath("/admin/events");
  revalidatePath("/events");
  updateTag("events");
  return { success: true, message: "Event deleted." };
}

/**
 * Updates a single event registration's status — used to mark attendance
 * (REGISTERED → ATTENDED) or cancel a registration (→ CANCELLED) directly
 * from the registrations dialog.
 */
export async function updateEventRegistrationStatus(formData: FormData): Promise<ActionResult> {
  guard();
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  if (!["REGISTERED", "ATTENDED", "CANCELLED"].includes(status)) {
    return { success: false, message: "Invalid registration status." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("event_registrations")
    .update({ status })
    .eq("id", id);
  if (error) {
    return { success: false, message: "Could not update the registration." };
  }
  await logAudit("event_registration_status", "event_registration", id, { status });
  revalidatePath("/admin/events");
  revalidatePath("/events");
  updateTag("events");
  return {
    success: true,
    message:
      status === "ATTENDED"
        ? "Marked as attended."
        : status === "CANCELLED"
          ? "Registration cancelled."
          : "Registration status reset to registered.",
  };
}

// ---------------------------------------------------------------------------
// Activities
// ---------------------------------------------------------------------------

export async function saveActivity(formData: FormData): Promise<ActionResult> {
  guard();
  const id = formData.get("id") ? String(formData.get("id")) : null;
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { success: false, message: "Title is required." };

  const images = String(formData.get("images") ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const payload = {
    title,
    slug: String(formData.get("slug") ?? "") ? String(formData.get("slug")) : slugify(title),
    date: String(formData.get("date") ?? "") || null,
    category: String(formData.get("category") ?? "") || null,
    description: String(formData.get("description") ?? "") || null,
    images,
    participants: Number(formData.get("participants") ?? 0) || 0,
    impact: String(formData.get("impact") ?? "") || null,
  };

  const supabase = await createClient();
  if (id) {
    const { error } = await supabase.from("activities").update(payload).eq("id", id);
    if (error) return { success: false, message: "Could not update the activity." };
    await logAudit("activity_updated", "activity", id);
  } else {
    const { error } = await supabase.from("activities").insert(payload);
    if (error) return { success: false, message: "Could not create the activity." };
    await logAudit("activity_created", "activity", payload.title);
  }
  revalidatePath("/admin/activities");
  revalidatePath("/gallery");
  updateTag("activities");
  return { success: true, message: "Activity saved." };
}

export async function deleteActivity(id: string): Promise<ActionResult> {
  guard();
  const supabase = await createClient();
  const { error } = await supabase.from("activities").delete().eq("id", id);
  if (error) return { success: false, message: "Could not delete the activity." };
  await logAudit("activity_deleted", "activity", id);
  revalidatePath("/admin/activities");
  revalidatePath("/gallery");
  updateTag("activities");
  return { success: true, message: "Activity deleted." };
}

// ---------------------------------------------------------------------------
// Notices
// ---------------------------------------------------------------------------

export async function saveNotice(formData: FormData): Promise<ActionResult> {
  guard();
  const id = formData.get("id") ? String(formData.get("id")) : null;
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { success: false, message: "Title is required." };

  const payload = {
    title,
    slug: String(formData.get("slug") ?? "") ? String(formData.get("slug")) : slugify(title),
    content: String(formData.get("content") ?? "") || null,
    category: String(formData.get("category") ?? "") || null,
    pinned: formData.get("pinned") === "on",
    published: formData.get("published") === "on",
  };

  const supabase = await createClient();
  let noticeId = id;
  if (id) {
    const { error } = await supabase.from("notices").update(payload).eq("id", id);
    if (error) return { success: false, message: "Could not update the notice." };
    await logAudit("notice_updated", "notice", id);
  } else {
    const { data, error } = await supabase
      .from("notices")
      .insert(payload)
      .select("id")
      .single();
    if (error || !data) return { success: false, message: "Could not create the notice." };
    noticeId = data.id;
    await logAudit("notice_created", "notice", payload.title);
  }

  // Replace attachments (one image URL per line).
  const attachmentUrls = String(formData.get("attachments") ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  if (noticeId) {
    await supabase.from("notice_attachments").delete().eq("notice_id", noticeId);
    if (attachmentUrls.length > 0) {
      await supabase.from("notice_attachments").insert(
        attachmentUrls.map((url) => ({
          notice_id: noticeId,
          name: url.split("/").pop()?.split("?")[0] || "attachment",
          url,
        }))
      );
    }
  }

  revalidatePath("/admin/notices");
  revalidatePath("/notices");
  revalidatePath("/notices/[slug]");
  updateTag("notices");
  return { success: true, message: "Notice saved." };
}

export async function deleteNotice(id: string): Promise<ActionResult> {
  guard();
  const supabase = await createClient();
  const { error } = await supabase.from("notices").delete().eq("id", id);
  if (error) return { success: false, message: "Could not delete the notice." };
  await logAudit("notice_deleted", "notice", id);
  revalidatePath("/admin/notices");
  revalidatePath("/notices");
  updateTag("notices");
  return { success: true, message: "Notice deleted." };
}

// ---------------------------------------------------------------------------
// Training
// ---------------------------------------------------------------------------

const TRAINING_PARTICIPANT_STATUSES = ["PENDING", "APPROVED", "REJECTED", "COMPLETED", "DROPPED"];

/** Approve / reject / complete / drop a member's training enrollment. */
export async function updateTrainingParticipantStatus(formData: FormData): Promise<ActionResult> {
  guard();
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  if (!TRAINING_PARTICIPANT_STATUSES.includes(status)) {
    return { success: false, message: "Invalid status." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("training_participants")
    .update({ status })
    .eq("id", id);
  if (error) return { success: false, message: "Could not update the enrollment." };
  await logAudit("training_participant_status", "training_participant", id, { status });
  revalidatePath("/admin/training");
  revalidatePath("/training");
  revalidatePath("/volunteer");
  updateTag("training");
  return { success: true, message: `Enrollment ${status.toLowerCase()}.` };
}

/**
 * One-click certificate for a training participant (used from the training
 * participants dialog). Title defaults to the training name.
 */
export async function issueTrainingCertificate(formData: FormData): Promise<ActionResult> {
  guard();
  const participantId = String(formData.get("participantId"));
  if (!participantId) return { success: false, message: "Participant is required." };

  const supabase = await createClient();
  const { data: participant } = await supabase
    .from("training_participants")
    .select("volunteer_id, training_id, training(title)")
    .eq("id", participantId)
    .maybeSingle();
  if (!participant) return { success: false, message: "Participant not found." };

  const trainingTitle =
    (participant.training as unknown as { title?: string } | undefined)?.title ?? "Training";
  const title = `${trainingTitle} — Training Certificate`;
  const token = `CRT-${Date.now().toString(36).toUpperCase()}${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;

  const { error } = await supabase.from("certificates").insert({
    volunteer_id: participant.volunteer_id,
    training_id: participant.training_id,
    title,
    issued_at: new Date().toISOString().slice(0, 10),
    verify_token: token,
  });
  if (error) return { success: false, message: "Could not issue the certificate." };
  await logAudit("certificate_issued", "certificate", participant.volunteer_id, { title });
  revalidatePath("/admin/training");
  revalidatePath("/admin/certificates");
  updateTag("certificates");
  return {
    success: true,
    message: `Certificate issued. Verify URL: /verify/certificate/${token}`,
  };
}

export async function saveTraining(formData: FormData): Promise<ActionResult> {
  guard();
  const id = formData.get("id") ? String(formData.get("id")) : null;
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { success: false, message: "Title is required." };

  const payload = {
    title,
    slug: String(formData.get("slug") ?? "") ? String(formData.get("slug")) : slugify(title),
    date: String(formData.get("date") ?? "") || null,
    trainer: String(formData.get("trainer") ?? "") || null,
    location: String(formData.get("location") ?? "") || null,
    description: String(formData.get("description") ?? "") || null,
    category: String(formData.get("category") ?? "") || null,
    status: String(formData.get("status") ?? "UPCOMING"),
  };

  const supabase = await createClient();
  if (id) {
    const { error } = await supabase.from("training").update(payload).eq("id", id);
    if (error) return { success: false, message: "Could not update the training." };
    await logAudit("training_updated", "training", id);
  } else {
    const { error } = await supabase.from("training").insert(payload);
    if (error) return { success: false, message: "Could not create the training." };
    await logAudit("training_created", "training", payload.title);
  }
  revalidatePath("/admin/training");
  revalidatePath("/training");
  updateTag("training");
  return { success: true, message: "Training saved." };
}

export async function deleteTraining(id: string): Promise<ActionResult> {
  guard();
  const supabase = await createClient();
  const { error } = await supabase.from("training").delete().eq("id", id);
  if (error) return { success: false, message: "Could not delete the training." };
  await logAudit("training_deleted", "training", id);
  revalidatePath("/admin/training");
  revalidatePath("/training");
  updateTag("training");
  return { success: true, message: "Training deleted." };
}

// ---------------------------------------------------------------------------
// Gallery albums
// ---------------------------------------------------------------------------

export async function saveAlbum(formData: FormData): Promise<ActionResult> {
  guard();
  const id = formData.get("id") ? String(formData.get("id")) : null;
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { success: false, message: "Title is required." };

  const supabase = await createClient();
  const payload = {
    title,
    slug: String(formData.get("slug") ?? "") ? String(formData.get("slug")) : slugify(title),
    description: String(formData.get("description") ?? "") || null,
    cover_image: String(formData.get("coverImage") ?? "") || null,
    date: String(formData.get("date") ?? "") || null,
  };

  let albumId: string | undefined = id ?? undefined;
  if (id) {
    const { error } = await supabase.from("gallery_albums").update(payload).eq("id", id);
    if (error) return { success: false, message: "Could not update the album." };
  } else {
    const { data, error } = await supabase.from("gallery_albums").insert(payload).select("id").single();
    if (error || !data) return { success: false, message: "Could not create the album." };
    albumId = data.id;
  }

  // Replace images (one URL per line)
  const imageUrls = String(formData.get("images") ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  if (albumId) {
    // Replace the album's photos with the edited list.
    await supabase.from("gallery_images").delete().eq("album_id", albumId);
    if (imageUrls.length > 0) {
      await supabase.from("gallery_images").insert(
        imageUrls.map((url, i) => ({ album_id: albumId, url, sort: i }))
      );
    }
  }

  await logAudit(id ? "album_updated" : "album_created", "gallery_album", albumId);
  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
  updateTag("gallery");
  return { success: true, message: "Album saved." };
}

export async function deleteAlbum(id: string): Promise<ActionResult> {
  guard();
  const supabase = await createClient();
  const { error } = await supabase.from("gallery_albums").delete().eq("id", id);
  if (error) return { success: false, message: "Could not delete the album." };
  await logAudit("album_deleted", "gallery_album", id);
  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
  updateTag("gallery");
  return { success: true, message: "Album deleted." };
}

// ---------------------------------------------------------------------------
// Certificates
// ---------------------------------------------------------------------------

export async function issueCertificate(formData: FormData): Promise<ActionResult> {
  guard();
  const teamMemberId = String(formData.get("teamMemberId"));
  const title = String(formData.get("title") ?? "").trim();
  if (!teamMemberId || !title) return { success: false, message: "Team member and title are required." };

  const token = `CRT-${Date.now().toString(36).toUpperCase()}${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;

  const supabase = await createClient();
  const { error } = await supabase.from("certificates").insert({
    volunteer_id: teamMemberId,
    title,
    issued_at: String(formData.get("issuedAt") ?? "") || new Date().toISOString().slice(0, 10),
    file_url: String(formData.get("fileUrl") ?? "") || null,
    verify_token: token,
  });
  if (error) return { success: false, message: "Could not issue the certificate." };
  await logAudit("certificate_issued", "certificate", teamMemberId, { title });
  revalidatePath("/admin/certificates");
  updateTag("certificates");
  return {
    success: true,
    message: `Certificate issued. Verify URL: /verify/certificate/${token}`,
  };
}

export async function deleteCertificate(id: string): Promise<ActionResult> {
  guard();
  const supabase = await createClient();
  const { error } = await supabase.from("certificates").delete().eq("id", id);
  if (error) return { success: false, message: "Could not delete the certificate." };
  await logAudit("certificate_deleted", "certificate", id);
  revalidatePath("/admin/certificates");
  updateTag("certificates");
  return { success: true, message: "Certificate deleted." };
}

// ---------------------------------------------------------------------------
// Attendance
// ---------------------------------------------------------------------------

export async function toggleAttendance(formData: FormData): Promise<ActionResult> {
  guard();
  const eventId = String(formData.get("eventId"));
  const teamMemberId = String(formData.get("teamMemberId"));
  const mark = String(formData.get("mark")); // PRESENT or ABSENT

  const supabase = await createClient();
  const { error } = await supabase
    .from("attendance")
    .upsert(
      { event_id: eventId, volunteer_id: teamMemberId, status: mark, scanned_at: new Date().toISOString() },
      { onConflict: "event_id,volunteer_id" }
    )
    .eq("event_id", eventId)
    .eq("volunteer_id", teamMemberId);
  if (error) return { success: false, message: "Could not update attendance." };
  await logAudit("attendance_marked", "attendance", teamMemberId, { eventId, mark });
  revalidatePath("/admin/attendance");
  return { success: true, message: `Marked ${mark.toLowerCase()}.` };
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export async function updateMessageStatus(formData: FormData): Promise<ActionResult> {
  guard();
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  const supabase = await createClient();
  const { error } = await supabase.from("contact_messages").update({ status }).eq("id", id);
  if (error) return { success: false, message: "Could not update the message." };
  revalidatePath("/admin/messages");
  return { success: true, message: "Message updated." };
}

/** Polled by the sidebar's unread indicator (client component). */
export async function getUnreadMessageCount(): Promise<number> {
  if (!isSupabaseConfigured) return 0;
  const supabase = await createClient();
  const { count } = await supabase
    .from("contact_messages")
    .select("id", { count: "exact", head: true })
    .eq("status", "NEW");
  return count ?? 0;
}

// ---------------------------------------------------------------------------
// Participation requests
// ---------------------------------------------------------------------------

export async function submitParticipationRequest(formData: FormData): Promise<ActionResult> {
  guard();
  const teamMemberId = String(formData.get("teamMemberId"));
  const eventId = String(formData.get("eventId") ?? "");
  const activityId = String(formData.get("activityId") ?? "");
  if (!teamMemberId) return { success: false, message: "Team member is required." };
  if (!eventId && !activityId) {
    return { success: false, message: "Choose an event or activity." };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("participation_requests")
    .select("id, status")
    .eq("volunteer_id", teamMemberId)
    .eq(eventId ? "event_id" : "activity_id", eventId || activityId)
    .maybeSingle();

  if (existing) {
    if (existing.status !== "REJECTED") {
      return { success: false, message: "You already have a request for this." };
    }
    // A rejected request can be submitted again — flip it back to pending.
    const { error } = await supabase
      .from("participation_requests")
      .update({ status: "PENDING" })
      .eq("id", existing.id);
    if (error) return { success: false, message: "Could not submit the request." };
    await logAudit("participation_requested", eventId ? "event" : "activity", eventId || activityId);
    revalidatePath("/volunteer");
    return { success: true, message: "Request resubmitted — awaiting admin approval." };
  }

  const { error } = await supabase.from("participation_requests").insert({
    volunteer_id: teamMemberId,
    event_id: eventId || null,
    activity_id: activityId || null,
    status: "PENDING",
  });
  if (error) return { success: false, message: "Could not submit the request." };
  await logAudit("participation_requested", eventId ? "event" : "activity", eventId || activityId);
  revalidatePath("/volunteer");
  return { success: true, message: "Request submitted — awaiting admin approval." };
}

export async function updateParticipationRequestStatus(
  formData: FormData
): Promise<ActionResult> {
  guard();
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  if (!["APPROVED", "REJECTED"].includes(status)) {
    return { success: false, message: "Invalid status." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("participation_requests")
    .update({ status })
    .eq("id", id);
  if (error) return { success: false, message: "Could not update the request." };
  await logAudit(`participation_${status.toLowerCase()}`, "participation_request", id);
  revalidatePath("/admin/participants");
  updateTag("events");
  updateTag("activities");
  return { success: true, message: status === "APPROVED" ? "Request approved." : "Request rejected." };
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export async function saveSettings(
  key: string,
  value: Record<string, string>
): Promise<ActionResult> {
  guard();
  const supabase = await createClient();

  // Merge into the stored value instead of replacing it: the homepage group is
  // edited by two forms (hero text and the photo carousel) that each submit only
  // their own fields, so a full replace would silently wipe the other form's data.
  const { data: existing } = await supabase
    .from("website_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  const previous =
    existing?.value && typeof existing.value === "object" && !Array.isArray(existing.value)
      ? (existing.value as Record<string, string | number>)
      : {};
  const merged = { ...previous, ...value };

  const { error } = await supabase
    .from("website_settings")
    .upsert({ key, value: merged }, { onConflict: "key" });
  if (error) return { success: false, message: "Could not save settings." };
  await logAudit("settings_updated", "website_settings", key);
  revalidatePath("/admin/settings");
  updateTag("settings");
  return { success: true, message: "Settings saved." };
}

/**
 * Saves the global ID card design (logos, watermark, header, typography,
 * footer, back side). Stored as a JSON string under the `id_card` settings
 * key; member data is never part of it — cards are assembled per member.
 */
export async function saveIdCardDesign(configJson: string): Promise<ActionResult> {
  guard();
  let parsed: unknown;
  try {
    parsed = JSON.parse(configJson);
  } catch {
    return { success: false, message: "The card design could not be read." };
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { success: false, message: "The card design must be a JSON object." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("website_settings")
    .upsert(
      { key: ID_CARD_SETTINGS_KEY, value: { config: JSON.stringify(parsed) } },
      { onConflict: "key" }
    );
  if (error) return { success: false, message: "Could not save the card design." };
  await logAudit("id_card_design_updated", "website_settings", ID_CARD_SETTINGS_KEY);
  revalidatePath("/admin/id-card");
  updateTag("settings");
  return {
    success: true,
    message: "ID card design saved — it now applies to every member card.",
  };
}
