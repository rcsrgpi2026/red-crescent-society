import Link from "next/link";
import {
  Mail,
  Phone,
  MapPin,
  HeartPulse,
  ShieldCheck,
  GraduationCap,
} from "lucide-react";
import {
  FacebookIcon,
  YoutubeIcon,
  InstagramIcon,
  TwitterIcon,
} from "@/components/shared/social-icons";
import { SiteLogo } from "@/components/layout/site-logo";
import { getSettings } from "@/lib/queries";
import { getServerMessages } from "@/lib/i18n/server";

const QUICK_LINKS = [
  { key: "volunteers", href: "/volunteers" },
  { key: "events", href: "/events" },
  { key: "activities", href: "/activities" },
  { key: "training", href: "/training" },
  { key: "gallery", href: "/gallery" },
  { key: "notices", href: "/notices" },
] as const;

const BLOOD_LINKS = [
  { key: "findDonor", href: "/blood-support" },
  { key: "requestBlood", href: "/blood-support/request" },
  { key: "registerAsDonor", href: "/blood-support#donor-registration" },
  { key: "emergency", href: "/emergency" },
] as const;

const SOCIAL_ICONS: Record<string, React.ElementType> = {
  facebook: FacebookIcon,
  youtube: YoutubeIcon,
  instagram: InstagramIcon,
  twitter: TwitterIcon,
};

export async function SiteFooter() {
  const [t, settings] = await Promise.all([getServerMessages(), getSettings()]);
  const society = settings.society ?? {};
  const contact = settings.contact ?? {};
  const social = settings.social ?? {};
  const emergency = settings.emergency ?? {};
  const societyShort =
    typeof society.shortName === "string" && society.shortName.trim()
      ? society.shortName.trim()
      : undefined;
  const societyName =
    typeof society.name === "string" && society.name.trim()
      ? society.name.trim()
      : undefined;
  const collegeName =
    typeof society.collegeName === "string" && society.collegeName.trim()
      ? society.collegeName.trim()
      : undefined;

  return (
    <footer className="border-t border-line bg-mist">
      {/* Emergency strip */}
      <div className="border-b border-line bg-white">
        <div className="container-site flex flex-col items-start justify-between gap-3 py-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-crescent-soft text-crescent">
              <HeartPulse className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {t.footer.needBloodUrgently}
              </p>
              <p className="text-xs text-muted-foreground">
                {typeof emergency.message === "string" && emergency.message
                  ? emergency.message
                  : t.footer.reachOut}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href="/blood-support/request"
              className="inline-flex items-center gap-1.5 rounded-full bg-crescent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-crescent-dark"
            >
              {t.footer.requestBlood}
            </Link>
            <Link
              href="/blood-support"
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-brand-dark transition-colors hover:bg-brand-soft"
            >
              {t.footer.findDonor}
            </Link>
          </div>
        </div>
      </div>

      <div className="container-site grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        {/* Identity */}
        <div>
          <div className="flex items-center gap-3">
            <SiteLogo variant="society" className="w-12" />
            <div className="leading-tight">
              <p className="font-bold text-brand-dark">
                {societyShort ?? t.nav.redCrescentSociety}
              </p>
              <p className="text-xs font-medium text-muted-foreground">
                {collegeName ?? t.nav.rajshahiPolytechnic}
              </p>
            </div>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {typeof settings.society?.description === "string"
              ? settings.society.description
              : t.footer.societyDefaultDescription}
          </p>
          <div className="mt-5 flex items-center gap-3">
            <SiteLogo variant="institute" className="w-9" />
            <p className="text-xs text-muted-foreground">
              {t.footer.anOfficialUnitOf}
              <span className="block font-semibold text-poly">
                {collegeName ?? t.nav.rajshahiPolytechnic}
              </span>
            </p>
          </div>
          <div className="mt-5 flex gap-2">
            {Object.entries(social)
              .filter(([, v]) => typeof v === "string" && v)
              .map(([key, value]) => {
                const Icon = SOCIAL_ICONS[key];
                if (!Icon) return null;
                return (
                  <a
                    key={key}
                    href={value as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={key}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white text-muted-foreground transition-colors hover:border-brand hover:bg-brand hover:text-white"
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </a>
                );
              })}
          </div>
        </div>

        {/* Quick links */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">{t.footer.quickLinks}</h3>
          <ul className="mt-4 space-y-2.5">
            {QUICK_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-brand-dark"
                >
                  {t.nav[link.key]}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Blood support */}
        <div>
          <h3 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider text-foreground">
            <HeartPulse className="h-4 w-4 text-crescent" aria-hidden />
            {t.footer.bloodSupport}
          </h3>
          <ul className="mt-4 space-y-2.5">
            {BLOOD_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-crescent"
                >
                  {t.footer[link.key]}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex items-start gap-2 rounded-lg bg-brand-soft p-3 text-xs text-brand-ink">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <p>{t.footer.donorPrivacy}</p>
          </div>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">{t.footer.contact}</h3>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-poly" aria-hidden />
              <span>
                {typeof contact.address === "string" && contact.address
                  ? contact.address
                  : t.contact.addressFallback}
              </span>
            </li>
            {typeof contact.email === "string" && contact.email && (
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-poly" aria-hidden />
                <a href={`mailto:${contact.email}`} className="hover:text-brand-dark">
                  {contact.email}
                </a>
              </li>
            )}
            {typeof contact.phone === "string" && contact.phone && (
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-poly" aria-hidden />
                <a href={`tel:${contact.phone}`} className="hover:text-brand-dark">
                  {contact.phone}
                </a>
              </li>
            )}
            {typeof emergency.bloodHelpline === "string" && emergency.bloodHelpline && (
              <li className="flex items-center gap-2.5">
                <HeartPulse className="h-4 w-4 shrink-0 text-crescent" aria-hidden />
                <a href={`tel:${emergency.bloodHelpline}`} className="font-medium text-crescent">
                  {t.footer.bloodHelpline}{emergency.bloodHelpline}
                </a>
              </li>
            )}
          </ul>
          <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
            <GraduationCap className="h-4 w-4 text-poly" aria-hidden />
            <span>{t.footer.volunteerServeRespond}</span>
          </div>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container-site flex flex-col items-center justify-between gap-2 py-5 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} {societyName ?? t.meta.siteName}. {t.footer.allRightsReserved}</p>
          <p className="flex items-center gap-1.5">{t.footer.builtWithHumanity}</p>
        </div>
      </div>
    </footer>
  );
}
