import type { Metadata } from "next";
import Link from "next/link";
import { Droplets, Siren, ShieldCheck, HeartPulse, MapPin, Clock } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge, statusTone } from "@/components/shared/status-badge";
import { DonorSearch } from "@/components/blood/donor-search";
import { DonorCard } from "@/components/blood/donor-card";
import { DonorRegisterForm } from "@/components/forms/donor-register-form";
import { DonorSelfService } from "@/components/forms/donor-self-service";
import { ContactRequestRecovery } from "@/components/blood/contact-request-recovery";
import { getDonors, getPublicBloodRequests } from "@/lib/queries";
import { formatDate } from "@/lib/constants";
import { getServerLocale, getServerMessages } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerMessages();
  return {
    title: t.meta.blood.title,
    description: t.meta.blood.description,
  };
}

export default async function BloodSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ bloodGroup?: string; area?: string }>;
}) {
  const [t, locale, params] = await Promise.all([
    getServerMessages(),
    getServerLocale(),
    searchParams,
  ]);
  const [donors, requests] = await Promise.all([
    getDonors({ bloodGroup: params.bloodGroup, area: params.area }),
    getPublicBloodRequests(),
  ]);

  return (
    <>
      <PageHero
        tone="crescent"
        eyebrow={t.blood.heroEyebrow}
        title={t.blood.heroTitle}
        description={t.blood.heroDescription}
      >
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/blood-support/request"
            className="inline-flex items-center gap-2 rounded-full bg-crescent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-crescent-dark"
          >
            <Siren className="h-4 w-4" aria-hidden />
            {t.blood.requestBlood}
          </Link>
          <a
            href="#donor-registration"
            className="inline-flex items-center gap-2 rounded-full border border-crescent/30 bg-white px-5 py-2.5 text-sm font-semibold text-crescent transition-colors hover:bg-crescent-soft"
          >
            <Droplets className="h-4 w-4" aria-hidden />
            {t.blood.registerAsDonor}
          </a>
        </div>
      </PageHero>

      {/* How it works guide */}
      <section className="border-b border-line bg-mist/50">
        <div className="container-site py-12 lg:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-crescent">
            {t.blood.guideEyebrow}
          </p>
          <h2 className="mt-3 text-balance text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
            {t.blood.guideTitle}
          </h2>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {t.blood.guideSteps.map((step, i) => (
              <li
                key={step.title}
                className="rounded-2xl border border-line bg-white p-5 shadow-sm"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-crescent text-sm font-bold text-white shadow-sm shadow-crescent/20">
                  {i + 1}
                </span>
                <h3 className="mt-3 font-semibold text-foreground">{step.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Donor directory */}
      <section className="border-b border-line bg-white">
        <div className="container-site py-14 lg:py-20">
          <h2 className="text-2xl font-bold text-foreground">{t.blood.availableDonors}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t.blood.availableDonorsText}</p>
          <div className="mt-6">
            <DonorSearch current={{ bloodGroup: params.bloodGroup, area: params.area }} />
          </div>
          {donors.length > 0 ? (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {donors.map((donor) => (
                <DonorCard key={donor.id} donor={donor} />
              ))}
            </div>
          ) : (
            <div className="mt-8">
              <EmptyState
                icon={Droplets}
                title={
                  params.bloodGroup || params.area
                    ? t.blood.noDonorsMatch
                    : t.blood.noDonorsYet
                }
                description={
                  params.bloodGroup || params.area
                    ? t.blood.noDonorsMatchText
                    : t.blood.noDonorsYetText
                }
              />
            </div>
          )}
          <div className="mt-8 flex items-start gap-2.5 rounded-xl border border-brand/20 bg-brand-soft/60 p-4 text-sm text-brand-ink">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <p>
              <span className="font-semibold">{t.blood.privacyFirst}</span> {t.blood.privacyText}
            </p>
          </div>
        </div>
      </section>

      {/* Recent requests */}
      <section className="border-b border-line bg-mist/50">
        <div className="container-site py-14 lg:py-20">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-foreground">{t.blood.recentRequests}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t.blood.recentRequestsText}</p>
            </div>
            <Link
              href="/blood-support/request"
              className="text-sm font-semibold text-crescent hover:underline"
            >
              {t.blood.submitRequest}
            </Link>
          </div>
          {requests.length > 0 ? (
            <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-white">
              <ul className="divide-y divide-line">
                {requests.slice(0, 8).map((request) => (
                  <li key={request.id}>
                    <Link
                      href={`/blood-support/request/${request.id}`}
                      className="flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-4 transition-colors hover:bg-mist/60"
                    >
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                          request.emergency_level === "EMERGENCY"
                            ? "bg-crescent text-white"
                            : "bg-crescent-soft text-crescent"
                        }`}
                      >
                        {request.blood_group}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-foreground">{request.patient_name}</p>
                        <p className="flex flex-wrap items-center gap-x-4 text-xs text-muted-foreground">
                          {request.hospital && (
                            <span className="flex items-center gap-1">
                              <HeartPulse className="h-3 w-3" aria-hidden />
                              {request.hospital}
                            </span>
                          )}
                          {request.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" aria-hidden />
                              {request.location}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" aria-hidden />
                            {formatDate(request.required_date ?? request.created_at, locale === "bn" ? "bn-BD" : "en-GB")}
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {request.emergency_level === "EMERGENCY" && (
                          <StatusBadge label={t.status.emergencyLevel.EMERGENCY} tone="crescent" />
                        )}
                        <StatusBadge
                          label={t.status.bloodRequest[request.status] ?? request.status}
                          tone={statusTone(request.status)}
                        />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="mt-8">
              <EmptyState
                title={t.blood.noRequestsTitle}
                description={t.blood.noRequestsText}
              />
            </div>
          )}
        </div>
      </section>

      {/* Donor registration */}
      <section id="donor-registration" className="bg-white scroll-mt-24">
        <div className="container-site py-14 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-crescent">
              {t.blood.donateLife}
            </p>
            <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground">
              {t.blood.registerTitle}
            </h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              {t.blood.registerText}
            </p>
            <ul className="mt-6 space-y-3 text-sm text-foreground/80">
              {t.blood.registerBullets.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <HeartPulse className="mt-0.5 h-4 w-4 shrink-0 text-crescent" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold text-foreground">{t.blood.donorRegistration}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t.blood.donorRegistrationSub}</p>
            <div className="mt-6">
              <DonorRegisterForm />
            </div>
          </div>
        </div>

        {/* Manage an existing listing */}
        <div className="mt-6 rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-bold text-foreground">{t.blood.manageListingTitle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t.blood.manageListingText}</p>
          <div className="mt-5">
            <DonorSelfService />
          </div>
        </div>

        {/* Recover a lost contact-request tracking link */}
        <div className="mt-6 rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-bold text-foreground">{t.blood.lostLinkTitle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t.blood.lostLinkText}</p>
          <div className="mt-5">
            <ContactRequestRecovery strings={t.contactRequest} />
          </div>
        </div>
        </div>
      </section>
    </>
  );
}
