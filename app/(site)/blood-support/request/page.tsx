import type { Metadata } from "next";
import { AlertTriangle, PhoneCall, HeartPulse } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { BloodRequestForm } from "@/components/forms/blood-request-form";
import { getSettings } from "@/lib/queries";
import { getServerMessages } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerMessages();
  return {
    title: t.meta.bloodRequest.title,
    description: t.meta.bloodRequest.description,
  };
}

export default async function BloodRequestPage() {
  const [t, settings] = await Promise.all([getServerMessages(), getSettings()]);
  const emergency = settings.emergency ?? {};
  const helpline = typeof emergency.bloodHelpline === "string" ? emergency.bloodHelpline : "";

  return (
    <>
      <PageHero
        tone="crescent"
        eyebrow={t.bloodRequest.heroEyebrow}
        title={t.bloodRequest.heroTitle}
        description={t.bloodRequest.heroDescription}
      />
      <section className="bg-white">
        <div className="container-site grid gap-10 py-14 lg:grid-cols-[1fr_1.3fr] lg:py-20">
          <div className="space-y-5">
            {helpline && (
              <div className="rounded-2xl border border-crescent/25 bg-crescent-soft p-5">
                <p className="flex items-center gap-2 text-sm font-bold text-crescent">
                  <PhoneCall className="h-4 w-4" aria-hidden />
                  {t.bloodRequest.bloodHelpline}
                </p>
                <a href={`tel:${helpline}`} className="mt-1 block text-2xl font-bold text-crescent-dark">
                  {helpline}
                </a>
                <p className="mt-1 text-xs text-muted-foreground">{t.bloodRequest.callDirectly}</p>
              </div>
            )}
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
              <p className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="h-4 w-4" aria-hidden />
                {t.bloodRequest.beforeSubmitting}
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-amber-800/90">
                {t.bloodRequest.beforeSubmittingList.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-line bg-mist p-5 text-sm text-muted-foreground">
              <p className="flex items-center gap-2 font-semibold text-foreground">
                <HeartPulse className="h-4 w-4 text-crescent" aria-hidden />
                {t.bloodRequest.howItWorks}
              </p>
              <ol className="mt-2 list-inside list-decimal space-y-1">
                {t.bloodRequest.howItWorksList.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            </div>
          </div>
          <div className="rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold text-foreground">{t.bloodRequest.formTitle}</h2>
            <div className="mt-6">
              <BloodRequestForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
