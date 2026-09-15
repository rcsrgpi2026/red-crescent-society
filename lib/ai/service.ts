import "server-only";

import { AI_CONFIG } from "./config";
import type { AssistantAction, AssistantResponse } from "./types";
import { checkAiRateLimit } from "./rate-limiter";
import { classifyIntent, tryDeterministicShortcut } from "./intent-router";
import { isRegisteredRoute } from "./registries/route-registry";
import { buildTrustedLiveContext, getActiveBloodRequestsSummary, getEmergencyHelpline } from "./resolvers/live-data";
import { buildAssistantSystemPrompt } from "./system-prompt";
import { isBloodRequestWizardQuery, executeBloodRequestWizard } from "./resolvers/blood-wizard";
import { callGeminiProvider } from "./providers/gemini";
import { callGroqProvider } from "./providers/groq";
import { logRetrievalMiss } from "./logger";
import { getCachedResponse, setCachedResponse } from "./cache";

export interface ProcessMessageParams {
  message: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  userId?: string | null;
  clientIp?: string;
  isAuthenticated?: boolean;
}

// Approved external domains for external_link actions
const ALLOWED_EXTERNAL_DOMAINS = [
  "facebook.com/rcsrgpi",
  "instagram.com/rcy_rgpi",
  "rcy-rgpi.org",
  "rgpi.gov.bd",
];

/**
 * Validates and filters AI-suggested actions against strict server-side allowlists.
 * Never trust arbitrary URLs returned by an LLM.
 */
export function sanitizeActions(actions?: AssistantAction[]): AssistantAction[] {
  if (!actions || !Array.isArray(actions)) return [];

  const validActions: AssistantAction[] = [];

  for (const action of actions) {
    if (!action || typeof action !== "object" || !action.label || !action.target) {
      continue;
    }

    const cleanTarget = action.target.trim();

    if (action.type === "navigate") {
      // Validate target is an approved internal application route
      if (isRegisteredRoute(cleanTarget)) {
        validActions.push({
          type: "navigate",
          label: action.label.trim(),
          target: cleanTarget,
        });
      } else {
        console.warn(`[AI Action Filter] Dropped unauthorized navigate target: "${cleanTarget}"`);
      }
    } else if (action.type === "external_link") {
      // Validate target domain is in the approved allowlist
      const isDomainAllowed = ALLOWED_EXTERNAL_DOMAINS.some((domain) =>
        cleanTarget.toLowerCase().includes(domain)
      );
      if (isDomainAllowed) {
        validActions.push({
          type: "external_link",
          label: action.label.trim(),
          target: cleanTarget,
        });
      } else {
        console.warn(`[AI Action Filter] Dropped unauthorized external target: "${cleanTarget}"`);
      }
    } else if (action.type === "contact") {
      validActions.push({
        type: "contact",
        label: action.label.trim(),
        target: cleanTarget,
      });
    }
  }

  return validActions;
}

/**
 * Generates an emergency-safe fallback response using raw Supabase data when LLMs are unavailable.
 */
async function buildEmergencyFallback(): Promise<AssistantResponse> {
  const [blood, helpline] = await Promise.all([
    getActiveBloodRequestsSummary(),
    getEmergencyHelpline(),
  ]);

  const msg = [
    "🚨 জরুরি সহায়তা তথ্য:",
    `- হটলাইন: ${helpline.bloodHelpline}`,
    `- বর্তমানে সিস্টেমে সক্রিয় রক্তের আবেদন: ${blood.activeCount}টি`,
    blood.activeCount > 0
      ? `- জরুরি/আশঙ্কাজনক আবেদন: ${blood.emergencyCount}টি`
      : "",
    "তাৎক্ষণিক রক্ত সহায়তার জন্য নিচে দেওয়া বাটনে ক্লিক করুন।",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    message: msg,
    actions: [
      {
        type: "navigate",
        label: "জরুরি রক্ত সহায়তা পেজ",
        target: "/blood-support",
      },
      {
        type: "navigate",
        label: "রক্তের আবেদন করুন",
        target: "/blood-support/request",
      },
    ],
    sourceType: "database",
    intent: "EMERGENCY",
  };
}

/**
 * Master AI Assistant Processing Pipeline.
 *
 * 1. Input sanitization & character limits
 * 2. Server-side rate limiting (burst + daily quotas)
 * 3. Intent classification
 * 4. Deterministic shortcut resolution (token & latency savings)
 * 5. Grounding context compilation from live Supabase
 * 6. Resilient LLM execution: Gemini (primary) -> Groq (fallback)
 * 7. Action sanitization & allowlist check
 */
