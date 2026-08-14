import Link from "next/link";
import {
  ArrowLeft,
  GraduationCap,
  HeartHandshake,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { SiteLogo } from "@/components/layout/site-logo";

/**
 * Shared page shell for the student / volunteer portals — a branded split
 * layout (dark brand side + white form side), mirroring the admin login page.
 */
export function PortalShell({
  kind,
  children,
}: {
  kind: "student" | "volunteer";
  children: React.ReactNode;
}) {
  const isStudent = kind === "student";
  const Icon = isStudent ? GraduationCap : HeartHandshake;
  const highlights = isStudent
    ? [
        "Instant access — no approval needed",
        "Your session, semester, roll and department",
        "Your details stay private to the society",
      ]
    : [
        "Application reviewed by the society leadership",
        "Track your approval status after signing in",
        "Membership unlocks once approved",
      ];

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand side */}
      <div className="relative hidden overflow-hidden bg-brand-dark lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/5 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-crescent/10 blur-3xl"
          aria-hidden
        />
        <Link href="/" className="relative flex items-center gap-3 text-white">
          <SiteLogo variant="society" className="w-10" />
          <span className="leading-tight">
            <span className="block font-bold">Red Crescent Society</span>
            <span className="block text-xs text-white/60">
              Rajshahi Polytechnic Institute
            </span>
          </span>
        </Link>
        <div className="relative">
          <Icon className="h-10 w-10 text-crescent" aria-hidden />
          <h1 className="mt-5 max-w-md text-balance text-3xl font-bold leading-tight text-white">
            {isStudent ? "Your student portal" : "Your volunteer portal"}
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70">
            {isStudent
              ? "Sign in to view and manage your student record with the society."
              : "Sign in to track your application and, once approved, access your volunteer membership."}
          </p>
          <ul className="mt-8 space-y-2.5 text-sm text-white/80">
            {highlights.map((item) => (
              <li key={item} className="flex items-center gap-2.5">
                <ShieldCheck
                  className="h-4 w-4 shrink-0 text-emerald-300"
                  aria-hidden
                />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative flex items-center gap-1.5 text-xs text-white/40">
          <Clock className="h-3.5 w-3.5" aria-hidden />
          {isStudent
            ? "Student accounts are activated immediately."
            : "Volunteer applications are reviewed by the leadership."}
        </p>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center bg-white px-6 py-16">
        <div className="w-full max-w-md">
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
          {children}
        </div>
      </div>
    </div>
  );
}
