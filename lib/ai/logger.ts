import { createAdminClient } from "../supabase/admin";

/**
 * Sanitizes user query before observability logging to protect privacy.
 * - Truncates to max 300 characters
 * - Masks email addresses
 * - Masks phone numbers (e.g. 017xxxxxxxx -> 017****xxxx)
 */
function sanitizeQueryForLogging(query: string): string {
  if (!query) return "";

  let clean = query.trim().slice(0, 300);

  // Mask email addresses
  clean = clean.replace(/[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g, "[EMAIL]");

  // Mask phone numbers (BD format: 01XXXXXXXXX)
  clean = clean.replace(/(?:(?:\+|00)88|01)?(?:\d{9,11})/g, (match) => {
    if (match.length >= 10) {
      return match.slice(0, 3) + "****" + match.slice(-3);
    }
    return "[PHONE]";
  });

  return clean;
}

/**
 * Logs ungrounded retrieval queries (misses) to Supabase table `ai_retrieval_misses`.
 * Runs asynchronously and fails silently if table or Supabase is not ready,
 * ensuring user requests are never delayed or interrupted.
 */
export async function logRetrievalMiss(
  query: string,
  detectedIntent: string = "UNKNOWN"
): Promise<void> {
  // Never log empty or trivially short queries
  if (!query || query.trim().length < 3) return;

  // Don't log security/injection attempts
  if (detectedIntent === "UNRELATED") return;

  try {
    const sanitizedQuery = sanitizeQueryForLogging(query);
    const supabase = createAdminClient();

    const { error } = await supabase.from("ai_retrieval_misses").insert({
      query: sanitizedQuery,
      detected_intent: detectedIntent,
    });

    if (error) {
      // Soft debug warning, don't throw
      if (process.env.NODE_ENV === "development") {
        console.debug("[AI Miss Logger] Miss logging skipped:", error.message);
      }
    }
  } catch {
    // Graceful fallback: silent failure
  }
}
