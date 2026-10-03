export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project") &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
);

export const isServiceRoleConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project") &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
);
