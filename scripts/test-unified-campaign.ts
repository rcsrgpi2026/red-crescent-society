import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

// Bypass server-only check in standalone Node runner
const serverOnlyPath = require.resolve("server-only");
require.cache[serverOnlyPath] = {
  id: serverOnlyPath,
  filename: serverOnlyPath,
  loaded: true,
  exports: {},
} as any;

async function run() {
  // Use relative import so TypeScript compiler and IDE language server resolve symbols cleanly
  const { sendCampaignEmailBatch } = await import("../lib/email/mailer");

  const targetEmail = process.argv[2] || "iamehedihsn@gmail.com";
  console.log("==================================================");
  console.log(" TESTING CAMPAIGN SEND VIA UNIFIED SYSTEM ENGINE  ");
  console.log("==================================================");
  console.log(`Recipient:   ${targetEmail}`);
  console.log(`Sender:      ${process.env.SMTP_USER}`);
  console.log("--------------------------------------------------");

  const result = await sendCampaignEmailBatch({
    recipients: [
      {
        email: targetEmail,
        name: "Mehedi Hasan",
      },
    ],
    campaign: {
      subject: "জরুরি নোটিশ — রেড ক্রিসেন্ট যুব দল (সিস্টেম টেস্ট)",
      heading: "ট্রানজ্যাকশনাল ইঞ্জিন ভেরিফিকেশন",
      body: "প্রিয় মেহদী হাসান,\n\nএটি একটি ভেরিফিকেশন টেস্ট মেইল। ক্যাম্পেইন ডিসপ্যাচ ইঞ্জিনকে এখন ব্লাড সাপোর্ট ও রেজিস্ট্রেশন সিস্টেমের হুবহু একই ১-টু-১ ট্রানজ্যাকশনাল ডেলিভারি পাইপলাইনে যুক্ত করা হয়েছে।\n\nদয়া করে চেক করে দেখুন এই মেইলটি সরাসরি আপনার Primary Inbox-এ এসেছে কি না।",
      badge: "অফিসিয়াল সার্কুলার",
      buttonText: "পোর্টালে প্রবেশ করুন",
      buttonUrl: "https://rcy-rgpi.org",
      secondaryInfo: "ব্লাড সাপোর্ট এবং ভলান্টিয়ার রেজিস্ট্রেশন মেইলের মতো এখন প্রতিটি ক্যাম্পেইন মেইল ব্যক্তিভিত্তিক ট্রানজ্যাকশনাল এনভেলপ নিয়ে যাবে।",
    },
  });

  console.log("--------------------------------------------------");
  console.log("Result:", JSON.stringify(result, null, 2));

  if (result.successCount > 0) {
    console.log(`\n🎉 SUCCESS: Delivered via sendSystemEmail engine to ${targetEmail}!`);
  } else {
    console.error(`\n❌ FAILED:`, result.errors);
  }
}

run().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
