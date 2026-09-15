/**
 * Generates precomputed offline vector embeddings for the RCY Knowledge Base
 * using Google's free-tier gemini-embedding-001 endpoint.
 *
 * Output: lib/ai/knowledge/kb-embeddings.json
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// 1. Read API key from .env.local or environment
let apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  const envPath = path.join(rootDir, ".env.local");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    const m = envContent.match(/GEMINI_API_KEY=(.+)/);
    if (m) apiKey = m[1].trim();
  }
}

if (!apiKey) {
  console.error("❌ ERROR: GEMINI_API_KEY not found in environment or .env.local");
  process.exit(1);
}

// 2. Load Knowledge Base
const kbPath = path.join(rootDir, "lib", "ai", "knowledge", "knowledge-base.ts");
const kbContent = fs.readFileSync(kbPath, "utf8");

// Parse articles dynamically via regex or evaluation
const articleBlocks = kbContent.split(/\{\s*id:\s*"/).slice(1);
const articles = [];

for (const block of articleBlocks) {
  const idMatch = block.match(/^([^"]+)"/);
  const titleMatch = block.match(/titleBn:\s*"([^"]+)"/);
  const categoryMatch = block.match(/category:\s*"([^"]+)"/);
  const contentMatch = block.match(/contentBn:\s*`([^`]+)`/);

  // Extract keywords
  const kwSectionMatch = block.match(/keywords:\s*\[([\s\S]*?)\]/);
  const keywords = [];
  if (kwSectionMatch) {
    const kwMatches = kwSectionMatch[1].matchAll(/"([^"]+)"/g);
    for (const km of kwMatches) {
      keywords.push(km[1]);
    }
  }

  if (idMatch && titleMatch && contentMatch) {
    articles.push({
      id: idMatch[1],
      titleBn: titleMatch[1],
      category: categoryMatch ? categoryMatch[1] : "about",
      keywords,
      contentBn: contentMatch[1].trim(),
    });
  }
}

console.log(`Loaded ${articles.length} articles from RCY Knowledge Base.`);

async function embedArticle(article) {
  const textToEmbed = `${article.titleBn}\n${article.contentBn}\nসম্পর্কিত বিষয়: ${article.keywords.join(", ")}`;
  const modelName = "gemini-embedding-001";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:embedContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: `models/${modelName}`,
      content: {
        parts: [{ text: textToEmbed }],
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Embedding failed for article "${article.id}": ${res.status} ${err}`);
  }

  const data = await res.json();
  if (!data?.embedding?.values) {
    throw new Error(`Invalid response structure for article "${article.id}"`);
  }

  return data.embedding.values;
}

async function main() {
  const results = [];
  console.log("Generating embeddings with gemini-embedding-001...");

  for (let i = 0; i < articles.length; i++) {
    const art = articles[i];
    process.stdout.write(`[${i + 1}/${articles.length}] Embedding "${art.id}"... `);
    const vector = await embedArticle(art);
    results.push({
      id: art.id,
      titleBn: art.titleBn,
      category: art.category,
      embedding: vector,
    });
    console.log(`✓ (${vector.length} dims)`);
    // Brief delay to stay safely under free-tier RPM limits
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  const outputPath = path.join(rootDir, "lib", "ai", "knowledge", "kb-embeddings.json");
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), "utf8");
  console.log(`\n🎉 Successfully saved ${results.length} article embeddings to:\n${outputPath}`);
}

main().catch((err) => {
  console.error("Error generating embeddings:", err);
  process.exit(1);
});
