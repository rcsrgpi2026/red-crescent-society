/**
 * Test script to simulate the deterministic multi-turn Blood Request Wizard
 */
import assert from "node:assert";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { processAssistantMessage } from "../lib/ai/service.ts";

console.log("==================================================");
console.log("🧪 TESTING DETERMINISTIC STEP-BY-STEP BLOOD WIZARD");
console.log("==================================================\n");

async function runWizardTest() {
  const history = [];

  // TURN 1: User triggers blood request
  console.log("--- Turn 1: User initiates blood request ---");
  const turn1 = await processAssistantMessage({
    message: "blood request korte chai",
    history,
    clientIp: "10.2.0.1",
  });
  console.log("A1:\n" + turn1.message);
  assert(turn1.message.includes("ধাপ ১/৪"), "Should start with Stage 1");
  assert(turn1.sourceType === "form", "Should be deterministic form wizard");
  assert(turn1.actions?.[0]?.target?.includes("/blood-support/request"), "Should provide fallback link");

  history.push({ role: "user", content: "blood request korte chai" });
  history.push({ role: "assistant", content: turn1.message });

  // TURN 2: User provides patient name and blood group
  console.log("\n--- Turn 2: User provides patient name & blood group ---");
  const turn2 = await processAssistantMessage({
    message: "রোগীর নাম রহিম, রক্তের গ্রুপ B+",
    history,
    clientIp: "10.2.0.2",
  });
  console.log("A2:\n" + turn2.message);
  assert(turn2.message.includes("ধাপ ২/৪"), "Should advance to Stage 2");
  assert(turn2.message.includes("রহিম"), "Should remember patient name");
  assert(turn2.message.includes("B+"), "Should remember blood group");

  history.push({ role: "user", content: "রোগীর নাম রহিম, রক্তের গ্রুপ B+" });
  history.push({ role: "assistant", content: turn2.message });

  // TURN 3: User provides units and hospital/location
  console.log("\n--- Turn 3: User provides units & hospital ---");
  const turn3 = await processAssistantMessage({
    message: "২ ব্যাগ, রাজশাহী মেডিকেল কলেজ হাসপাতাল, ওয়ার্ড ৮",
    history,
    clientIp: "10.2.0.3",
  });
  console.log("A3:\n" + turn3.message);
  assert(turn3.message.includes("ধাপ ৩/৪"), "Should advance to Stage 3");
  assert(turn3.message.includes("2 ব্যাগ") || turn3.message.includes("২ ব্যাগ"), "Should remember units");
  assert(turn3.message.includes("রাজশাহী মেডিকেল"), "Should remember hospital");

  history.push({ role: "user", content: "২ ব্যাগ, রাজশাহী মেডিকেল কলেজ হাসপাতাল, ওয়ার্ড ৮" });
  history.push({ role: "assistant", content: turn3.message });

  // TURN 4: User provides required date & urgency level
  console.log("\n--- Turn 4: User provides date & emergency level ---");
  const turn4 = await processAssistantMessage({
    message: "আজকেই লাগবে, অতি জরুরি",
    history,
    clientIp: "10.2.0.4",
  });
  console.log("A4:\n" + turn4.message);
  assert(turn4.message.includes("ধাপ ৪/৪"), "Should advance to Stage 4 (contact & email)");
  assert(turn4.message.includes("ইমেইল"), "Must specifically ask for email");
  assert(turn4.message.includes("মোবাইল নম্বর"), "Must ask for mobile number");

  history.push({ role: "user", content: "আজকেই লাগবে, অতি জরুরি" });
  history.push({ role: "assistant", content: turn4.message });

  // TURN 5: User provides requester name, mobile, and email
  console.log("\n--- Turn 5: User provides requester name, phone & email ---");
  const turn5 = await processAssistantMessage({
    message: "আমার নাম করিম, মোবাইল 01712345678, ইমেইল karim@gmail.com",
    history,
    clientIp: "10.2.0.5",
  });
  console.log("A5:\n" + turn5.message);
  assert(turn5.message.includes("সফলভাবে সংগৃহীত হয়েছে"), "Should complete the wizard");
  assert(turn5.message.includes("karim@gmail.com"), "Should include email in summary");
  assert(turn5.message.includes("01712345678"), "Should include phone in summary");
  assert(turn5.actions && turn5.actions.length > 0, "Must include action button");

  const targetUrl = turn5.actions[0].target;
  console.log("\n🔗 Generated Pre-Filled URL:\n" + targetUrl);
  assert(targetUrl.includes("bloodGroup=B%2B"), "URL must include pre-filled bloodGroup B+");
  assert(targetUrl.includes("patientName="), "URL must include patientName");
  assert(targetUrl.includes("units=2"), "URL must include units=2");
  assert(targetUrl.includes("contact=01712345678"), "URL must include contact");
  assert(targetUrl.includes("email=karim%40gmail.com"), "URL must include email");
  assert(targetUrl.includes("emergencyLevel=EMERGENCY"), "URL must include emergencyLevel");

  console.log("\n==================================================");
  console.log("🧪 TESTING SHORTHAND / CASUAL REPLIES (NO LOOPING)");
  console.log("==================================================\n");

  const history2 = [];

  // Turn 1: "blood lagbe"
  const t1 = await processAssistantMessage({ message: "blood lagbe", history: history2, clientIp: "10.3.0.1" });
  assert(t1.message.includes("ধাপ ১/৪"), "T1 must be stage 1");
  history2.push({ role: "user", content: "blood lagbe" });
  history2.push({ role: "assistant", content: t1.message });

  // Turn 2: User says just "mehedi a+" (no formal labels)
  const t2 = await processAssistantMessage({ message: "mehedi a+", history: history2, clientIp: "10.3.0.2" });
  assert(t2.message.includes("ধাপ ২/৪"), "T2 MUST advance to stage 2, never loop on stage 1!");
  history2.push({ role: "user", content: "mehedi a+" });
  history2.push({ role: "assistant", content: t2.message });

  // Turn 3: User says just "rmch" (no units mentioned)
  const t3 = await processAssistantMessage({ message: "rmch", history: history2, clientIp: "10.3.0.3" });
  assert(t3.message.includes("ধাপ ৩/৪"), "T3 MUST advance to stage 3, never loop on stage 2!");
  history2.push({ role: "user", content: "rmch" });
  history2.push({ role: "assistant", content: t3.message });

  // Turn 4: User says just "ajke" (no emergency level mentioned)
  const t4 = await processAssistantMessage({ message: "ajke", history: history2, clientIp: "10.3.0.4" });
  assert(t4.message.includes("ধাপ ৪/৪"), "T4 MUST advance to stage 4, never loop on stage 3!");
  history2.push({ role: "user", content: "ajke" });
  history2.push({ role: "assistant", content: t4.message });

  // Turn 5: User says just phone number "01799999999" (no email mentioned)
  const t5 = await processAssistantMessage({ message: "01799999999", history: history2, clientIp: "10.3.0.5" });
  assert(t5.message.includes("সফলভাবে সংগৃহীত হয়েছে"), "T5 MUST complete, never loop on missing email!");
  assert(t5.actions?.[0]?.target?.includes("contact=01799999999"), "URL must have phone number");

  console.log("\n==================================================");
  console.log("🎉 ALL WIZARD & ZERO-LOOP TESTS PASSED PERFECTLY! 🎉");
  console.log("==================================================");
}

runWizardTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
