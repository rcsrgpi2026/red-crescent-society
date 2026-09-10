import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { ContactRequestTracker } from "@/components/blood/contact-request-tracker";
import { getServerMessages } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerMessages();
  return {
    title: t.meta.bloodContact.title,
    description: t.meta.bloodContact.description,
    robots: { index: false, follow: false },
  };
}

export default async function ContactRequestStatusPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getServerMessages();

  return (
    <>
      <PageHero
        tone="crescent"
        eyebrow={t.contactRequest.heroEyebrow}
        title={t.contactRequest.heroTitle}
        description={t.contactRequest.heroDescription}
      />

      <section className="bg-white">
        <div className="container-site py-12 lg:py-16">
          <Link
            href="/blood-support"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand-dark"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {t.contactRequest.backToBloodSupport}
          </Link>

          <div className="mt-6 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
            {/* Tracker card */}
            <div className="overflow-hidden rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-8">
              <div className="border-b border-line pb-6">
                <h1 className="text-2xl font-bold text-foreground">
                  {t.contactRequest.trackingTitle}
                </h1>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t.contactRequest.trackingId}: <span className="font-mono">{id}</span>
                </p>
              </div>

              {/* Quick how-to guide */}
              <div className="mt-5 rounded-2xl border border-brand/20 bg-brand-soft/60 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-brand-dark">
                  {t.contactRequest.pageGuideTitle}
                </p>
                <ol className="mt-2 space-y-1.5">
                  {t.contactRequest.pageGuideSteps.map((step, i) => (
                    <li key={step} className="flex items-start gap-2 text-xs leading-relaxed text-brand-ink/90">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="mt-6">
                <ContactRequestTracker requestId={id} strings={t.contactRequest} />
              </div>
            </div>

            {/* Privacy & guidance side */}
            <div className="space-y-5">
              <div className="rounded-3xl border border-brand/20 bg-brand-soft/60 p-6">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-dark">
                  <ShieldCheck className="h-4 w-4 text-brand" aria-hidden />
                  {t.contactRequest.privacyTitle}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-brand-ink/90">
                  {t.contactRequest.privacyText}
                </p>
              </div>

              <div className="rounded-3xl border border-crescent/30 bg-crescent-soft p-6 text-sm text-crescent-dark">
                <p className="font-bold">{t.contactRequest.howItWorksTitle}</p>
                <ul className="mt-3 list-inside list-disc space-y-1.5 text-xs leading-relaxed text-crescent-dark/90">
                  <li>{t.contactRequest.howItWorksStep1}</li>
                  <li>{t.contactRequest.howItWorksStep2}</li>
                  <li>{t.contactRequest.howItWorksStep3}</li>
                </ul>
              </div>

              <div className="rounded-3xl border border-line bg-mist/60 p-6 text-center">
                <p className="text-sm font-semibold text-foreground">
                  {t.contactRequest.needHelpTitle}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t.contactRequest.needHelpText}
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <Link
                    href="/blood-support"
                    className="rounded-full bg-crescent px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-crescent-dark"
                  >
                    {t.blood.availableDonors}
                  </Link>
                  <Link
                    href="/blood-support/request"
                    className="rounded-full border border-line bg-white px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-mist"
                  >
                    {t.blood.requestBlood}
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
