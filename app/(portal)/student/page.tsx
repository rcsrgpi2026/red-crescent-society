import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Sparkles, Clock, CheckCircle2, XCircle, ArrowRight, UserPlus } from "lucide-react";
import { requireStudent } from "@/lib/auth";
import {
  getMyDonorContactRequests,
  getActiveRecruitmentCampaign,
  getMyVolunteerApplication,
} from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { SiteLogo } from "@/components/layout/site-logo";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { StudentProfileEditor } from "@/components/student/student-profile-editor";
import { DonorContactNotifications } from "@/components/portal/donor-contact-notifications";
import { NotificationPreferencesForm } from "@/components/notifications/preference-form";
import { getMyNotificationPreferences } from "@/lib/notifications/actions";
import { formatDateTime } from "@/lib/constants";


export const metadata: Metadata = {
  title: "My Student Profile & Portal",
  description: "Manage your student account details and profile picture at Rajshahi Polytechnic Institute Red Crescent Society.",
  robots: { index: false, follow: false },
};

export default async function StudentPortalPage() {
  const { profile, student } = await requireStudent();
  const [notifications, notifPrefs, activeCampaign, myApplication] = await Promise.all([
    getMyDonorContactRequests(),
    getMyNotificationPreferences(),
    getActiveRecruitmentCampaign(),
    getMyVolunteerApplication(student.user_id || profile.id),
  ]);


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
                RPI Red Crescent Youth
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
          {/* Volunteer Application Review Status (if submitted) */}
          {myApplication && myApplication.status === "PENDING" && (
            <div className="rounded-3xl border border-amber-200 bg-amber-50/80 p-6 shadow-sm sm:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3.5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shadow-sm">
                    <Clock className="h-6 w-6" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-foreground">
                        Volunteer Application Under Review
                      </h3>
                      <span className="rounded-full bg-amber-200/80 px-2.5 py-0.5 text-[11px] font-bold text-amber-900 uppercase">
                        Pending
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      Your volunteer application for <strong>{myApplication.recruitment_campaigns?.title || "Recruitment"}</strong> was submitted on{" "}
                      <strong>{formatDateTime(myApplication.created_at)}</strong>. Society leadership is reviewing your application.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {myApplication && myApplication.status === "APPROVED" && (
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50/80 p-6 shadow-sm sm:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3.5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 shadow-sm">
                    <CheckCircle2 className="h-6 w-6" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      Volunteer Application Approved! 🎉
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      Congratulations! Your volunteer membership has been approved. You can now access the official Team Member Portal and your digital ID card.
                    </p>
                  </div>
                </div>
                <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0">
                  <Link href="/volunteer">Go to Volunteer Portal</Link>
                </Button>
              </div>
            </div>
          )}

          {myApplication && myApplication.status === "REJECTED" && (
            <div className="rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-7">
              <div className="flex items-start gap-3.5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-crescent-soft text-crescent shadow-sm">
                  <XCircle className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Volunteer Application Status
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    Your volunteer application was reviewed by society leadership and was not approved at this time.
                  </p>
                  {myApplication.rejection_reason && (
                    <p className="mt-2 text-xs font-medium text-foreground bg-mist/50 p-2.5 rounded-xl border border-line">
                      Note: {myApplication.rejection_reason}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Active Recruitment Invitation Banner (if no application yet) */}
          {!myApplication && activeCampaign && (
            <div className="relative overflow-hidden rounded-3xl border border-brand/20 bg-gradient-to-r from-brand-dark via-[#043c28] to-brand p-6 text-white shadow-md sm:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3.5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white shadow-sm border border-white/20">
                    <UserPlus className="h-6 w-6" />
                  </span>
                  <div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-crescent-soft">
                      <Sparkles className="h-3 w-3" />
                      Recruitment Open
                    </span>
                    <h3 className="mt-0.5 text-base font-bold text-white sm:text-lg">
                      {activeCampaign.popup_title}
                    </h3>
                    <p className="mt-1 text-xs text-white/80 max-w-xl leading-relaxed">
                      {activeCampaign.popup_description}
                    </p>
                  </div>
                </div>
                <Button asChild size="sm" className="bg-crescent hover:bg-crescent-dark text-white font-semibold shrink-0 gap-1.5 shadow-sm">
                  <Link href="/apply-volunteer">
                    Apply for Volunteer
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          )}

          <DonorContactNotifications requests={notifications} />
          <StudentProfileEditor student={student} />


          {/* Smart Notification Preferences */}
          <div className="rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-8 space-y-4">
            <div>
              <h3 className="text-base font-bold text-foreground">Notification & Alert Preferences</h3>
              <p className="text-xs text-muted-foreground">
                Customize which alerts you receive and manage quiet hours for your account.
              </p>
            </div>
            <NotificationPreferencesForm initialPreferences={notifPrefs} />
          </div>
        </div>
      </main>
    </div>
  );
}

