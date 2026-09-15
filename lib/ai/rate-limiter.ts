import { AI_CONFIG } from "./config";
import { createAdminClient } from "../supabase/admin";

interface ClientUsageRecord {
  burstTimestamps: number[];
  dayKey: string;
  dailyCount: number;
}

// In-memory sliding window cache for rate limiting
const usageStore = new Map<string, ClientUsageRecord>();

// Cleanup stale records periodically (every 5 minutes)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    const currentDayKey = new Date().toISOString().slice(0, 10);
    for (const [key, record] of usageStore.entries()) {
      const lastBurst = record.burstTimestamps[record.burstTimestamps.length - 1] || 0;
      if (record.dayKey !== currentDayKey && now - lastBurst > 600000) {
        usageStore.delete(key);
      }
    }
  }, 300000).unref?.();
}

export interface RateLimitCheckResult {
  allowed: boolean;
  reason?: string;
  remainingDaily?: number;
  retryAfterSeconds?: number;
}

/**
 * Atomically increments durable daily count in Supabase if available.
 * Returns null if Supabase is unreachable or not configured.
 */
async function incrementDurableDailyCount(clientId: string, dayKey: string): Promise<number | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("increment_ai_rate_limit", {
      p_client_id: clientId,
      p_day_key: dayKey,
    });
    if (!error && typeof data === "number") {
      return data;
    }
  } catch {
    // Fallback silently to in-memory
  }
  return null;
}

/**
 * Checks and records rate limits for an AI assistant client.
 *
 * 1. Short burst check (10s): High-speed in-memory sliding window.
 * 2. Daily limits (10/day anon, 30/day auth): Persisted in Supabase to survive
 *    serverless cold starts, with automatic in-memory fallback if Supabase is unavailable.
 */
export async function checkAiRateLimit(
  clientId: string,
  isAuthenticated = false
): Promise<RateLimitCheckResult> {
  if (!AI_CONFIG.rateLimits.enabled) {
    return { allowed: true };
  }

  const now = Date.now();
  const currentDayKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const burstWindowMs = AI_CONFIG.rateLimits.burstWindowSeconds * 1000;
  const dailyLimit = isAuthenticated
    ? AI_CONFIG.rateLimits.authDailyLimit
    : AI_CONFIG.rateLimits.anonDailyLimit;

  let record = usageStore.get(clientId);
  if (!record) {
    record = {
      burstTimestamps: [],
      dayKey: currentDayKey,
      dailyCount: 0,
    };
    usageStore.set(clientId, record);
  }

  // Reset in-memory daily count if day rolled over
  if (record.dayKey !== currentDayKey) {
    record.dayKey = currentDayKey;
    record.dailyCount = 0;
  }

  // 1. Check Short Burst Limit (e.g. max 2 requests in 10 seconds)
  record.burstTimestamps = record.burstTimestamps.filter((ts) => now - ts < burstWindowMs);

  if (record.burstTimestamps.length >= AI_CONFIG.rateLimits.burstLimit) {
    const oldestTimestamp = record.burstTimestamps[0];
    const waitSeconds = Math.ceil((burstWindowMs - (now - oldestTimestamp)) / 1000);
    return {
      allowed: false,
      reason: `অনুগ্রহ করে ${Math.max(waitSeconds, 1)} সেকেন্ড অপেক্ষা করুন। অতি দ্রুত পরপর প্রশ্ন পাঠানো সাময়িকভাবে সীমিত করা হয়েছে।`,
      retryAfterSeconds: Math.max(waitSeconds, 1),
    };
  }

  // 2. Check Daily Limit (Durable with Supabase + In-Memory Fallback)
  let currentDailyCount = record.dailyCount + 1;

  // Try durable increment in Supabase
  const durableCount = await incrementDurableDailyCount(clientId, currentDayKey);
  if (durableCount !== null) {
    currentDailyCount = durableCount;
  }

  if (currentDailyCount > dailyLimit) {
    return {
      allowed: false,
      reason: isAuthenticated
        ? `আজকের জন্য আপনার দৈনিক AI প্রশ্ন করার সীমা (${dailyLimit}টি) পূর্ণ হয়েছে। আগামীকাল পুনরায় প্রশ্ন করতে পারবেন।`
        : `আজকের জন্য অতিথি ব্যবহারকারী হিসেবে আপনার দৈনিক সীমা (${dailyLimit}টি) পূর্ণ হয়েছে। আরও ব্যবহারের জন্য শিক্ষার্থী বা স্বেচ্ছাসেবক অ্যাকাউন্টে লগইন করুন।`,
      remainingDaily: 0,
    };
  }

  // Record valid invocation in local memory
  record.burstTimestamps.push(now);
  record.dailyCount = currentDailyCount;

  return {
    allowed: true,
    remainingDaily: Math.max(0, dailyLimit - currentDailyCount),
  };
}

/**
 * Synchronous version for tests or non-async callers.
 */
export function checkAiRateLimitSync(
  clientId: string,
  isAuthenticated = false
): RateLimitCheckResult {
  if (!AI_CONFIG.rateLimits.enabled) {
    return { allowed: true };
  }

  const now = Date.now();
  const currentDayKey = new Date().toISOString().slice(0, 10);
  const burstWindowMs = AI_CONFIG.rateLimits.burstWindowSeconds * 1000;
  const dailyLimit = isAuthenticated
    ? AI_CONFIG.rateLimits.authDailyLimit
    : AI_CONFIG.rateLimits.anonDailyLimit;

  let record = usageStore.get(clientId);
  if (!record) {
    record = {
      burstTimestamps: [],
      dayKey: currentDayKey,
      dailyCount: 0,
    };
    usageStore.set(clientId, record);
  }

  if (record.dayKey !== currentDayKey) {
    record.dayKey = currentDayKey;
    record.dailyCount = 0;
  }

  record.burstTimestamps = record.burstTimestamps.filter((ts) => now - ts < burstWindowMs);

  if (record.burstTimestamps.length >= AI_CONFIG.rateLimits.burstLimit) {
    const oldestTimestamp = record.burstTimestamps[0];
    const waitSeconds = Math.ceil((burstWindowMs - (now - oldestTimestamp)) / 1000);
    return {
      allowed: false,
      reason: `অনুগ্রহ করে ${Math.max(waitSeconds, 1)} সেকেন্ড অপেক্ষা করুন। অতি দ্রুত পরপর প্রশ্ন পাঠানো সাময়িকভাবে সীমিত করা হয়েছে।`,
      retryAfterSeconds: Math.max(waitSeconds, 1),
    };
  }

  if (record.dailyCount >= dailyLimit) {
    return {
      allowed: false,
      reason: isAuthenticated
        ? `আজকের জন্য আপনার দৈনিক AI প্রশ্ন করার সীমা (${dailyLimit}টি) পূর্ণ হয়েছে। আগামীকাল পুনরায় প্রশ্ন করতে পারবেন।`
        : `আজকের জন্য অতিথি ব্যবহারকারী হিসেবে আপনার দৈনিক সীমা (${dailyLimit}টি) পূর্ণ হয়েছে। আরও ব্যবহারের জন্য শিক্ষার্থী বা স্বেচ্ছাসেবক অ্যাকাউন্টে লগইন করুন।`,
      remainingDaily: 0,
    };
  }

  record.burstTimestamps.push(now);
  record.dailyCount += 1;

  return {
    allowed: true,
    remainingDaily: Math.max(0, dailyLimit - record.dailyCount),
  };
}

/**
 * Resets a client's usage (useful for automated testing)
 */
export function resetClientAiUsage(clientId: string) {
  usageStore.delete(clientId);
}
