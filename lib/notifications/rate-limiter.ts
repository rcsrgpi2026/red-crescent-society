import { NOTIFICATION_CONFIG } from "./config";
import type { CandidateUser, NotificationPriority, NotificationType } from "./types";

export interface RateLimitCheckResult {
  allowed: boolean;
  reason?: string;
  isBypassedByCritical?: boolean;
}

/**
 * Evaluates candidate user rate limits and cooldowns.
 * CRITICAL priority bypasses normal rate limits.
 */
export function checkRateLimits(
  candidate: CandidateUser,
  type: NotificationType,
  priority: NotificationPriority
): RateLimitCheckResult {
  // If rate limiting is disabled (e.g. during testing/development), allow all
  if (!NOTIFICATION_CONFIG.rateLimits.ENABLED) {
    return { allowed: true };
  }

  // CRITICAL and HIGH priority alerts (and Admin notifications) bypass normal rate limits
  if (
    priority === "critical" ||
    priority === "high" ||
    ((candidate.role === "SUPER_ADMIN" || candidate.role === "ADMIN") && type === "system")
  ) {
    return { allowed: true, isBypassedByCritical: true };
  }

  // 1. Cooldown check for similar notifications (within 30 mins)
  if (candidate.lastNotificationSentAt) {
    const lastSent = new Date(candidate.lastNotificationSentAt).getTime();
    const diffMinutes = (Date.now() - lastSent) / (1000 * 60);

    if (
      diffMinutes < NOTIFICATION_CONFIG.rateLimits.COOLDOWN_MINUTES_SIMILAR &&
      candidate.recentSimilarNotificationsCount24h > 0
    ) {
      return {
        allowed: false,
        reason: `Similar notification cooldown active (${Math.round(
          NOTIFICATION_CONFIG.rateLimits.COOLDOWN_MINUTES_SIMILAR - diffMinutes
        )}m remaining)`,
      };
    }
  }

  // 3. Daily rate limits
  if (type === "blood_request") {
    if (candidate.recentSimilarNotificationsCount24h >= NOTIFICATION_CONFIG.rateLimits.MAX_BLOOD_REQUESTS_PER_DAY) {
      return {
        allowed: false,
        reason: `Daily blood request notification limit reached (${NOTIFICATION_CONFIG.rateLimits.MAX_BLOOD_REQUESTS_PER_DAY}/day)`,
      };
    }
  }

  if (candidate.recentNotificationsCount24h >= NOTIFICATION_CONFIG.rateLimits.MAX_NORMAL_PER_DAY) {
    return {
      allowed: false,
      reason: `Daily notification limit reached (${NOTIFICATION_CONFIG.rateLimits.MAX_NORMAL_PER_DAY}/day)`,
    };
  }

  return { allowed: true };
}
