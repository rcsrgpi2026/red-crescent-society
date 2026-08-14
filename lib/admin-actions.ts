"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { logAudit } from "@/lib/auth";
import { slugify } from "@/lib/constants";
import type { ActionResult } from "@/lib/actions";

function guard() {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured. Add your credentials (see README).");
  }
}

// ---------------------------------------------------------------------------
// Volunteers
// ---------------------------------------------------------------------------

export async function updateVolunteerStatus(formData: FormData): Promise<ActionResult> {
  guard();
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  if (!["APPROVED", "REJECTED"].includes(status)) {
    return { success: false, message: "Invalid status." };
  }

  const supabase = await createClient();
  const patch: Record<string, unknown> = { status };

  if (status === "APPROVED") {
    // Generate a sequential member ID: RCR-YYYY-NNNN
    const { count } = await supabase
      .from("volunteers")
      .select("id", { count: "exact", head: true });
    const year = new Date().getFullYear();
    const next = (count ?? 0) + 1;
    patch.member_id = `RCR-${year}-${String(next).padStart(4, "0")}`;
    patch.joined_at = new Date().toISOString();
  }

  const { error } = await supabase.from("volunteers").update(patch).eq("id", id);
  if (error) {
    return { success: false, message: "Could not update the volunteer." };
  }
  await logAudit(`volunteer_${status.toLowerCase()}`, "volunteer", id);
  revalidatePath("/admin/volunteers");
  revalidatePath("/volunteers");
  return { success: true, message: `Volunteer ${status.toLowerCase()}.` };
}

export async function deleteVolunteer(id: string): Promise<ActionResult> {
  guard();
  const supabase = await createClient();
  const { error } = await supabase.from("volunteers").delete().eq("id", id);
  if (error) return { success: false, message: "Could not delete the volunteer." };
  await logAudit("volunteer_deleted", "volunteer", id);
  revalidatePath("/admin/volunteers");
  return { success: true, message: "Volunteer deleted." };
}

export async function addPoints(formData: FormData): Promise<ActionResult> {
  guard();
  const volunteerId = String(formData.get("volunteerId"));
  const points = Number(formData.get("points"));
  const reason = String(formData.get("reason") ?? "");
  const category = String(formData.get("category") ?? "");

  if (!volunteerId || !Number.isFinite(points) || points === 0) {
    return { success: false, message: "Enter a valid point value." };
  }

  const supabase = await createClient();
  const { error: insertError } = await supabase.from("volunteer_points").insert({
    volunteer_id: volunteerId,
    points,
    reason: reason || null,
    category: category || null,
  });
  if (insertError) return { success: false, message: "Could not add points." };

  const { data: total } = await supabase
    .from("volunteer_points")
    .select("points")
    .eq("volunteer_id", volunteerId);
  const sum = (total ?? []).reduce((acc, row) => acc + row.points, 0);
  await supabase.from("volunteers").update({ points: sum }).eq("id", volunteerId);

  await logAudit("points_added", "volunteer", volunteerId, { points, reason });
  revalidatePath("/admin/volunteers");
  return { success: true, message: `Added ${points} points.` };
}

