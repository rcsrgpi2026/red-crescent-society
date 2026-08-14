import type { Metadata } from "next";
import { ShieldPlus, HeartPulse, Award, BadgeCheck } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { JoinForm } from "@/components/forms/join-form";
import { getServerMessages } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerMessages();
  return {
    title: t.meta.join.title,
    description: t.meta.join.description,
  };
}

export default async function JoinPage() {
  const t = await getServerMessages();

  const PERKS = [
    { icon: ShieldPlus, ...t.join.perks[0] },
    { icon: HeartPulse, ...t.join.perks[1] },
    { icon: Award, ...t.join.perks[2] },
    { icon: BadgeCheck, ...t.join.perks[3] },
  ];

  return (
    <>
      <PageHero
        eyebrow={t.join.heroEyebrow}
        title={t.join.heroTitle}
        description={t.join.heroDescription}
      />
      <section className="bg-white">
        <div className="container-site grid gap-12 py-14 lg:grid-cols-[1fr_1.25fr] lg:py-20">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{t.join.whatYouGain}</h2>
            <div className="mt-6 space-y-4">
              {PERKS.map((perk) => (
                <div key={perk.title} className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                    <perk.icon className="h-5 w-5" aria-hidden />
                  </span>
                  <div>
                    <p className="font-semibold text-foreground">{perk.title}</p>
                    <p className="text-sm text-muted-foreground">{perk.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-2xl border border-line bg-mist p-5 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">{t.join.afterYouApply}</p>
              <p className="mt-1.5 leading-relaxed">{t.join.afterYouApplyText}</p>
            </div>
          </div>
          <div className="rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold text-foreground">{t.join.applicationForm}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t.join.fieldsRequired}</p>
            <div className="mt-6">
              <JoinForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
