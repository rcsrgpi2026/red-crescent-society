import { AI_CONFIG } from "../config";
import type { AssistantResponse } from "../types";
import {
  isAccountAvailable,
  recordAccountSuccess,
  recordAccountFailure,
  recordAccountQuotaExhausted,
  isModelDisabled,
  disableModel,
  disableAccount,
} from "./circuit-breaker";

export interface ProviderCallParams {
  systemPrompt: string;
  userMessage: string;
  contextData?: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
}

export interface ProviderResult {
  success: boolean;
  data?: AssistantResponse;
  error?: string;
}

/**
 * Executes a structured query to Google Gemini with multi-account cascading failover.
 * (Account 1 -> if 429/403/error -> Account 2 -> ... )
 */
export async function callGeminiProvider({
  systemPrompt,
  userMessage,
  contextData,
  history = [],
}: ProviderCallParams): Promise<ProviderResult> {
  const accounts = AI_CONFIG.geminiAccounts;

  if (accounts.length === 0) {
    return {
      success: false,
      error: "No Gemini API keys configured (set GEMINI_API_KEY, GEMINI_API_KEY_2, or GEMINI_API_KEYS).",
    };
  }

  // Filter accounts that are active (not in circuit breaker cooldown)
  const availableAccounts = accounts.filter((acc) => isAccountAvailable(acc.id));
  const accountsToTry = availableAccounts.length > 0 ? availableAccounts : accounts;

  // Assemble contents
  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

  // Add conversation history
  for (const turn of history.slice(-AI_CONFIG.maxHistoryTurns)) {
    contents.push({
      role: turn.role === "assistant" ? "model" : "user",
      parts: [{ text: turn.content }],
    });
  }

  // Add current turn with context
  const currentTurnText = contextData
    ? `${contextData}\n\n[USER INQUIRY]: ${userMessage}`
    : userMessage;

  contents.push({
    role: "user",
    parts: [{ text: currentTurnText }],
  });

  // Filter candidate models (excluding any models that returned 404)
  const configuredModels = (
    AI_CONFIG.geminiCandidateModels && AI_CONFIG.geminiCandidateModels.length > 0
      ? AI_CONFIG.geminiCandidateModels
      : [AI_CONFIG.geminiModel, "gemini-3.5-flash", "gemini-flash-lite-latest"]
  ).filter((m, i, arr) => arr.indexOf(m) === i);

  const candidateModels = configuredModels.filter((m) => !isModelDisabled(m));

  if (candidateModels.length === 0) {
    return {
      success: false,
      error: "All configured Gemini models are currently disabled due to 404 errors.",
    };
  }

  let lastError = "";

  // 1. Cascade across configured Gemini Accounts (Account 1 -> Account 2)
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
        `[AI Multi-Router] Provider=Gemini Account=${accIdx + 1} Model=${currentModel} Reason=${reason}`
      );

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${currentAccount.key}`;

      // Standard robust generation config (no thinkingConfig which causes 400 on 3.5-flash-lite)
      const generationConfig: Record<string, any> = {
        temperature: 0.2, // Low temperature for factual consistency
        topP: 0.9,
        maxOutputTokens: 2500,
        responseMimeType: "application/json",
      };

      const requestBody = {
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents,
        generationConfig,
      };

      for (let attempt = 1; attempt <= 2; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), AI_CONFIG.providerTimeoutMs);

        try {
          validModelAttempted = true;
          const response = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorText = await response.text().catch(() => "");
            lastError = `Gemini [${currentModel} | ${accountLabel}] HTTP ${response.status}: ${errorText.slice(0, 180)}`;

            // Model unavailable (404): disable model globally, do not penalize account!
            if (response.status === 404) {
              console.warn(
                `[AI Multi-Router] Gemini Account #${accIdx + 1} Model=${currentModel} Error=404 Action=disable-model`
              );
              disableModel(currentModel, errorText.slice(0, 100));
              break; // Try next candidate model
            }

            // Key unauthorized / Project access denied (401 or 403): permanently disable this account
            if (response.status === 401 || response.status === 403) {
              console.error(
                `[AI Multi-Router] Gemini Account #${accIdx + 1} Error=${response.status} (${errorText.slice(0, 100)}) Action=disable-account`
              );
              disableAccount(accountId, `HTTP ${response.status}: Access Denied / Invalid Key`);
              accountDisabled = true;
              break; // Break model loop, proceed to next account immediately
            }

            // Quota / Rate limit (429): Cooldown account and failover immediately
            if (response.status === 429) {
              console.warn(
                `[AI Multi-Router] Gemini Account #${accIdx + 1} Model=${currentModel} Error=429 (Quota Limit) Action=cooldown-account`
              );
              recordAccountQuotaExhausted(accountId, 60000);
              accountHitQuota = true;
              break; // Break model loop, proceed to next account immediately
            }

            // Server overload (503): retry once, then try next model
            if (response.status === 503) {
              console.warn(
                `[AI Multi-Router] Gemini Account #${accIdx + 1} Model=${currentModel} Error=503 (Overloaded) Action=${attempt < 2 ? "retry" : "try-next-model"}`
              );
              if (attempt < 2) {
                await new Promise((r) => setTimeout(r, 200));
                continue;
              }
              break;
            }

            // General 400 or 500 error
            console.warn(
              `[AI Multi-Router] Gemini Account #${accIdx + 1} Model=${currentModel} Error=${response.status} Action=try-next-model`
            );
            break;
          }

          const json = await response.json();
          const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text;

          if (!rawText) {
            lastError = `Empty response returned from Gemini (${currentModel} on ${accountLabel}).`;
            console.warn(
              `[AI Multi-Router] Gemini Account #${accIdx + 1} Model=${currentModel} Error=EmptyResponse Action=try-next-model`
            );
            break;
          }

          // Parse and validate structured output
          const parsed = parseStructuredOutput(rawText);
          recordAccountSuccess(accountId);
          console.log(
            `[AI Multi-Router] SUCCESS Provider=Gemini Account=${accIdx + 1} Model=${currentModel}`
          );
          return {
            success: true,
            data: parsed,
          };
        } catch (err: any) {
          clearTimeout(timeoutId);
          const isAbort = err.name === "AbortError";
          const errDesc = isAbort ? `Timeout after ${AI_CONFIG.providerTimeoutMs}ms` : (err.message || "Network error");
          lastError = `Gemini [${currentModel} | ${accountLabel}]: ${errDesc}`;
          console.warn(
            `[AI Multi-Router] Gemini Account #${accIdx + 1} Model=${currentModel} Error=${errDesc} Action=try-next-model`
          );

          if (isAbort) break;
        }
      }

      // If account hit 429 or was disabled (401/403), stop trying models on this account
      if (accountHitQuota || accountDisabled) {
        break;
      }
    }

    // Only record generic failure if account was not already handled by 429/403/404
    if (!accountHitQuota && !accountDisabled && validModelAttempted) {
      recordAccountFailure(accountId, lastError);
    }
  }

  return { success: false, error: lastError || "Failed all configured Gemini accounts and models." };
}


