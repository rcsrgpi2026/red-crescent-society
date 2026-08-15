import type { Metadata } from "next";
import Link from "next/link";
import { HeartPulse, ShieldCheck, ArrowLeft } from "lucide-react";
import { LoginForm } from "@/components/admin/login-form";
import { SiteLogo } from "@/components/layout/site-logo";
import { getSettings } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Admin Login",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const settings = await getSettings();
  const society = settings.society ?? {};
  const asString = (v: unknown) =>
    typeof v === "string" && v.trim() ? v.trim() : undefined;
  const societyName = asString(society.shortName) ?? asString(society.name);
  const collegeName = asString(society.collegeName);

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand side */}
      <div className="relative hidden overflow-hidden bg-brand-dark lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/5 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-crescent/10 blur-3xl" aria-hidden />
        <Link href="/" className="relative flex items-center gap-3 text-white">
          <SiteLogo variant="society" className="w-10" />
          <span className="leading-tight">
            <span className="block font-bold">{societyName ?? "Red Crescent Society"}</span>
            <span className="block text-xs text-white/60">
              {collegeName ?? "Rajshahi Polytechnic Institute"}
            </span>
          </span>
        </Link>
        <div className="relative">
          <HeartPulse className="h-10 w-10 text-crescent" aria-hidden />
          <h1 className="mt-5 max-w-md text-balance text-3xl font-bold leading-tight text-white">
            Management dashboard for the society leadership
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70">
            Approve volunteers, manage blood requests, publish events and notices, and keep
            the society running — all in one place.
          </p>
          <ul className="mt-8 space-y-2.5 text-sm text-white/80">
            {[
              "Role-based access — only authorized staff",
              "Every important action is audit-logged",
              "Sensitive data never leaves the platform",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2.5">
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-300" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-white/40">
          Restricted area — authorized personnel only.
        </p>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center bg-white px-6 py-16">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand-dark"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to website
          </Link>
          <div className="lg:hidden">
            <SiteLogo variant="society" className="w-12" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-foreground">Admin sign in</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Use your authorized society account to continue.
          </p>
          <div className="mt-8">
            <LoginForm />
          </div>
          <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
            Accounts are created by the super admin in the Supabase dashboard. See the README
            for the full setup guide.
          </p>
        </div>
      </div>
    </div>
  );
}
