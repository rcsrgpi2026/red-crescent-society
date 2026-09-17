/**
 * Centralized Configuration for RCY AI Website Assistant
 */

export interface ApiAccount {
  id: string; // e.g. "gemini:1", "gemini:2"
  label: string; // e.g. "Gemini Account #1 (Primary)", "Gemini Account #2 (Secondary)"
  key: string;
  provider: "gemini" | "groq";
}

function collectAccounts(
  provider: "gemini" | "groq",
  envVarNames: string[]
): ApiAccount[] {
  const accounts: ApiAccount[] = [];
  const seenKeys = new Set<string>();

  for (const envName of envVarNames) {
    const rawVal = process.env[envName];
    if (!rawVal) continue;

    // Support comma-separated or single keys
    const tokens = rawVal.split(",").map((t) => t.trim()).filter(Boolean);
    for (const token of tokens) {
      if (!seenKeys.has(token)) {
        seenKeys.add(token);
        const idx = accounts.length + 1;
        accounts.push({
          id: `${provider}:${idx}`,
          label: `${provider === "gemini" ? "Gemini" : "Groq"} Account #${idx}${
            idx === 1 ? " (Primary)" : idx === 2 ? " (Secondary)" : ""
          }`,
          key: token,
          provider,
        });
      }
    }
  }

  return accounts;
}

const geminiAccounts = collectAccounts("gemini", [
  "GEMINI_API_KEY",
  "GEMINI_API_KEY_1",
  "GEMINI_API_KEY_2",
  "GEMINI_API_KEY_3",
  "GEMINI_API_KEYS",
  "GOOGLE_API_KEY",
  "GOOGLE_API_KEY_2",
]);

const groqAccounts = collectAccounts("groq", [
  "GROQ_API_KEY",
  "GROQ_API_KEY_1",
  "GROQ_API_KEY_2",
  "GROQ_API_KEY_3",
  "GROQ_API_KEYS",
]);

export const AI_CONFIG = {
  // Provider API Accounts & Keys (Server-side only — never expose to client!)
  geminiAccounts,
  geminiApiKeys: geminiAccounts.map((a) => a.key),
  geminiApiKey: geminiAccounts[0]?.key || "",

  groqAccounts,
  groqApiKeys: groqAccounts.map((a) => a.key),
  groqApiKey: groqAccounts[0]?.key || "",

  // Provider Priority ('gemini' | 'groq') - Gemini is set as primary
  primaryProvider: (process.env.AI_PRIMARY_PROVIDER as "gemini" | "groq") || "gemini",

  // Models
  geminiModel: process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",
  groqModel: process.env.GROQ_MODEL || "openai/gpt-oss-120b",

  // Model Cascading Fallback Chains - Valid, currently active models only
  geminiCandidateModels: [
    process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-flash-lite-latest",
  ],
  groqCandidateModels: [
    process.env.GROQ_MODEL || "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
  ],

  // Request limits
  maxMessageLength: 2500, // Reject prompts exceeding ~2500 characters
  maxHistoryTurns: 6, // Keep recent 6 conversation turns for context

  // Timeouts (Milliseconds) — 7s per attempt to prevent premature aborts while keeping system snappy
  providerTimeoutMs: 7000,
  totalRequestTimeoutMs: 14000,

  // Response Caching (Multiplies effective RPD by 3x-5x)
  cache: {
    enabled: process.env.AI_CACHE_ENABLED !== "false",
    ttlMs: 2 * 60 * 60 * 1000, // 2 hours
    maxEntries: 500,
  },

  // Rate Limiting
  rateLimits: {
    enabled: process.env.AI_RATE_LIMIT_ENABLED !== "false",
    burstLimit: Number(process.env.AI_BURST_LIMIT) || 4, // Max 4 requests per 10 seconds
    burstWindowSeconds: 10,
    anonDailyLimit: Number(process.env.AI_ANON_DAILY_LIMIT) || 20, // Max 20 requests per day for anonymous visitors
    authDailyLimit: Number(process.env.AI_AUTH_DAILY_LIMIT) || 50, // Max 50 requests per day for logged-in users
  },

  // Circuit Breaker
  circuitBreaker: {
    failureThreshold: 3, // Trip breaker after 3 consecutive failures
    cooldownMs: 60000, // 60 seconds cooldown before retrying primary provider
  },
};
