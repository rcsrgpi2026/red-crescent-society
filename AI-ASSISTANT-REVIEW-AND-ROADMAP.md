# RCY AI Website Assistant — Weakness Report & Improvement Roadmap

**Date:** September 15, 2026
**Scope:** `lib/ai/` — the assistant stack (service, intent router, knowledge base, providers, rate limiter)
**Constraint:** Every recommendation below runs on **free tiers only — $0/month**, keeping the assistant serverless on Vercel.

---

## 1. What the current setup does well (keep these)

| Strength | Where | Why it matters |
|---|---|---|
| Deterministic, fact-checked grounding | `knowledge/knowledge-base.ts` | Blood eligibility criteria and org facts are served verbatim — near-zero hallucination risk on critical content |
| Layered provider failover | `providers/gemini.ts`, `providers/groq.ts`, `providers/circuit-breaker.ts` | Gemini → Groq fallback with circuit breaker = resilient on free tiers |
| Rate limiting with burst + daily caps | `rate-limiter.ts`, `config.ts` | Protects free-tier API quotas from abuse |
| Action sanitization | `service.ts` (`sanitizeActions`) | LLM-suggested navigation targets validated against route registry and external-domain allowlist |
| Prompt-injection pre-filter | `intent-router.ts` (`isPromptInjectionAttempt`) | First-line defense before any LLM call |
| Emergency intent fast-path | `intent-router.ts` | Blood emergency queries bypass the LLM entirely |
| Timeouts on every provider call | `config.ts` | No hanging requests on slow free-tier endpoints |

This architecture is **better suited to this project than adopting a full RAG framework** (e.g., Ragpi, LangChain stacks): those require an always-on server (~$5–10/mo), cannot run on Vercel, and their scale-oriented machinery (connectors, agentic retrieval, rerankers) solves problems this project does not have.

---

## 2. Weaknesses (with evidence from the code)

### W1 — Keyword-only knowledge retrieval misses paraphrases *(highest impact)*

**Evidence:** `findRelevantKnowledge()` in `knowledge/knowledge-base.ts` scores articles by counting `q.includes(keyword)` substring hits.

**Problem:** Retrieval succeeds only if the user's wording *literally contains* a string from the `keywords` array. Real users paraphrase, and the failure is silent: when no keyword matches, the question falls through to the raw LLM, which may answer org facts **without the fact-checked grounding** — exactly the hallucination risk the knowledge base exists to prevent.

Examples that currently fail or degrade:
- *"বয়স ১৭, আমি কি রক্ত দিতে পারি?"* — contains no keyword from the blood-donation article ("রক্তদানের যোগ্যতা", "রক্তদানের শর্ত"…)
- *"Do I have enough weight to donate?"* — "donor eligibility" and "blood criteria" don't appear
- *"রক্ত কতদিন পর আবার দেওয়া যায়?"* — gap interval is in the article but no keyword matches this phrasing

**Severity: High.** This is the single biggest accuracy gap.

### W2 — Intent router is a long chain of hardcoded substrings *(maintenance + brittleness)*

**Evidence:** `classifyIntent()` in `intent-router.ts` — hundreds of `q.includes(...)` literals across ~575 lines.

**Problems:**
- Every new phrasing requires a manual code edit; the lists grow unboundedly.
- Same paraphrase problem as W1, but at the routing layer: "রক্ত লাগবে" (need blood) may not hit `FORM_GUIDANCE` or `EMERGENCY` depending on spelling variants.
- Romanized Bengali ("blood lagbe", "kobe") is only partially covered.
- Partial-word includes (`"activit"`, `"verify"`) can over-match inside unrelated words.

**Severity: Medium-High.** Misrouted intents produce wrong response *formats* (e.g., form guidance card when the user asked a factual question).

### W3 — In-memory rate limiter does not survive serverless reality *(correctness under load)*

**Evidence:** `rate-limiter.ts` uses a module-level `Map`.

**Problem:** On Vercel, each serverless function instance has its own memory, and instances recycle frequently. Consequences:
- Counters reset on cold start → daily limits (10/day anon) can be **exceeded many times over**.
- Concurrent instances don't share state → effective limit = limit × number of warm instances.

It still works as a soft guard, but it is not enforcing what `config.ts` promises.

**Severity: Medium.** Free-tier Gemini/Groq quotas are the real resource at risk.

### W4 — Prompt-injection blocklist is trivially bypassable

**Evidence:** `isPromptInjectionAttempt()` matches ~17 exact English strings.

**Problems:**
- Zero-width characters, spacing, or capitalization tricks ("i g n o r e   i n s t r u c t i o n s") defeat `toLowerCase().includes`.
- Bengali-language injection ("আগের নির্দেশনা ভুলে যাও") is not covered at all.
- A blocklist can never be complete — it's a speed bump, not a wall.

**Severity: Medium.** Mitigated by the fact that the LLM's *actions* are always sanitized server-side (W1's strength), so worst case is a bad answer, not data exfiltration via actions.

