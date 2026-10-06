import type { Metadata } from "next";
import Link from "next/link";
import { Droplets, Bot, BadgeCheck, Users, ArrowRight } from "lucide-react";
import { PromoCinematic } from "@/components/promo/promo-cinematic";

export const metadata: Metadata = {
  title: "Promo — Cinematic Feature Tour",
  description:
    "Scroll-driven cinematic tour of the RCY platform: emergency blood network, bilingual AI assistant, verifiable ID cards and certificates, volunteer portals, and PWA.",
};

const tiers = [
  {
    icon: Droplets,
    title: "Emergency Blood Network",
    text: "One-click requests, donor directory by all 8 blood groups, email + push + Telegram dispatch.",
    href: "/blood-support",
  },
  {
    icon: Bot,
    title: "RCY AI Assistant",
    text: "24/7 bilingual answers from live campus data — leaders, blood needs, training dates.",
    href: "/emergency",
  },
  {
    icon: BadgeCheck,
    title: "ID cards + certificates",
    text: "Printable volunteer IDs with live QR profiles and tamper-proof certificate verification.",
    href: "/verify",
  },
  {
    icon: Users,
    title: "Portals + leaderboard",
    text: "Student and volunteer dashboards, points, recruitment funnel, installable PWA.",
    href: "/apply-volunteer",
  },
];

export default function PromoPage() {
  return (
    <>
      <PromoCinematic />
      <section className="border-t border-line bg-white">
        <div className="container-site py-16 lg:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
            Continue exploring
          </p>
          <h2 className="mt-3 max-w-xl text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Every beat links to the live feature
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {tiers.map((t) => (
              <Link
                key={t.title}
                href={t.href}
                className="group rounded-2xl border border-line bg-mist/50 p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white">
                  <t.icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-bold">{t.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t.text}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-brand">
                  Open
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
