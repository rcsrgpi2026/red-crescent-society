"use server";

import { randomBytes } from "crypto";
import { revalidatePath, updateTag, refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { logAudit, requireAdmin } from "@/lib/auth";
import { slugify, TEAM_POSITIONS, RCY_DEPARTMENTS, NON_DEPARTMENT_POSITIONS, getCommunityMappingForPosition } from "@/lib/constants";
import { ID_CARD_SETTINGS_KEY } from "@/lib/id-card/constants";
import { createAndDispatchNotification } from "@/lib/notifications/notification-service";
import type { ActionResult } from "@/lib/actions";

function guardConfig() {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured. Add your credentials (see README).");
  }
}

/**
 * Enforces admin-level access for every admin server action. RLS alone is not
 * enough — server actions are plain HTTP endpoints, so the role check must
 * happen in the action itself (a non-admin could otherwise reach actions whose
 * RLS policies do not protect a column, e.g. self-updating `position`).
 */
async function guard() {
  guardConfig();
  const profile = await requireAdmin();
  if (!profile) {
    throw new Error("You are not authorized to perform this action.");
  }
  return profile;
}

/** Cryptographically strong, unguessable certificate verification token. */
function generateVerifyToken(): string {
  return `CRT-${randomBytes(12).toString("hex").toUpperCase()}`;
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
  await guard();
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

  // Trigger system notification if approved or rejected
  if (status === "APPROVED") {
    try {
      const { data: member } = await supabase
        .from("team_members")
        .select("name, user_id")
        .eq("id", id)
        .maybeSingle();

      if (member?.user_id) {
        await createAndDispatchNotification(
          {
            title: "🎉 Membership Application Approved!",
            body: `Congratulations ${member.name}! Your Red Crescent Youth team membership has been approved (${patch.member_id}). You can now access your member ID card and join trainings.`,
            type: "system",
            priority: "high",
            actionUrl: "/volunteer",
          },
          {
            specificUserIds: [member.user_id],
          }
        );
      }
    } catch (notifErr) {
      console.warn("Could not dispatch volunteer approval notification:", notifErr);
    }
  } else if (status === "REJECTED") {
    try {
      const { data: member } = await supabase
        .from("team_members")
        .select("name, user_id")
        .eq("id", id)
        .maybeSingle();

      if (member?.user_id) {
        await createAndDispatchNotification(
          {
            title: "Membership Application Update",
            body: `Dear ${member.name}, your volunteer application could not be approved at this time. Please contact the society office for details.`,
            type: "system",
            priority: "normal",
            actionUrl: "/volunteer",
          },
          {
            specificUserIds: [member.user_id],
          }
        );
      }
    } catch (notifErr) {
      console.warn("Could not dispatch volunteer rejection notification:", notifErr);
    }
  }

  await logAudit(`volunteer_${status.toLowerCase()}`, "volunteer", id);
  revalidatePath("/admin/team");
  revalidatePath("/team");
  updateTag("volunteers");
  return { success: true, message: `Team member ${status.toLowerCase()}.` };
}

