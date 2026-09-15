import { AI_CONFIG } from "./config";
import type { AssistantResponse } from "./types";

interface CacheItem {
  response: AssistantResponse;
  expiresAt: number;
}

// In-memory response cache
const responseStore = new Map<string, CacheItem>();

/**
 * Normalizes user queries for robust cache key matching.
 * Collapses whitespace, lowercases, and removes trailing punctuation.
 */
export function normalizeQueryForCache(query: string): string {
  if (!query) return "";
  return query
    .toLowerCase()
    .trim()
    .replace(/[?!।,.\-_/\\()[\]{}'"`]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Retrieves a cached AI response if available and not expired.
 */
export function getCachedResponse(query: string): AssistantResponse | null {
  if (!AI_CONFIG.cache.enabled) return null;

  const key = normalizeQueryForCache(query);
  if (!key || key.length < 3) return null;

  const item = responseStore.get(key);
  if (!item) return null;

  const now = Date.now();
  if (now > item.expiresAt) {
    responseStore.delete(key);
    return null;
  }

  // Return a cloned response marked as cached
  return {
    ...item.response,
    sourceType: "database", // Safe deterministic source
  };
}

/**
 * Stores an AI response in memory for future fast lookups.
 */
export function setCachedResponse(query: string, response: AssistantResponse): void {
  if (!AI_CONFIG.cache.enabled) return;

  // Don't cache errors, fallbacks, or emergency answers
  if (response.sourceType === "fallback" || response.intent === "EMERGENCY") {
    return;
  }

  const key = normalizeQueryForCache(query);
  if (!key || key.length < 3) return;

  // Prevent memory bloat
  if (responseStore.size >= AI_CONFIG.cache.maxEntries) {
    const oldestKey = responseStore.keys().next().value;
    if (oldestKey) responseStore.delete(oldestKey);
  }

  responseStore.set(key, {
    response,
    expiresAt: Date.now() + AI_CONFIG.cache.ttlMs,
  });
}

/**
 * Clears the cache (useful in tests)
 */
export function clearResponseCache(): void {
  responseStore.clear();
}
