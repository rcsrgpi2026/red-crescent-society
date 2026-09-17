import { AI_CONFIG } from "../config";
import type { AssistantResponse } from "../types";
import type { ProviderCallParams, ProviderResult } from "./gemini";
import {
  isAccountAvailable,
  recordAccountSuccess,
  recordAccountFailure,
  recordAccountQuotaExhausted,
  isModelDisabled,
  disableModel,
  disableAccount,
} from "./circuit-breaker";

/**
 * Executes a structured query to Groq with multi-account cascading failover.
 * (Groq Account 1 -> if 429 or error -> Groq Account 2)
 */
export async function callGroqProvider({
  systemPrompt,
  userMessage,
  contextData,
  history = [],
}: ProviderCallParams): Promise<ProviderResult> {
  const accounts = AI_CONFIG.groqAccounts;

  if (accounts.length === 0) {
    return {
      success: false,
      error: "No Groq API keys configured (set GROQ_API_KEY, GROQ_API_KEY_2, or GROQ_API_KEYS).",
    };
  }

  // Filter accounts that are active (not in circuit breaker cooldown)
  const availableAccounts = accounts.filter((acc) => isAccountAvailable(acc.id));
  const accountsToTry = availableAccounts.length > 0 ? availableAccounts : accounts;

  const endpoint = "https://api.groq.com/openai/v1/chat/completions";

  const messages: Array<{ role: string; content: string }> = [
    { role: "system", content: systemPrompt },
  ];

  // Add conversation history
  for (const turn of history.slice(-AI_CONFIG.maxHistoryTurns)) {
    messages.push({
      role: turn.role,
      content: turn.content,
    });
  }

  // Add current turn
  const userContent = contextData
    ? `${contextData}\n\n[USER INQUIRY]: ${userMessage}`
    : userMessage;

  messages.push({
    role: "user",
    content: userContent,
  });

  const configuredModels = (
    AI_CONFIG.groqCandidateModels && AI_CONFIG.groqCandidateModels.length > 0
      ? AI_CONFIG.groqCandidateModels
      : [AI_CONFIG.groqModel, "openai/gpt-oss-120b", "openai/gpt-oss-20b"]
  ).filter((m, i, arr) => arr.indexOf(m) === i);

  const candidateModels = configuredModels.filter((m) => !isModelDisabled(m));

  if (candidateModels.length === 0) {
    return {
      success: false,
      error: "All configured Groq models are disabled.",
    };
  }

  let lastError = "";

  // 1. Cascade across configured Groq Accounts (Groq Account 1 -> Groq Account 2)
  for (let accIdx = 0; accIdx < accountsToTry.length; accIdx++) {
    const currentAccount = accountsToTry[accIdx];
    const accountId = currentAccount.id;
    const accountLabel = currentAccount.label;

    if (!isAccountAvailable(accountId) && availableAccounts.length > 0) {
      console.log(`[AI Multi-Router] Skipping ${accountLabel} (Circuit in Cooldown)...`);
      continue;
    }

    let accountHitQuota = false;
    let accountDisabled = false;
    let validModelAttempted = false;

    // 2. Cascade across candidate models for this account
    for (let modelIdx = 0; modelIdx < candidateModels.length; modelIdx++) {
      const currentModel = candidateModels[modelIdx];
      if (isModelDisabled(currentModel)) continue;

      const reason = modelIdx === 0 && accIdx === 0 ? "primary" : "fallback-model";
      console.log(
        `[AI Multi-Router] Provider=Groq Account=${accIdx + 1} Model=${currentModel} Reason=${reason}`
      );

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), AI_CONFIG.providerTimeoutMs);

      try {
        validModelAttempted = true;
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentAccount.key}`,
          },
          body: JSON.stringify({
            model: currentModel,
            messages,
            temperature: 0.2,
            max_tokens: 1000,
            response_format: { type: "json_object" },
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text().catch(() => "");
          lastError = `Groq [${currentModel} | ${accountLabel}] HTTP ${response.status}: ${errorText.slice(0, 180)}`;

          // Model not found (404): disable model globally, try next candidate model
          if (response.status === 404) {
            console.warn(
              `[AI Multi-Router] Groq Account #${accIdx + 1} Model=${currentModel} Error=404 Action=disable-model`
            );
            disableModel(currentModel, errorText.slice(0, 100));
            continue;
          }

          // Unauthorized or forbidden (401/403): permanently disable account
          if (response.status === 401 || response.status === 403) {
            console.error(
              `[AI Multi-Router] Groq Account #${accIdx + 1} Error=${response.status} Action=disable-account`
            );
            disableAccount(accountId, `HTTP ${response.status}: Access Denied / Invalid Key`);
            accountDisabled = true;
            break;
          }

          // Quota / Rate limit (429): Mark account quota-exhausted and failover to next Groq account immediately!
          if (response.status === 429) {
            console.warn(
              `[AI Multi-Router] Groq Account #${accIdx + 1} Model=${currentModel} Error=429 (Quota Limit) Action=cooldown-account`
            );
            recordAccountQuotaExhausted(accountId, 60000);
            accountHitQuota = true;
            break;
          }

          console.warn(
            `[AI Multi-Router] Groq Account #${accIdx + 1} Model=${currentModel} Error=${response.status} Action=try-next-model`
          );
          continue;
        }

        const json = await response.json();
        const rawText = json?.choices?.[0]?.message?.content;

        if (!rawText) {
          lastError = `Empty response from Groq [${currentModel} on ${accountLabel}].`;
          console.warn(
            `[AI Multi-Router] Groq Account #${accIdx + 1} Model=${currentModel} Error=EmptyResponse Action=try-next-model`
          );
          continue;
        }

        const parsed = parseStructuredOutput(rawText);
        recordAccountSuccess(accountId);
        console.log(
          `[AI Multi-Router] SUCCESS Provider=Groq Account=${accIdx + 1} Model=${currentModel}`
        );
        return {
          success: true,
          data: parsed,
        };
      } catch (err: any) {
        clearTimeout(timeoutId);
        const isAbort = err.name === "AbortError";
        const errDesc = isAbort ? `Timeout after ${AI_CONFIG.providerTimeoutMs}ms` : (err.message || "Unknown Groq error");
        lastError = `Groq [${currentModel} | ${accountLabel}]: ${errDesc}`;
        console.warn(
          `[AI Multi-Router] Groq Account #${accIdx + 1} Model=${currentModel} Error=${errDesc} Action=try-next-model`
        );

        if (isAbort) break;
      }
    }

    if (!accountHitQuota && !accountDisabled && validModelAttempted) {
      recordAccountFailure(accountId, lastError);
    }
  }

  return { success: false, error: lastError || "Failed all configured Groq accounts and models." };
}


function parseStructuredOutput(text: string): AssistantResponse {
  try {
    const cleaned = text.trim();
    const jsonStr = cleaned.startsWith("```")
      ? cleaned.replace(/^```json\s*/i, "").replace(/```$/, "").trim()
      : cleaned;

    const obj = JSON.parse(jsonStr);
    return {
      message: typeof obj.message === "string" ? obj.message : cleaned,
      actions: Array.isArray(obj.actions)
        ? obj.actions.filter(
            (a: any) => typeof a === "object" && typeof a.label === "string" && typeof a.type === "string"
          )
        : undefined,
      sourceType: obj.sourceType || "mixed",
    };
  } catch {
    return {
      message: text,
      sourceType: "mixed",
    };
  }
}