export async function processAssistantMessage({
  message,
  history = [],
  userId,
  clientIp = "127.0.0.1",
  isAuthenticated = false,
}: ProcessMessageParams): Promise<AssistantResponse> {
  const cleanInput = (message || "").trim();

  // 1. Validate Input Length
  if (!cleanInput) {
    return {
      message: "অনুগ্রহ করে আপনার প্রশ্ন বা জানার বিষয়টি লিখুন।",
      sourceType: "fallback",
    };
  }

  if (cleanInput.length > AI_CONFIG.maxMessageLength) {
    return {
      message: `আপনার প্রশ্নটি অনেক দীর্ঘ। অনুগ্রহ করে ${AI_CONFIG.maxMessageLength} অক্ষরের মধ্যে সংক্ষেপে লিখুন।`,
      sourceType: "fallback",
    };
  }

  // 2. Server-Side Rate Limiting
  const clientId = userId ? `user:${userId}` : `ip:${clientIp}`;
  const rateLimit = await checkAiRateLimit(clientId, isAuthenticated);
  if (!rateLimit.allowed) {
    return {
      message: rateLimit.reason || "অতিরিক্ত রিকোয়েস্টের কারণে সাময়িকভাবে বন্ধ রয়েছে।",
      sourceType: "fallback",
    };
  }

  // 3. Classify Intent
  const intent = classifyIntent(cleanInput);

  // 4. Evaluate Deterministic Shortcuts (No LLM required)
  const shortcut = tryDeterministicShortcut(cleanInput);
  if (shortcut) {
    shortcut.actions = sanitizeActions(shortcut.actions);
    return shortcut;
  }

  // 4.5. Deterministic Step-by-Step Blood Request Wizard (Zero LLM Tokens)
  if (isBloodRequestWizardQuery(cleanInput, history)) {
    const wizardResponse = executeBloodRequestWizard(cleanInput, history);
    wizardResponse.actions = sanitizeActions(wizardResponse.actions);
    return wizardResponse;
  }

  // 4.8. High-Speed In-Memory Cache (Sub-millisecond latency & zero LLM quota consumption)
  if (history.length === 0) {
    const cachedResponse = getCachedResponse(cleanInput);
    if (cachedResponse) {
      cachedResponse.actions = sanitizeActions(cachedResponse.actions);
      return cachedResponse;
    }
  }

  // 5. Compile Grounding Context from Live Supabase & Knowledge Base
  const [liveContext, helplineData] = await Promise.all([
    buildTrustedLiveContext(intent, cleanInput),
    getEmergencyHelpline(),
  ]);

  // Observability (Phase 2): Log queries that proceed to raw LLM without curated grounding
  if (
    !liveContext.includes("[ORGANIZATIONAL KNOWLEDGE]") &&
    (intent === "KNOWLEDGE" || intent === "UNKNOWN" || intent === "BLOOD_SUPPORT")
  ) {
    void logRetrievalMiss(cleanInput, intent);
  }

  const systemPrompt = buildAssistantSystemPrompt(helplineData.bloodHelpline);

  // 6. Execute Primary Provider (Gemini with candidate models & keys cascade)
  let providerRes = await callGeminiProvider({
    systemPrompt,
    userMessage: cleanInput,
    contextData: liveContext,
    history,
  });

  // 7. Execute Fallback Provider (Groq with candidate models cascade) if Gemini failed
  if (!providerRes.success && (AI_CONFIG.groqApiKey || AI_CONFIG.groqApiKeys.length > 0)) {
    console.warn(`[AI Engine] Gemini failed (${providerRes.error}). Falling back to Groq...`);
    providerRes = await callGroqProvider({
      systemPrompt,
      userMessage: cleanInput,
      contextData: liveContext,
      history,
    });
  }

  // 8. Graceful Zero-Degradation Degradation if all providers failed
  if (!providerRes.success || !providerRes.data) {
    console.error("[AI Engine] Both Gemini and Groq providers were unable to respond:", providerRes.error);

    // If query was emergency or blood support, immediately return emergency blood hotline fallback
    if (intent === "EMERGENCY" || intent === "BLOOD_SUPPORT" || intent === "LIVE_DATA") {
      return buildEmergencyFallback();
    }

    // Zero-Degradation Factual Fallback: If liveContext retrieved organizational knowledge,
    // present the facts directly without failing or showing an error to the user!
    if (liveContext.includes("[ORGANIZATIONAL KNOWLEDGE]")) {
      const cleanedKnowledge = liveContext
        .replace(/\[ORGANIZATIONAL KNOWLEDGE\][^\n]*/, "")
        .replace(/\[LIVE DATABASE SUMMARY\][^\n]*/, "")
        .trim();

      if (cleanedKnowledge.length > 20) {
        return {
          message: `${cleanedKnowledge}\n\n(আমাদের অফিসিয়াল তথ্যভাণ্ডার থেকে সংগৃহীত)`,
          actions: [
            {
              type: "navigate",
              label: "আমাদের সম্পর্কে পেজ",
              target: "/about",
            },
            {
              type: "navigate",
              label: "যোগাযোগ পেজ",
              target: "/contact",
            },
          ],
          sourceType: "database",
          intent,
        };
      }
    }

    // Default friendly fallback with helpful navigation
    return {
      message:
        "এই মুহূর্তে এআই সার্ভার সাময়িকভাবে ব্যস্ত রয়েছে। আপনার প্রয়োজনীয় তথ্য জানতে নিচের পেজগুলোতে প্রবেশ করতে পারেন অথবা সরাসরি আমাদের সাথে যোগাযোগ করতে পারেন।",
      actions: [
        {
          type: "navigate",
          label: "জরুরি রক্ত সহায়তা",
          target: "/blood-support",
        },
        {
          type: "navigate",
          label: "নোটিশ বোর্ড",
          target: "/notices",
        },
        {
          type: "navigate",
          label: "যোগাযোগ পেজ",
          target: "/contact",
        },
      ],
      sourceType: "fallback",
      intent,
    };
  }

  // 9. Sanitize Output Actions & Cache Response
  const output = providerRes.data;
  output.actions = sanitizeActions(output.actions);
  output.intent = intent;

  // Cache single-turn query responses to multiply RPD capacity
  if (history.length === 0) {
    setCachedResponse(cleanInput, output);
  }

  return output;
}
