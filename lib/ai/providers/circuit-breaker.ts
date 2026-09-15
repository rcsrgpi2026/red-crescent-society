import { AI_CONFIG } from "../config";

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

interface ProviderHealth {
  state: CircuitState;
  consecutiveFailures: number;
  lastFailureTime: number;
  lastSuccessTime: number;
}

const providerCircuits = new Map<string, ProviderHealth>();

function getOrCreateCircuit(provider: string): ProviderHealth {
  let circuit = providerCircuits.get(provider);
  if (!circuit) {
    circuit = {
      state: "CLOSED",
      consecutiveFailures: 0,
      lastFailureTime: 0,
      lastSuccessTime: 0,
    };
    providerCircuits.set(provider, circuit);
  }
  return circuit;
}

/**
 * Checks whether a given AI provider is available according to the circuit breaker.
 */
export function isProviderAvailable(provider: string): boolean {
  const circuit = getOrCreateCircuit(provider);
  const now = Date.now();

  if (circuit.state === "CLOSED") {
    return true;
  }

  if (circuit.state === "OPEN") {
    // If cooldown has elapsed, move to HALF_OPEN to attempt a canary request
    if (now - circuit.lastFailureTime >= AI_CONFIG.circuitBreaker.cooldownMs) {
      circuit.state = "HALF_OPEN";
      console.log(`[CircuitBreaker] Provider "${provider}" cooldown elapsed. State -> HALF_OPEN`);
      return true;
    }
    return false;
  }

  if (circuit.state === "HALF_OPEN") {
    return true;
  }

  return true;
}

/**
 * Records a successful response from an AI provider.
 */
export function recordProviderSuccess(provider: string) {
  const circuit = getOrCreateCircuit(provider);
  circuit.consecutiveFailures = 0;
  circuit.lastSuccessTime = Date.now();
  if (circuit.state !== "CLOSED") {
    circuit.state = "CLOSED";
    console.log(`[CircuitBreaker] Provider "${provider}" recovered. State -> CLOSED`);
  }
}

/**
 * Records a failure or timeout from an AI provider.
 */
export function recordProviderFailure(provider: string, errorMessage?: string) {
  const circuit = getOrCreateCircuit(provider);
  circuit.consecutiveFailures += 1;
  circuit.lastFailureTime = Date.now();

  console.warn(
    `[CircuitBreaker] Provider "${provider}" failure #${circuit.consecutiveFailures}: ${
      errorMessage || "Unknown error"
    }`
  );

  if (
    circuit.consecutiveFailures >= AI_CONFIG.circuitBreaker.failureThreshold ||
    circuit.state === "HALF_OPEN"
  ) {
    circuit.state = "OPEN";
    console.warn(
      `[CircuitBreaker] Provider "${provider}" tripped. State -> OPEN (Cooldown ${
        AI_CONFIG.circuitBreaker.cooldownMs / 1000
      }s)`
    );
  }
}

/**
 * Resets a provider circuit (useful for tests)
 */
export function resetProviderCircuit(provider: string) {
  providerCircuits.delete(provider);
}
