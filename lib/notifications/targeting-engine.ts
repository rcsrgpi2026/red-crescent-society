import { NOTIFICATION_CONFIG, BLOOD_COMPATIBILITY, NEARBY_DISTRICTS } from "./config";
import { checkRateLimits } from "./rate-limiter";
import type {
  CandidateUser,
  NotificationPriority,
  NotificationType,
  TargetCriteria,
  UserScoringEvaluation,
} from "./types";

/**
 * Checks if the candidate opted into this notification category.
 */
export function isCategoryAllowedByPreference(
  candidate: CandidateUser,
  type: NotificationType
): boolean {
  const prefs = candidate.preferences;
  if (!prefs) return true; // Default is opt-in

  switch (type) {
    case "notice":
      return prefs.general_notice ?? true;
    case "blood_request":
      return prefs.blood_request ?? true;
    case "emergency":
      return prefs.emergency_alert ?? true;
    case "volunteer":
      return prefs.volunteer_notification ?? true;
    case "event":
      return prefs.event_notification ?? true;
    case "system":
      return prefs.system_notification ?? true;
    default:
      return true;
  }
}

/**
 * Scores and evaluates eligibility for a single candidate user against
 * notification metadata and target criteria.
 */
export function evaluateCandidate(
  candidate: CandidateUser,
  type: NotificationType,
  priority: NotificationPriority,
  criteria: TargetCriteria = {}
): UserScoringEvaluation {
  const breakdown: Record<string, number> = {};
  let totalScore = 0;

  // 1. Hard Check: Notification Preference
  if (!isCategoryAllowedByPreference(candidate, type)) {
    return {
      candidate,
      score: 0,
      eligible: false,
      rejectionReason: `User disabled '${type}' notifications in preferences`,
      scoreBreakdown: breakdown,
    };
  }

  // 2. Hard Check: Specific User IDs filter
  if (criteria.specificUserIds && criteria.specificUserIds.length > 0) {
    if (!criteria.specificUserIds.includes(candidate.userId)) {
      return {
        candidate,
        score: 0,
        eligible: false,
        rejectionReason: "User is not in targeted user list",
        scoreBreakdown: breakdown,
      };
    }
  }

  // 3. Hard Check: Role filter
  if (criteria.roles && criteria.roles.length > 0) {
    if (!candidate.role || !criteria.roles.includes(candidate.role)) {
      return {
        candidate,
        score: 0,
        eligible: false,
        rejectionReason: `User role '${candidate.role}' does not match target roles`,
        scoreBreakdown: breakdown,
      };
    }
  }

  // 4. Hard Check: Volunteer Only filter
  if (criteria.isVolunteerOnly && !candidate.isVolunteer) {
    return {
      candidate,
      score: 0,
      eligible: false,
      rejectionReason: "Requires active volunteer status",
      scoreBreakdown: breakdown,
    };
  }

  // 5. Hard Check: RCY Department / Academic Department filter
  if (criteria.departments && criteria.departments.length > 0) {
    if (!candidate.volunteerDepartment || !criteria.departments.includes(candidate.volunteerDepartment)) {
      return {
        candidate,
        score: 0,
        eligible: false,
        rejectionReason: "User department does not match target department",
        scoreBreakdown: breakdown,
      };
    }
  }

  if (criteria.rcyDepartments && criteria.rcyDepartments.length > 0) {
    if (!candidate.volunteerRcyDepartment || !criteria.rcyDepartments.includes(candidate.volunteerRcyDepartment)) {
      return {
        candidate,
        score: 0,
        eligible: false,
        rejectionReason: "User RCY wing does not match target wing",
        scoreBreakdown: breakdown,
      };
    }
  }

  // 6. Hard Check: Donor Only & Availability filter
  if (criteria.isDonorOnly && !candidate.isDonor) {
    return {
      candidate,
      score: 0,
      eligible: false,
      rejectionReason: "User is not a registered blood donor",
      scoreBreakdown: breakdown,
    };
  }

  if (criteria.availableOnly && candidate.isDonor && candidate.donorAvailability === "UNAVAILABLE") {
    return {
      candidate,
      score: 0,
      eligible: false,
      rejectionReason: "Donor availability is marked UNAVAILABLE",
      scoreBreakdown: breakdown,
    };
  }

  // 7. Rate Limiting & Cooldown Check
  const rateLimitCheck = checkRateLimits(candidate, type, priority);
  if (!rateLimitCheck.allowed) {
    return {
      candidate,
      score: 0,
      eligible: false,
      rejectionReason: rateLimitCheck.reason,
      scoreBreakdown: breakdown,
    };
  }

  // ------------------------------------------------------------
  // SCORING ENGINE
  // ------------------------------------------------------------

  // A. Location / District Scoring
  if (criteria.districts && criteria.districts.length > 0) {
    const candidateLoc = (candidate.district || candidate.area || "").trim().toLowerCase();
    const isDirectMatch = criteria.districts.some(
      (d) => candidateLoc.includes(d.toLowerCase()) || d.toLowerCase().includes(candidateLoc)
    );

    if (isDirectMatch) {
      breakdown.same_district = NOTIFICATION_CONFIG.scoring.SAME_DISTRICT;
      totalScore += NOTIFICATION_CONFIG.scoring.SAME_DISTRICT;
    } else {
      // Check nearby district clusters
      let isNearby = false;
      for (const targetDist of criteria.districts) {
        const nearbyList = NEARBY_DISTRICTS[targetDist] ?? [];
        if (nearbyList.some((nb) => candidateLoc.includes(nb.toLowerCase()))) {
          isNearby = true;
          break;
        }
      }
      if (isNearby) {
        breakdown.nearby_district = NOTIFICATION_CONFIG.scoring.NEARBY_DISTRICT;
        totalScore += NOTIFICATION_CONFIG.scoring.NEARBY_DISTRICT;
      }
    }
  } else {
    // If no specific district criteria, grant baseline location score
    breakdown.general_audience = 20;
    totalScore += 20;
  }

  // B. Blood Group Scoring
  if (criteria.bloodGroups && criteria.bloodGroups.length > 0) {
    const candidateBg = candidate.bloodGroup?.trim().toUpperCase();
    if (candidateBg) {
      if (criteria.bloodGroups.includes(candidateBg)) {
        breakdown.exact_blood_match = NOTIFICATION_CONFIG.scoring.EXACT_BLOOD_MATCH;
        totalScore += NOTIFICATION_CONFIG.scoring.EXACT_BLOOD_MATCH;
      } else {
        // Check compatible donor match
        const isCompatible = criteria.bloodGroups.some((reqBg) => {
          const compatibleDonors = BLOOD_COMPATIBILITY[reqBg] ?? [];
          return compatibleDonors.includes(candidateBg);
        });
        if (isCompatible) {
          breakdown.compatible_blood_match = NOTIFICATION_CONFIG.scoring.COMPATIBLE_BLOOD_MATCH;
          totalScore += NOTIFICATION_CONFIG.scoring.COMPATIBLE_BLOOD_MATCH;
        }
      }
    }
  }

  // C. Donor Availability Bonus
  if (candidate.isDonor && candidate.donorAvailability === "AVAILABLE") {
    breakdown.available_donor = NOTIFICATION_CONFIG.scoring.AVAILABLE_DONOR;
    totalScore += NOTIFICATION_CONFIG.scoring.AVAILABLE_DONOR;
  }

  // D. Active Volunteer Bonus
  if (candidate.isVolunteer && candidate.volunteerStatus === "APPROVED") {
    breakdown.active_volunteer = NOTIFICATION_CONFIG.scoring.RECENTLY_ACTIVE_VOLUNTEER;
    totalScore += NOTIFICATION_CONFIG.scoring.RECENTLY_ACTIVE_VOLUNTEER;
  }

  // E. Push Token Registered Bonus
  if (candidate.pushSubscriptions && candidate.pushSubscriptions.some((s) => s.is_active)) {
    breakdown.active_push_token = NOTIFICATION_CONFIG.scoring.ACTIVE_PUSH_TOKEN;
    totalScore += NOTIFICATION_CONFIG.scoring.ACTIVE_PUSH_TOKEN;
  }

  // F. Recent Similar Notification Penalty
  if (candidate.recentSimilarNotificationsCount24h > 0) {
    breakdown.recent_similar_penalty = NOTIFICATION_CONFIG.scoring.RECENT_SIMILAR_PENALTY;
    totalScore += NOTIFICATION_CONFIG.scoring.RECENT_SIMILAR_PENALTY;
  }

  // Score threshold check (inclusive by default so all users receive alerts unless custom threshold specified)
  let minThreshold = criteria.minScoreThreshold !== undefined ? criteria.minScoreThreshold : 0;

  const finalScore = Math.max(0, totalScore);
  const eligible = finalScore >= minThreshold;

  return {
    candidate,
    score: finalScore,
    eligible,
    rejectionReason: eligible
      ? undefined
      : `Score ${finalScore} is below threshold ${minThreshold}`,
    scoreBreakdown: breakdown,
  };
}

/**
 * Filter and rank candidates for a notification.
 */
export function rankRecipients(
  candidates: CandidateUser[],
  type: NotificationType,
  priority: NotificationPriority,
  criteria: TargetCriteria = {}
): UserScoringEvaluation[] {
  const evaluations = candidates.map((c) => evaluateCandidate(c, type, priority, criteria));

  return evaluations
    .filter((e) => e.eligible)
    .sort((a, b) => b.score - a.score);
}
