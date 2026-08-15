import type { Metadata } from "next";
import Link from "next/link";
import {
  HeartHandshake,
  Hourglass,
  XCircle,
  ArrowLeft,
  BadgeCheck,
  Droplets,
  MapPin,
  CalendarDays,
  Building2,
  GraduationCap,
  Award,
} from "lucide-react";
import { requireVolunteer } from "@/lib/auth";
import { getUpcomingEvents, getPublicActivities, getVolunteerParticipation } from "@/lib/queries";
import { formatDate } from "@/lib/constants";
import { VOLUNTEER_STATUS_LABELS } from "@/lib/constants";
import { StatusBadge, statusTone } from "@/components/shared/status-badge";
import { SiteLogo } from "@/components/layout/site-logo";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ParticipationPanel } from "@/components/volunteer/participation-panel";

export const metadata: Metadata = {
  title: "Volunteer Portal",
  robots: { index: false, follow: false },
};

export default async function VolunteerPortalPage() {
  const { volunteer } = await requireVolunteer();

  // Approved volunteers can request to participate in upcoming events and
  // activities; the requests go to the admin for approval.
  let participationEvents: { id: string; title: string; date: string | null }[] = [];
  let participationActivities: { id: string; title: string; date: string | null }[] = [];
  let requests: Awaited<ReturnType<typeof getVolunteerParticipation>> = [];
  if (volunteer.status === "APPROVED") {
    const [events, activities, ownRequests] = await Promise.all([
      getUpcomingEvents(12),
      getPublicActivities(),
      getVolunteerParticipation(volunteer.id),
    ]);
    participationEvents = events.map((e) => ({ id: e.id, title: e.title, date: e.date }));
    participationActivities = activities
      .slice(0, 12)
      .map((a) => ({ id: a.id, title: a.title, date: a.date }));
    requests = ownRequests;
  }

  return (
    <div className="min-h-screen bg-mist">
      {/* Portal header */}
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <SiteLogo variant="society" className="w-9 shrink-0" />
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-bold text-brand-dark">
                Volunteer Portal
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
            <SignOutButton redirectTo="/volunteer/login" />
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

        <div className="mt-6">
          {volunteer.status === "PENDING" && <PendingNotice />}
          {volunteer.status === "REJECTED" && <RejectedNotice />}
          {volunteer.status === "APPROVED" && (
            <>
              <ApprovedProfile />
              <ParticipationPanel
                volunteerId={volunteer.id}
                events={participationEvents}
                activities={participationActivities}
                requests={requests}
              />
            </>
          )}
        </div>
      </main>
    </div>
  );

  function ApprovedProfile() {
    const rows = [
      { icon: Building2, label: "Department", value: volunteer.department },
      { icon: GraduationCap, label: "Semester", value: volunteer.semester },
      { icon: Droplets, label: "Blood group", value: volunteer.blood_group },
      { icon: MapPin, label: "Area", value: volunteer.area },
      { icon: CalendarDays, label: "Joined", value: formatDate(volunteer.joined_at) },
      { icon: Award, label: "Points", value: String(volunteer.points) },
    ];

    return (
      <div className="rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <HeartHandshake className="h-6 w-6" aria-hidden />
            </span>
            <div>
              <h1 className="text-xl font-bold text-foreground">{volunteer.name}</h1>
              <p className="text-sm text-muted-foreground">
                {volunteer.position ?? "Volunteer"}
                {volunteer.member_id ? ` · ${volunteer.member_id}` : ""}
              </p>
            </div>
          </div>
          <StatusBadge
            label={VOLUNTEER_STATUS_LABELS[volunteer.status] ?? volunteer.status}
            tone={statusTone(volunteer.status)}
          />
        </div>

        <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            You are an approved member of the Rajshahi Polytechnic Institute Red
            Crescent Society. Thank you for serving!
          </p>
        </div>

        <dl className="mt-6 grid gap-x-6 gap-y-5 sm:grid-cols-2">
          {rows.map((row) => (
            <div key={row.label} className="rounded-xl border border-line bg-mist/60 p-4">
              <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <row.icon className="h-3.5 w-3.5" aria-hidden />
                {row.label}
              </dt>
              <dd className="mt-1.5 font-medium text-foreground">
                {row.value || "—"}
              </dd>
            </div>
          ))}
        </dl>

        {(volunteer.skills?.length ?? 0) > 0 && (
          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Skills
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {volunteer.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand-ink"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  function PendingNotice() {
    return (
      <div className="rounded-2xl border border-line bg-white p-6 text-center shadow-sm sm:p-10">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <Hourglass className="h-7 w-7" aria-hidden />
        </span>
        <h1 className="mt-5 text-xl font-bold text-foreground">
          Application under review
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          Thanks, {volunteer.name}! Your volunteer application is{" "}
          <span className="font-semibold text-foreground">pending approval</span>{" "}
          from the society leadership. You will be able to access your full
          volunteer profile as soon as it is approved.
        </p>
        <div className="mt-6 inline-flex">
          <StatusBadge
            label={VOLUNTEER_STATUS_LABELS[volunteer.status] ?? volunteer.status}
            tone={statusTone(volunteer.status)}
          />
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          If you have questions, contact the society leadership through the
          website.
        </p>
      </div>
    );
  }

  function RejectedNotice() {
    return (
      <div className="rounded-2xl border border-line bg-white p-6 text-center shadow-sm sm:p-10">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-crescent-soft text-crescent">
          <XCircle className="h-7 w-7" aria-hidden />
        </span>
        <h1 className="mt-5 text-xl font-bold text-foreground">
          Application not approved
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          Your volunteer application was reviewed but not approved at this time.
          You may submit a new application, or contact the society leadership if
          you believe this is a mistake.
        </p>
        <div className="mt-6 inline-flex">
          <StatusBadge
            label={VOLUNTEER_STATUS_LABELS[volunteer.status] ?? volunteer.status}
            tone={statusTone(volunteer.status)}
          />
        </div>
      </div>
    );
  }
}
