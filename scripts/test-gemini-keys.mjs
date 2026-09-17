import fs from "fs";
import path from "path";

// 1. Read .env.local and .env
function loadEnv() {
  const envVars = {};
  for (const filename of [".env", ".env.local"]) {
    const fullPath = path.resolve(process.cwd(), filename);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, "utf-8");
      const lines = content.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          envVars[key] = val;
        }
      }
    }
  }
  return envVars;
}

const env = loadEnv();

// Match logic in lib/ai/config.ts
function collectGeminiKeys() {
  const envVarNames = [
    "GEMINI_API_KEY",
    "GEMINI_API_KEY_1",
    "GEMINI_API_KEY_2",
    "GEMINI_API_KEY_3",
    "GEMINI_API_KEYS",
    "GOOGLE_API_KEY",
    "GOOGLE_API_KEY_2",
  ];

  const accounts = [];
  const seenKeys = new Set();

  for (const envName of envVarNames) {
    const rawVal = env[envName];
    if (!rawVal) continue;

    const tokens = rawVal.split(",").map((t) => t.trim()).filter(Boolean);
    for (const token of tokens) {
      if (!seenKeys.has(token)) {
        seenKeys.add(token);
        const idx = accounts.length + 1;
        accounts.push({
          sourceVar: envName,
          index: idx,
          label: `Gemini Key #${idx} (from ${envName})`,
          maskedKey: `${token.slice(0, 6)}...${token.slice(-4)}`,
          fullKey: token,
        });
      }
    }
  }
  return accounts;
}

const accounts = collectGeminiKeys();

console.log("==================================================");
console.log(`Found ${accounts.length} unique Gemini API key(s) in environment.`);
console.log("==================================================\n");

if (accounts.length === 0) {
  console.error("❌ No Gemini API keys found in .env or .env.local!");
  process.exit(1);
}

// Models to test
const modelsToTest = [
  env.GEMINI_MODEL || "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-2.5-flash-lite",
].filter((v, i, a) => a.indexOf(v) === i && Boolean(v));

async function testKey(account) {
  console.log(`\n--------------------------------------------------`);
  console.log(`Testing: ${account.label}`);
  console.log(`Masked Key: ${account.maskedKey}`);
  console.log(`--------------------------------------------------`);

  // Step 1: Query models endpoint to test authentication and permissions
  let authSuccess = false;
  let availableGeminiModels = [];
  try {
    const listModelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${account.fullKey}`;
    const t0 = Date.now();
    const res = await fetch(listModelsUrl, { method: "GET" });
    const elapsed = Date.now() - t0;

    if (!res.ok) {
      const errText = await res.text();
      console.log(`❌ Auth / List Models failed! (HTTP ${res.status}, ${elapsed}ms)`);
      console.log(`   Response: ${errText.slice(0, 300)}`);
      return { success: false, error: `HTTP ${res.status}: ${errText.slice(0, 200)}` };
    }

    const data = await res.json();
    authSuccess = true;
    availableGeminiModels = (data.models || [])
      .map((m) => m.name.replace("models/", ""))
      .filter((m) => m.includes("gemini"));

    console.log(`✅ Authentication SUCCESSFUL (${elapsed}ms)`);
    console.log(`   Total accessible models: ${data.models?.length || 0}`);
    console.log(`   Sample Gemini models: ${availableGeminiModels.slice(0, 5).join(", ")}...`);
  } catch (err) {
    console.log(`❌ Network / Fetch error during auth check:`, err.message);
    return { success: false, error: err.message };
  }

  // Step 2: Test generateContent on models
  let generateResults = [];
  const candidateModels = [
    "gemini-3.5-flash-lite",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
  ];

  for (const model of candidateModels) {
    const generateUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${account.fullKey}`;
    const t0 = Date.now();
    try {
      const res = await fetch(generateUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: "Respond in 5 words or fewer: Is this connection working?" }],
            },
          ],
          generationConfig: {
            maxOutputTokens: 30,
            temperature: 0.1,
          },
        }),
      });
      const elapsed = Date.now() - t0;

      if (!res.ok) {
        const errText = await res.text();
        let shortErr = errText;
        try {
          const parsed = JSON.parse(errText);
          shortErr = parsed.error?.message || errText;
        } catch {}
        console.log(`   Model [${model}]: ❌ HTTP ${res.status} (${elapsed}ms) -> ${shortErr.slice(0, 150)}`);
        generateResults.push({ model, ok: false, status: res.status, error: shortErr });
      } else {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "(No text returned)";
        console.log(`   Model [${model}]: ✅ OK (${elapsed}ms) -> "${text}"`);
        generateResults.push({ model, ok: true, status: 200, text });
      }
    } catch (err) {
      console.log(`   Model [${model}]: ❌ Error -> ${err.message}`);
      generateResults.push({ model, ok: false, error: err.message });
    }
  }

  const anyWorking = generateResults.some((r) => r.ok);
  return {
    success: anyWorking,
    account,
    generateResults,
  };
}

async function runAll() {
  const results = [];
  for (const acc of accounts) {
    const res = await testKey(acc);
    results.push(res);
  }

  console.log("\n==================================================");
  console.log("FINAL SUMMARY REPORT");
  console.log("==================================================");
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const acc = accounts[i];
    const statusSymbol = r.success ? "✅ WORKING" : "❌ FAILED";
    console.log(`[Key #${acc.index}] ${acc.label} (${acc.maskedKey}): ${statusSymbol}`);
  }
}

runAll();
