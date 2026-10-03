import { revalidatePath } from "next/cache";
import { updateTag } from "next/cache";
import { getCommunityMappingForPosition } from "@/lib/constants";
import { invalidateLeadershipCache } from "@/lib/ai/resolvers/live-data";
import { clearResponseCache } from "@/lib/ai/cache";

/**
 * Normalizes member names to match slight spelling variations
 */
export function normalizeName(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/\b(md|most|dr|engr|mrs|ms)\b/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

/**
 * Synchronizes an approved team member to the community leadership tree in real-time.
 * Automatically keeps their name, position, sub_role/department, level, and photo in sync.
 */
export async function syncTeamMemberToCommunity(supabase: any, teamMemberId: string): Promise<void> {
  if (!supabase || !teamMemberId) return;

  try {
    const { data: member, error: memberErr } = await supabase
      .from("team_members")
      .select("id, name, photo_url, position, rcy_department, status, is_legacy")
      .eq("id", teamMemberId)
      .maybeSingle();

    if (memberErr || !member) return;

    // Check if member already has a linked entry in community_members (by team_member_id or normalized name)
    const { data: existingAll } = await supabase
      .from("community_members")
      .select("id, team_member_id, name");

    const normMemberName = normalizeName(member.name);
    const existing = (existingAll || []).find(
      (c: any) =>
        c.team_member_id === member.id ||
        normalizeName(c.name) === normMemberName ||
        (normMemberName.length > 4 && normalizeName(c.name).includes(normMemberName))
    );

    if (member.is_legacy) {
      // Legacy members belong to legacy archives and must NEVER appear in community_members or admin community page.
      if (existing) {
        await supabase.from("community_members").delete().eq("id", existing.id);
      }
      try {
        revalidatePath("/admin/community");
        revalidatePath("/admin/team");
        revalidatePath("/community");
        revalidatePath("/legacy-members");
        revalidatePath("/");
        updateTag("community");
        updateTag("volunteers");
      } catch {}
      invalidateLeadershipCache();
      clearResponseCache();
      return;
    }

    const posLower = (member.position || "").toLowerCase();
    const isLeadershipRole = [
      "team leader",
      "deputy leader",
      "group leader",
      "asst. group leader",
      "assistant group leader",
      "incharge",
    ].some((role) => posLower.includes(role));

    const mapping = getCommunityMappingForPosition(member.position, member.rcy_department);

    if (existing) {
      // If member already exists in community_members, update details & maintain link
      await supabase
        .from("community_members")
        .update({
          name: member.name.trim(),
          photo_url: member.photo_url || null,
          position: mapping.position,
          sub_role: mapping.subRole,
          level: mapping.level,
          team_member_id: member.id,
          is_active: member.status === "APPROVED",
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else if (member.status === "APPROVED" && isLeadershipRole) {
      // If newly approved with a leadership role and not yet in tree, auto-add
      await supabase.from("community_members").insert({
        name: member.name.trim(),
        photo_url: member.photo_url || null,
        position: mapping.position,
        sub_role: mapping.subRole,
        level: mapping.level,
        display_order: mapping.level * 10,
        is_active: true,
        team_member_id: member.id,
      });
    }

    try {
      revalidatePath("/admin/community");
      revalidatePath("/admin/team");
      revalidatePath("/community");
      revalidatePath("/legacy-members");
      revalidatePath("/");
      updateTag("community");
      updateTag("volunteers");
    } catch {}

    invalidateLeadershipCache();
    clearResponseCache();
  } catch (err) {
    console.warn("[syncTeamMemberToCommunity exception]:", err);
  }
}

/**
 * Removes or unlinks a community member when a team member is deleted.
 */
export async function deleteCommunityMemberByTeamId(supabase: any, teamMemberId: string): Promise<void> {
  if (!supabase || !teamMemberId) return;
  try {
    await supabase.from("community_members").delete().eq("team_member_id", teamMemberId);
    try {
      revalidatePath("/admin/community");
      revalidatePath("/admin/team");
      revalidatePath("/community");
      revalidatePath("/");
      updateTag("community");
      updateTag("volunteers");
    } catch {}
    invalidateLeadershipCache();
    clearResponseCache();
  } catch (err) {
    console.warn("[deleteCommunityMemberByTeamId exception]:", err);
  }
}

/**
 * Synchronizes all approved executive team members to the community tree.
 */
export async function syncAllTeamMembersToCommunity(supabase: any): Promise<{ syncedCount: number }> {
  if (!supabase) return { syncedCount: 0 };

  // Remove any legacy members that might still be in community_members
  const { data: legacyMembers } = await supabase
    .from("team_members")
    .select("id, name")
    .eq("is_legacy", true);
  if (legacyMembers && legacyMembers.length > 0) {
    const legacyIds = legacyMembers.map((l: any) => l.id);
    await supabase.from("community_members").delete().in("team_member_id", legacyIds);

    const { data: allComm } = await supabase.from("community_members").select("id, name");
    if (allComm && allComm.length > 0) {
      for (const legacy of legacyMembers) {
        const normLegacy = normalizeName(legacy.name);
        const matches = allComm.filter((c: any) => {
          const normC = normalizeName(c.name);
          return normC === normLegacy || (normLegacy.length > 4 && normC.includes(normLegacy));
        });
        for (const match of matches) {
          await supabase.from("community_members").delete().eq("id", match.id);
        }
      }
    }
  }

  const { data: teamMembers } = await supabase
    .from("team_members")
    .select("id, name, photo_url, position, rcy_department, status, is_legacy")
    .eq("status", "APPROVED")
    .eq("is_legacy", false);

  if (!teamMembers || teamMembers.length === 0) return { syncedCount: 0 };

  let count = 0;
  for (const m of teamMembers) {
    await syncTeamMemberToCommunity(supabase, m.id);
    count++;
  }

  return { syncedCount: count };
}
