import { redirect } from "next/navigation";

// The volunteer application flow now lives in the volunteer portal, which
// includes signup (with login credentials) and admin-approval tracking.
export default function JoinPage() {
  redirect("/volunteer/login");
}
