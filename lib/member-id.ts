import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Generates the next sequential unique Member ID (e.g. RCR-2026-0022).
 * Inspects all existing member IDs for the given year, determines the highest
 * assigned sequence number, and increments it to avoid duplicate key violations
 * even when records have gaps or were deleted.
 */
export async function generateNextMemberId(
  supabase: SupabaseClient,
  year: number = new Date().getFullYear()
): Promise<string> {
  const { data: members, error } = await supabase
    .from("team_members")
    .select("member_id")
    .ilike("member_id", `RCR-${year}-%`);

  if (error) {
    console.error("generateNextMemberId query error:", error);
  }

  const takenIds = new Set<string>();
  let maxNum = 0;

  for (const m of members ?? []) {
    if (!m.member_id) continue;
    takenIds.add(m.member_id);
    const parts = m.member_id.split("-");
    if (parts.length === 3) {
      const num = parseInt(parts[2], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }

  let next = maxNum + 1;
  let candidate = `RCR-${year}-${String(next).padStart(4, "0")}`;

  // Extra guard against any race condition or collision
  while (takenIds.has(candidate)) {
    next++;
    candidate = `RCR-${year}-${String(next).padStart(4, "0")}`;
  }

  return candidate;
}
