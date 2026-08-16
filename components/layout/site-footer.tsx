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
import { getProfile, isAdminRole } from "@/lib/auth";

const QUICK_LINKS = [
  { key: "team", href: "/team" },
  { key: "events", href: "/events" },
  { key: "activitiesGallery", href: "/gallery" },
  { key: "training", href: "/training" },
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
  const profile = await getProfile();
  const isAdmin = isAdminRole(profile?.role);
  // Team is admin-only — keep its quick link off the footer for everyone else.
  const quickLinks = QUICK_LINKS.filter((link) => link.key !== "team" || isAdmin);
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
    <footer className="border-t border-crescent-dark bg-crescent text-white">
      {/* Emergency strip */}
      <div className="border-b border-white/10 bg-crescent-dark">
        <div className="container-site flex flex-col items-start justify-between gap-2.5 py-2.5 sm:flex-row sm:items-center sm:gap-3 sm:py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 sm:h-10 sm:w-10">
              <HeartPulse className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold text-white">
                {t.footer.needBloodUrgently}
              </p>
              <p className="text-xs text-white/70">
                {typeof emergency.message === "string" && emergency.message
                  ? emergency.message
                  : t.footer.reachOut}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href="/blood-support/request"
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-crescent transition-colors hover:bg-white/90 sm:px-4 sm:py-2 sm:text-sm"
            >
              {t.footer.requestBlood}
            </Link>
            <Link
              href="/blood-support"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/20 sm:px-4 sm:py-2 sm:text-sm"
            >
              {t.footer.findDonor}
            </Link>
          </div>
        </div>
      </div>

      {/* Compact on phones: identity and contact span the full width while the
          two link lists sit side by side in half-width columns. */}
      <div className="container-site grid grid-cols-2 gap-6 py-7 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr] lg:gap-10 lg:py-14">
        {/* Identity */}
        <div className="col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3">
            <SiteLogo variant="society" className="w-10 sm:w-12" />
            <div className="leading-tight">
              <p className="font-bold text-white">
                {societyShort ?? t.nav.redCrescentSociety}
              </p>
              <p className="text-xs font-medium text-white/70">
                {collegeName ?? t.nav.rajshahiPolytechnic}
              </p>
            </div>
          </div>
          <p className="mt-4 hidden max-w-sm text-sm leading-relaxed text-white/70 md:block">
            {typeof settings.society?.description === "string"
              ? settings.society.description
              : t.footer.societyDefaultDescription}
          </p>
          <div className="mt-4 flex items-center gap-3">
            <SiteLogo variant="institute" className="w-8" />
            <p className="text-xs text-white/70">
              {t.footer.anOfficialUnitOf}
              <span className="block font-semibold text-white">
                {collegeName ?? t.nav.rajshahiPolytechnic}
              </span>
            </p>
          </div>
          <div className="mt-4 flex gap-2">
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
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/80 transition-colors hover:border-white hover:bg-white hover:text-crescent sm:h-9 sm:w-9"
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </a>
                );
              })}
          </div>
        </div>

        {/* Quick links */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white/90 sm:text-sm">
            {t.footer.quickLinks}
          </h3>
          <ul className="mt-3 grid grid-cols-2 gap-x-2 gap-y-1.5">
            {quickLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-white/75 transition-colors hover:text-white"
                >
                  {t.nav[link.key]}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Blood support */}
        <div>
          <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white/90 sm:text-sm">
            <HeartPulse className="h-4 w-4" aria-hidden />
            {t.footer.bloodSupport}
          </h3>
          <ul className="mt-3 space-y-1.5">
            {BLOOD_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-white/75 transition-colors hover:text-white"
                >
                  {t.footer[link.key]}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4 hidden items-start gap-2 rounded-lg bg-white/10 p-3 text-xs text-white/80 md:flex">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <p>{t.footer.donorPrivacy}</p>
          </div>
        </div>

        {/* Contact */}
        <div className="col-span-2 lg:col-span-1">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white/90 sm:text-sm">
            {t.footer.contact}
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-white/75">
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-white/60" aria-hidden />
              <span>
                {typeof contact.address === "string" && contact.address
                  ? contact.address
                  : t.contact.addressFallback}
              </span>
            </li>
            {typeof contact.email === "string" && contact.email && (
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-white/60" aria-hidden />
                <a href={`mailto:${contact.email}`} className="break-all hover:text-white">
                  {contact.email}
                </a>
              </li>
            )}
            {typeof contact.phone === "string" && contact.phone && (
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-white/60" aria-hidden />
                <a href={`tel:${contact.phone}`} className="hover:text-white">
                  {contact.phone}
                </a>
              </li>
            )}
            {typeof emergency.bloodHelpline === "string" && emergency.bloodHelpline && (
              <li className="flex items-center gap-2.5">
                <HeartPulse className="h-4 w-4 shrink-0" aria-hidden />
                <a href={`tel:${emergency.bloodHelpline}`} className="font-medium text-white">
                  {t.footer.bloodHelpline}{emergency.bloodHelpline}
                </a>
              </li>
            )}
          </ul>
          <div className="mt-4 flex items-center gap-2 text-xs text-white/70">
            <GraduationCap className="h-4 w-4 shrink-0 text-white/60" aria-hidden />
            <span>{t.footer.volunteerServeRespond}</span>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 bg-crescent-dark">
        <div className="container-site flex flex-col items-center justify-between gap-1.5 py-3 text-xs text-white/70 sm:flex-row sm:py-4">
          <p>
            © {new Date().getFullYear()} {societyName ?? t.meta.siteName}.{" "}
            {t.footer.allRightsReserved}
          </p>
          <p className="text-center sm:text-left">
            {t.footer.foundBug}{" "}
            <a
              href="https://wa.me/8801300124952"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-yellow-300 underline underline-offset-2 transition-colors hover:text-yellow-200"
            >
              {t.footer.here}
            </a>
          </p>
          <p className="hidden items-center gap-1.5 sm:flex">{t.footer.builtWithHumanity}</p>
        </div>
      </div>
    </footer>
  );
}