### W5 — No visibility into retrieval failures

**Problem:** There is no logging or aggregation of queries where `findRelevantKnowledge()` returned `null` and the LLM answered ungrounded. The team cannot see *which* user phrasings are missing from the knowledge base, so W1 never improves on its own.

**Severity: Medium.** Cheap to fix, compounds the value of every other fix.

### W6 — Knowledge base content is hand-maintained in TypeScript

**Problem:** Adding or editing an article requires a code change and redeploy. Non-technical admins of the org cannot update Q&A content. Acceptable at current size (~dozens of articles), but it's friction that will keep the KB stale as the org grows.

**Severity: Low-Medium (defer).**

---

## 3. Recommendation — the free upgrade path (in order)

> Strategy: **keep the current architecture**. It is correct for a correctness-critical, low-budget, serverless deployment. Fix its weakest link (retrieval) with free embeddings instead of replacing it with heavier infrastructure.

### Phase 0 — Keyword & intent audit *(~1 hour, zero risk, do first)*

- Review the knowledge base `keywords` arrays and `classifyIntent()` lists; add the phrasings real users type, including **romanized Bengali** and common spelling variants (for Bengali numerals: ১৭/17).
- Log every query that misses the knowledge base (see Phase 2) and feed the top misses back into the lists.
- Expected outcome: eliminates a large share of retrieval misses before any new code.

### Phase 1 — RAG-lite: embedding-based article matching *(~half a day, $0)*

Replace substring scoring with semantic similarity, using **`gemini-embedding-001` — free on the Gemini free tier** (the same API key already in `config.ts`):

1. **Embed once:** a small Node script loops over `RCY_KNOWLEDGE_BASE`, calls the embedding API per article, and writes a JSON file of vectors (`lib/ai/knowledge/embeddings.json`). Re-run only when articles change. No vector DB — with ~dozens of articles, brute-force cosine similarity is microseconds.
2. **Match at query time:** in `findRelevantKnowledge()`, when keyword scoring finds no match (or as a combined score), embed the user's question with the *same model* and rank articles by cosine similarity; return the top article above a threshold (e.g., 0.72), else `null`.
3. **Fail safe:** below threshold → current behavior (deterministic refusal / LLM with no fabricated facts).

**Cost per query:** one embedding call — well within Gemini's free-tier embedding limits for this site's traffic. **No new infrastructure, no paid service, stays serverless.**

This one change fixes W1 and softens W2: paraphrases in both Bengali and English map to the right article, and the same technique can later back the intent router (embed an "intent anchor phrase set" instead of substring lists).

### Phase 2 — Observability: log ungrounded queries *(~1 hour)*

- When retrieval misses and the LLM answers, append the query (truncated, no PII) to a `retrieval_misses` table in **Supabase (existing, free tier)**.
- Review weekly; feed misses into Phase 0 keyword lists. This creates the feedback loop that keeps accuracy improving.

### Phase 3 — Durable rate limiting *(~2 hours, when abuse becomes real)*

- Move rate-limit counters from the in-memory `Map` to Supabase (upsert per `clientId` per day, atomic increment via a Postgres function or `UPDATE ... RETURNING`). Free tier, fixes W3 fully.
- Until then, the current limiter is acceptable as a soft guard.

### Phase 4 *(optional, defer until needed)*

- **pgvector in Supabase:** only if the knowledge base grows to hundreds of articles (free tier includes pgvector).
- **KB editing via admin panel:** move articles from TypeScript into a Supabase table editable by org admins (fixes W6).
- **Injection hardening:** strip zero-width characters before matching, add Bengali injection phrases, and rely primarily on the existing action-allowlist sandbox as the real boundary.

### Explicitly *not* recommended

| Option | Why not |
|---|---|
| **Ragpi / full RAG frameworks** | Self-hosted Python service; needs an always-on server (~$5–10/mo); cannot run on Vercel; agentic retrieval is overkill for a curated KB |
| **Rerankers, hybrid BM25, query rewriting** | Advanced-RAG machinery pays off at scale (100s–1000s of chunks); adds latency and cost with no benefit here |
| **Fine-tuning an LLM** | Knowledge changes over time and is small; retrieval beats baked-in weights for this use case |
| **Paid vector databases (Pinecone etc.)** | Corpus is tiny; pgvector or brute-force math is free and sufficient |

---

## 4. Cost summary after all phases

| Component | Service | Cost |
|---|---|---|
| Response generation | Gemini free tier → Groq free tier failover | $0 |
| Embeddings (KB + queries) | `gemini-embedding-001` free tier | $0 |
| Miss logging, durable rate limits, future pgvector | Supabase free tier (existing) | $0 |
| Hosting | Vercel (existing) | $0 |
| **Total** | | **$0/month** |

**Bottom line:** The chatbot's architecture is fundamentally sound — its one meaningful weakness is keyword-only matching. Phase 0 + Phase 1 (~half a day of work, $0) close that gap with paraphrase-tolerant semantic retrieval while preserving deterministic, fact-checked answers.
