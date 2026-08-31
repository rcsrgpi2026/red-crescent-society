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

async function testPush() {
  console.log("Fetching active push subscriptions for SUPER_ADMIN Mehedi Hasan...");
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("is_active", true);

  console.log(`Found ${subs?.length || 0} active subscriptions:`);
  for (const sub of subs || []) {
    console.log(`Sending to ${sub.browser} (${sub.platform}) [User: ${sub.user_id || "Guest"}]...`);
    try {
      const payload = JSON.stringify({
        title: "🩸 [Admin Alert] Donor Response Received!",
        body: "A willing donor submitted their details for patient Rahman (O+).",
        actionUrl: "/admin/messages",
        notificationId: "test-admin-id",
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
      console.log(`✅ Push Sent successfully! Status: ${res.statusCode}`);
    } catch (err) {
      console.error(`❌ Failed to send to ${sub.browser}:`, err.statusCode || err.message);
    }
  }
}

testPush();
