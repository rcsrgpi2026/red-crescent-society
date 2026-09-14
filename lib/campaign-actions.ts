"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isAdminRole } from "@/lib/auth";
import { sendCampaignEmailBatch, type BatchSendResult } from "@/lib/email/mailer";
import type { CampaignAudience, CampaignCategory, EmailCampaign } from "@/types/database";

export interface RecipientContact {
  email: string;
  name: string | null;
  type: string;
  details?: string;
}

export interface AudienceStatsResult {
  totalUnique: number;
  breakdown: {
    students: number;
    volunteers: number;
    donors: number;
    blood_requesters: number;
    event_registrants: number;
  };
  contacts: RecipientContact[];
}

/**
 * Checks if current caller is an authenticated administrator
 */
async function requireAdmin() {
  if (!isSupabaseConfigured) {
    throw new Error("Database service is not configured.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized: Please sign in as an administrator.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !isAdminRole(profile.role)) {
    throw new Error("Unauthorized: Administrative privileges required.");
  }

  return user;
}

/**
 * Loads and aggregates contacts across selected audience segments,
 * deduplicating by email address.
 */
export async function getAudienceContacts(
  audiences: CampaignAudience[],
  options?: { bloodGroup?: string }
): Promise<AudienceStatsResult> {
  await requireAdmin();

  const admin = createAdminClient();
  const contactMap = new Map<string, RecipientContact>();

  const breakdown = {
    students: 0,
    volunteers: 0,
    donors: 0,
    blood_requesters: 0,
    event_registrants: 0,
  };

  // 1. Registered Students
  if (audiences.includes("students")) {
    let q = admin.from("students").select("name, email, department, session, blood_group");
    if (options?.bloodGroup && options.bloodGroup !== "ALL") {
      q = q.eq("blood_group", options.bloodGroup);
    }
    const { data: students } = await q;

    for (const s of students ?? []) {
      const email = s.email?.trim().toLowerCase();
      if (email && email.includes("@")) {
        breakdown.students++;
        if (!contactMap.has(email)) {
          contactMap.set(email, {
            email,
            name: s.name || null,
            type: "Student",
            details: `${s.department || "Student"} (${s.session || ""})`,
          });
        }
      }
    }
  }

  // 2. Volunteers / Team Members
  if (audiences.includes("volunteers")) {
    let q = admin
      .from("team_members")
      .select("name, email, position, rcy_department, department, blood_group")
      .eq("status", "APPROVED");
    if (options?.bloodGroup && options.bloodGroup !== "ALL") {
      q = q.eq("blood_group", options.bloodGroup);
    }
    const { data: team } = await q;

    for (const v of team ?? []) {
      const email = v.email?.trim().toLowerCase();
      if (email && email.includes("@")) {
        breakdown.volunteers++;
        if (!contactMap.has(email)) {
          contactMap.set(email, {
            email,
            name: v.name || null,
            type: "Volunteer",
            details: v.position || v.rcy_department || "Team Member",
          });
        }
      }
    }
  }

  // 3. Blood Donors
  if (audiences.includes("donors")) {
    let q = admin
      .from("blood_donors")
      .select(`
        id,
        name,
        email,
        blood_group,
        area,
        volunteer_id,
        student_id,
        team_members (name, email),
        students (name, email)
      `);
    if (options?.bloodGroup && options.bloodGroup !== "ALL") {
      q = q.eq("blood_group", options.bloodGroup);
    }
    const { data: donors } = await q;

    for (const d of (donors as any[]) ?? []) {
      const email =
        d.email?.trim().toLowerCase() ||
        d.team_members?.email?.trim().toLowerCase() ||
        d.students?.email?.trim().toLowerCase();

      if (email && email.includes("@")) {
        breakdown.donors++;
        if (!contactMap.has(email)) {
          contactMap.set(email, {
            email,
            name: d.name || d.team_members?.name || d.students?.name || null,
            type: "Blood Donor",
            details: `${d.blood_group || "Donor"} ${d.area ? `(${d.area})` : ""}`,
          });
        }
      }
    }
  }

  // 4. Blood Requesters (people who requested blood through the portal)
  if (audiences.includes("blood_requesters")) {
    const [contactReqsRes, bloodReqsRes] = await Promise.all([
      admin
        .from("blood_contact_requests")
        .select("requester_name, email, blood_group, hospital")
        .not("email", "is", null),
      admin
        .from("blood_requests")
        .select("requester_name, email, blood_group, hospital, location")
        .not("email", "is", null),
    ]);

    for (const r of contactReqsRes.data ?? []) {
      const email = r.email?.trim().toLowerCase();
      if (email && email.includes("@")) {
        breakdown.blood_requesters++;
        if (!contactMap.has(email)) {
          contactMap.set(email, {
            email,
            name: r.requester_name || null,
            type: "Blood Requester",
            details: `${r.blood_group || ""} Blood Request ${r.hospital ? `@ ${r.hospital}` : ""}`,
          });
        }
      }
    }

    for (const r of bloodReqsRes.data ?? []) {
      const email = r.email?.trim().toLowerCase();
      if (email && email.includes("@")) {
        breakdown.blood_requesters++;
        if (!contactMap.has(email)) {
          contactMap.set(email, {
            email,
            name: r.requester_name || null,
            type: "Blood Requester",
            details: `${r.blood_group || ""} Blood Request ${r.hospital || r.location ? `@ ${r.hospital || r.location}` : ""}`,
          });
        }
      }
    }
  }

  // 5. Event Registrants
  if (audiences.includes("event_registrants")) {
    const { data: registrations } = await admin
      .from("event_registrations")
      .select("name, email, department")
      .not("email", "is", null);

    for (const reg of registrations ?? []) {
      const email = reg.email?.trim().toLowerCase();
      if (email && email.includes("@")) {
        breakdown.event_registrants++;
        if (!contactMap.has(email)) {
          contactMap.set(email, {
            email,
            name: reg.name || null,
            type: "Event Registrant",
            details: reg.department || "Participant",
          });
        }
      }
    }
  }

  const contacts = Array.from(contactMap.values());

  return {
    totalUnique: contacts.length,
    breakdown,
    contacts,
  };
}

/**
 * Sends a single test email preview to the admin's inbox.
 */
export async function sendTestCampaignEmail({
  recipientEmail,
  subject,
  heading,
  body,
  badge,
  buttonText,
  buttonUrl,
  secondaryInfo,
}: {
  recipientEmail: string;
  subject: string;
  heading: string;
  body: string;
  badge?: string | null;
  buttonText?: string | null;
  buttonUrl?: string | null;
  secondaryInfo?: string | null;
}): Promise<{ success: boolean; message: string }> {
  await requireAdmin();

  const cleanEmail = recipientEmail.trim();
  if (!cleanEmail || !cleanEmail.includes("@")) {
    return { success: false, message: "Invalid test recipient email." };
  }

  const result = await sendCampaignEmailBatch({
    recipients: [{ email: cleanEmail, name: "Admin Preview" }],
    campaign: {
      subject: `[Preview] ${subject}`,
      heading,
      body,
      badge: badge ? `[Preview] ${badge}` : "[Preview] Official Circular",
      buttonText,
      buttonUrl,
      secondaryInfo,
    },
  });

  if (result.successCount > 0) {
    return {
      success: true,
      message: `Test email sent successfully to ${cleanEmail}! Please check your inbox and spam folder.`,
    };
  }

  const errorMsg = result.errors[0]?.error || "Could not send test email.";
  return {
    success: false,
    message: `Test delivery failed: ${errorMsg}`,
  };
}

/**
 * Creates an email campaign record in the database
 */
export async function createCampaignRecord(data: {
  subject: string;
  category: CampaignCategory;
  badge?: string | null;
  heading: string;
  body: string;
  button_text?: string | null;
  button_url?: string | null;
  target_audiences: CampaignAudience[];
  total_recipients: number;
}): Promise<{ id: string | null; error?: string }> {
  const user = await requireAdmin();
  const admin = createAdminClient();

  const { data: campaign, error } = await admin
    .from("email_campaigns")
    .insert({
      subject: data.subject,
      category: data.category,
      badge: data.badge || null,
      heading: data.heading,
      body: data.body,
      button_text: data.button_text || null,
      button_url: data.button_url || null,
      target_audiences: data.target_audiences,
      total_recipients: data.total_recipients,
      sent_count: 0,
      failed_count: 0,
      status: "SENDING",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[createCampaignRecord Error]:", error);
    return { id: null, error: error.message };
  }

  return { id: campaign.id };
}

/**
 * Dispatches one batch of campaign emails and updates campaign progress
 */
export async function dispatchCampaignBatch({
  campaignId,
  batch,
  campaign,
}: {
  campaignId: string | null;
  batch: Array<{ email: string; name?: string | null }>;
  campaign: {
    subject: string;
    heading: string;
    body: string;
    badge?: string | null;
    buttonText?: string | null;
    buttonUrl?: string | null;
    secondaryInfo?: string | null;
  };
}): Promise<BatchSendResult> {
  await requireAdmin();

  console.log(`[dispatchCampaignBatch] Starting dispatch for ${batch.length} recipient(s), campaignId: ${campaignId}`);

  let result: BatchSendResult;
  try {
    result = await sendCampaignEmailBatch({
      recipients: batch,
      campaign,
    });
  } catch (err: any) {
    console.error("[dispatchCampaignBatch send error]:", err);
    result = {
      successCount: 0,
      failedCount: batch.length,
      errors: batch.map((b) => ({ email: b.email, error: err.message || "Email dispatch failed" })),
    };
  }

  // Increment counters in email_campaigns table if campaignId is present
  if (campaignId) {
    try {
      const admin = createAdminClient();
      const { data: curr } = await admin
        .from("email_campaigns")
        .select("sent_count, failed_count, total_recipients")
        .eq("id", campaignId)
        .single();

      if (curr) {
        const newSent = (curr.sent_count || 0) + result.successCount;
        const newFailed = (curr.failed_count || 0) + result.failedCount;
        const isDone = newSent + newFailed >= (curr.total_recipients || 0);

        await admin
          .from("email_campaigns")
          .update({
            sent_count: newSent,
            failed_count: newFailed,
            status: isDone ? "COMPLETED" : "SENDING",
          })
          .eq("id", campaignId);
      }
    } catch (dbErr) {
      console.error("[dispatchCampaignBatch DB counter update error]:", dbErr);
    }
  }

  console.log(`[dispatchCampaignBatch] Finished: ${result.successCount} sent, ${result.failedCount} failed`);
  return result;
}

/**
 * Loads recent email campaigns
 */
export async function getPastCampaigns(): Promise<EmailCampaign[]> {
  await requireAdmin();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("email_campaigns")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[getPastCampaigns Error]:", error);
    return [];
  }

  return (data as EmailCampaign[]) || [];
}

/**
 * Loads published notices and upcoming events for 1-click template insertion
 */
export async function getCampaignResources() {
  await requireAdmin();
  const admin = createAdminClient();

  const [{ data: notices }, { data: events }] = await Promise.all([
    admin
      .from("notices")
      .select("id, slug, title, content, category, created_at")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(10),
    admin
      .from("events")
      .select("id, slug, title, date, time, location, description, category")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  return {
    notices: notices || [],
    events: events || [],
  };
}

/**
 * Searches across students and team members/volunteers for individual recipient selection
 */
export async function searchIndividualMembers(query: string): Promise<RecipientContact[]> {
  await requireAdmin();
  const clean = query.trim().toLowerCase();
  if (!clean || clean.length < 2) return [];

  const admin = createAdminClient();
  const results: RecipientContact[] = [];
  const seenEmails = new Set<string>();

  const [{ data: students }, { data: teamMembers }] = await Promise.all([
    admin
      .from("students")
      .select("name, email, roll, department, session")
      .or(`name.ilike.%${clean}%,email.ilike.%${clean}%,roll.ilike.%${clean}%`)
      .limit(10),
    admin
      .from("team_members")
      .select("name, email, position, department, rcy_department")
      .or(`name.ilike.%${clean}%,email.ilike.%${clean}%,position.ilike.%${clean}%`)
      .limit(10),
  ]);

  for (const s of students ?? []) {
    const email = s.email?.trim().toLowerCase();
    if (email && email.includes("@") && !seenEmails.has(email)) {
      seenEmails.add(email);
      results.push({
        email,
        name: s.name || null,
        type: "Student",
        details: `Roll: ${s.roll} • ${s.department || "Student"} (${s.session || ""})`,
      });
    }
  }

  for (const t of teamMembers ?? []) {
    const email = t.email?.trim().toLowerCase();
    if (email && email.includes("@") && !seenEmails.has(email)) {
      seenEmails.add(email);
      results.push({
        email,
        name: t.name || null,
        type: "Volunteer",
        details: t.position || t.rcy_department || "Team Member",
      });
    }
  }

  return results;
}
