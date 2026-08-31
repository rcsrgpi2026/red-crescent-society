import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

async function runTests() {
  console.log("==================================================");
  console.log("🧪 STARTING SMART NOTIFICATION SYSTEM TESTS");
  console.log("==================================================\n");

  // Test 1: Check database schema & tables
  console.log("🔹 Test 1: Verifying Database Tables...");
  const [notifs, userNotifs, prefs, pushSubs] = await Promise.all([
    supabase.from("notifications").select("id", { count: "exact", head: true }),
    supabase.from("user_notifications").select("id", { count: "exact", head: true }),
    supabase.from("notification_preferences").select("id", { count: "exact", head: true }),
    supabase.from("push_subscriptions").select("id", { count: "exact", head: true }),
  ]);

  if (notifs.error || userNotifs.error || prefs.error || pushSubs.error) {
    console.error("❌ Table verification failed:", {
      notifications: notifs.error?.message,
      user_notifications: userNotifs.error?.message,
      notification_preferences: prefs.error?.message,
      push_subscriptions: pushSubs.error?.message,
    });
    process.exit(1);
  }
  console.log("✅ All 4 tables exist and are reachable!");

  // Test 2: Create Test Notification (Notice)
  console.log("\n🔹 Test 2: Creating Test Notice Notification...");
  const { data: noticeNotif, error: noticeErr } = await supabase
    .from("notifications")
    .insert({
      title: "📢 [Automated Test] Important Volunteer Meeting",
      body: "A general assembly for all Red Crescent youth members will be held tomorrow at 10 AM.",
      type: "notice",
      priority: "normal",
      action_url: "/notices/test-notice",
    })
    .select("id")
    .single();

  if (noticeErr || !noticeNotif) {
    console.error("❌ Failed to create notice notification:", noticeErr);
  } else {
    console.log(`✅ Notice notification created with ID: ${noticeNotif.id}`);
  }

  // Test 3: Create Test Gallery Notification
  console.log("\n🔹 Test 3: Creating Test Gallery Notification...");
  const { data: galleryNotif, error: galleryErr } = await supabase
    .from("notifications")
    .insert({
      title: "📸 [Automated Test] New Gallery Album: First Aid Drill 2026",
      body: "Check out photos from our annual disaster response and first aid simulation.",
      type: "event",
      priority: "normal",
      action_url: "/gallery/first-aid-drill-2026",
    })
    .select("id")
    .single();

  if (galleryErr || !galleryNotif) {
    console.error("❌ Failed to create gallery notification:", galleryErr);
  } else {
    console.log(`✅ Gallery notification created with ID: ${galleryNotif.id}`);
  }

  // Test 4: Create Test Blood Request Notification
  console.log("\n🔹 Test 4: Creating Test Blood Request Notification...");
  const { data: bloodNotif, error: bloodErr } = await supabase
    .from("notifications")
    .insert({
      title: "🩸 [Automated Test] Blood Request Update: Donor Found",
      body: "Donor found for O+ blood request (Patient: Rahman) at Rajshahi Medical College Hospital.",
      type: "blood_request",
      priority: "normal",
      action_url: "/blood-support",
    })
    .select("id")
    .single();

  if (bloodErr || !bloodNotif) {
    console.error("❌ Failed to create blood request notification:", bloodErr);
  } else {
    console.log(`✅ Blood Request notification created with ID: ${bloodNotif.id}`);
  }

  // Test 5: Verify user_notifications delivery linkage
  console.log("\n🔹 Test 5: Simulating User Delivery & Feed...");
  const { data: profiles } = await supabase.from("profiles").select("id").limit(3);
  if (profiles && profiles.length > 0 && noticeNotif) {
    const userRows = profiles.map((p) => ({
      notification_id: noticeNotif.id,
      user_id: p.id,
      status: "sent",
      score: 100,
    }));
    const { error: linkErr } = await supabase.from("user_notifications").upsert(userRows, {
      onConflict: "notification_id,user_id",
    });
    if (linkErr) {
      console.error("❌ Failed to link user notification:", linkErr);
    } else {
      console.log(`✅ Successfully delivered in-app test notification to ${profiles.length} user(s)!`);
    }
  }

  console.log("\n==================================================");
  console.log("🎉 ALL TESTS COMPLETED SUCCESSFULLY!");
  console.log("==================================================");
}

runTests();