export async function deleteTeamMember(id: string): Promise<ActionResult> {
  await guard();
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
  await guard();
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
  await guard();
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
  await guard();
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

/**
 * Toggles or updates a team member's legacy (alumni / former leader) status.
 */
export async function updateTeamMemberLegacyStatus(formData: FormData): Promise<ActionResult> {
  await guard();
  const id = String(formData.get("id"));
  const isLegacy = formData.get("isLegacy") === "true";
  const legacyTenure = formData.get("legacyTenure") ? String(formData.get("legacyTenure")).trim() : null;
  const legacyDesignation = formData.get("legacyDesignation") ? String(formData.get("legacyDesignation")).trim() : null;
  const legacyNote = formData.get("legacyNote") ? String(formData.get("legacyNote")).trim() : null;

  if (!id) return { success: false, message: "Team member ID is required." };

  const supabase = await createClient();
  const patch: Record<string, unknown> = {
    is_legacy: isLegacy,
    legacy_tenure: legacyTenure || null,
    legacy_designation: legacyDesignation || null,
    legacy_note: legacyNote || null,
  };

  const { error } = await supabase
    .from("team_members")
    .update(patch)
    .eq("id", id);

  if (error) {
    return { success: false, message: "Could not update legacy status." };
  }

  await logAudit("legacy_status_changed", "team_member", id, patch);
  revalidatePath("/admin/team");
  revalidatePath("/team");
  revalidatePath("/legacy-members");
  updateTag("volunteers");

  return {
    success: true,
    message: isLegacy
      ? "Team member marked as Legacy Member."
      : "Member restored to active team roster.",
  };
}

export async function addPoints(formData: FormData): Promise<ActionResult> {
  await guard();
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
  await guard();
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
  await guard();
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
  await guard();
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
  await guard();
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
  await guard();
  const supabase = await createClient();
  const { error } = await supabase.from("community_members").delete().eq("id", id);
  if (error) return { success: false, message: "Could not delete the member." };
  await logAudit("community_deleted", "community_member", id);
  revalidatePath("/admin/community");
  revalidatePath("/");
  updateTag("community");
  return { success: true, message: "Community member deleted." };
}

/**
 * Adds or updates an approved team member into the Community leadership tree.
 */
export async function addTeamMemberToCommunity(formData: FormData): Promise<ActionResult> {
  await guard();
  const teamMemberId = String(formData.get("teamMemberId") ?? "").trim();
  if (!teamMemberId) return { success: false, message: "Team member ID is required." };

  const supabase = await createClient();

  const { data: member, error: memberError } = await supabase
    .from("team_members")
    .select("id, name, photo_url, position, rcy_department, status")
    .eq("id", teamMemberId)
    .maybeSingle();

  if (memberError || !member) {
    return { success: false, message: "Team member not found." };
  }

  const defaultMapping = getCommunityMappingForPosition(member.position, member.rcy_department);
  const level = formData.get("level") ? Number(formData.get("level")) : defaultMapping.level;
  const position = formData.get("position") ? String(formData.get("position")).trim() : defaultMapping.position;
  const subRole = formData.get("subRole") !== null
    ? (String(formData.get("subRole")).trim() || null)
    : defaultMapping.subRole;
  const displayOrder = formData.get("displayOrder") ? Number(formData.get("displayOrder")) : 0;

  const { data: existing } = await supabase
    .from("community_members")
    .select("id")
    .eq("team_member_id", teamMemberId)
    .maybeSingle();

  const payload = {
    name: member.name,
    photo_url: member.photo_url || null,
    position,
    sub_role: subRole,
    level,
    display_order: displayOrder,
    is_active: true,
    team_member_id: member.id,
  };

  if (existing) {
    const { error: updateError } = await supabase
      .from("community_members")
      .update(payload)
      .eq("id", existing.id);
    if (updateError) return { success: false, message: "Could not update community member." };
    await logAudit("community_linked_updated", "community_member", existing.id, { team_member_id: member.id });
  } else {
    const { error: insertError } = await supabase
      .from("community_members")
      .insert(payload);
    if (insertError) return { success: false, message: "Could not add to community tree." };
    await logAudit("community_linked_created", "community_member", undefined, { team_member_id: member.id });
  }

  revalidatePath("/admin/team");
  revalidatePath("/admin/community");
  revalidatePath("/community");
  revalidatePath("/");
  updateTag("community");

  return { success: true, message: `${member.name} has been placed in Level ${level} (${position}) of the Community tree.` };
}

/**
 * Removes a linked team member from the Community leadership tree.
 */
export async function removeTeamMemberFromCommunity(formData: FormData): Promise<ActionResult> {
  await guard();
  const teamMemberId = String(formData.get("teamMemberId") ?? "").trim();
  if (!teamMemberId) return { success: false, message: "Team member ID is required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("community_members")
    .delete()
    .eq("team_member_id", teamMemberId);

  if (error) return { success: false, message: "Could not remove from community tree." };

  await logAudit("community_linked_removed", "community_member", undefined, { team_member_id: teamMemberId });

  revalidatePath("/admin/team");
  revalidatePath("/admin/community");
  revalidatePath("/community");
  revalidatePath("/");
  updateTag("community");

  return { success: true, message: "Removed from Community leadership tree." };
}

// ---------------------------------------------------------------------------
// Blood donors & contact requests
// ---------------------------------------------------------------------------

export async function updateDonor(formData: FormData): Promise<ActionResult> {
  await guard();
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
  await guard();
  const supabase = await createClient();
  const { error } = await supabase.from("blood_donors").delete().eq("id", id);
  if (error) return { success: false, message: "Could not delete the donor." };
  await logAudit("donor_deleted", "blood_donor", id);
  revalidatePath("/admin/donors");
  updateTag("blood");
  return { success: true, message: "Donor deleted." };
}

export async function updateContactRequestStatus(formData: FormData): Promise<ActionResult> {
  await guard();
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
  await guard();
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  const supabase = await createClient();

  const { data: request } = await supabase
    .from("blood_requests")
    .select("patient_name, blood_group, units, hospital, location")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("blood_requests").update({ status }).eq("id", id);
  if (error) return { success: false, message: "Could not update the request." };

  if (request && (status === "DONOR_FOUND" || status === "CONTACTING_DONOR" || status === "COMPLETED")) {
    try {
      const statusLabel =
        status === "DONOR_FOUND"
          ? "Donor Found"
          : status === "CONTACTING_DONOR"
          ? "Contacting Donor"
          : "Donation Completed";

      await createAndDispatchNotification({
        title: `🩸 Blood Request Update: ${statusLabel}`,
        body: `${statusLabel} for ${request.blood_group} request (${request.patient_name})${request.hospital ? ` at ${request.hospital}` : ""}.`,
        type: "blood_request",
        priority: "normal",
        actionUrl: `/blood-support`,
      });
    } catch (notifErr) {
      console.warn("Could not dispatch blood request update notification:", notifErr);
    }
  }

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
  await guard();
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
  await guard();
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

/**
 * Permanently deletes a CANCELLED blood request.
 * Pending, in-progress, and completed requests cannot be deleted to protect actual records.
 */
export async function deleteBloodRequest(id: string): Promise<ActionResult> {
  await guard();
  if (!id) return { success: false, message: "Blood request ID is required." };

  const supabase = await createClient();

  // Safety check: ensure only CANCELLED requests can be deleted
  const { data: request, error: findError } = await supabase
    .from("blood_requests")
    .select("id, status, patient_name")
    .eq("id", id)
    .maybeSingle();

  if (findError || !request) {
    return { success: false, message: "Blood request not found." };
  }

  if (request.status !== "CANCELLED") {
    return {
      success: false,
      message: "Only cancelled requests can be deleted. Completed and pending requests are protected.",
    };
  }

  const { error } = await supabase.from("blood_requests").delete().eq("id", id);
  if (error) {
    return { success: false, message: "Could not delete the request." };
  }

  await logAudit("blood_request_deleted", "blood_request", id, {
    patient_name: request.patient_name,
  });

  revalidatePath("/admin/blood-requests");
  revalidatePath("/admin");
  revalidatePath("/blood-support");
  updateTag("blood");

  return { success: true, message: `Cancelled request for ${request.patient_name} deleted.` };
}

/**
 * Permanently deletes ALL cancelled blood requests in bulk.
 * Preserves all pending, in-progress, and completed records.
 */
export async function deleteCancelledBloodRequests(): Promise<ActionResult> {
  await guard();
  const supabase = await createClient();

  const { data: cancelled, error: fetchError } = await supabase
    .from("blood_requests")
    .select("id")
    .eq("status", "CANCELLED");

  if (fetchError || !cancelled) {
    return { success: false, message: "Failed to fetch cancelled requests." };
  }

  if (cancelled.length === 0) {
    return { success: false, message: "No cancelled requests found to delete." };
  }

  const { error } = await supabase
    .from("blood_requests")
    .delete()
    .eq("status", "CANCELLED");

  if (error) {
    return { success: false, message: "Could not delete cancelled requests." };
  }

  await logAudit("blood_requests_bulk_deleted", "blood_request", "all_cancelled", {
    count: cancelled.length,
  });

  revalidatePath("/admin/blood-requests");
  revalidatePath("/admin");
  revalidatePath("/blood-support");
  updateTag("blood");

  return {
    success: true,
    message: `Successfully deleted ${cancelled.length} cancelled request${
      cancelled.length === 1 ? "" : "s"
    }.`,
  };
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export async function saveEvent(formData: FormData): Promise<ActionResult> {
  await guard();
  const id = formData.get("id") ? String(formData.get("id")) : null;
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { success: false, message: "Title is required." };

  const endDate = String(formData.get("endDate") ?? "").trim() || null;

  const payload: Record<string, any> = {
    title,
    slug: String(formData.get("slug") ?? "") ? String(formData.get("slug")) : slugify(title),
    cover_image: String(formData.get("coverImage") ?? "") || null,
    description: String(formData.get("description") ?? "") || null,
    date: String(formData.get("date") ?? "") || null,
    end_date: endDate,
    time: String(formData.get("time") ?? "") || null,
    location: String(formData.get("location") ?? "") || null,
    category: String(formData.get("category") ?? "") || null,
    organizer: String(formData.get("organizer") ?? "") || null,
    registration_enabled: formData.get("registrationEnabled") === "on",
    registration_type: String(formData.get("registrationType") ?? "BUILT_IN"),
    registration_link: String(formData.get("registrationLink") ?? "").trim() || null,
    registration_instructions: String(formData.get("registrationInstructions") ?? "").trim() || null,
    max_participants: Number(formData.get("maxParticipants") ?? 0) || null,
    status: String(formData.get("status") ?? "UPCOMING"),
    report: String(formData.get("report") ?? "") || null,
  };

  const supabase = await createClient();
  let insertOrUpdateErr = null;

  if (id) {
    const res = await supabase.from("events").update(payload).eq("id", id);
    if (res.error && res.error.message?.includes("end_date")) {
      // Fallback if migration 0050 has not yet been executed in Supabase
      delete payload.end_date;
      const retry = await supabase.from("events").update(payload).eq("id", id);
      insertOrUpdateErr = retry.error;
    } else {
      insertOrUpdateErr = res.error;
    }
    if (insertOrUpdateErr) return { success: false, message: "Could not update the event." };
    await logAudit("event_updated", "event", id);
  } else {
    const res = await supabase.from("events").insert(payload);
    if (res.error && res.error.message?.includes("end_date")) {
      delete payload.end_date;
      const retry = await supabase.from("events").insert(payload);
      insertOrUpdateErr = retry.error;
    } else {
      insertOrUpdateErr = res.error;
    }
    if (insertOrUpdateErr) return { success: false, message: "Could not create the event." };
    await logAudit("event_created", "event", payload.title);

    // Trigger event announcement notification for new upcoming events
    if (payload.status === "UPCOMING") {
      try {
        await createAndDispatchNotification({
          title: `📅 New Event: ${payload.title}`,
          body: `Date: ${payload.date || "Soon"} ${payload.time ? `(${payload.time})` : ""} · Location: ${payload.location || "RGPI"}. Tap to view details and register.`,
          type: "event",
          priority: "normal",
          actionUrl: `/events/${payload.slug}`,
        });
      } catch (notifErr) {
        console.warn("Could not dispatch event notification:", notifErr);
      }
    }
  }
  revalidatePath("/admin/events");
  revalidatePath("/events");
  updateTag("events");
  return { success: true, message: "Event saved." };
}

export async function deleteEvent(id: string): Promise<ActionResult> {
  await guard();
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
  await guard();
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
  await guard();
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
  await guard();
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
  await guard();
  const id = formData.get("id") ? String(formData.get("id")) : null;
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { success: false, message: "Title is required." };

  const supabase = await createClient();

  const eventMode = String(formData.get("event_mode") ?? "none");
  let event_id = String(formData.get("event_id") ?? "").trim() || null;

  // Parse structured attachments (images and external links)
  const attachmentsJson = String(formData.get("attachments_json") ?? "").trim();
  let parsedAttachments: { name: string; url: string }[] = [];

  if (attachmentsJson) {
    try {
      const raw = JSON.parse(attachmentsJson);
      if (Array.isArray(raw)) {
        parsedAttachments = raw
          .filter((i) => i && typeof i.url === "string" && i.url.trim())
          .map((i, idx) => ({
            name: String(i.name ?? "").trim() || `Attachment ${idx + 1}`,
            url: String(i.url).trim(),
          }));
      }
    } catch (e) {
      console.warn("Could not parse attachments_json:", e);
    }
  }

  // Fallback to newline-separated URLs if attachments_json was empty
  if (parsedAttachments.length === 0) {
    const rawAttachments = String(formData.get("attachments") ?? "").trim();
    if (rawAttachments) {
      parsedAttachments = rawAttachments
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((url, idx) => ({
          name: url.split("/").pop()?.split("?")[0] || `Attachment ${idx + 1}`,
          url,
        }));
    }
  }

  const firstImageItem = parsedAttachments.find(
    (a) => a.url.match(/\.(jpg|jpeg|png|webp|gif|svg|avif)$/i) || a.url.includes("images/notices")
  );
  const coverUrl = firstImageItem?.url || parsedAttachments[0]?.url || null;

  if (eventMode === "create_new") {
    const eventTitle = String(formData.get("event_title") ?? "").trim() || title;
    const eventDate = String(formData.get("event_date") ?? "").trim() || null;
    const eventTime = String(formData.get("event_time") ?? "").trim() || null;
    const eventLocation = String(formData.get("event_location") ?? "").trim() || null;
    const eventCategory = String(formData.get("event_category") ?? "").trim() || null;
    const registrationEnabled = formData.get("event_registration_enabled") === "on";
    const registrationType = String(formData.get("event_registration_type") ?? "BUILT_IN");
    const registrationLink = String(formData.get("event_registration_link") ?? "").trim() || null;
    const registrationInstructions = String(formData.get("event_registration_instructions") ?? "").trim() || null;
    const maxParticipants = Number(formData.get("event_max_participants") ?? 0) || null;

    const eventSlug = slugify(eventTitle);
    const eventPayload = {
      title: eventTitle,
      slug: eventSlug,
      cover_image: coverUrl,
      description: String(formData.get("content") ?? "") || null,
      date: eventDate,
      time: eventTime,
      location: eventLocation,
      category: eventCategory,
      organizer: "RGPI Red Crescent Youth",
      registration_enabled: registrationEnabled,
      registration_type: registrationType,
      registration_link: registrationLink,
      registration_instructions: registrationInstructions,
      max_participants: maxParticipants,
      status: "UPCOMING",
      report: null,
    };

    const { data: existingEvent } = await supabase
      .from("events")
      .select("id")
      .eq("slug", eventSlug)
      .maybeSingle();

    if (existingEvent) {
      // Event already exists with this slug — update it and link it
      const { error: updateErr } = await supabase
        .from("events")
        .update(eventPayload)
        .eq("id", existingEvent.id);

      if (!updateErr) {
        event_id = existingEvent.id;
        await logAudit("event_updated", "event", existingEvent.id);
        revalidatePath("/admin/events");
        revalidatePath("/events");
        revalidatePath(`/events/${eventSlug}`);
        updateTag("events");
      } else {
        console.warn("Could not update existing event from notice form:", updateErr);
      }
    } else {
      const { data: newEvent, error: eventErr } = await supabase
        .from("events")
        .insert(eventPayload)
        .select("id")
        .single();

      if (!eventErr && newEvent) {
        event_id = newEvent.id;
        await logAudit("event_created", "event", eventPayload.title);
        revalidatePath("/admin/events");
        revalidatePath("/events");
        revalidatePath(`/events/${eventSlug}`);
        updateTag("events");
      } else if (eventErr) {
        console.warn("Could not create linked event from notice form:", eventErr);
      }
    }
  } else if (eventMode === "none") {
    event_id = null;
  }

  const payload = {
    title,
    slug: String(formData.get("slug") ?? "") ? String(formData.get("slug")) : slugify(title),
    content: String(formData.get("content") ?? "") || null,
    category: String(formData.get("category") ?? "") || null,
    pinned: formData.get("pinned") === "on",
    published: formData.get("published") === "on",
    event_id,
  };

  let noticeId = id;
  if (id) {
    const { error } = await supabase.from("notices").update(payload).eq("id", id);
    if (error) {
      console.error("[saveNotice update error]:", error);
      return { success: false, message: error.message || "Could not update the notice." };
    }
    await logAudit("notice_updated", "notice", id);
  } else {
    const { data, error } = await supabase
      .from("notices")
      .insert(payload)
      .select("id")
      .single();
    if (error || !data) {
      console.error("[saveNotice insert error]:", error);
      return { success: false, message: error?.message || "Could not create the notice." };
    }
    noticeId = data.id;
    await logAudit("notice_created", "notice", payload.title);
  }

  // Replace attachments with structured names and URLs
  if (noticeId) {
    await supabase.from("notice_attachments").delete().eq("notice_id", noticeId);
    if (parsedAttachments.length > 0) {
      await supabase.from("notice_attachments").insert(
        parsedAttachments.map((item) => ({
          notice_id: noticeId,
          name: item.name,
          url: item.url,
        }))
      );
    }
  }

  // Trigger smart notice notification if newly created and published
  if (!id && payload.published) {
    try {
      const snippet = payload.content ? payload.content.slice(0, 140) + "..." : "A new official notice has been published on the portal.";
      await createAndDispatchNotification({
        title: `📢 ${payload.title}`,
        body: snippet,
        type: "notice",
        priority: payload.pinned ? "high" : "normal",
        actionUrl: `/notices/${payload.slug}`,
        imageUrl: coverUrl || undefined,
      });
    } catch (notifErr) {
      console.warn("Could not dispatch notice notification:", notifErr);
    }
  }

  revalidatePath("/");
  revalidatePath("/admin/notices");
  revalidatePath("/notices");
  revalidatePath("/notices/[slug]");
  revalidatePath("/events");
  updateTag("notices");
  updateTag("events");
  return { success: true, message: "Notice saved." };
}

export async function deleteNotice(id: string): Promise<ActionResult> {
  await guard();
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
  await guard();
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

  // Dispatch notification to participant on status change
  if (status === "APPROVED" || status === "REJECTED") {
    try {
      const { data: part } = await supabase
        .from("training_participants")
        .select("team_members(user_id, name), training(title)")
        .eq("id", id)
        .maybeSingle();

      const memberUserId = (part?.team_members as any)?.user_id;
      const memberName = (part?.team_members as any)?.name || "Participant";
      const trainingTitle = (part?.training as any)?.title || "Training";

      if (memberUserId) {
        if (status === "APPROVED") {
          await createAndDispatchNotification(
            {
              title: "🎓 Training Enrollment Approved!",
              body: `Congratulations ${memberName}! Your enrollment for "${trainingTitle}" has been approved. See you at the session.`,
              type: "system",
              priority: "high",
              actionUrl: "/volunteer",
            },
            { specificUserIds: [memberUserId] }
          );
        } else {
          await createAndDispatchNotification(
            {
              title: "Training Enrollment Update",
              body: `Dear ${memberName}, your enrollment request for "${trainingTitle}" could not be accommodated at this time.`,
              type: "system",
              priority: "normal",
              actionUrl: "/volunteer",
            },
            { specificUserIds: [memberUserId] }
          );
        }
      }
    } catch (notifErr) {
      console.warn("Could not dispatch training participant notification:", notifErr);
    }
  }
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
  await guard();
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
  const token = generateVerifyToken();

  const { error } = await supabase.from("certificates").insert({
    volunteer_id: participant.volunteer_id,
    training_id: participant.training_id,
    title,
    issued_at: new Date().toISOString().slice(0, 10),
    verify_token: token,
  });
  if (error) return { success: false, message: "Could not issue the certificate." };
  await logAudit("certificate_issued", "certificate", participant.volunteer_id, { title });

  // Dispatch notification to volunteer about issued certificate
  try {
    const { data: member } = await supabase
      .from("team_members")
      .select("user_id, name")
      .eq("id", participant.volunteer_id)
      .maybeSingle();

    if (member?.user_id) {
      await createAndDispatchNotification(
        {
          title: "🎖️ New Certificate Issued!",
          body: `Congratulations ${member.name}! Your official certificate for "${trainingTitle}" has been issued and is available on your portal.`,
          type: "system",
          priority: "high",
          actionUrl: "/volunteer",
        },
        { specificUserIds: [member.user_id] }
      );
    }
  } catch (notifErr) {
    console.warn("Could not dispatch certificate notification:", notifErr);
  }
  revalidatePath("/admin/training");
  revalidatePath("/admin/certificates");
  updateTag("certificates");
  return {
    success: true,
    message: `Certificate issued. Verify URL: /verify/certificate/${token}`,
  };
}

export async function saveTraining(formData: FormData): Promise<ActionResult> {
  await guard();
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

    // Trigger training announcement notification for new upcoming sessions
    if (payload.status === "UPCOMING") {
      try {
        await createAndDispatchNotification({
          title: `🎓 New Training Session: ${payload.title}`,
          body: `Date: ${payload.date || "Soon"} · Location: ${payload.location || "RGPI"}. Tap to view details and enroll.`,
          type: "system",
          priority: "normal",
          actionUrl: `/training`,
        });
      } catch (notifErr) {
        console.warn("Could not dispatch training announcement notification:", notifErr);
      }
    }
  }
  revalidatePath("/admin/training");
  revalidatePath("/training");
  updateTag("training");
  return { success: true, message: "Training saved." };
}

export async function deleteTraining(id: string): Promise<ActionResult> {
  await guard();
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
  await guard();
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

  if (!id) {
    try {
      await createAndDispatchNotification({
        title: `📸 New Gallery Album: ${payload.title}`,
        body: payload.description ? payload.description.slice(0, 120) + "..." : `Check out the latest photos from ${payload.title} in the gallery.`,
        type: "event",
        priority: "normal",
        actionUrl: `/gallery/${payload.slug}`,
        imageUrl: payload.cover_image || undefined,
      });
    } catch (notifErr) {
      console.warn("Could not dispatch gallery notification:", notifErr);
    }
  }

  await logAudit(id ? "album_updated" : "album_created", "gallery_album", albumId);
  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
  updateTag("gallery");
  return { success: true, message: "Album saved." };
}

export async function deleteAlbum(id: string): Promise<ActionResult> {
  await guard();
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
  await guard();
  const teamMemberId = String(formData.get("teamMemberId"));
  const title = String(formData.get("title") ?? "").trim();
  if (!teamMemberId || !title) return { success: false, message: "Team member and title are required." };

  const token = generateVerifyToken();

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
  await guard();
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
  await guard();
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
  await guard();
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
  const profile = await requireAdmin();
  if (!profile) return 0;
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
  guardConfig();
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
  await guard();
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
  await guard();
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
  await guard();
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

// ---------------------------------------------------------------------------
// Dynamic Form Editor Configurations
// ---------------------------------------------------------------------------

export async function saveFormConfigsAction(
  formKey: string,
  fieldsJson: string
): Promise<ActionResult> {
  await guard();
  let parsedFields: unknown;
  try {
    parsedFields = JSON.parse(fieldsJson);
  } catch {
    return { success: false, message: "Invalid form configuration format." };
  }

  if (!Array.isArray(parsedFields)) {
    return { success: false, message: "Fields configuration must be an array." };
  }

  const supabase = await createClient();

  // Get current form configs
  const { data: current } = await supabase
    .from("website_settings")
    .select("value")
    .eq("key", "form_configs")
    .maybeSingle();

  const { DEFAULT_FORM_CONFIGS } = await import("@/types/form-editor");
  const defaultForm = (DEFAULT_FORM_CONFIGS as Record<string, any>)[formKey];

  const currentConfigs = (current?.value as Record<string, any>) ?? {};
  const updatedForm = {
    ...(defaultForm ?? {}),
    ...(currentConfigs[formKey] ?? {}),
    key: formKey,
    title: defaultForm?.title ?? formKey,
    description: defaultForm?.description ?? "",
    fields: parsedFields,
    updated_at: new Date().toISOString(),
  };

  const newConfigs = {
    ...currentConfigs,
    [formKey]: updatedForm,
  };

  const { error } = await supabase
    .from("website_settings")
    .upsert(
      { key: "form_configs", value: newConfigs },
      { onConflict: "key" }
    );

  if (error) {
    console.error("[saveFormConfigsAction error]:", error);
    return { success: false, message: "Could not save form settings." };
  }

  await logAudit("form_config_updated", "website_settings", formKey);
  revalidatePath("/", "layout");
  revalidatePath("/admin/form-editor");
  updateTag("settings");
  updateTag("form-configs");
  try { refresh(); } catch {}

  return { success: true, message: "Form configuration saved successfully!" };
}

export async function resetFormConfigsAction(formKey: string): Promise<ActionResult> {
  await guard();
  const { DEFAULT_FORM_CONFIGS } = await import("@/types/form-editor");
  const defaultForm = (DEFAULT_FORM_CONFIGS as Record<string, any>)[formKey];
  if (!defaultForm) {
    return { success: false, message: "Unknown form key." };
  }

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("website_settings")
    .select("value")
    .eq("key", "form_configs")
    .maybeSingle();

  const currentConfigs = (current?.value as Record<string, any>) ?? {};
  const newConfigs = {
    ...currentConfigs,
    [formKey]: defaultForm,
  };

  const { error } = await supabase
    .from("website_settings")
    .upsert(
      { key: "form_configs", value: newConfigs },
      { onConflict: "key" }
    );

  if (error) {
    return { success: false, message: "Could not reset form settings." };
  }

  await logAudit("form_config_reset", "website_settings", formKey);
  revalidatePath("/", "layout");
  revalidatePath("/admin/form-editor");
  updateTag("settings");
  updateTag("form-configs");
  try { refresh(); } catch {}

  return { success: true, message: "Form reset to default settings." };
}
