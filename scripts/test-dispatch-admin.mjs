import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:info@rcy-rgpi.org";

webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

const supabase = createClient(url, serviceKey);

async function testAdminNotification() {
  console.log("1. Finding all SUPER_ADMIN and ADMIN users...");
  const { data: admins } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .in("role", ["SUPER_ADMIN", "ADMIN", "VOLUNTEER_MANAGER"]);

  console.log("Admins found:", admins);

  const adminUserIds = (admins || []).map((a) => a.id);

  console.log("2. Inserting main notification in notifications table...");
  const { data: notif, error: notifErr } = await supabase
    .from("notifications")
    .insert({
      title: "🛡️ [Admin Alert] Donor Offered Blood: O+ for Patient Rahman",
      body: "Mehedi Hasan (01614424259) wants to donate blood immediately. Click to view message in Admin Inbox.",
      type: "system",
      priority: "high",
      action_url: "/admin/messages",
      target_criteria: { roles: ["SUPER_ADMIN", "ADMIN", "VOLUNTEER_MANAGER"] },
    })
    .select()
    .single();

  if (notifErr) {
    console.error("Error creating notification:", notifErr);
    return;
  }

  console.log("Notification created:", notif.id);

  console.log("3. Inserting user_notifications for admins...");
  for (const admin of admins || []) {
    await supabase.from("user_notifications").insert({
      notification_id: notif.id,
      user_id: admin.id,
      status: "sent",
      score: 100,
      sent_at: new Date().toISOString(),
    });
  }

  console.log("4. Querying push subscriptions for admin user IDs...");
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("*")
    .in("user_id", adminUserIds)
    .eq("is_active", true);

  console.log(`Found ${subs?.length || 0} active push subscriptions for logged-in admins.`);

  for (const sub of subs || []) {
    console.log(`🚀 Dispatching push to ${sub.browser} (${sub.platform}) for admin ${sub.user_id}...`);
    try {
      const payload = JSON.stringify({
        title: notif.title,
        body: notif.body,
        actionUrl: notif.action_url,
        notificationId: notif.id,
        priority: "high",
      });

      const pushSub = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      const res = await webpush.sendNotification(pushSub, payload);
      console.log(`✅ Push Sent successfully! HTTP Status: ${res.statusCode}`);
    } catch (err) {
      console.error(`❌ Push delivery error:`, err.statusCode || err.message);
    }
  }

  console.log("\n🎉 Admin test notification completed successfully!");
}

testAdminNotification();
