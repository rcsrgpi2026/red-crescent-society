import { AI_CONFIG } from "../config";
import type { AssistantResponse } from "../types";
import type { ProviderCallParams, ProviderResult } from "./gemini";
import {
  isProviderAvailable,
  recordProviderSuccess,
  recordProviderFailure,
} from "./circuit-breaker";

/**
 * Executes a structured query to Groq (fallback provider) with timeouts and circuit breaker.
 */
export async function callGroqProvider({
  systemPrompt,
  userMessage,
  contextData,
  history = [],
}: ProviderCallParams): Promise<ProviderResult> {
  const providerName = "groq";

  const apiKeys =
    AI_CONFIG.groqApiKeys && AI_CONFIG.groqApiKeys.length > 0
      ? AI_CONFIG.groqApiKeys
      : AI_CONFIG.groqApiKey
      ? [AI_CONFIG.groqApiKey]
      : [];

  if (apiKeys.length === 0) {
    return {
      success: false,
      error: "GROQ_API_KEY is not configured.",
    };
  }

  if (!isProviderAvailable(providerName)) {
    return {
      success: false,
      error: "Groq provider is currently in cooldown (circuit breaker OPEN).",
    };
  }

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

  const candidateModels = (
    AI_CONFIG.groqCandidateModels && AI_CONFIG.groqCandidateModels.length > 0
      ? AI_CONFIG.groqCandidateModels
      : [
          AI_CONFIG.groqModel,
          "llama-3.3-70b-versatile",
          "llama-3.1-8b-instant",
          "openai/gpt-oss-120b",
        ]
  ).filter((m, i, arr) => arr.indexOf(m) === i);

  let lastError = "";

  // Cascade across candidate models
  for (const currentModel of candidateModels) {
    // Rotate across available Groq API keys
    for (let keyIdx = 0; keyIdx < apiKeys.length; keyIdx++) {
      const currentApiKey = apiKeys[keyIdx];
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), AI_CONFIG.providerTimeoutMs);

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentApiKey}`,
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
          lastError = `Groq [${currentModel} | key #${keyIdx + 1}] HTTP ${response.status}: ${errorText.slice(0, 180)}`;

          // Quota exhausted (429): rotate immediately to next API key
          if (response.status === 429) {
            console.warn(`[Groq] Key #${keyIdx + 1} hit 429 on ${currentModel}. Rotating key/model...`);
            continue;
          }

          continue;
        }

        const json = await response.json();
        const rawText = json?.choices?.[0]?.message?.content;

        if (!rawText) {
          lastError = `Empty response from Groq [${currentModel}].`;
          continue;
        }

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
          ? `Groq [${currentModel}] timed out after ${AI_CONFIG.providerTimeoutMs}ms`
          : err.message || "Groq connection error";

        if (isAbort) break;
      }
    }
  }

  recordProviderFailure(providerName, lastError);
  return { success: false, error: lastError || "Failed all candidate Groq models." };
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
