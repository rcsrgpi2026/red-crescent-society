import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  User,
  GraduationCap,
  Hash,
  Building2,
  Calendar,
  Mail,
  Phone,
  Droplets,
  HeartHandshake,
  FileText,
  Clock,
  Sparkles,
  CheckCircle2,
  XCircle,
  Shield,
  Layers,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { StatusBadge, statusTone } from "@/components/shared/status-badge";
import { Reveal } from "@/components/shared/reveal";
import { Button } from "@/components/ui/button";
import { ApplicationReviewActions } from "@/components/admin/application-review-actions";
import { adminGetVolunteerApplication } from "@/lib/queries";
import { formatDateTime, VOLUNTEER_APPLICATION_STATUS_LABELS } from "@/lib/constants";

export const metadata = {
  title: "Volunteer Application Details",
  robots: { index: false, follow: false },
};

export default async function AdminApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const application = await adminGetVolunteerApplication(id);

  if (!application) {
    notFound();
  }

  const studentOverview = [
    { icon: User, label: "Full Name", value: application.name },
    { icon: Hash, label: "Roll Number", value: application.roll },
    { icon: Layers, label: "College Reg. No.", value: application.registration_no || "—" },
    { icon: Calendar, label: "Academic Session", value: application.session },
    { icon: Building2, label: "Department", value: application.department },
    { icon: GraduationCap, label: "Semester", value: `${application.semester} Semester` },
    { icon: Mail, label: "Email Address", value: application.email },
  ];

  const contactEmergency = [
    { icon: Phone, label: "Mobile Number", value: application.phone },
    { icon: Droplets, label: "Blood Group", value: application.blood_group || "—" },
    { icon: User, label: "Emergency Contact", value: application.emergency_contact_name },
    { icon: Phone, label: "Emergency Phone", value: application.emergency_contact_phone },
  ];

  return (
    <div className="space-y-8">
      {/* Back Link */}
      <Link
        href="/admin/recruitment/applications"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to all applications
      </Link>

      {/* Header Banner */}
      <div className="rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-dark text-xl font-bold text-white shadow-md shadow-brand/20">
              {application.name.charAt(0)}
            </span>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-foreground sm:text-2xl">
                  {application.name}
                </h1>
                <StatusBadge
                  label={
                    VOLUNTEER_APPLICATION_STATUS_LABELS[application.status] ??
                    application.status
                  }
                  tone={statusTone(application.status)}
                />
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                Applied on {formatDateTime(application.created_at)} · Campaign:{" "}
                <span className="font-semibold text-foreground">
                  {application.recruitment_campaigns?.title || "Recruitment"}
                </span>
              </p>
            </div>
          </div>

          <ApplicationReviewActions application={application} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Academic & Contact Details (2 cols) */}
        <div className="space-y-6 lg:col-span-2">
          {/* 1. Verified Student Academic Profile */}
          <Reveal>
            <div className="rounded-3xl border border-line bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-line pb-3">
                <Shield className="h-4 w-4 text-brand" />
                <h2 className="text-base font-bold text-foreground">
                  Verified Student Profile Information
                </h2>
              </div>

              <dl className="grid gap-3 sm:grid-cols-2">
                {studentOverview.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-line bg-mist/30 p-3.5"
                  >
                    <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <item.icon className="h-3.5 w-3.5 text-brand" />
                      {item.label}
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-foreground">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>

          {/* 2. Motivation & Volunteer Experience */}
          <Reveal delay={0.05}>
            <div className="rounded-3xl border border-line bg-white p-6 shadow-sm space-y-6">
              <div className="flex items-center gap-2 border-b border-line pb-3">
                <HeartHandshake className="h-4 w-4 text-brand" />
                <h2 className="text-base font-bold text-foreground">
                  Volunteer Motivation & Background
                </h2>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Why do you want to join RGPI Red Crescent Youth?
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground whitespace-pre-wrap rounded-2xl bg-mist/30 border border-line p-4">
                  {application.motivation}
                </p>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Previous Volunteering Experience
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground whitespace-pre-wrap rounded-2xl bg-mist/30 border border-line p-4">
                  {application.previous_volunteer_experience || "No previous experience mentioned."}
                </p>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Skills & Areas of Interest
                </h3>
                {application.skills && application.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {application.skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-dark"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">None specified</p>
                )}
              </div>
            </div>
          </Reveal>
        </div>

        {/* Right Column: Contact, Emergency & Review Status */}
        <div className="space-y-6">
          {/* Contact & Emergency */}
          <Reveal delay={0.1}>
            <div className="rounded-3xl border border-line bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-line pb-3">
                <Phone className="h-4 w-4 text-brand" />
                <h2 className="text-base font-bold text-foreground">
                  Contact & Emergency Info
                </h2>
              </div>

              <dl className="space-y-3">
                {contactEmergency.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-line bg-mist/30 p-3.5"
                  >
                    <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <item.icon className="h-3.5 w-3.5 text-brand" />
                      {item.label}
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-foreground">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>

          {/* Review Audit / Feedback Log */}
          {application.status !== "PENDING" && (
            <Reveal delay={0.15}>
              <div className="rounded-3xl border border-line bg-white p-6 shadow-sm space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Review Log
                </h3>
                <div className="text-xs space-y-2 text-muted-foreground">
                  <p>
                    Status:{" "}
                    <strong className="text-foreground">{application.status}</strong>
                  </p>
                  {application.reviewed_at && (
                    <p>
                      Reviewed on:{" "}
                      <strong className="text-foreground">
                        {formatDateTime(application.reviewed_at)}
                      </strong>
                    </p>
                  )}
                  {application.rejection_reason && (
                    <div className="rounded-xl border border-crescent/20 bg-crescent-soft/60 p-3 text-crescent-dark mt-2">
                      <p className="font-semibold text-xs text-crescent">
                        Rejection Note:
                      </p>
                      <p className="mt-1 text-xs">{application.rejection_reason}</p>
                    </div>
                  )}
                </div>
              </div>
            </Reveal>
          )}
        </div>
      </div>
    </div>
  );
}
