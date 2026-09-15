/**
 * Centralized Configuration for RCY AI Website Assistant
 */

const rawGeminiKeys = (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "")
  .split(",")
  .map((k) => k.trim())
  .filter(Boolean);

const rawGroqKeys = (process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY || "")
  .split(",")
  .map((k) => k.trim())
  .filter(Boolean);

export const AI_CONFIG = {
  // Provider API Keys (Server-side only — never expose to client!)
  geminiApiKey: rawGeminiKeys[0] || "",
  geminiApiKeys: rawGeminiKeys,
  groqApiKey: rawGroqKeys[0] || "",
  groqApiKeys: rawGroqKeys,

  // Models
  geminiModel: process.env.GEMINI_MODEL || "gemini-3.5-flash",
  groqModel: process.env.GROQ_MODEL || "openai/gpt-oss-120b",

  // Model Cascading Fallback Chains
  geminiCandidateModels: [
    process.env.GEMINI_MODEL || "gemini-3.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-2.0-flash-lite",
    "gemini-3.5-flash-lite",
  ],
  groqCandidateModels: [
    process.env.GROQ_MODEL || "openai/gpt-oss-120b",
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant", // 14,400 RPD ultra-capacity fallback
    "openai/gpt-oss-20b",
  ],

  // Request limits
  maxMessageLength: 2500, // Reject prompts exceeding ~2500 characters
  maxHistoryTurns: 6, // Keep recent 6 conversation turns for context

  // Timeouts (Milliseconds) — Reduced to 7s for ultra-fast failovers
  providerTimeoutMs: 7000,
  totalRequestTimeoutMs: 20000,

  // Response Caching (Multiplies effective RPD by 3x-5x)
  cache: {
    enabled: process.env.AI_CACHE_ENABLED !== "false",
    ttlMs: 2 * 60 * 60 * 1000, // 2 hours
    maxEntries: 500,
  },

  // Rate Limiting
  rateLimits: {
    enabled: process.env.AI_RATE_LIMIT_ENABLED !== "false",
    burstLimit: 2, // Max 2 requests per 10 seconds
    burstWindowSeconds: 10,
    anonDailyLimit: 10, // Max 10 requests per day for anonymous visitors
    authDailyLimit: 30, // Max 30 requests per day for logged-in users
  },

  // Circuit Breaker
  circuitBreaker: {
    failureThreshold: 3, // Trip breaker after 3 consecutive failures
    cooldownMs: 60000, // 60 seconds cooldown before retrying primary provider
  },
};
