import { AI_CONFIG } from "../config";

/**
 * Calculates cosine similarity between two numerical vectors.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Generates an embedding vector for a given text using Google's free-tier gemini-embedding-001 endpoint.
 * Returns null gracefully if API key is missing or request fails.
 */
export async function embedTextWithGemini(text: string): Promise<number[] | null> {
  const apiKey = AI_CONFIG.geminiApiKey;
  if (!apiKey || !text || !text.trim()) {
    return null;
  }

  const modelName = "gemini-embedding-001";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:embedContent?key=${apiKey}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: `models/${modelName}`,
        content: {
          parts: [{ text: text.trim().slice(0, 1000) }], // limit to 1000 chars
        },
      }),
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    if (data?.embedding?.values && Array.isArray(data.embedding.values)) {
      return data.embedding.values;
    }

    return null;
  } catch {
    return null;
  }
}
