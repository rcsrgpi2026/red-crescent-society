import assert from "node:assert";
import { findRelevantKnowledge, findRelevantKnowledgeSync } from "../lib/ai/knowledge/knowledge-base.ts";

console.log("--- Testing Hybrid Knowledge Retrieval (Keyword + Semantic Embeddings) ---");

async function runTests() {
  // Test 1: Synchronous keyword fast-path
  const syncRes = findRelevantKnowledgeSync("রক্তদানের যোগ্যতা ও শর্ত");
  assert(syncRes && syncRes.includes("রক্তদানের শর্ত ও যোগ্যতা"), "Sync search should find blood criteria");
  console.log("✓ Synchronous fast-path works as expected");

  // Test 2: Paraphrase in Bengali (blood donation age)
  const res1 = await findRelevantKnowledge("বয়স ১৭, আমি কি রক্ত দিতে পারি?");
  assert(res1 && res1.includes("রক্তদানের শর্ত ও যোগ্যতা"), "Should retrieve blood donation criteria for age 17");
  console.log("✓ Paraphrase 1 ('বয়স ১৭, আমি কি রক্ত দিতে পারি?') -> matched blood-donation-criteria");

  // Test 3: Paraphrase in English (weight eligibility)
  const res2 = await findRelevantKnowledge("Do I have enough weight to donate blood?");
  assert(res2 && res2.includes("রক্তদানের শর্ত ও যোগ্যতা"), "Should retrieve blood donation criteria for weight question");
  console.log("✓ Paraphrase 2 ('Do I have enough weight to donate blood?') -> matched blood-donation-criteria");

  // Test 4: Paraphrase interval
  const res3 = await findRelevantKnowledge("রক্ত কতদিন পর আবার দেওয়া যায়?");
  assert(res3 && res3.includes("রক্তদানের শর্ত ও যোগ্যতা"), "Should retrieve blood donation criteria for donation interval");
  console.log("✓ Paraphrase 3 ('রক্ত কতদিন পর আবার দেওয়া যায়?') -> matched blood-donation-criteria");

  // Test 5: Seven principles
  const res4 = await findRelevantKnowledge("রেড ক্রসের সাতটি মূল আদর্শ বা নীতি কি কি?");
  assert(res4 && res4.includes("৭টি মূলনীতি"), "Should retrieve seven-principles");
  console.log("✓ Query 4 ('রেড ক্রসের সাতটি মূল আদর্শ বা নীতি') -> matched seven-principles");

  // Test 6: Certificate check
  const res5 = await findRelevantKnowledge("অনলাইনে সনদ ঠিক আছে কিনা কীভাবে দেখব?");
  assert(res5 && res5.includes("সার্টিফিকেট যাচাইকরণ"), "Should retrieve certificate-verification");
  console.log("✓ Query 5 ('অনলাইনে সনদ ঠিক আছে কিনা কীভাবে দেখব?') -> matched certificate-verification");

  console.log("\n==========================================");
  console.log("🎉 ALL SEMANTIC RETRIEVAL TESTS PASSED! 🎉");
  console.log("==========================================");
}

runTests().catch((err) => {
  console.error("Semantic retrieval test failed:", err);
  process.exit(1);
});
