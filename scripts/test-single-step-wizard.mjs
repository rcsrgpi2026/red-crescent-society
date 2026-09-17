import assert from "node:assert";
import { executeBloodRequestWizard } from "../lib/ai/resolvers/blood-wizard.ts";

console.log("==================================================");
console.log("🧪 TESTING 7-STEP 1-DETAIL BLOOD REQUEST WIZARD");
console.log("==================================================\n");

const history = [];

// Turn 1: Initiation
console.log("Turn 1: Initiation");
const r1 = executeBloodRequestWizard("রক্তের আবেদন করতে চাই", history);
console.log("A1:", r1.message);
assert(r1.message.includes("ধাপ ১/৭"), "Should be step 1/7");
assert(r1.message.includes("রোগীর পুরো নাম"), "Should ask for patient name only");

history.push({ role: "user", content: "রক্তের আবেদন করতে চাই" });
history.push({ role: "assistant", content: r1.message });

// Turn 2: Patient Name provided
console.log("\nTurn 2: Patient Name provided");
const r2 = executeBloodRequestWizard("মোঃ তানভীর আহমেদ", history);
console.log("A2:", r2.message);
assert(r2.message.includes("ধাপ ২/৭"), "Should be step 2/7");
assert(r2.message.includes("তানভীর আহমেদ"), "Should confirm patient name");
assert(r2.message.includes("রক্তের গ্রুপ"), "Should ask for blood group only");

history.push({ role: "user", content: "মোঃ তানভীর আহমেদ" });
history.push({ role: "assistant", content: r2.message });

// Turn 3: Blood Group provided
console.log("\nTurn 3: Blood Group provided");
const r3 = executeBloodRequestWizard("A+", history);
console.log("A3:", r3.message);
assert(r3.message.includes("ধাপ ৩/৭"), "Should be step 3/7");
assert(r3.message.includes("A+"), "Should confirm blood group");
assert(r3.message.includes("কত ব্যাগ রক্ত"), "Should ask for units only");

history.push({ role: "user", content: "A+" });
history.push({ role: "assistant", content: r3.message });

// Turn 4: Units provided
console.log("\nTurn 4: Units provided");
const r4 = executeBloodRequestWizard("১ ব্যাগ", history);
console.log("A4:", r4.message);
assert(r4.message.includes("ধাপ ৪/৭"), "Should be step 4/7");
assert(r4.message.includes("1 ব্যাগ") || r4.message.includes("১ ব্যাগ"), "Should confirm units");
assert(r4.message.includes("হাসপাতালে"), "Should ask for hospital only");

history.push({ role: "user", content: "১ ব্যাগ" });
history.push({ role: "assistant", content: r4.message });

// Turn 5: Hospital provided
console.log("\nTurn 5: Hospital provided");
const r5 = executeBloodRequestWizard("রাজশাহী মেডিকেল কলেজ হাসপাতাল", history);
console.log("A5:", r5.message);
assert(r5.message.includes("ধাপ ৫/৭"), "Should be step 5/7");
assert(r5.message.includes("রাজশাহী মেডিকেল কলেজ হাসপাতাল"), "Should confirm hospital");
assert(r5.message.includes("কবে প্রয়োজন"), "Should ask for date only");

history.push({ role: "user", content: "রাজশাহী মেডিকেল কলেজ হাসপাতাল" });
history.push({ role: "assistant", content: r5.message });

// Turn 6: Date provided
console.log("\nTurn 6: Date provided");
const r6 = executeBloodRequestWizard("আজকে সন্ধ্যা ৬টায়", history);
console.log("A6:", r6.message);
assert(r6.message.includes("ধাপ ৬/৭"), "Should be step 6/7");
assert(r6.message.includes("মোবাইল নম্বর"), "Should ask for mobile number only");

history.push({ role: "user", content: "আজকে সন্ধ্যা ৬টায়" });
history.push({ role: "assistant", content: r6.message });

// Turn 7: Phone number provided
console.log("\nTurn 7: Phone number provided");
const r7 = executeBloodRequestWizard("01712345678", history);
console.log("A7:", r7.message);
assert(r7.message.includes("ধাপ ৭/৭"), "Should be step 7/7");
assert(r7.message.includes("01712345678"), "Should confirm phone number");
assert(r7.message.includes("ইমেইল ঠিকানা"), "Should ask for email only");

history.push({ role: "user", content: "01712345678" });
history.push({ role: "assistant", content: r7.message });

// Turn 8: Email provided
console.log("\nTurn 8: Email provided");
const r8 = executeBloodRequestWizard("tanvir@gmail.com", history);
console.log("A8:", r8.message);
assert(r8.message.includes("সফলভাবে সংগৃহীত হয়েছে"), "Should complete wizard");
assert(r8.message.includes("তানভীর আহমেদ"), "Summary should have patient name");
assert(r8.message.includes("A+"), "Summary should have blood group");
assert(r8.message.includes("01712345678"), "Summary should have phone number");
assert(r8.message.includes("tanvir@gmail.com"), "Summary should have email");

const targetUrl = r8.actions[0].target;
console.log("\nPre-filled URL:", targetUrl);
assert(targetUrl.includes("patientName="), "Pre-filled URL should have patientName");
assert(targetUrl.includes("bloodGroup=A%2B"), "Pre-filled URL should have bloodGroup A+");
assert(targetUrl.includes("contact=01712345678"), "Pre-filled URL should have contact");
assert(targetUrl.includes("email=tanvir%40gmail.com"), "Pre-filled URL should have email");
assert(/\d{4}-\d{2}-\d{2}/.test(targetUrl), "Pre-filled URL should have valid ISO date for date picker");

console.log("\n==================================================");
console.log("🎉 ALL 7 STEPS WITH 1-DETAIL EACH PASSED! 🎉");
console.log("==================================================");
