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

/**
 * Generates the next sequential unique Admission Serial / Roll Number (e.g. online-reg-1, online-reg-2).
 * Formatted as online-reg-N starting from 1.
 * If a user/record is deleted from the database, its roll number is freed up and re-used for new approvals.
 */
export async function generateNextApplicationSerialNo(
  supabase: SupabaseClient
): Promise<string> {
  const [appsRes, membersRes] = await Promise.all([
    supabase
      .from("volunteer_applications")
      .select("serial_no")
      .eq("status", "APPROVED")
      .or("serial_no.ilike.online-reg-%,serial_no.ilike.reg-online-%"),
    supabase
      .from("team_members")
      .select("roll")
      .or("roll.ilike.online-reg-%,roll.ilike.reg-online-%"),
  ]);

  if (appsRes.error) {
    console.error("generateNextApplicationSerialNo query error (apps):", appsRes.error);
  }
  if (membersRes.error) {
    console.error("generateNextApplicationSerialNo query error (members):", membersRes.error);
  }

  const takenNumbers = new Set<number>();

  const extractNum = (str: string | null | undefined) => {
    if (!str) return;
    // Matches online-reg-1, online-reg-0001, reg-online-1, etc.
    const match = str.match(/(?:online-reg|reg-online)-0*(\d+)/i);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > 0) {
        takenNumbers.add(num);
      }
    }
  };

  for (const a of appsRes.data ?? []) extractNum(a.serial_no);
  for (const m of membersRes.data ?? []) extractNum(m.roll);

  // Start from 1 and find the lowest available positive number (e.g. online-reg-1)
  let next = 1;
  while (takenNumbers.has(next)) {
    next++;
  }

  return `online-reg-${next}`;
}

