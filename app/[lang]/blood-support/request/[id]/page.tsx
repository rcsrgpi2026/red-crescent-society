import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  HeartPulse,
  MapPin,
  Clock,
  Droplets,
  Building2,
  PhoneCall,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { StatusBadge, statusTone } from "@/components/shared/status-badge";
import { getPublicBloodRequestById, getSettings } from "@/lib/queries";
import { formatDate, BLOOD_REQUEST_STATUS_LABELS } from "@/lib/constants";
import { getServerLocale, getServerMessages } from "@/lib/i18n/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const request = await getPublicBloodRequestById(id);
  if (!request) return { title: "Blood Request Status" };
  return {
    title: `Blood Request for ${request.patient_name} (${request.blood_group}) — Status`,
    description: `Tracking blood request status for ${request.patient_name}, ${request.blood_group} at ${request.hospital || request.location || "Rajshahi"}.`,
    robots: { index: false, follow: false },
  };
}

export default async function BloodRequestStatusPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [t, locale, request, settings] = await Promise.all([
    getServerMessages(),
    getServerLocale(),
    getPublicBloodRequestById(id),
    getSettings(),
  ]);

  if (!request) notFound();

  const emergency = settings.emergency ?? {};
  const helpline = typeof emergency.bloodHelpline === "string" ? emergency.bloodHelpline : "";

  const statusLabel =
    t.status.bloodRequest[request.status] ??
    BLOOD_REQUEST_STATUS_LABELS[request.status] ??
    request.status;

  const isEmergency = request.emergency_level === "EMERGENCY";

  return (
    <>
      <PageHero
        tone="crescent"
        eyebrow="Blood Support Service"
        title="Blood Request Tracking"
        description="Real-time status of the blood requirement coordinate by the Red Crescent team."
      />

      <section className="bg-white">
        <div className="container-site py-12 lg:py-16">
          <Link
            href="/blood-support"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand-dark"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to Blood Support
          </Link>

          <div className="mt-6 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
            {/* Status card */}
            <div className="overflow-hidden rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
                <div className="flex items-center gap-3.5">
                  <span
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-xl font-bold ${
                      isEmergency
                        ? "bg-crescent text-white shadow-md shadow-crescent/20"
                        : "bg-crescent-soft text-crescent"
                    }`}
                  >
                    {request.blood_group}
                  </span>
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">
                      {request.patient_name}
                    </h1>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Tracking ID: <span className="font-mono">{request.id}</span>
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {isEmergency && (
                    <StatusBadge label={t.status.emergencyLevel.EMERGENCY} tone="crescent" />
                  )}
                  <StatusBadge label={statusLabel} tone={statusTone(request.status)} />
                </div>
              </div>

              {/* Status explanation */}
              <div className="mt-6 rounded-2xl border border-brand/20 bg-brand-soft/60 p-5">
                <p className="flex items-center gap-2 text-sm font-bold text-brand-dark">
                  <CheckCircle2 className="h-4 w-4 text-brand" aria-hidden />
                  Current Request Progress
                </p>
                <p className="mt-1 text-sm leading-relaxed text-brand-ink/90">
                  {request.status === "PENDING" &&
                    "Your request has been received. Our volunteer coordinator is verifying patient requirements and reaching out to eligible blood donors."}
                  {request.status === "CONTACTING_DONOR" &&
                    "We are actively contacting registered donors in your area for immediate donation."}
                  {request.status === "DONOR_FOUND" &&
                    "A donor has agreed to donate! The coordinator is connecting the donor with the patient attendant."}
                  {request.status === "COMPLETED" &&
                    "Blood donation has been completed successfully. Thank you to the donor and volunteers!"}
                  {request.status === "CANCELLED" &&
                    "This request was marked as cancelled."}
                </p>
              </div>

              {/* Details grid */}
              <dl className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-line bg-mist/40 p-4">
                  <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <Droplets className="h-3.5 w-3.5 text-crescent" aria-hidden />
                    Units Required
                  </dt>
                  <dd className="mt-1 text-base font-bold text-foreground">
                    {request.units} {request.units === 1 ? "Bag" : "Bags"}
                  </dd>
                </div>

                <div className="rounded-2xl border border-line bg-mist/40 p-4">
                  <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 text-poly" aria-hidden />
                    Requested Date
                  </dt>
                  <dd className="mt-1 text-base font-bold text-foreground">
                    {formatDate(
                      request.required_date ?? request.created_at,
                      locale === "bn" ? "bn-BD" : "en-GB"
                    )}
                    {request.required_time ? ` · ${request.required_time}` : ""}
                  </dd>
                </div>

                <div className="rounded-2xl border border-line bg-mist/40 p-4 sm:col-span-2">
                  <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5 text-brand" aria-hidden />
                    Hospital / Location
                  </dt>
                  <dd className="mt-1 text-base font-semibold text-foreground">
                    {[request.hospital, request.location].filter(Boolean).join(" — ") || "Rajshahi"}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Helpline & Guidance side */}
            <div className="space-y-5">
              {helpline && (
                <div className="rounded-3xl border border-crescent/30 bg-crescent-soft p-6">
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-crescent">
                    <PhoneCall className="h-4 w-4" aria-hidden />
                    Emergency Blood Helpline
                  </p>
                  <a
                    href={`tel:${helpline}`}
                    className="mt-2 block text-2xl font-bold text-crescent-dark hover:underline"
                  >
                    {helpline}
                  </a>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    If this is a critical emergency, call our emergency hotline directly for immediate assistance.
                  </p>
                </div>
              )}

              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
                <p className="flex items-center gap-2 font-bold">
                  <AlertTriangle className="h-4 w-4" aria-hidden />
                  Attendant Guidelines
                </p>
                <ul className="mt-3 list-inside list-disc space-y-1.5 text-xs leading-relaxed text-amber-800">
                  <li>Keep patient blood requisition slip ready for the donor.</li>
                  <li>Ensure cross-matching facility is available at the hospital.</li>
                  <li>Notify the society coordinator once blood has been received.</li>
                </ul>
              </div>

              <div className="rounded-3xl border border-line bg-mist/60 p-6 text-center">
                <p className="text-sm font-semibold text-foreground">Need another blood unit?</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Submit a new request or search for available donors in the directory.
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <Link
                    href="/blood-support/request"
                    className="rounded-full bg-crescent px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-crescent-dark"
                  >
                    New Request
                  </Link>
                  <Link
                    href="/blood-support"
                    className="rounded-full border border-line bg-white px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-mist"
                  >
                    Find Donors
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
