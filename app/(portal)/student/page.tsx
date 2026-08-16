import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireStudent } from "@/lib/auth";
import { getMyDonorContactRequests } from "@/lib/queries";
import { SiteLogo } from "@/components/layout/site-logo";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { StudentProfileEditor } from "@/components/student/student-profile-editor";
import { DonorContactNotifications } from "@/components/portal/donor-contact-notifications";

export const metadata: Metadata = {
  title: "My Student Profile & Portal",
  description: "Manage your student account details and profile picture at Rajshahi Polytechnic Institute Red Crescent Society.",
  robots: { index: false, follow: false },
};

export default async function StudentPortalPage() {
  const { student } = await requireStudent();
  const notifications = await getMyDonorContactRequests();

  return (
    <div className="min-h-screen bg-mist">
      {/* Portal header */}
      <header className="border-b border-line bg-white sticky top-0 z-30">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <SiteLogo variant="society" className="w-9 shrink-0" />
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-bold text-brand-dark">
                Student Account Portal
              </p>
              <p className="truncate text-xs text-muted-foreground">
                RPI Red Crescent Society
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Link
              href="/"
              className="text-xs font-semibold text-brand hover:underline hidden sm:inline-block"
            >
              Visit website
            </Link>
            <SignOutButton redirectTo="/student/login" size="sm" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand-dark"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to website
        </Link>

        <div className="mt-6 space-y-6">
          <DonorContactNotifications requests={notifications} />
          <StudentProfileEditor student={student} />
        </div>
      </main>
    </div>
  );
}
