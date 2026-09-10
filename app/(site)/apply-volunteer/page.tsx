import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  Lock,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  LogIn,
  GraduationCap,
  HeartHandshake,
  UserCheck,
} from "lucide-react";
import {
  getActiveRecruitmentCampaign,
  getMyVolunteerApplication,
} from "@/lib/queries";
import { getCurrentUser, getProfile, getCurrentStudent } from "@/lib/auth";
import { isSemesterEligible, formatDateTime, VOLUNTEER_APPLICATION_STATUS_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { StatusBadge, statusTone } from "@/components/shared/status-badge";
import { VolunteerApplicationForm } from "@/components/recruitment/volunteer-application-form";

export const metadata: Metadata = {
  title: "Volunteer Recruitment Application | RGPI Red Crescent Youth",
  description: "Apply to become a volunteer at Rajshahi Govt. Polytechnic Institute Red Crescent Youth.",
};

export default async function ApplyVolunteerPage() {
  const [campaign, user, profile, student] = await Promise.all([
    getActiveRecruitmentCampaign(),
    getCurrentUser(),
    getProfile(),
    getCurrentStudent(),
  ]);

  // 1. If Recruitment is CLOSED
  if (!campaign || !campaign.is_active) {
    return (
      <div className="container-site min-h-[70vh] py-16 flex items-center justify-center">
        <div className="mx-auto max-w-lg rounded-3xl border border-line bg-white p-8 text-center shadow-sm sm:p-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-600">
            <Lock className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-foreground">
            Recruitment is Currently Closed
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Volunteer recruitment is not active at this moment. New recruitment rounds are announced on our homepage and notices board.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button asChild variant="outline">
              <Link href="/">Back to Homepage</Link>
            </Button>
            <Button asChild className="bg-brand hover:bg-brand-dark">
              <Link href="/notices">View Notices</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 2. If User is NOT LOGGED IN
  if (!user || !profile) {
    return (
      <div className="container-site min-h-[70vh] py-16 flex items-center justify-center">
        <div className="mx-auto max-w-lg rounded-3xl border border-line bg-white p-8 text-center shadow-sm sm:p-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-brand-dark">
            <GraduationCap className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-foreground">
            Student Account Required
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Volunteer recruitment is exclusively open to existing students of Rajshahi Govt. Polytechnic Institute. Please sign in with your student account to apply.
          </p>

          <div className="mt-8 space-y-3">
            <Button asChild size="lg" className="w-full gap-2 bg-brand hover:bg-brand-dark">
              <Link href="/student/login?redirect=/apply-volunteer">
                <LogIn className="h-4 w-4" />
                Sign in with Student Account
              </Link>
            </Button>
            <p className="text-xs text-muted-foreground">
              Don&apos;t have a student account yet?{" "}
              <Link href="/student/login" className="font-semibold text-brand hover:underline">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 3. If User is ALREADY a VOLUNTEER
  if (profile.role === "VOLUNTEER") {
    return (
      <div className="container-site min-h-[70vh] py-16 flex items-center justify-center">
        <div className="mx-auto max-w-lg rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-sm sm:p-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <UserCheck className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-foreground">
            You Are Already a Volunteer
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            You are an approved member of the RGPI Red Crescent Youth volunteer team. You can view your membership ID card, certificates, and activities in the member portal.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button asChild size="lg" className="bg-brand hover:bg-brand-dark">
              <Link href="/volunteer">Go to Volunteer Portal</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/">Back to Homepage</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 4. If User is a STUDENT: check existing application
  const existingApp = await getMyVolunteerApplication(user.id);

  if (existingApp && existingApp.campaign_id === campaign.id) {
    if (existingApp.status === "PENDING") {
      return (
        <div className="container-site min-h-[70vh] py-16 flex items-center justify-center">
          <div className="mx-auto max-w-lg rounded-3xl border border-amber-200 bg-white p-8 text-center shadow-sm sm:p-12">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <Clock className="h-7 w-7" />
            </div>
            <h1 className="mt-4 text-2xl font-bold text-foreground">
              Application Under Review
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Your volunteer application for <strong>{campaign.title}</strong> was submitted on{" "}
              <strong>{formatDateTime(existingApp.created_at)}</strong> and is currently under review by the society leadership.
            </p>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-4 py-1.5 text-xs font-bold text-amber-800">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              Status: 🟡 Under Review
            </div>

            <div className="mt-8 flex justify-center gap-3">
              <Button asChild size="lg" className="bg-brand hover:bg-brand-dark">
                <Link href="/student">View in Student Portal</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/">Back to Homepage</Link>
              </Button>
            </div>
          </div>
        </div>
      );
    }

    if (existingApp.status === "REJECTED") {
      return (
        <div className="container-site min-h-[70vh] py-16 flex items-center justify-center">
          <div className="mx-auto max-w-lg rounded-3xl border border-line bg-white p-8 text-center shadow-sm sm:p-12">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-crescent-soft text-crescent">
              <XCircle className="h-7 w-7" />
            </div>
            <h1 className="mt-4 text-2xl font-bold text-foreground">
              Application Reviewed
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Your application for this recruitment campaign was reviewed. Unfortunately, it was not approved at this time.
            </p>
            {existingApp.rejection_reason && (
              <div className="mt-4 rounded-xl border border-line bg-mist/50 p-3 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground">Note from leadership:</p>
                <p className="mt-1">{existingApp.rejection_reason}</p>
              </div>
            )}
            <div className="mt-8 flex justify-center gap-3">
              <Button asChild variant="outline">
                <Link href="/student">Student Portal</Link>
              </Button>
              <Button asChild className="bg-brand hover:bg-brand-dark">
                <Link href="/">Back to Homepage</Link>
              </Button>
            </div>
          </div>
        </div>
      );
    }
  }

  // 5. Check Semester Eligibility
  if (!student) {
    return (
      <div className="container-site min-h-[70vh] py-16 flex items-center justify-center">
        <div className="mx-auto max-w-lg rounded-3xl border border-line bg-white p-8 text-center shadow-sm sm:p-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-foreground">
            Complete Student Profile
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Please complete your student profile details before applying for volunteer recruitment.
          </p>
          <div className="mt-8">
            <Button asChild size="lg" className="bg-brand hover:bg-brand-dark">
              <Link href="/student">Go to Student Portal</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isEligible = isSemesterEligible(student.semester, campaign.allowed_semesters);

  if (student.semester && !isEligible) {
    return (
      <div className="container-site min-h-[70vh] py-16 flex items-center justify-center">
        <div className="mx-auto max-w-lg rounded-3xl border border-line bg-white p-8 text-center shadow-sm sm:p-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-foreground">
            Semester Not Eligible
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Sorry, your registered semester (<strong>{student.semester} Semester</strong>) is not eligible for the ongoing volunteer recruitment.
          </p>
          <div className="mt-4 rounded-2xl border border-line bg-mist/40 p-4 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">Eligible Semesters for this Campaign:</p>
            <p className="mt-1 font-medium text-brand">
              {campaign.allowed_semesters.map((s) => `${s} Semester`).join(", ")}
            </p>
          </div>
          <div className="mt-8 flex justify-center gap-3">
            <Button asChild variant="outline">
              <Link href="/student">Update Student Profile</Link>
            </Button>
            <Button asChild className="bg-brand hover:bg-brand-dark">
              <Link href="/">Back to Homepage</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 6. Eligible Student: Render Application Form
  return (
    <div className="min-h-screen bg-mist/60 py-12">
      <div className="container-site max-w-4xl space-y-8">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-brand-dark"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Homepage
        </Link>

        {/* Page Hero Header */}
        <div className="rounded-3xl border border-line bg-gradient-to-r from-brand-dark via-[#043c28] to-brand p-6 text-white shadow-md sm:p-10">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-white/75">
            <Sparkles className="h-4 w-4 text-crescent" />
            <span>Official Volunteer Recruitment</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-4xl">
            {campaign.popup_title || "Join RGPI Red Crescent Youth"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/85 sm:text-base">
            {campaign.popup_description ||
              "Become part of our humanitarian community, gain first aid & leadership skills, and serve society."}
          </p>

          <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-white/15 text-xs">
            <span className="rounded-full bg-white/10 px-3 py-1 text-white/90">
              Eligible: {campaign.allowed_semesters.map((s) => `${s} Sem`).join(", ")}
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-white/90">
              {campaign.title}
            </span>
          </div>
        </div>

        {/* Application Form */}
        <VolunteerApplicationForm campaign={campaign} student={student} />
      </div>
    </div>
  );
}
