-- Migration: AI Assistant Upgrades (Observability & Durable Rate Limiting)
-- Date: 2026-09-15
-- Free-tier Supabase compatible

-- 1. Table to log queries that missed deterministic grounding (Observability)
CREATE TABLE IF NOT EXISTS public.ai_retrieval_misses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query TEXT NOT NULL,
    detected_intent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for analyzing recent misses
CREATE INDEX IF NOT EXISTS idx_ai_retrieval_misses_created_at 
    ON public.ai_retrieval_misses(created_at DESC);

-- Enable RLS
ALTER TABLE public.ai_retrieval_misses ENABLE ROW LEVEL SECURITY;

-- Allow server-side service role full access
CREATE POLICY "Service role full access on ai_retrieval_misses" 
    ON public.ai_retrieval_misses 
    FOR ALL 
    TO service_role 
    USING (true) 
    WITH CHECK (true);


-- 2. Table for Durable Serverless Rate Limiting
CREATE TABLE IF NOT EXISTS public.ai_rate_limits (
    client_id TEXT NOT NULL,
    day_key TEXT NOT NULL, -- Format: YYYY-MM-DD
    request_count INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (client_id, day_key)
);

-- Index for cleanup or queries by day
CREATE INDEX IF NOT EXISTS idx_ai_rate_limits_day_key 
    ON public.ai_rate_limits(day_key);

-- Enable RLS
ALTER TABLE public.ai_rate_limits ENABLE ROW LEVEL SECURITY;

-- Allow server-side service role full access
CREATE POLICY "Service role full access on ai_rate_limits" 
    ON public.ai_rate_limits 
    FOR ALL 
    TO service_role 
    USING (true) 
    WITH CHECK (true);

-- Atomic increment function for rate limiting
CREATE OR REPLACE FUNCTION public.increment_ai_rate_limit(
    p_client_id TEXT,
    p_day_key TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    INSERT INTO public.ai_rate_limits (client_id, day_key, request_count, updated_at)
    VALUES (p_client_id, p_day_key, 1, timezone('utc'::text, now()))
    ON CONFLICT (client_id, day_key)
    DO UPDATE SET 
        request_count = public.ai_rate_limits.request_count + 1,
        updated_at = timezone('utc'::text, now())
    RETURNING request_count INTO v_count;

    RETURN v_count;
END;
$$;
