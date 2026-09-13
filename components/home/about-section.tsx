import Image from "next/image";
import Link from "next/link";
import { Target, Eye, History, HeartPulse, CheckCircle2, Quote, ArrowRight } from "lucide-react";
import { SectionHeader } from "@/components/shared/section-header";
import { Reveal } from "@/components/shared/reveal";
import { EmptyState } from "@/components/shared/empty-state";
import { SiteLogo } from "@/components/layout/site-logo";
import { PrinciplesCardStack } from "@/components/home/principles-card-stack";
import { PRINCIPLES_CONFIG } from "@/components/home/principles-config";
import { AboutCardsStack } from "@/components/home/about-cards-stack";
import {
  VectorMission,
  VectorVision,
  VectorActions,
  VectorHeritage,
} from "@/components/home/principle-vectors";
import { cn } from "@/lib/utils";
import type { Messages } from "@/lib/i18n";
import type { Founder } from "@/types/database";

export function AboutSection({ t, founders }: { t: Messages; founders: Founder[] }) {
  const principals = founders.filter((f) => f.category === "PRINCIPAL");
  const founderList = founders.filter((f) => f.category === "FOUNDER");

  return (
    <>
      {/* Introduction */}
      <section className="border-b border-line bg-white">
        <div className="container-site grid gap-12 py-16 lg:grid-cols-2 lg:py-24">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-b from-brand-soft to-mist p-10">
              <div className="relative flex flex-col items-center text-center">
                <SiteLogo variant="society" className="w-24" />
                <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-brand-dark">
                  {t.about.introLabel}
                </p>
                <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
                  {t.about.introText}
                </p>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
                {t.about.introEyebrow}
              </p>
              <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground">
                {t.about.introTitle}
              </h2>
              <p className="mt-5 leading-relaxed text-muted-foreground">
                {t.about.introText1}
              </p>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                {t.about.introText2}
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Mission / Vision / Objectives / History */}
      <section className="border-b border-line bg-mist/50">
        <div className="container-site py-16 lg:py-24">
          {/* Desktop Grid Layout (sm and up) */}
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-2 gap-6">
            {/* Card 1: Our Mission */}
            <Reveal>
              <div className="group relative h-full overflow-hidden rounded-2xl border border-emerald-500/25 ring-1 ring-emerald-500/10 bg-gradient-to-b from-white via-white to-mist/40 p-8 shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-500/60 hover:shadow-xl hover:shadow-emerald-500/5">
                <div className="pointer-events-none absolute -top-12 -right-12 h-36 w-36 rounded-full bg-gradient-to-br from-red-500/15 via-rose-500/5 to-transparent blur-2xl transition-opacity duration-300 group-hover:opacity-100 opacity-60" />
                <div className="pointer-events-none absolute -bottom-5 -right-5 h-44 w-44 select-none opacity-[0.05]">
                  <VectorMission />
                </div>
                
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 text-white shadow-md shadow-red-500/25 ring-2 ring-white">
                    <Target className="h-6 w-6" strokeWidth={2.2} />
                  </div>
                  <span className="rounded-full border border-red-200/80 bg-red-50 px-3 py-1 text-[11px] font-bold tracking-wider text-red-700 uppercase">
                    Purpose · 01
                  </span>
                </div>

                <div className="relative z-10 mt-5 grid grid-cols-[1fr_80px] items-center gap-4">
                  <div className="space-y-1.5">
                    <h3 className="font-jakarta text-xl font-bold tracking-tight text-foreground group-hover:text-red-600 transition-colors">
                      {t.about.missionTitle}
                    </h3>
                    <p className="font-inter text-sm leading-relaxed text-muted-foreground">
                      {t.about.missionText}
                    </p>
                  </div>
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/80 bg-gradient-to-b from-white/90 to-mist/40 p-2 shadow-sm backdrop-blur-xs ring-1 ring-black/5">
                    <VectorMission />
                  </div>
                </div>

                <div className="relative z-10 mt-6 flex items-center justify-between border-t border-line/60 pt-4">
                  <div className="h-1.5 w-14 rounded-full bg-gradient-to-r from-red-600 to-rose-400" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                    Mission Focus
                  </span>
                </div>
              </div>
            </Reveal>

            {/* Card 2: Our Vision */}
            <Reveal delay={0.07}>
              <div className="group relative h-full overflow-hidden rounded-2xl border border-emerald-500/25 ring-1 ring-emerald-500/10 bg-gradient-to-b from-white via-white to-mist/40 p-8 shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-500/60 hover:shadow-xl hover:shadow-emerald-500/5">
                <div className="pointer-events-none absolute -top-12 -right-12 h-36 w-36 rounded-full bg-gradient-to-br from-poly/15 via-blue-500/5 to-transparent blur-2xl transition-opacity duration-300 group-hover:opacity-100 opacity-60" />
                <div className="pointer-events-none absolute -bottom-5 -right-5 h-44 w-44 select-none opacity-[0.05]">
                  <VectorVision />
                </div>
                
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-poly to-blue-700 text-white shadow-md shadow-blue-500/25 ring-2 ring-white">
                    <Eye className="h-6 w-6" strokeWidth={2.2} />
                  </div>
                  <span className="rounded-full border border-poly/30 bg-poly-soft px-3 py-1 text-[11px] font-bold tracking-wider text-poly uppercase">
                    Outlook · 02
                  </span>
                </div>

                <div className="relative z-10 mt-5 grid grid-cols-[1fr_80px] items-center gap-4">
                  <div className="space-y-1.5">
                    <h3 className="font-jakarta text-xl font-bold tracking-tight text-foreground group-hover:text-poly transition-colors">
                      {t.about.visionTitle}
                    </h3>
                    <p className="font-inter text-sm leading-relaxed text-muted-foreground">
                      {t.about.visionText}
                    </p>
                  </div>
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/80 bg-gradient-to-b from-white/90 to-mist/40 p-2 shadow-sm backdrop-blur-xs ring-1 ring-black/5">
                    <VectorVision />
                  </div>
                </div>

                <div className="relative z-10 mt-6 flex items-center justify-between border-t border-line/60 pt-4">
                  <div className="h-1.5 w-14 rounded-full bg-gradient-to-r from-poly to-cyan-400" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                    Vision 2026
                  </span>
                </div>
              </div>
            </Reveal>

            {/* Card 3: What team members do */}
            <Reveal delay={0.1}>
              <div className="group relative h-full overflow-hidden rounded-2xl border border-emerald-500/25 ring-1 ring-emerald-500/10 bg-gradient-to-b from-white via-white to-mist/40 p-8 shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-500/60 hover:shadow-xl hover:shadow-emerald-500/5">
                <div className="pointer-events-none absolute -top-12 -right-12 h-36 w-36 rounded-full bg-gradient-to-br from-crescent/15 via-teal-500/5 to-transparent blur-2xl transition-opacity duration-300 group-hover:opacity-100 opacity-60" />
                <div className="pointer-events-none absolute -bottom-5 -right-5 h-44 w-44 select-none opacity-[0.05]">
                  <VectorActions />
                </div>
                
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-crescent to-teal-700 text-white shadow-md shadow-teal-500/25 ring-2 ring-white">
                    <HeartPulse className="h-6 w-6" strokeWidth={2.2} />
                  </div>
                  <span className="rounded-full border border-crescent/30 bg-crescent-soft px-3 py-1 text-[11px] font-bold tracking-wider text-crescent uppercase">
                    Actions · 03
                  </span>
                </div>

                <div className="relative z-10 mt-5 grid grid-cols-[1fr_80px] items-center gap-4">
                  <div className="space-y-1.5">
                    <h3 className="font-jakarta text-xl font-bold tracking-tight text-foreground group-hover:text-crescent transition-colors">
                      {t.about.whatVolunteersDoTitle}
                    </h3>
                    <ul className="font-inter space-y-1 text-xs leading-relaxed text-muted-foreground pt-1">
                      {t.about.whatVolunteersDo.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-crescent" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/80 bg-gradient-to-b from-white/90 to-mist/40 p-2 shadow-sm backdrop-blur-xs ring-1 ring-black/5">
                    <VectorActions />
                  </div>
                </div>

                <div className="relative z-10 mt-6 flex items-center justify-between border-t border-line/60 pt-4">
                  <div className="h-1.5 w-14 rounded-full bg-gradient-to-r from-crescent to-emerald-400" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                    Youth Impact
                  </span>
                </div>
              </div>
            </Reveal>

            {/* Card 4: Our History */}
            <Reveal delay={0.15}>
              <div className="group relative h-full overflow-hidden rounded-2xl border border-emerald-500/25 ring-1 ring-emerald-500/10 bg-gradient-to-b from-white via-white to-mist/40 p-8 shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-500/60 hover:shadow-xl hover:shadow-emerald-500/5">
                <div className="pointer-events-none absolute -top-12 -right-12 h-36 w-36 rounded-full bg-gradient-to-br from-amber-500/15 via-orange-500/5 to-transparent blur-2xl transition-opacity duration-300 group-hover:opacity-100 opacity-60" />
                <div className="pointer-events-none absolute -bottom-5 -right-5 h-44 w-44 select-none opacity-[0.05]">
                  <VectorHeritage />
                </div>
                
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/25 ring-2 ring-white">
                    <History className="h-6 w-6" strokeWidth={2.2} />
                  </div>
                  <span className="rounded-full border border-amber-200/80 bg-amber-50 px-3 py-1 text-[11px] font-bold tracking-wider text-amber-800 uppercase">
                    Heritage · 04
                  </span>
                </div>

                <div className="relative z-10 mt-5 grid grid-cols-[1fr_80px] items-center gap-4">
                  <div className="space-y-1.5">
                    <h3 className="font-jakarta text-xl font-bold tracking-tight text-foreground group-hover:text-amber-600 transition-colors">
                      {t.about.historyTitle}
                    </h3>
                    <p className="font-inter text-sm leading-relaxed text-muted-foreground">
                      {t.about.historyText}
                    </p>
                  </div>
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/80 bg-gradient-to-b from-white/90 to-mist/40 p-2 shadow-sm backdrop-blur-xs ring-1 ring-black/5">
                    <VectorHeritage />
                  </div>
                </div>

                <div className="relative z-10 mt-6 flex items-center justify-between border-t border-line/60 pt-4">
                  <div className="h-1.5 w-14 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                    Est. 2020 · RGPI Unit
                  </span>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Mobile Tinder-Style Swipe Deck (phone screens only) */}
          <div className="block sm:hidden">
            <AboutCardsStack t={t} />
          </div>
        </div>
      </section>

      {/* Principles */}
      <section className="border-b border-line bg-white">
        <div className="container-site py-16 lg:py-24">
          <Reveal>
            <SectionHeader
              eyebrow={t.about.principlesEyebrow}
              title={t.about.principlesTitle}
              description={t.about.principlesDescription}
            />
          </Reveal>
          {/* Desktop Grid Layout (sm and up) */}
          <div className="mt-10 hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {t.about.principles.map(([title, text], i) => {
              const cfg = PRINCIPLES_CONFIG[i % PRINCIPLES_CONFIG.length];
              const Icon = cfg.icon;
              const VectorIllustration = cfg.vector;
              return (
                <Reveal key={title} delay={(i % 4) * 0.05}>
                  <div className="group relative h-full flex flex-col justify-between overflow-hidden rounded-xl border border-emerald-500/25 ring-1 ring-emerald-500/10 bg-gradient-to-b from-white to-mist/30 p-5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/60 hover:shadow-lg hover:shadow-emerald-500/10">
                    {/* Top glass sheen line */}
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent opacity-90" />
                    {/* Corner glow */}
                    <div className={cn("pointer-events-none absolute -top-10 -right-10 h-24 w-24 rounded-full bg-gradient-to-br blur-xl opacity-40 transition-opacity duration-300 group-hover:opacity-80", cfg.glow)} />
                    {/* Watermark vector in background */}
                    <div className="pointer-events-none absolute -bottom-3 -right-2 h-24 w-24 select-none opacity-[0.06]">
                      <VectorIllustration />
                    </div>

                    <div className="relative z-10">
                      <div className="flex items-center justify-between">
                        <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl shadow-xs ring-1 ring-white", cfg.iconBg)}>
                          <Icon className="h-4.5 w-4.5" strokeWidth={2.2} />
                        </div>
                        <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase", cfg.badge)}>
                          #{cfg.num}
                        </span>
                      </div>
                      <div className="mt-3 flex items-start justify-between gap-2.5">
                        <div className="flex-1">
                          <p className="font-jakarta text-sm font-bold text-foreground group-hover:text-brand transition-colors">
                            {title}
                          </p>
                          <p className="font-inter mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-3">
                            {text}
                          </p>
                        </div>
                        <div className="h-13 w-13 shrink-0 rounded-xl bg-gradient-to-b from-white to-mist/40 p-1 border border-white/80 shadow-2xs">
                          <VectorIllustration />
                        </div>
                      </div>
                    </div>

                    <div className="relative z-10 mt-4 pt-2 border-t border-line/60 flex items-center justify-between">
                      <div className={cn("h-1 w-10 rounded-full bg-gradient-to-r", cfg.accent)} />
                      <span className="text-[9px] font-semibold text-muted-foreground/60 uppercase">
                        Principle
                      </span>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>

          {/* Mobile Tinder-Style Swipe Deck (phone screens only) */}
          <div className="mt-6 block sm:hidden">
            <PrinciplesCardStack principles={t.about.principles} />
          </div>
        </div>
      </section>

      {/* Founders & Principal */}
      <section id="founders" className="border-b border-line bg-white scroll-mt-24">
        <div className="container-site py-16 lg:py-24">
          <Reveal>
            <SectionHeader
              eyebrow={t.about.foundersEyebrow}
              title={t.about.foundersTitle}
              description={t.about.foundersDescription}
            />
          </Reveal>

          {founders.length > 0 ? (
            <>
              {principals.length > 0 && (
                <div className="mt-10">
                  <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-poly">
                    {t.about.foundersPrincipalLabel}
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-5">
                    {principals.map((principal, i) => {
                      const glimpse = principal.message?.trim() || principal.background?.trim();
                      return (
                        <Reveal key={principal.id} delay={i * 0.08} className="w-full max-w-2xl">
                          <Link
                            href={`/founders/${principal.id}`}
                            className="group flex h-full flex-col items-center gap-6 rounded-2xl border border-emerald-500/25 ring-1 ring-emerald-500/10 bg-gradient-to-b from-mist/70 to-white p-8 sm:p-10 text-center transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/60 hover:shadow-xl hover:shadow-emerald-500/5"
                          >
                            <div className="relative h-48 w-40 shrink-0 overflow-hidden rounded-2xl bg-brand-soft ring-1 ring-emerald-500/20 shadow-xs">
                              {principal.photo_url ? (
                                <Image
                                  src={principal.photo_url}
                                  alt={principal.name}
                                  fill
                                  sizes="160px"
                                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                              ) : (
                                <span className="flex h-full w-full items-center justify-center text-5xl font-bold text-brand/40">
                                  {principal.name.charAt(0)}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0 w-full">
                              <h3 className="font-jakarta text-2xl font-bold tracking-tight text-foreground transition-colors group-hover:text-emerald-700">
                                {principal.name}
                              </h3>
                              {principal.title && (
                                <p className="font-jakarta mt-1.5 text-base font-medium text-brand">
                                  {principal.title}
                                </p>
                              )}
                              {principal.bio && (
                                <p className="font-inter mt-2.5 text-sm leading-relaxed text-muted-foreground">
                                  {principal.bio}
                                </p>
                              )}

                              {/* Message / Background Glimpse (Only shown if added) */}
                              {glimpse && (
                                <div className="mt-5 w-full rounded-xl border border-emerald-500/20 bg-gradient-to-b from-emerald-50/60 via-white to-mist/40 p-4 text-left shadow-2xs">
                                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                                    <Quote className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                                    <span>
                                      {principal.message ? "Message to Students & Volunteers" : "Working Background"}
                                    </span>
                                  </div>
                                  <p className="font-inter mt-2 line-clamp-3 text-xs sm:text-sm leading-relaxed text-muted-foreground italic">
                                    &ldquo;{glimpse}&rdquo;
                                  </p>
                                  <div className="mt-3 flex items-center justify-end">
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 transition-transform group-hover:translate-x-1">
                                      See full profile
                                      <ArrowRight className="h-3.5 w-3.5" />
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </Link>
                        </Reveal>
                      );
                    })}
                  </div>
                </div>
              )}

              {founderList.length > 0 && (
                <div className="mt-12">
                  <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-brand">
                    {t.about.foundersListLabel}
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-5">
                    {founderList.map((founder, i) => {
                      const glimpse = founder.message?.trim() || founder.background?.trim();
                      return (
                        <Reveal
                          key={founder.id}
                          delay={(i % 4) * 0.06}
                          className="w-full sm:w-[calc(50%-0.625rem)] lg:w-[calc(25%-0.9375rem)]"
                        >
                          <Link
                            href={`/founders/${founder.id}`}
                            className="group flex h-full flex-col items-center justify-between rounded-2xl border border-emerald-500/25 ring-1 ring-emerald-500/10 bg-white p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/60 hover:shadow-xl hover:shadow-emerald-500/5"
                          >
                            <div className="flex flex-col items-center w-full">
                              <div className="relative h-28 w-28 overflow-hidden rounded-full bg-brand-soft ring-2 ring-white shadow-sm">
                                {founder.photo_url ? (
                                  <Image
                                    src={founder.photo_url}
                                    alt={founder.name}
                                    fill
                                    sizes="112px"
                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                  />
                                ) : (
                                  <span className="flex h-full w-full items-center justify-center text-4xl font-bold text-brand/40">
                                    {founder.name.charAt(0)}
                                  </span>
                                )}
                              </div>
                              <h3 className="font-jakarta mt-4 font-bold text-foreground transition-colors group-hover:text-emerald-700">
                                {founder.name}
                              </h3>
                              {founder.title && (
                                <p className="font-jakarta mt-0.5 text-xs font-medium text-brand">
                                  {founder.title}
                                </p>
                              )}
                              {founder.bio && (
                                <p className="font-inter mt-2 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                                  {founder.bio}
                                </p>
                              )}
                            </div>

                            {/* Message / Background Glimpse (Only shown if added) */}
                            {glimpse && (
                              <div className="mt-4 w-full rounded-xl border border-emerald-500/20 bg-gradient-to-b from-emerald-50/50 via-white to-mist/30 p-3 text-left shadow-2xs">
                                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                                  <Quote className="h-3 w-3 shrink-0 text-emerald-600" />
                                  <span>{founder.message ? "Message" : "Background"}</span>
                                </div>
                                <p className="font-inter mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground italic">
                                  &ldquo;{glimpse}&rdquo;
                                </p>
                                <div className="mt-2 flex items-center justify-end">
                                  <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-700 transition-transform group-hover:translate-x-0.5">
                                    See more
                                    <ArrowRight className="h-3 w-3" />
                                  </span>
                                </div>
                              </div>
                            )}
                          </Link>
                        </Reveal>
                      );
                    })}
                  </div>
                </div>
              )}

            </>
          ) : (
            <div className="mt-10">
              <EmptyState
                title={t.about.foundersEmptyTitle}
                description={t.about.foundersEmptyText}
              />
            </div>
          )}
        </div>
      </section>

    </>
  );
}
