// Read-only: check whether the target auth user exists.
// Usage: node scripts/check-user.mjs <email>
import { createClient } from "@supabase/supabase-js";

const email = process.argv[2];
if (!email) {
  console.error("Usage: node scripts/check-user.mjs <email>");
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
if (error) {
  console.error("listUsers error:", error.message);
  process.exit(1);
}

const found = data.users.filter((u) => u.email === email);
if (found.length === 0) {
  console.log("NOT_FOUND");
} else {
  console.log("FOUND");
  for (const u of found) {
    console.log(JSON.stringify({ id: u.id, email: u.email, confirmed: u.email_confirmed_at !== null }));
  }
}
