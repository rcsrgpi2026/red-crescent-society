import type { Metadata } from "next";
import Link from "next/link";
import { Siren, Droplets, Users, PhoneCall, HeartPulse, MapPin, Clock } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { getSettings } from "@/lib/queries";
import { getServerMessages } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerMessages();
  return {
    title: t.meta.emergency.title,
    description: t.meta.emergency.description,
  };
}

export default async function EmergencyPage() {
  const [t, settings] = await Promise.all([getServerMessages(), getSettings()]);
  const emergency = settings.emergency ?? {};
  const contact = settings.contact ?? {};

  const bloodHelpline = typeof emergency.bloodHelpline === "string" ? emergency.bloodHelpline : "";
  const societyContact = typeof emergency.societyContact === "string" ? emergency.societyContact : "";
  const message =
    typeof emergency.message === "string" && emergency.message
      ? emergency.message
      : t.emergency.heroDescriptionFallback;

  return (
    <>
      <PageHero
        tone="crescent"
        eyebrow={t.emergency.heroEyebrow}
        title={t.emergency.heroTitle}
        description={message}
      >
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/blood-support/request"
            className="inline-flex items-center gap-2 rounded-full bg-crescent px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-crescent/25 transition-colors hover:bg-crescent-dark"
          >
            <Droplets className="h-4 w-4" aria-hidden />
            {t.emergency.needBlood}
          </Link>
          <Link
            href="/blood-support"
            className="inline-flex items-center gap-2 rounded-full border border-crescent/40 bg-white px-5 py-2.5 text-sm font-semibold text-crescent transition-colors hover:bg-crescent-soft"
          >
            <Users className="h-4 w-4" aria-hidden />
            {t.emergency.findDonor}
          </Link>
        </div>
      </PageHero>

      <section className="bg-white">
        <div className="container-site py-14 lg:py-20">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Need blood */}
            <div className="rounded-3xl border border-crescent/25 bg-crescent-soft/60 p-7">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-crescent text-white shadow-md shadow-crescent/25">
                <Droplets className="h-6 w-6" aria-hidden />
              </span>
              <h2 className="mt-5 text-xl font-bold text-foreground">{t.emergency.needBloodTitle}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t.emergency.needBloodText}</p>
              <Link
                href="/blood-support/request"
                className="mt-5 inline-block rounded-full bg-crescent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-crescent-dark"
              >
                {t.footer.requestBlood}
              </Link>
            </div>

            {/* Need volunteers */}
            <div className="rounded-3xl border border-line bg-mist/60 p-7">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-white shadow-md shadow-brand/25">
                <Users className="h-6 w-6" aria-hidden />
              </span>
              <h2 className="mt-5 text-xl font-bold text-foreground">{t.emergency.needVolunteersTitle}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t.emergency.needVolunteersText}</p>
              <Link
                href="/contact"
                className="mt-5 inline-block rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
              >
                {t.emergency.requestVolunteerHelp}
              </Link>
            </div>

            {/* Emergency contacts */}
            <div className="rounded-3xl border border-line bg-white p-7 shadow-sm">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-poly-soft text-poly">
                <PhoneCall className="h-6 w-6" aria-hidden />
              </span>
              <h2 className="mt-5 text-xl font-bold text-foreground">{t.emergency.emergencyContacts}</h2>
              <div className="mt-4 space-y-3 text-sm">
                {bloodHelpline && (
                  <div className="rounded-xl border border-crescent/20 bg-crescent-soft/50 p-3.5">
                    <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-crescent">
                      <HeartPulse className="h-3.5 w-3.5" aria-hidden />
                      {t.emergency.bloodHelpline}
                    </p>
                    <a href={`tel:${bloodHelpline}`} className="mt-1 block text-lg font-bold text-crescent-dark">
                      {bloodHelpline}
                    </a>
                  </div>
                )}
                {societyContact && (
                  <div className="rounded-xl border border-line bg-mist/60 p-3.5">
                    <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-poly">
                      <PhoneCall className="h-3.5 w-3.5" aria-hidden />
                      {t.emergency.societyContact}
                    </p>
                    <a href={`tel:${societyContact}`} className="mt-1 block text-lg font-bold text-poly">
                      {societyContact}
                    </a>
                  </div>
                )}
                {!bloodHelpline && !societyContact && (
                  <p className="rounded-xl border border-dashed border-line p-3.5 text-sm text-muted-foreground">
                    {t.emergency.numbersConfigured}
                  </p>
                )}
                {typeof contact.address === "string" && contact.address && (
                  <p className="flex items-start gap-2 rounded-xl border border-line bg-mist/60 p-3.5 text-muted-foreground">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-poly" aria-hidden />
                    {contact.address}
                  </p>
                )}
                <p className="flex items-start gap-2 rounded-xl border border-line bg-mist/60 p-3.5 text-muted-foreground">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-poly" aria-hidden />
                  {t.emergency.call999First}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
            <Siren className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            <p>
              <span className="font-semibold">{t.emergency.important}</span> {t.emergency.importantText}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
