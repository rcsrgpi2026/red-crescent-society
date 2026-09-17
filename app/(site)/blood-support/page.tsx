import type { Metadata } from "next";
import Link from "next/link";
import { Droplets, Siren, ShieldCheck, HeartPulse, MapPin, Clock } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge, statusTone } from "@/components/shared/status-badge";
import { DonorDirectory } from "@/components/blood/donor-directory";
import { DonorRegisterForm } from "@/components/forms/donor-register-form";
import { DonorSelfService } from "@/components/forms/donor-self-service";
import { ContactRequestRecovery } from "@/components/blood/contact-request-recovery";
import { BloodGuideModal } from "@/components/blood/blood-guide-modal";
import { getDonors, getPublicBloodRequests, getDonorGroupCounts } from "@/lib/queries";
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
  const [allDonors, allRequests, groupCounts] = await Promise.all([
    getDonors(),
    getPublicBloodRequests(),
    getDonorGroupCounts(),
  ]);

  // Only show active/ongoing blood requests (hide COMPLETED and CANCELLED to prevent donor confusion)
  const activeRequests = allRequests.filter(
    (r) => r.status !== "COMPLETED" && r.status !== "CANCELLED"
  );
  const completedCount = allRequests.filter((r) => r.status === "COMPLETED").length;

  return (
    <>
      <PageHero
        tone="crescent"
        compact
        eyebrow={t.blood.heroEyebrow}
        title={t.blood.heroTitle}
        description={t.blood.heroDescription}
      >
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <Link
            href="/blood-support/request"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-crescent px-5 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-bold text-white shadow-md shadow-crescent/25 transition-all hover:bg-crescent-dark hover:shadow-lg hover:shadow-crescent/30 active:scale-95"
          >
            <Siren className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
            {t.blood.requestBlood}
          </Link>
          <a
            href="#donor-registration"
            className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-crescent/30 bg-white px-5 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-bold text-crescent shadow-xs transition-all hover:bg-crescent-soft hover:border-crescent active:scale-95"
          >
            <Droplets className="h-4 w-4 sm:h-5 sm:w-5 text-crescent" aria-hidden />
            {t.blood.registerAsDonor}
          </a>
          <BloodGuideModal />
        </div>
      </PageHero>

      {/* Recent blood requests (placed above donors for immediate emergency visibility) */}
      <section className="border-b border-line bg-white">
        <div className="container-site py-7 sm:py-10 lg:py-12">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="flex h-2 w-2 rounded-full bg-crescent animate-ping" />
                <h2 className="text-2xl font-bold text-foreground">{t.blood.recentRequests}</h2>
                {completedCount > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
                    ✨ সফল রক্তদান: {completedCount} জন
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                এই মুহূর্তে যেসব রোগীর জরুরি রক্তের প্রয়োজন (সক্রিয় অনুরোধসমূহ)
              </p>
            </div>
            <div className="w-full sm:w-auto flex justify-center sm:justify-end">
              <Link
                href="/blood-support/request"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-crescent/30 bg-crescent-soft px-4.5 py-2 text-xs sm:text-sm font-bold text-crescent shadow-2xs transition-all hover:bg-crescent hover:text-white active:scale-95"
              >
                <HeartPulse className="h-4 w-4" />
                {t.blood.submitRequest}
              </Link>
            </div>
          </div>
          {activeRequests.length > 0 ? (
            <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-white shadow-xs">
              <ul className="divide-y divide-line">
                {activeRequests.slice(0, 8).map((request) => (
                  <li key={request.id}>
                    <Link
                      href={`/blood-support/request/${request.id}`}
                      className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 gap-y-2 px-4 py-4 transition-colors hover:bg-mist/60 sm:flex sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-2 sm:px-5"
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
                      <div className="min-w-0 sm:flex-1">
                        <p className="font-semibold text-foreground sm:truncate">{request.patient_name}</p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          {request.hospital && (
                            <span className="flex min-w-0 items-center gap-1">
                              <HeartPulse className="h-3 w-3 shrink-0" aria-hidden />
                              <span className="min-w-0">{request.hospital}</span>
                            </span>
                          )}
                          {request.location && (
                            <span className="flex min-w-0 items-center gap-1">
                              <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                              <span className="min-w-0">{request.location}</span>
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 shrink-0" aria-hidden />
                            {formatDate(request.required_date ?? request.created_at, locale === "bn" ? "bn-BD" : "en-GB")}
                          </span>
                        </p>
                      </div>
                      <div className="col-span-2 flex flex-wrap items-center gap-2 sm:col-span-1 sm:ml-auto">
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
            <div className="mt-6">
              <EmptyState
                icon={HeartPulse}
                title="বর্তমানে কোনো সক্রিয় রক্তের অনুরোধ নেই"
                description="আলহামদুলিল্লাহ, পূর্বের রক্তের অনুরোধগুলো সফলভাবে সম্পন্ন হয়েছে। নতুন কোনো রোগীর জরুরি রক্তের প্রয়োজন হলে উপরের বাটনে ক্লিক করে অনুরোধ জানাতে পারেন।"
              />
            </div>
          )}
        </div>
      </section>

      {/* Donor directory */}
      <section className="border-b border-line bg-mist/40">
        <div className="container-site py-7 sm:py-10 lg:py-12">
          <DonorDirectory
            allDonors={allDonors}
            initialBloodGroup={params.bloodGroup}
            initialArea={params.area}
            counts={groupCounts}
            texts={{
              availableDonors: t.blood.availableDonors,
              availableDonorsText: t.blood.availableDonorsText,
              noDonorsMatch: t.blood.noDonorsMatch,
              noDonorsMatchText: t.blood.noDonorsMatchText,
              noDonorsYet: t.blood.noDonorsYet,
              noDonorsYetText: t.blood.noDonorsYetText,
              privacyFirst: t.blood.privacyFirst,
              privacyText: t.blood.privacyText,
            }}
          />
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

      {/* How it works guide - bottom placement right above footer */}
      <section className="border-t border-line bg-mist/50">
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
    </>
  );
}
