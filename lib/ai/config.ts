/**
 * Centralized Configuration for RCY AI Website Assistant
 */

export const AI_CONFIG = {
  // Provider API Keys (Server-side only — never expose to client!)
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  groqApiKey: process.env.GROQ_API_KEY || "",

  // Models
  geminiModel: process.env.GEMINI_MODEL || "gemini-3.5-flash",
  groqModel: process.env.GROQ_MODEL || "openai/gpt-oss-120b",

  // Request limits
  maxMessageLength: 2500, // Reject prompts exceeding ~2500 characters
  maxHistoryTurns: 6, // Keep recent 6 conversation turns for context

  // Timeouts (Milliseconds)
  providerTimeoutMs: 15000, // 15 seconds max per LLM attempt (provides network resilience)
  totalRequestTimeoutMs: 30000,

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
