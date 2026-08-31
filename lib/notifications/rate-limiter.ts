import { NOTIFICATION_CONFIG } from "./config";
import type { CandidateUser, NotificationPriority, NotificationType } from "./types";

export interface RateLimitCheckResult {
  allowed: boolean;
  reason?: string;
  isBypassedByCritical?: boolean;
}

/**
 * Checks if the current time falls within the user's quiet hours.
 * Time formats are "HH:mm" in 24h format (e.g. "22:00" to "07:00").
 */
export function isInQuietHours(
  startStr: string = NOTIFICATION_CONFIG.defaultQuietHours.start,
  endStr: string = NOTIFICATION_CONFIG.defaultQuietHours.end,
  now: Date = new Date()
): boolean {
  try {
    const [startH, startM] = startStr.split(":").map(Number);
    const [endH, endM] = endStr.split(":").map(Number);

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = startH * 60 + (startM || 0);
    const endMinutes = endH * 60 + (endM || 0);

    if (startMinutes <= endMinutes) {
      // Normal range e.g. 01:00 to 06:00
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    } else {
      // Overnight range e.g. 22:00 to 07:00
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }
  } catch {
    return false;
  }
}

/**
 * Evaluates candidate user rate limits, cooldowns, and quiet hours.
 * CRITICAL priority bypasses normal rate limits and quiet hours.
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

  // CRITICAL alerts bypass normal rate limits and quiet hours
  if (priority === "critical") {
    return { allowed: true, isBypassedByCritical: true };
  }

  const prefs = candidate.preferences;

  // 1. Quiet Hours check
  if (prefs?.quiet_hours_enabled) {
    const inQuiet = isInQuietHours(prefs.quiet_hours_start, prefs.quiet_hours_end);
    if (inQuiet) {
      return {
        allowed: false,
        reason: `User is in quiet hours (${prefs.quiet_hours_start} - ${prefs.quiet_hours_end})`,
      };
    }
  }

  // 2. Cooldown check for similar notifications (within 30 mins)
  if (candidate.lastNotificationSentAt) {
    const lastSent = new Date(candidate.lastNotificationSentAt).getTime();
    const diffMinutes = (Date.now() - lastSent) / (1000 * 60);

    if (
      diffMinutes < NOTIFICATION_CONFIG.rateLimits.COOLDOWN_MINUTES_SIMILAR &&
      candidate.recentSimilarNotificationsCount24h > 0
    ) {
      // HIGH priority can bypass 30-min cooldown if not exceeding daily limit
      if (priority !== "high") {
        return {
          allowed: false,
          reason: `Similar notification cooldown active (${Math.round(
            NOTIFICATION_CONFIG.rateLimits.COOLDOWN_MINUTES_SIMILAR - diffMinutes
          )}m remaining)`,
        };
      }
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
    if (priority !== "high") {
      return {
        allowed: false,
        reason: `Daily notification limit reached (${NOTIFICATION_CONFIG.rateLimits.MAX_NORMAL_PER_DAY}/day)`,
      };
    }
  }

  return { allowed: true };
}
