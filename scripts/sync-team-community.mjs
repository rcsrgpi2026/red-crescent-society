import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function normalize(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/\b(md|most|dr|engr)\b/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

async function sync() {
  console.log("=== SYNCING TEAM MEMBERS TO COMMUNITY TREE ===");

  const { data: teamMembers, error: teamErr } = await supabase
    .from("team_members")
    .select("id, name, position, photo_url");
  if (teamErr) {
    console.error("Failed to fetch team_members:", teamErr);
    return;
  }

  const { data: commMembers, error: commErr } = await supabase
    .from("community_members")
    .select("id, name, position, level, photo_url, team_member_id");
  if (commErr) {
    console.error("Failed to fetch community_members:", commErr);
    return;
  }

  console.log(`Found ${teamMembers.length} team members and ${commMembers.length} community members.\n`);

  let matchedCount = 0;
  let photoUpdatedCount = 0;

  for (const comm of commMembers) {
    const normComm = normalize(comm.name);
    // Find best match in teamMembers
    let match = teamMembers.find((t) => normalize(t.name) === normComm);

    // Fuzzy fallbacks for known slight spelling differences:
    // e.g. "tamimhossain" vs "tamimhosen", "suraiayayasminsetu" vs "suraiyayesminsetu"
    if (!match) {
      match = teamMembers.find((t) => {
        const normTeam = normalize(t.name);
        if (normComm.includes("setu") && normTeam.includes("setu")) return true;
        if (normComm.includes("tamim") && normTeam.includes("tamim")) return true;
        if (normComm.includes("nusrat") && normTeam.includes("nusrat")) return true;
        if (normComm.includes("rezwan") || normComm.includes("rejwan")) {
          return normTeam.includes("rezwan") || normTeam.includes("rejwan");
        }
        return false;
      });
    }

    if (match) {
      matchedCount++;
      const updates = {};

      if (!comm.team_member_id) {
        updates.team_member_id = match.id;
      }

      // If community member doesn't have a photo or has a broken/null photo, but team member has one:
      if ((!comm.photo_url || comm.photo_url === "null") && match.photo_url) {
        updates.photo_url = match.photo_url;
      }

      if (Object.keys(updates).length > 0) {
        const { error: updateErr } = await supabase
          .from("community_members")
          .update(updates)
          .eq("id", comm.id);

        if (updateErr) {
          console.error(`❌ Failed to update ${comm.name}:`, updateErr.message);
        } else {
          console.log(`✅ Linked: "${comm.name}" -> Team: "${match.name}"`);
          if (updates.photo_url) {
            photoUpdatedCount++;
            console.log(`   📸 Set photo_url: ${updates.photo_url}`);
          }
        }
      } else {
        console.log(`ℹ️ Already up-to-date: "${comm.name}" (linked to "${match.name}")`);
      }
    } else {
      console.log(`⚠️ No team match found for Community member: "${comm.name}"`);
    }
  }

  console.log(`\n=== SYNC COMPLETE ===`);
  console.log(`Matched & Linked: ${matchedCount} members`);
  console.log(`Photos Restored: ${photoUpdatedCount}`);
}

sync().catch(console.error);
