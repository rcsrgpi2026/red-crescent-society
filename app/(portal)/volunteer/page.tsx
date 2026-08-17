import type { Metadata } from "next";
import Link from "next/link";
import {
  Hourglass,
  XCircle,
  ArrowLeft,
} from "lucide-react";
import { requireTeamMember } from "@/lib/auth";
import {
  getUpcomingEvents,
  getPublicActivities,
  getTeamMemberParticipation,
  getMyDonorContactRequests,
  getMyTrainingEnrollments,
  getMyCertificates,
  getSettings,
} from "@/lib/queries";
import {
  designFromSettings,
  memberFromTeamMember,
  buildCardConfig,
} from "@/lib/id-card/config";
import { MemberCardPanel } from "@/components/id-card/member-card-panel";
import { updateTeamMemberPhoto } from "@/lib/portal-actions";
import { TEAM_MEMBER_STATUS_LABELS } from "@/lib/constants";
import { StatusBadge, statusTone } from "@/components/shared/status-badge";
import { SiteLogo } from "@/components/layout/site-logo";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ParticipationPanel } from "@/components/team/participation-panel";
import { TeamMemberProfileEditor } from "@/components/team/team-member-profile-editor";
import { DonorContactNotifications } from "@/components/portal/donor-contact-notifications";
import { MyTrainings } from "@/components/team/my-trainings";
import { MyCertificates } from "@/components/team/my-certificates";

export const metadata: Metadata = {
  title: "Team Member Portal & Profile",
  description: "Manage your team member profile, photo, and participation at Rajshahi Polytechnic Institute Red Crescent Society.",
  robots: { index: false, follow: false },
};

export default async function TeamMemberPortalPage() {
  const { teamMember } = await requireTeamMember();

  let participationEvents: { id: string; title: string; date: string | null }[] = [];
  let participationActivities: { id: string; title: string; date: string | null }[] = [];
  let requests: Awaited<ReturnType<typeof getTeamMemberParticipation>> = [];
  let trainings: Awaited<ReturnType<typeof getMyTrainingEnrollments>> = [];
  let certificates: Awaited<ReturnType<typeof getMyCertificates>> = [];
  const [notifications, settings] = await Promise.all([
    getMyDonorContactRequests(),
    getSettings(),
  ]);
  const cardConfig = buildCardConfig(
    designFromSettings(settings),
    memberFromTeamMember(teamMember),
    teamMember.photo_url
  );

  if (teamMember.status === "APPROVED") {
    const [events, activities, ownRequests, ownTrainings, ownCertificates] =
      await Promise.all([
        getUpcomingEvents(12),
        getPublicActivities(),
        getTeamMemberParticipation(teamMember.id),
        getMyTrainingEnrollments(teamMember.id),
        getMyCertificates(teamMember.id),
      ]);
    participationEvents = events.map((e) => ({ id: e.id, title: e.title, date: e.date }));
    participationActivities = activities
      .slice(0, 12)
      .map((a) => ({ id: a.id, title: a.title, date: a.date }));
    requests = ownRequests;
    trainings = ownTrainings;
    certificates = ownCertificates;
  }

  return (
    <div className="min-h-screen bg-mist">
      {/* Portal header */}
      <header className="border-b border-line bg-white sticky top-0 z-30">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <SiteLogo variant="society" className="w-9 shrink-0" />
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-bold text-brand-dark">
                Team Member Portal
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
            <SignOutButton redirectTo="/volunteer/login" size="sm" />
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
          {teamMember.status === "PENDING" && <PendingNotice />}
          {teamMember.status === "REJECTED" && <RejectedNotice />}

          {/* Membership ID Card — design is set by admins, details come from this profile */}
          <MemberCardPanel
            config={cardConfig}
            title="Membership ID Card"
            description="Your official membership card — front and back. Download both sides together to keep a copy on your phone."
            onPhotoSaved={updateTeamMemberPhoto}
            photoFolder="volunteers"
            showBothSides
          />

          {/* Dedicated Profile & Photo Editor */}
          <TeamMemberProfileEditor teamMember={teamMember} />

          {/* Event & Activity Participation Panel (Approved Only) */}
          {teamMember.status === "APPROVED" && (
            <ParticipationPanel
              teamMemberId={teamMember.id}
              events={participationEvents}
              activities={participationActivities}
              requests={requests}
            />
          )}

          {/* Training Enrollments (Approved Only) */}
          {teamMember.status === "APPROVED" && <MyTrainings enrollments={trainings} />}

          {/* Issued Certificates (Approved Only) */}
          {teamMember.status === "APPROVED" && (
            <MyCertificates certificates={certificates} />
          )}
        </div>
      </main>
    </div>
  );

  function PendingNotice() {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-center shadow-sm sm:p-8">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <Hourglass className="h-6 w-6" aria-hidden />
        </span>
        <h2 className="mt-4 text-lg font-bold text-foreground">
          Application Pending Review
        </h2>
        <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted-foreground">
          Thanks, {teamMember.name}! Your team member application is currently being reviewed by the society leadership. You can complete and update your profile details and photo below while waiting for approval.
        </p>
        <div className="mt-4 inline-flex">
          <StatusBadge
            label={TEAM_MEMBER_STATUS_LABELS[teamMember.status] ?? teamMember.status}
            tone={statusTone(teamMember.status)}
          />
        </div>
      </div>
    );
  }

  function RejectedNotice() {
    return (
      <div className="rounded-3xl border border-line bg-white p-6 text-center shadow-sm sm:p-8">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-crescent-soft text-crescent">
          <XCircle className="h-6 w-6" aria-hidden />
        </span>
        <h2 className="mt-4 text-lg font-bold text-foreground">
          Application Not Approved
        </h2>
        <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted-foreground">
          Your team member application was reviewed but not approved at this time.
          You may contact the society leadership if you believe this was in error.
        </p>
        <div className="mt-4 inline-flex">
          <StatusBadge
            label={TEAM_MEMBER_STATUS_LABELS[teamMember.status] ?? teamMember.status}
            tone={statusTone(teamMember.status)}
          />
        </div>
      </div>
    );
  }
}
