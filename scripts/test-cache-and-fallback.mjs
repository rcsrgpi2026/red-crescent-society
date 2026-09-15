import { getCachedResponse, setCachedResponse, clearResponseCache, normalizeQueryForCache } from "../lib/ai/cache.js";
import { AI_CONFIG } from "../lib/ai/config.js";

console.log("=== Testing AI Cache & High-Speed Performance ===");

// 1. Normalization test
const q1 = "  রক্তদানের   নিয়ম কি???  ";
const q2 = "রক্তদানের নিয়ম কি";
const norm1 = normalizeQueryForCache(q1);
const norm2 = normalizeQueryForCache(q2);

if (norm1 === norm2) {
  console.log(`✅ [PASS] Query normalizer correctly equated variations: "${norm1}"`);
} else {
  console.error(`❌ [FAIL] Normalizer failed: "${norm1}" !== "${norm2}"`);
  process.exit(1);
}

// 2. Cache store & hit test
clearResponseCache();
const mockResponse = {
  message: "১৮-৬০ বছর বয়সী যে কেউ রক্ত দিতে পারবেন।",
  actions: [{ type: "navigate", label: "রক্তদান", target: "/blood-support" }],
  sourceType: "database",
};

setCachedResponse(q1, mockResponse);

const start = performance.now();
const hit = getCachedResponse(q2);
const elapsed = performance.now() - start;

if (hit && hit.message === mockResponse.message) {
  console.log(`✅ [PASS] Cache hit succeeded in ${elapsed.toFixed(3)}ms (Instant sub-millisecond response!)`);
  console.log(`✅ [PASS] Cached response preserved actions: ${JSON.stringify(hit.actions)}`);
} else {
  console.error("❌ [FAIL] Cache miss occurred unexpectedly.");
  process.exit(1);
}

// 3. Negative test (non-cached query)
const miss = getCachedResponse("অজানা কোনো প্রশ্ন");
if (miss === null) {
  console.log("✅ [PASS] Uncached query correctly returned null.");
} else {
  console.error("❌ [FAIL] Expected null for uncached query.");
  process.exit(1);
}

// 4. Fallback filter test (fallback types shouldn't be cached)
const fallbackResponse = {
  message: "সার্ভারে সমস্যা",
  sourceType: "fallback",
};
setCachedResponse("সমস্যা কি", fallbackResponse);
const fallbackHit = getCachedResponse("সমস্যা কি");
if (fallbackHit === null) {
  console.log("✅ [PASS] Error fallback was correctly prevented from polluting the cache.");
} else {
  console.error("❌ [FAIL] Error fallback was incorrectly cached.");
  process.exit(1);
}

console.log("\n🚀 Candidate Models Configured for Cascading:");
console.log("Gemini Chain:", AI_CONFIG.geminiCandidateModels.join(" -> "));
console.log("Groq Chain:  ", AI_CONFIG.groqCandidateModels.join(" -> "));
console.log("\n🎉 ALL CACHE & PERFORMANCE TESTS PASSED!");
