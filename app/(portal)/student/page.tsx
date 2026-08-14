import type { Metadata } from "next";
import Link from "next/link";
import {
  User,
  GraduationCap,
  CalendarDays,
  Hash,
  Building2,
  Phone,
  Mail,
  ArrowLeft,
} from "lucide-react";
import { requireStudent } from "@/lib/auth";
import { SiteLogo } from "@/components/layout/site-logo";
import { SignOutButton } from "@/components/auth/sign-out-button";

export const metadata: Metadata = {
  title: "Student Portal",
  robots: { index: false, follow: false },
};

export default async function StudentPortalPage() {
  const { student } = await requireStudent();

  const rows = [
    { icon: User, label: "Name", value: student.name },
    { icon: CalendarDays, label: "Session", value: student.session },
    { icon: GraduationCap, label: "Semester", value: student.semester },
    { icon: Hash, label: "Roll", value: student.roll },
    { icon: Building2, label: "Department", value: student.department },
    { icon: Phone, label: "Mobile", value: student.phone },
    { icon: Mail, label: "Email", value: student.email },
  ];

  return (
    <div className="min-h-screen bg-mist">
      {/* Portal header */}
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <SiteLogo variant="society" className="w-9 shrink-0" />
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-bold text-brand-dark">
                Student Portal
              </p>
              <p className="truncate text-xs text-muted-foreground">
                RPI Red Crescent Society
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/"
              className="text-xs font-semibold text-brand hover:underline"
            >
              Visit website
            </Link>
            <SignOutButton redirectTo="/student/login" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand-dark"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to website
        </Link>

        <div className="mt-6 rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <GraduationCap className="h-6 w-6" aria-hidden />
            </span>
            <div>
              <h1 className="text-xl font-bold text-foreground">My Student Profile</h1>
              <p className="text-sm text-muted-foreground">
                Your student record with the society — no approval required.
              </p>
            </div>
          </div>

          <dl className="mt-8 grid gap-x-6 gap-y-5 sm:grid-cols-2">
            {rows.map((row) => (
              <div
                key={row.label}
                className="rounded-xl border border-line bg-mist/60 p-4"
              >
                <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <row.icon className="h-3.5 w-3.5" aria-hidden />
                  {row.label}
                </dt>
                <dd className="mt-1.5 font-medium text-foreground">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </main>
    </div>
  );
}