/**
 * Safely parses the LLM output into an AssistantResponse structure with resilient fallback.
 */
function parseStructuredOutput(text: string): AssistantResponse {
  const cleaned = text.trim();
  const jsonStr = cleaned.startsWith("```")
    ? cleaned.replace(/^```json\s*/i, "").replace(/```$/, "").trim()
    : cleaned;

  try {
    const obj = JSON.parse(jsonStr);
    return {
      message: typeof obj.message === "string" ? obj.message : cleaned,
      actions: Array.isArray(obj.actions)
        ? obj.actions.filter(
            (a: any) => typeof a === "object" && typeof a.label === "string" && typeof a.type === "string"
          )
        : undefined,
      sourceType: obj.sourceType || "database",
    };
  } catch {
    // Resilient JSON recovery if model output was slightly truncated
    const messageMatch = jsonStr.match(/"message"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    const actionBlockMatch = jsonStr.match(/"actions"\s*:\s*(\[[^\]]*\])/);

    let extractedActions: any[] | undefined;
    if (actionBlockMatch) {
      try {
        extractedActions = JSON.parse(actionBlockMatch[1]);
      } catch {
        // ignore
      }
    }

    if (messageMatch) {
      try {
        const unescaped = JSON.parse(`"${messageMatch[1]}"`);
        return {
          message: unescaped,
          actions: Array.isArray(extractedActions) ? extractedActions : undefined,
          sourceType: "database",
        };
      } catch {
        return {
          message: messageMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"'),
          actions: Array.isArray(extractedActions) ? extractedActions : undefined,
          sourceType: "database",
        };
      }
    }

    return {
      message: text,
      sourceType: "mixed",
    };
  }
}
