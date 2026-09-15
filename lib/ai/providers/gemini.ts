import { AI_CONFIG } from "../config";
import type { AssistantResponse } from "../types";
import {
  isProviderAvailable,
  recordProviderSuccess,
  recordProviderFailure,
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
 * Executes a structured query to Google Gemini with timeouts, retries, and circuit breaker.
 */
export async function callGeminiProvider({
  systemPrompt,
  userMessage,
  contextData,
  history = [],
}: ProviderCallParams): Promise<ProviderResult> {
  const providerName = "gemini";

  const apiKeys =
    AI_CONFIG.geminiApiKeys && AI_CONFIG.geminiApiKeys.length > 0
      ? AI_CONFIG.geminiApiKeys
      : AI_CONFIG.geminiApiKey
      ? [AI_CONFIG.geminiApiKey]
      : [];

  if (apiKeys.length === 0) {
    return {
      success: false,
      error: "GEMINI_API_KEY is not configured.",
    };
  }

  if (!isProviderAvailable(providerName)) {
    return {
      success: false,
      error: "Gemini provider is currently in cooldown (circuit breaker OPEN).",
    };
  }

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

  const candidateModels = (
    AI_CONFIG.geminiCandidateModels && AI_CONFIG.geminiCandidateModels.length > 0
      ? AI_CONFIG.geminiCandidateModels
      : [AI_CONFIG.geminiModel, "gemini-2.0-flash", "gemini-1.5-flash", "gemini-2.0-flash-lite"]
  ).filter((m, i, arr) => arr.indexOf(m) === i);

  let lastError = "";

  // Cascade across candidate models
  for (const currentModel of candidateModels) {
    // Rotate across available API keys for each model
    for (let keyIdx = 0; keyIdx < apiKeys.length; keyIdx++) {
      const currentApiKey = apiKeys[keyIdx];
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${currentApiKey}`;

      // Base generation config
      const generationConfig: Record<string, any> = {
        temperature: 0.2, // Low temperature for high factual accuracy
        topP: 0.9,
        maxOutputTokens: 2500,
        responseMimeType: "application/json",
      };

      // For models with thinking capability (such as gemini-3.5-flash), disable thinking tokens
      // to reduce latency from ~10s down to ~1.2s and prevent timeouts
      if (currentModel.includes("3.5-flash")) {
        generationConfig.thinkingConfig = {
          thinkingBudget: 0,
        };
      }

      const requestBody: {
        systemInstruction: { parts: Array<{ text: string }> };
        contents: typeof contents;
        generationConfig: Record<string, any>;
      } = {
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
            lastError = `Gemini [${currentModel} | key #${keyIdx + 1}] HTTP ${response.status}: ${errorText.slice(0, 180)}`;

            // If thinkingConfig is not supported on this model, strip it and retry immediately
            if (response.status === 400 && requestBody.generationConfig?.thinkingConfig) {
              delete requestBody.generationConfig.thinkingConfig;
              continue;
            }

            // Quota exhausted (429): rotate immediately to next API key
            if (response.status === 429) {
              console.warn(`[Gemini] Key #${keyIdx + 1} hit 429 on ${currentModel}. Rotating key/model...`);
              break; // breaks out of attempt loop to try next key or next model
            }

            // Server overload (503): retry once or rotate
            if (response.status === 503) {
              if (attempt < 2) {
                await new Promise((r) => setTimeout(r, 200));
                continue;
              }
              break;
            }

            if (attempt < 2) {
              await new Promise((r) => setTimeout(r, 200));
              continue;
            }
            break;
          }

          const json = await response.json();
          const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text;

          if (!rawText) {
            lastError = `Empty response returned from Gemini (${currentModel}).`;
            break;
          }

          // Parse and validate structured output
          const parsed = parseStructuredOutput(rawText);
          recordProviderSuccess(providerName);
          return {
            success: true,
            data: parsed,
          };
        } catch (err: any) {
          clearTimeout(timeoutId);
          const isAbort = err.name === "AbortError";
          lastError = isAbort
            ? `Gemini [${currentModel}] timed out after ${AI_CONFIG.providerTimeoutMs}ms`
            : err.message || "Unknown network error";

          if (isAbort) break;
        }
      }
    }
  }

  recordProviderFailure(providerName, lastError);
  return { success: false, error: lastError || "Failed all candidate models and keys." };
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
