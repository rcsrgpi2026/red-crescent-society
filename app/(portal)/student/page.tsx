import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Sparkles, Clock, CheckCircle2, XCircle, ArrowRight, UserPlus, BadgeCheck } from "lucide-react";
import { requireStudent } from "@/lib/auth";
import {
  getMyDonorContactRequests,
  getActiveRecruitmentCampaign,
  getMyVolunteerApplication,
  getStudentTeamMembership,
} from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { SiteLogo } from "@/components/layout/site-logo";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { StudentProfileEditor } from "@/components/student/student-profile-editor";
import { DonorContactNotifications } from "@/components/portal/donor-contact-notifications";
import { NotificationPreferencesForm } from "@/components/notifications/preference-form";
import { VolunteerAdmitCard } from "@/components/recruitment/volunteer-admit-card";
import { getMyNotificationPreferences } from "@/lib/notifications/actions";
import { formatDateTime } from "@/lib/constants";


export const metadata: Metadata = {
  title: "My Student Profile & Portal",
  description: "Manage your student account details and profile picture at Rajshahi Polytechnic Institute Red Crescent Society.",
  robots: { index: false, follow: false },
};

export default async function StudentPortalPage() {
  const { profile, student } = await requireStudent();
  const [notifications, notifPrefs, activeCampaign, myApplication, teamMembership] = await Promise.all([
    getMyDonorContactRequests(),
    getMyNotificationPreferences(),
    getActiveRecruitmentCampaign(),
    getMyVolunteerApplication(student.user_id || profile.id),
    getStudentTeamMembership(student.id, student.user_id || profile.id, student.email),
  ]);


  return (
    <div className="min-h-screen bg-mist print:bg-white print:min-h-0">
      {/* Portal header */}
      <header className="border-b border-line bg-white sticky top-0 z-30 print:hidden">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <SiteLogo variant="society" className="w-9 shrink-0" />
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-bold text-brand-dark">
                Student Account Portal
              </p>
              <p className="truncate text-xs text-muted-foreground">
                RGPI Red Crescent Youth
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {teamMembership && (
              <Link
                href="/volunteer"
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors"
              >
                <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />
                Volunteer Portal
              </Link>
            )}
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

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 print:max-w-none print:p-0 print:m-0">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand-dark print:hidden"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to website
        </Link>

        <div className="mt-6 space-y-6 print:mt-0 print:space-y-0">
          {/* Official RCY Team Member Status Card */}
          {teamMembership && (
            <div className="relative overflow-hidden rounded-3xl border border-emerald-300 bg-gradient-to-r from-[#033c27] via-brand to-emerald-700 p-6 text-white shadow-md sm:p-7 print:hidden">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3.5">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-emerald-200 shadow-sm border border-white/20">
                    <BadgeCheck className="h-7 w-7 text-emerald-300" />
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-emerald-400/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-200 uppercase tracking-wide border border-emerald-400/30">
                        Official RCY Member
                      </span>
                      {teamMembership.member_id && (
                        <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-mono font-semibold text-white">
                          ID: {teamMembership.member_id}
                        </span>
                      )}
                    </div>
                    <h3 className="mt-1.5 text-base font-bold text-white sm:text-lg">
                      Active Team Member · {teamMembership.position || "General Member"}
                    </h3>
                    <p className="mt-1 text-xs text-white/80 max-w-xl leading-relaxed">
                      You are an official active member of Rajshahi Polytechnic Institute Red Crescent Youth ({teamMembership.rcy_department || "Society-wide"}). You have full access to your digital ID card, event participation, certificates, and team portal.
                    </p>
                  </div>
                </div>
                <Button asChild size="sm" className="bg-white hover:bg-white/90 text-brand-dark font-bold shrink-0 gap-1.5 shadow-sm">
                  <Link href="/volunteer">
                    Volunteer Portal & ID Card
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          )}

          {/* Volunteer Application Review Status (if submitted and not yet a team member) */}
          {!teamMembership && myApplication && myApplication.status === "PENDING" && (
            <div className="rounded-3xl border border-amber-200 bg-amber-50/80 p-6 shadow-sm sm:p-7 print:hidden">
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
                        Pending Approval
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      Your volunteer application for <strong>{myApplication.recruitment_campaigns?.title || "Recruitment"}</strong> was submitted on{" "}
                      <strong>{formatDateTime(myApplication.created_at)}</strong>. Society leadership is currently reviewing it.
                    </p>
                    <p className="mt-2 text-xs font-semibold text-amber-800 bg-amber-100/60 inline-block px-2.5 py-1 rounded-lg">
                      ⏳ নোট: আবেদন অনুমোদিত হলে স্বয়ংক্রিয়ভাবে আপনার অফিসিয়াল রোল/ক্রমিক নম্বর ও প্রবেশ পত্র (Admit Card) এখানে প্রদর্শিত হবে।
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Volunteer Application Approved: Display Celebration & Official Admit Card Slip */}
          {myApplication && myApplication.status === "APPROVED" && (
            <div className="space-y-6 print:space-y-0">
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50/90 p-6 shadow-sm sm:p-7 print:hidden">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3.5">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 shadow-sm">
                      <CheckCircle2 className="h-6 w-6" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-foreground">
                          Volunteer Application Approved! 🎉
                        </h3>
                        <span className="rounded-full bg-emerald-600 text-white px-2.5 py-0.5 text-[11px] font-mono font-bold">
                          রোল/ক্রমিক নং: {myApplication.serial_no || myApplication.roll}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                        অভিনন্দন! আপনার স্বেচ্ছাসেবী ভর্তি আবেদনটি অনুমোদিত হয়েছে। নিচে আপনার অফিসিয়াল <strong>প্রবেশ পত্র (Admit Card)</strong> দেওয়া হলো। এটি সংরক্ষণ বা প্রিন্ট করে ইন্টারভিউ ও ভর্তি পরীক্ষার সময় সাথে রাখুন।
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Official Admit Card (প্রবেশ পত্র) Slip */}
              <div className="rounded-3xl border border-line bg-white p-3 sm:p-8 shadow-sm print:border-none print:p-0 print:shadow-none print:m-0">
                <VolunteerAdmitCard application={myApplication} />
              </div>
            </div>
          )}

          {!teamMembership && myApplication && myApplication.status === "REJECTED" && (
            <div className="rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-7 print:hidden">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3.5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-crescent-soft text-crescent shadow-sm">
                    <XCircle className="h-6 w-6" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-foreground">
                        Volunteer Application Status
                      </h3>
                      <span className="rounded-full bg-crescent-soft px-2.5 py-0.5 text-[11px] font-bold text-crescent uppercase">
                        Not Approved
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      Your volunteer application was reviewed by society leadership and was not approved at this time. You are eligible to submit a fresh application with updated details or documents.
                    </p>
                    {myApplication.rejection_reason && (
                      <p className="mt-2 text-xs font-medium text-foreground bg-mist/50 p-2.5 rounded-xl border border-line">
                        Feedback Note: {myApplication.rejection_reason}
                      </p>
                    )}
                  </div>
                </div>

                {activeCampaign && (
                  <Button asChild size="sm" className="bg-brand hover:bg-brand-dark text-white font-bold shrink-0 gap-1.5 shadow-sm">
                    <Link href="/apply-volunteer">
                      Apply Again
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Active Recruitment Invitation Banner (if no application and not a member) */}
          {!teamMembership && !myApplication && activeCampaign && (
            <div className="relative overflow-hidden rounded-3xl border border-brand/20 bg-gradient-to-r from-brand-dark via-[#043c28] to-brand p-6 text-white shadow-md sm:p-7 print:hidden">
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

          <div className="print:hidden">
            <DonorContactNotifications requests={notifications} />
          </div>
          <div className="print:hidden">
            <StudentProfileEditor student={student} />
          </div>

          {/* Smart Notification Preferences */}
          <div className="rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-8 space-y-4 print:hidden">
            <div>
              <h3 className="text-base font-bold text-foreground">Notification & Alert Preferences</h3>
              <p className="text-xs text-muted-foreground">
                Customize which alerts and categories you receive on your account.
              </p>
            </div>
            <NotificationPreferencesForm initialPreferences={notifPrefs} />
          </div>
        </div>
      </main>
    </div>
  );
}

