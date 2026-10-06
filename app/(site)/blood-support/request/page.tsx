import { Suspense } from "react";
import type { Metadata } from "next";
import { AlertTriangle, PhoneCall, HeartPulse } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { BloodRequestForm } from "@/components/forms/blood-request-form";
import { getSettings, getFormConfigs } from "@/lib/queries";
import { getServerMessages } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerMessages();
  return {
    title: t.meta.bloodRequest.title,
    description: t.meta.bloodRequest.description,
  };
}

export default async function BloodRequestPage() {
  const [t, settings, formConfigs] = await Promise.all([
    getServerMessages(),
    getSettings(),
    getFormConfigs(),
  ]);
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
      <section className="bg-slate-50/50 py-10 sm:py-14 lg:py-16">
        <div className="container-site max-w-4xl space-y-8 sm:space-y-10">
          {/* Blood Request Form */}
          <div className="rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-8 md:p-10">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">{t.bloodRequest.formTitle}</h2>
            <div className="mt-6">
              <Suspense fallback={<div className="h-64 flex items-center justify-center text-sm text-muted-foreground">ফরম লোড হচ্ছে...</div>}>
                <BloodRequestForm fields={formConfigs.blood_request.fields} />
              </Suspense>
            </div>
          </div>

          {/* Guidelines & Info Cards Directly Below Form */}
          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 text-sm text-amber-800 shadow-2xs">
              <p className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-700" aria-hidden />
                {t.bloodRequest.beforeSubmitting}
              </p>
              <ul className="mt-2.5 list-inside list-disc space-y-1.5 text-xs sm:text-sm text-amber-800/90 leading-relaxed">
                {t.bloodRequest.beforeSubmittingList.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-line bg-white p-5 text-sm text-muted-foreground shadow-2xs">
              <p className="flex items-center gap-2 font-semibold text-foreground">
                <HeartPulse className="h-4 w-4 shrink-0 text-crescent" aria-hidden />
                {t.bloodRequest.howItWorks}
              </p>
              <ol className="mt-2.5 list-inside list-decimal space-y-1.5 text-xs sm:text-sm leading-relaxed">
                {t.bloodRequest.howItWorksList.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            </div>

            {helpline && (
              <div className="sm:col-span-2 rounded-2xl border border-crescent/25 bg-crescent-soft/60 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-2xs">
                <div>
                  <p className="flex items-center gap-2 text-sm font-bold text-crescent">
                    <PhoneCall className="h-4 w-4" aria-hidden />
                    {t.bloodRequest.bloodHelpline}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{t.bloodRequest.callDirectly}</p>
                </div>
                <a
                  href={`tel:${helpline}`}
                  className="inline-flex items-center justify-center rounded-xl bg-crescent px-5 py-2.5 text-lg font-bold text-white shadow-xs hover:bg-crescent-dark transition-colors"
                >
                  {helpline}
                </a>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
