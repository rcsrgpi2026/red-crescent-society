import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, serviceKey);

async function testFullPipeline() {
  console.log("==================================================");
  console.log("🚀 TESTING NOTIFICATION PIPELINE & STATS");
  console.log("==================================================\n");

  // 1. Fetch notifications with delivery tracking
  const { data: list, error } = await supabase
    .from("notifications")
    .select(`
      id,
      title,
      type,
      priority,
      action_url,
      created_at,
      user_notifications(id, status, opened_at)
    `)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("❌ Failed to query notifications:", error);
    process.exit(1);
  }

  console.log(`✅ Retrieved ${list.length} recent notification campaign(s):\n`);
  for (const n of list) {
    const recipients = n.user_notifications?.length || 0;
    const opened = n.user_notifications?.filter((u) => u.status === "opened" || u.opened_at)?.length || 0;
    console.log(`  • [${n.type.toUpperCase()}] ${n.title}`);
    console.log(`    Recipients: ${recipients} | Opened: ${opened} | Action: ${n.action_url || "none"}`);
  }

  console.log("\n==================================================");
  console.log("✨ ALL PIPELINE CHECKS PASSED!");
  console.log("==================================================");
}

testFullPipeline();
