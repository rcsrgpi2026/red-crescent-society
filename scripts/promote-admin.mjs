// Promotes an existing Supabase auth user to SUPER_ADMIN and sets their password.
// Usage: node scripts/promote-admin.mjs <email> <password>
import { createClient } from "@supabase/supabase-js";

const email = process.argv[2];
const password = process.argv[3];
if (!email || !password) {
  console.error("Usage: node scripts/promote-admin.mjs <email> <password>");
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 1. Find the user by email.
const { data: userList, error: listError } = await supabase.auth.admin.listUsers({
  page: 1,
  perPage: 1000,
});
if (listError) {
  console.error("listUsers error:", listError.message);
  process.exit(1);
}
const user = userList.users.find((u) => u.email === email);
if (!user) {
  console.error(`User not found: ${email}`);
  process.exit(1);
}

// 2. Set the password.
const { data: updated, error: passError } = await supabase.auth.admin.updateUserById(user.id, {
  password,
  email_confirm: true,
});
if (passError) {
  console.error("updateUserById error:", passError.message);
  process.exit(1);
}

// 3. Promote the profile role (service role bypasses RLS).
const { data: profile, error: roleError } = await supabase
  .from("profiles")
  .update({ role: "SUPER_ADMIN" })
  .eq("id", user.id)
  .select("id, role, full_name")
  .single();
if (roleError) {
  console.error("profile update error:", roleError.message);
  process.exit(1);
}

console.log(
  JSON.stringify({
    id: user.id,
    email: updated.email,
    password_set: true,
    profile: { id: profile.id, role: profile.role, full_name: profile.full_name },
  })
);