export async function updateVolunteerPhoto(formData: FormData): Promise<ActionResult> {
  guard();
  const id = String(formData.get("id"));
  const photoUrl = String(formData.get("photoUrl") ?? "").trim();
  if (!id) return { success: false, message: "Volunteer is required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("volunteers")
    .update({ photo_url: photoUrl || null })
    .eq("id", id);
  if (error) return { success: false, message: "Could not update the photo." };
  await logAudit("volunteer_photo_updated", "volunteer", id);
  revalidatePath(`/admin/volunteers/${id}`);
  revalidatePath("/volunteers");
  revalidatePath(`/volunteers/${id}`);
  return { success: true, message: "Photo updated." };
}

// ---------------------------------------------------------------------------
// Team members
// ---------------------------------------------------------------------------

export async function saveTeamMember(formData: FormData): Promise<ActionResult> {
  guard();
  const id = formData.get("id") ? String(formData.get("id")) : null;
  const payload = {
    name: String(formData.get("name") ?? ""),
    position: String(formData.get("position") ?? ""),
    department: String(formData.get("department") ?? "") || null,
    semester: String(formData.get("semester") ?? "") || null,
    bio: String(formData.get("bio") ?? "") || null,
    photo_url: String(formData.get("photoUrl") ?? "") || null,
    display_order: Number(formData.get("displayOrder") ?? 0) || 0,
    is_active: formData.get("isActive") === "on" || formData.get("isActive") === "true",
  };

  if (!payload.name || !payload.position) {
    return { success: false, message: "Name and position are required." };
  }

  const supabase = await createClient();
  if (id) {
    const { error } = await supabase.from("team_members").update(payload).eq("id", id);
    if (error) return { success: false, message: "Could not update the member." };
    await logAudit("team_updated", "team_member", id);
  } else {
    const { error } = await supabase.from("team_members").insert(payload);
    if (error) return { success: false, message: "Could not create the member." };
    await logAudit("team_created", "team_member");
  }
  revalidatePath("/admin/team");
  revalidatePath("/about");
  return { success: true, message: "Team member saved." };
}

export async function deleteTeamMember(id: string): Promise<ActionResult> {
  guard();
  const supabase = await createClient();
  const { error } = await supabase.from("team_members").delete().eq("id", id);
  if (error) return { success: false, message: "Could not delete the member." };
  await logAudit("team_deleted", "team_member", id);
  revalidatePath("/admin/team");
  revalidatePath("/about");
  return { success: true, message: "Team member deleted." };
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
  revalidatePath("/about");
  return { success: true, message: "Founder saved." };
}

export async function deleteFounder(id: string): Promise<ActionResult> {
  guard();
  const supabase = await createClient();
  const { error } = await supabase.from("founders").delete().eq("id", id);
  if (error) return { success: false, message: "Could not delete the founder." };
  await logAudit("founder_deleted", "founder", id);
  revalidatePath("/admin/founders");
  revalidatePath("/about");
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
  revalidatePath("/community");
  return { success: true, message: "Community member saved." };
}

export async function deleteCommunityMember(id: string): Promise<ActionResult> {
  guard();
  const supabase = await createClient();
  const { error } = await supabase.from("community_members").delete().eq("id", id);
  if (error) return { success: false, message: "Could not delete the member." };
  await logAudit("community_deleted", "community_member", id);
  revalidatePath("/admin/community");
  revalidatePath("/community");
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
  return { success: true, message: "Donor updated." };
}

export async function deleteDonor(id: string): Promise<ActionResult> {
  guard();
  const supabase = await createClient();
  const { error } = await supabase.from("blood_donors").delete().eq("id", id);
  if (error) return { success: false, message: "Could not delete the donor." };
  await logAudit("donor_deleted", "blood_donor", id);
  revalidatePath("/admin/donors");
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
  return { success: true, message: "Request status updated." };
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
  return { success: true, message: "Event deleted." };
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
  revalidatePath("/activities");
  return { success: true, message: "Activity saved." };
}

export async function deleteActivity(id: string): Promise<ActionResult> {
  guard();
  const supabase = await createClient();
  const { error } = await supabase.from("activities").delete().eq("id", id);
  if (error) return { success: false, message: "Could not delete the activity." };
  await logAudit("activity_deleted", "activity", id);
  revalidatePath("/admin/activities");
  revalidatePath("/activities");
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
    publish_at: String(formData.get("publishAt") ?? "") || null,
    expires_at: String(formData.get("expiresAt") ?? "") || null,
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
  return { success: true, message: "Notice deleted." };
}

// ---------------------------------------------------------------------------
// Training
// ---------------------------------------------------------------------------

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
  return { success: true, message: "Album deleted." };
}

// ---------------------------------------------------------------------------
// Certificates
// ---------------------------------------------------------------------------

export async function issueCertificate(formData: FormData): Promise<ActionResult> {
  guard();
  const volunteerId = String(formData.get("volunteerId"));
  const title = String(formData.get("title") ?? "").trim();
  if (!volunteerId || !title) return { success: false, message: "Volunteer and title are required." };

  const token = `CRT-${Date.now().toString(36).toUpperCase()}${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;

  const supabase = await createClient();
  const { error } = await supabase.from("certificates").insert({
    volunteer_id: volunteerId,
    title,
    issued_at: String(formData.get("issuedAt") ?? "") || new Date().toISOString().slice(0, 10),
    file_url: String(formData.get("fileUrl") ?? "") || null,
    verify_token: token,
  });
  if (error) return { success: false, message: "Could not issue the certificate." };
  await logAudit("certificate_issued", "certificate", volunteerId, { title });
  revalidatePath("/admin/certificates");
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
  return { success: true, message: "Certificate deleted." };
}

// ---------------------------------------------------------------------------
// Attendance
// ---------------------------------------------------------------------------

export async function toggleAttendance(formData: FormData): Promise<ActionResult> {
  guard();
  const eventId = String(formData.get("eventId"));
  const volunteerId = String(formData.get("volunteerId"));
  const mark = String(formData.get("mark")); // PRESENT or ABSENT

  const supabase = await createClient();
  const { error } = await supabase
    .from("attendance")
    .upsert(
      { event_id: eventId, volunteer_id: volunteerId, status: mark, scanned_at: new Date().toISOString() },
      { onConflict: "event_id,volunteer_id" }
    )
    .eq("event_id", eventId)
    .eq("volunteer_id", volunteerId);
  if (error) return { success: false, message: "Could not update attendance." };
  await logAudit("attendance_marked", "attendance", volunteerId, { eventId, mark });
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

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export async function saveSettings(
  key: string,
  value: Record<string, string>
): Promise<ActionResult> {
  guard();
  const supabase = await createClient();
  const { error } = await supabase
    .from("website_settings")
    .upsert({ key, value }, { onConflict: "key" });
  if (error) return { success: false, message: "Could not save settings." };
  await logAudit("settings_updated", "website_settings", key);
  revalidatePath("/admin/settings");
  return { success: true, message: "Settings saved." };
}
