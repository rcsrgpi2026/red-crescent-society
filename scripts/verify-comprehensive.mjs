/**
 * Comprehensive Verification Script for Upgraded RCY AI Assistant
 * Validates Live Data Resolvers, Intent Routing, and Live End-to-End Responses.
 */
import assert from "node:assert";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import {
  getSiteImpactStats,
  getLeadershipSummary,
  getRecentActivitiesSummary,
  getUpcomingEventsSummary,
  buildTrustedLiveContext,
} from "../lib/ai/resolvers/live-data.ts";
import { classifyIntent } from "../lib/ai/intent-router.ts";
import { processAssistantMessage } from "../lib/ai/service.ts";

console.log("==================================================");
console.log("🚀 COMPREHENSIVE AI ASSISTANT INTELLIGENCE VERIFICATION");
console.log("==================================================\n");

async function runVerification() {
  let passed = 0;
  let total = 0;

  function record(testName, ok, extra = "") {
    total++;
    if (ok) {
      passed++;
      console.log(`✅ [PASS] ${testName} ${extra}`);
    } else {
      console.error(`❌ [FAIL] ${testName} ${extra}`);
      process.exit(1);
    }
  }

  // 1. Live Data Resolvers Verification
  console.log("--- 1. Testing Live Database Resolvers ---");
  const stats = await getSiteImpactStats();
  console.log("Returned stats:", JSON.stringify(stats, null, 2));
  record("Site Impact Stats computed", stats && stats.totalBloodDonations >= 0);
  record(`Total Donated Units: ${stats.totalBloodDonations}`, stats.totalBloodDonations === 5);
  record(`Total Active Donors: ${stats.activeDonors}`, stats.activeDonors >= 1);
  record("Donors by Group mapped", Object.keys(stats.availableDonorsByGroup).length > 0);
  record(`B+ Donors Count: ${stats.availableDonorsByGroup["B+"] ?? 0}`, stats.availableDonorsByGroup["B+"] >= 1);

  const leadership = await getLeadershipSummary();
  record("Incharge Teacher extracted", Boolean(leadership.inchargeTeacher?.name));
  record(`Incharge Name: ${leadership.inchargeTeacher?.name}`, leadership.inchargeTeacher?.name.includes("নূরুল আমিন") || leadership.inchargeTeacher?.name.includes("Nurul Amin"));
  record(`Principal Name: ${leadership.principal?.name}`, leadership.principal?.name.includes("আজম মাসুদুর রহমান") || leadership.principal?.name.includes("Ajm Masudur"));

  const activities = await getRecentActivitiesSummary();
  record("Recent Field Activities extracted", activities.length > 0);
  record(`Activity Title: ${activities[0]?.title}`, activities[0]?.title.toLowerCase().includes("safer roads") || activities[0]?.title.includes("সড়ক"));

  const events = await getUpcomingEventsSummary();
  record("Events extracted", events.length > 0);
  const dengueEvent = events.find((e) => e.slug.includes("dengue"));
  record("Dengue Event status correctly resolved", dengueEvent?.status === "COMPLETED");

  // 2. Intent Routing Verification for Banglish & Edge Queries
  console.log("\n--- 2. Testing Banglish & Typo Tolerance ---");
  record("Typos: 'incharj techer k?' -> TEAM_FOUNDER", classifyIntent("incharj techer k?") === "TEAM_FOUNDER");
  record("Typos: 'koy bag rocto dan hoise?' -> SITE_STATS", classifyIntent("koy bag rocto dan hoise?") === "SITE_STATS");
  record("Typos: 'Reccent activites dau' -> EVENT_ACTIVITY", classifyIntent("Reccent activites dau") === "EVENT_ACTIVITY");
  record("Typos: 'student id card kivabe pabo?' -> FORM_GUIDANCE", classifyIntent("student id card kivabe pabo?") === "FORM_GUIDANCE");
  record("Typos: 'certificate verify kora jabe?' -> FORM_GUIDANCE", classifyIntent("certificate verify kora jabe?") === "FORM_GUIDANCE");
  record("Donors: 'A+ donor koyjon ache?' -> BLOOD_SUPPORT", classifyIntent("A+ donor koyjon ache?") === "BLOOD_SUPPORT");
  record("Recruitment: 'ekhon ki volunteer recruitment cholche?' -> RECRUITMENT", classifyIntent("ekhon ki volunteer recruitment cholche?") === "RECRUITMENT");

  // 3. Live Context Assembly Verification
  console.log("\n--- 3. Testing Context Engineering Ground Truth ---");
  const activityContext = await buildTrustedLiveContext("EVENT_ACTIVITY", "recent activities ki ki?");
  record("Activity Context includes [SPECIFIC FOCUS: RCY ON-GROUND FIELD ACTIVITIES]", activityContext.includes("[SPECIFIC FOCUS: RCY ON-GROUND FIELD ACTIVITIES"));
  record("Activity Context includes Safer Roads activity", activityContext.includes("Safer Roads") || activityContext.includes("সড়ক"));

  const teamContext = await buildTrustedLiveContext("TEAM_FOUNDER", "incharge teacher k?");
  record("Team Context includes Incharge Teacher name", teamContext.includes("নূরুল আমিন") || teamContext.includes("Nurul Amin"));

  const statsContext = await buildTrustedLiveContext("SITE_STATS", "koto unit blood donated hoise?");
  record("Stats Context includes total blood donated (5)", statsContext.includes("5") && statsContext.includes("ব্যাগ"));

  // 4. Live End-to-End Service Tests with Mock IPs
  console.log("\n--- 4. Testing End-to-End AI Responses ---");
  
  // Test A: Incharge Teacher Name
  const resTeacher = await processAssistantMessage({
    message: "আমাদের ইনচার্জ শিক্ষক কে?",
    clientIp: "10.1.0.1",
  });
  console.log("Q: আমাদের ইনচার্জ শিক্ষক কে?");
  console.log(`A: ${resTeacher.message.slice(0, 150)}...`);
  record("Incharge Teacher answer mentions Nurul Amin", resTeacher.message.includes("নূরুল আমিন") || resTeacher.message.includes("Nurul Amin"));

  // Test B: Total Blood Donated Units
  const resDonation = await processAssistantMessage({
    message: "মোট কত ব্যাগ রক্তদান হয়েছে সাইটে?",
    clientIp: "10.1.0.2",
  });
  console.log("Q: মোট কত ব্যাগ রক্তদান হয়েছে সাইটে?");
  console.log(`A: ${resDonation.message.slice(0, 150)}...`);
  record("Blood Donated answer states 5 units", resDonation.message.includes("৫") || resDonation.message.includes("5"));

  // Test C: Activities vs Events Distinction
  const resActivity = await processAssistantMessage({
    message: "Recent activities er details dao",
    clientIp: "10.1.0.3",
  });
  console.log("Q: Recent activities er details dao");
  console.log(`A: ${resActivity.message.slice(0, 150)}...`);
  record("Recent activities mentions Safer Roads/সড়ক", resActivity.message.includes("Safer Roads") || resActivity.message.includes("নিরাপদ সড়ক") || resActivity.message.includes("সড়ক"));
  record("Recent activities has button to /activities", resActivity.actions?.some((a) => a.target.includes("/activities")) ?? false);

  // Test D: Group-Specific Donor Count
  const resDonor = await processAssistantMessage({
    message: "B+ donor koyjon ache?",
    clientIp: "10.1.0.4",
  });
  console.log("Q: B+ donor koyjon ache?");
  console.log(`A: ${resDonor.message.slice(0, 150)}...`);
  record("Donor inquiry answered accurately", resDonor.message.includes("B+") || resDonor.message.includes("১") || resDonor.message.includes("1"));

  // Test E: ID Card Guidance
  const resIdCard = await processAssistantMessage({
    message: "Student ID card kivabe pabo?",
    clientIp: "10.1.0.5",
  });
  console.log("Q: Student ID card kivabe pabo?");
  console.log(`A: ${resIdCard.message.slice(0, 150)}...`);
  record("ID Card guidance points to /student/login", resIdCard.message.includes("/student/login") || (resIdCard.actions?.some((a) => a.target.includes("/student/login")) ?? false));

  // Test F: PWA Mobile App Installation
  const resPwa = await processAssistantMessage({
    message: "app install korbo kmne?",
    clientIp: "10.1.0.6",
  });
  console.log("Q: app install korbo kmne?");
  console.log(`A: ${resPwa.message.slice(0, 150)}...`);
  record("PWA response explains installation", resPwa.message.includes("PWA") || resPwa.message.includes("ইনস্টল") || resPwa.message.includes("Home screen"));
  record("PWA response never denies app", !resPwa.message.includes("কোনো মোবাইল অ্যাপ নেই"));

  // Test G: Push Notification Setup
  const resPush = await processAssistantMessage({
    message: "push notification on korbo kmne?",
    clientIp: "10.1.0.7",
  });
  console.log("Q: push notification on korbo kmne?");
  console.log(`A: ${resPush.message.slice(0, 150)}...`);
  record("Push notification explains bell icon/enable", resPush.message.includes("নোটিফিকেশন") && (resPush.message.includes("ঘণ্টা") || resPush.message.includes("Enable Push") || resPush.message.includes("Allow")));
  record("Push notification never says unavailable", !resPush.message.includes("উপলব্ধ নেই"));

  console.log("\n==================================================");
  console.log(`🎉 ALL ${passed}/${total} COMPREHENSIVE VERIFICATIONS PASSED! 🎉`);
  console.log("==================================================");
}

runVerification().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
