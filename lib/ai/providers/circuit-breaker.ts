import { AI_CONFIG } from "../config";

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

interface HealthRecord {
  state: CircuitState;
  consecutiveFailures: number;
  lastFailureTime: number;
  lastSuccessTime: number;
  cooldownMs: number;
}

const circuits = new Map<string, HealthRecord>();
const disabledModels = new Set<string>();

/**
 * Checks whether a specific model is disabled (e.g. returned HTTP 404).
 */
export function isModelDisabled(model: string): boolean {
  return disabledModels.has(model);
}

/**
 * Marks a model as globally disabled across all accounts so it is not retried.
 */
export function disableModel(model: string, reason = "HTTP 404 / Model Unavailable") {
  if (!disabledModels.has(model)) {
    disabledModels.add(model);
    console.warn(`[AI Multi-Router] Model "${model}" disabled globally (${reason}).`);
  }
}

/**
 * Permanently disables an account (e.g. invalid API key 401 or permission denied 403).
 */
export function disableAccount(id: string, reason = "Permission Denied / Invalid API Key") {
  const record = getOrCreateRecord(id);
  record.state = "OPEN";
  record.cooldownMs = 24 * 60 * 60 * 1000; // 24 hours
  console.error(`[AI Multi-Router] Account "${id}" disabled (${reason}).`);
}

function getOrCreateRecord(id: string): HealthRecord {
  let record = circuits.get(id);
  if (!record) {
    record = {
      state: "CLOSED",
      consecutiveFailures: 0,
      lastFailureTime: 0,
      lastSuccessTime: 0,
      cooldownMs: AI_CONFIG.circuitBreaker.cooldownMs,
    };
    circuits.set(id, record);
  }
  return record;
}

/**
 * Checks whether a specific account/key is available.
 */
export function isAccountAvailable(id: string): boolean {
  const record = getOrCreateRecord(id);
  const now = Date.now();

  if (record.state === "CLOSED") {
    return true;
  }

  if (record.state === "OPEN") {
    // If cooldown has elapsed, move to HALF_OPEN to attempt a canary request
    if (now - record.lastFailureTime >= record.cooldownMs) {
      record.state = "HALF_OPEN";
      console.log(`[CircuitBreaker] "${id}" cooldown elapsed. State -> HALF_OPEN (Canary retry)`);
      return true;
    }
    return false;
  }

  if (record.state === "HALF_OPEN") {
    return true;
  }

  return true;
}

/**
 * Records a successful response for an account.
 */
export function recordAccountSuccess(id: string) {
  const record = getOrCreateRecord(id);
  record.consecutiveFailures = 0;
  record.lastSuccessTime = Date.now();
  if (record.state !== "CLOSED") {
    record.state = "CLOSED";
    console.log(`[CircuitBreaker] "${id}" recovered successfully. State -> CLOSED`);
  }
}

/**
 * Records a general failure or timeout for an account.
 */
export function recordAccountFailure(id: string, errorMessage?: string) {
  const record = getOrCreateRecord(id);
  record.consecutiveFailures += 1;
  record.lastFailureTime = Date.now();

  console.warn(
    `[CircuitBreaker] "${id}" error (${record.consecutiveFailures}/${AI_CONFIG.circuitBreaker.failureThreshold}): ${
      errorMessage || "Unknown error"
    }`
  );

  if (
    record.consecutiveFailures >= AI_CONFIG.circuitBreaker.failureThreshold ||
    record.state === "HALF_OPEN"
  ) {
    record.state = "OPEN";
    record.cooldownMs = AI_CONFIG.circuitBreaker.cooldownMs;
    console.warn(
      `[CircuitBreaker] "${id}" tripped. State -> OPEN (Cooldown ${
        record.cooldownMs / 1000
      }s)`
    );
  }
}

/**
 * Instantly puts an account in cooldown upon HTTP 429 (Rate Limit / Quota Exhausted)
 * to avoid wasting latency on subsequent requests until the quota resets.
 */
export function recordAccountQuotaExhausted(id: string, customCooldownMs = 60000) {
  const record = getOrCreateRecord(id);
  record.consecutiveFailures += 1;
  record.lastFailureTime = Date.now();
  record.state = "OPEN";
  record.cooldownMs = customCooldownMs;
  console.warn(
    `[CircuitBreaker] "${id}" reached Quota/Rate Limit (HTTP 429). Marked OPEN for ${
      customCooldownMs / 1000
    }s. Immediate failover triggered!`
  );
}

/**
 * Legacy aliases for backwards compatibility
 */
export function isProviderAvailable(provider: string): boolean {
  return isAccountAvailable(provider);
}

export function recordProviderSuccess(provider: string) {
  recordAccountSuccess(provider);
}

export function recordProviderFailure(provider: string, errorMessage?: string) {
  recordAccountFailure(provider, errorMessage);
}

export function resetProviderCircuit(id: string) {
  circuits.delete(id);
}
