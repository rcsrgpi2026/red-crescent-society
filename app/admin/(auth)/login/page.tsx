import { redirect } from "next/navigation";

// The separate admin login page is deprecated in favor of unified authentication
// with server-side role detection. Redirect any old bookmarks/links safely.
export default function AdminLoginPage() {
  redirect("/volunteer/login");
}
