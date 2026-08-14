import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/supabase/config";

let client: SupabaseClient<any, "public", any> | null = null;

/**
 * Cookie-free Supabase client for public reads. There is no session and no
 * per-request runtime context, so it is safe to call from inside cached
 * server functions (unstable_cache) and never forces a route dynamic.
 *
 * Public data is exposed through the `public_*` views, which are readable by
 * the anon role — the same role anonymous visitors already use today.
 */
export function getPublicClient() {
  if (!isSupabaseConfigured) return null;
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
  }
  return client;
}
