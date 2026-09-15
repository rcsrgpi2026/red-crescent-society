import { processAssistantMessage } from "../lib/ai/service.js";
import { clearResponseCache } from "../lib/ai/cache.js";

async function main() {
  clearResponseCache();

  console.log("=== Testing Leadership & Wing Resolution ===");
  const q = "ICT and media communication er GL k?";
  console.log("Query:", q);

  const res = await processAssistantMessage({ message: q });
  console.log("\nResponse Message:\n", res.message);
  console.log("\nResponse Actions:\n", res.actions);

  const text = res.message.toLowerCase();
  if (text.includes("pius") || text.includes("পিয়াস") || text.includes("মিনহাজুল")) {
    console.log("\n✅ [PASS] Accurately identified Minhajul Abadin Pius as ICT & Media GL!");
  } else {
    console.error("\n❌ [FAIL] Did not identify Minhajul Abadin Pius correctly.");
    process.exit(1);
  }

  if (text.includes("maruf") || text.includes("মারুফ")) {
    console.error("\n❌ [FAIL] Incorrectly mentioned Maruf for ICT wing!");
    process.exit(1);
  } else {
    console.log("✅ [PASS] Did NOT incorrectly mention Maruf for ICT wing.");
  }
}

main().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
