/**
 * Generates precomputed offline vector embeddings for the RCY Knowledge Base
 * using Google's free-tier gemini-embedding-001 endpoint.
 *
 * Output: lib/ai/knowledge/kb-embeddings.json
 * Cache: lib/ai/knowledge/.kb-embeddings.hash
 */
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const kbPath = path.join(rootDir, "lib", "ai", "knowledge", "knowledge-base.ts");
const outputPath = path.join(rootDir, "lib", "ai", "knowledge", "kb-embeddings.json");
const hashPath = path.join(rootDir, "lib", "ai", "knowledge", ".kb-embeddings.hash");

if (!fs.existsSync(kbPath)) {
  console.error("❌ ERROR: knowledge-base.ts not found at:", kbPath);
  process.exit(1);
}

const kbContent = fs.readFileSync(kbPath, "utf8");
const currentHash = crypto.createHash("sha256").update(kbContent).digest("hex");

// 1. Check if embeddings are already up to date
if (fs.existsSync(outputPath) && fs.existsSync(hashPath)) {
  const savedHash = fs.readFileSync(hashPath, "utf8").trim();
  if (savedHash === currentHash) {
    console.log("✓ Knowledge base unchanged. Reusing precomputed embeddings.");
    process.exit(0);
  }
}

// 2. Read API key from .env.local or environment
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
  if (fs.existsSync(outputPath)) {
    console.log("ℹ️ GEMINI_API_KEY not found in environment. Reusing existing kb-embeddings.json.");
    process.exit(0);
  }
  console.error("❌ ERROR: GEMINI_API_KEY not found and no precomputed kb-embeddings.json exists.");
  process.exit(1);
}

// 3. Parse articles dynamically
const articleBlocks = kbContent.split(/\{\s*id:\s*"/).slice(1);
const articles = [];

for (const block of articleBlocks) {
  const idMatch = block.match(/^([^"]+)"/);
  const titleMatch = block.match(/titleBn:\s*"([^"]+)"/);
  const categoryMatch = block.match(/category:\s*"([^"]+)"/);
  const contentMatch = block.match(/contentBn:\s*`([^`]+)`/);

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

console.log(`Detected changes in knowledge-base.ts. Embedding ${articles.length} articles with gemini-embedding-001...`);

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
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), "utf8");
  fs.writeFileSync(hashPath, currentHash, "utf8");
  console.log(`\n🎉 Successfully updated ${results.length} article embeddings to:\n${outputPath}`);
}

main().catch((err) => {
  console.error("Error generating embeddings:", err);
  // Do not fail build if existing embeddings are present
  if (fs.existsSync(outputPath)) {
    console.warn("⚠️ Reusing existing embeddings due to generation failure.");
    process.exit(0);
  }
  process.exit(1);
});
