import Image from "next/image";
import Link from "next/link";
import { Target, Eye, History, HeartPulse, ArrowRight } from "lucide-react";
import { SectionHeader } from "@/components/shared/section-header";
import { Reveal } from "@/components/shared/reveal";
import { EmptyState } from "@/components/shared/empty-state";
import { SiteLogo } from "@/components/layout/site-logo";
import type { Messages } from "@/lib/i18n";
import type { Founder, TeamMember } from "@/types/database";

export function AboutSection({
  t,
  team,
  founders,
}: {
  t: Messages;
  team: TeamMember[];
  founders: Founder[];
}) {
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
          <div className="grid gap-5 lg:grid-cols-2">
            <Reveal>
              <div className="h-full rounded-2xl border border-line bg-white p-7">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand">
                  <Target className="h-5.5 w-5.5" aria-hidden />
                </span>
                <h3 className="mt-4 text-lg font-bold text-foreground">{t.about.missionTitle}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">
                  {t.about.missionText}
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.07}>
              <div className="h-full rounded-2xl border border-line bg-white p-7">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-poly-soft text-poly">
                  <Eye className="h-5.5 w-5.5" aria-hidden />
                </span>
                <h3 className="mt-4 text-lg font-bold text-foreground">{t.about.visionTitle}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">
                  {t.about.visionText}
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="h-full rounded-2xl border border-line bg-white p-7">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-crescent-soft text-crescent">
                  <HeartPulse className="h-5.5 w-5.5" aria-hidden />
                </span>
                <h3 className="mt-4 text-lg font-bold text-foreground">{t.about.whatVolunteersDoTitle}</h3>
                <ul className="mt-2 list-inside list-disc space-y-1.5 leading-relaxed text-muted-foreground">
                  {t.about.whatVolunteersDo.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="h-full rounded-2xl border border-line bg-white p-7">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <History className="h-5.5 w-5.5" aria-hidden />
                </span>
                <h3 className="mt-4 text-lg font-bold text-foreground">{t.about.historyTitle}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">
                  {t.about.historyText}
                </p>
              </div>
            </Reveal>
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
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {t.about.principles.map(([title, text], i) => (
              <Reveal key={title} delay={(i % 4) * 0.05}>
                <div className="h-full rounded-2xl border border-line bg-mist/40 p-5">
                  <p className="text-sm font-bold text-brand-dark">{title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{text}</p>
                </div>
              </Reveal>
            ))}
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
                    {principals.map((principal, i) => (
                      <Reveal key={principal.id} delay={i * 0.08} className="w-full max-w-2xl">
                        <div className="flex h-full flex-col items-center gap-7 rounded-3xl border border-line bg-gradient-to-b from-mist/70 to-white p-10 text-center">
                          <div className="relative h-48 w-40 shrink-0 overflow-hidden rounded-2xl bg-brand-soft">
                            {principal.photo_url ? (
                              <Image
                                src={principal.photo_url}
                                alt={principal.name}
                                fill
                                sizes="144px"
                                className="object-cover"
                              />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center text-5xl font-bold text-brand/40">
                                {principal.name.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-2xl font-bold text-foreground">{principal.name}</h3>
                            {principal.title && (
                              <p className="mt-1.5 text-base font-medium text-brand">{principal.title}</p>
                            )}
                            {principal.bio && (
                              <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                                {principal.bio}
                              </p>
                            )}
                          </div>
                        </div>
                      </Reveal>
                    ))}
                  </div>
                </div>
              )}

              {founderList.length > 0 && (
                <div className="mt-12">
                  <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-brand">
                    {t.about.foundersListLabel}
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-5">
                    {founderList.map((founder, i) => (
                      <Reveal
                        key={founder.id}
                        delay={(i % 4) * 0.06}
                        className="w-full sm:w-[calc(50%-0.625rem)] lg:w-[calc(25%-0.9375rem)]"
                      >
                        <div className="flex h-full flex-col items-center rounded-2xl border border-line bg-white p-6 text-center transition-all hover:border-brand/40 hover:shadow-sm">
                          <div className="relative h-28 w-28 overflow-hidden rounded-full bg-brand-soft">
                            {founder.photo_url ? (
                              <Image
                                src={founder.photo_url}
                                alt={founder.name}
                                fill
                                sizes="112px"
                                className="object-cover"
                              />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center text-4xl font-bold text-brand/40">
                                {founder.name.charAt(0)}
                              </span>
                            )}
                          </div>
                          <h3 className="mt-4 font-semibold text-foreground">{founder.name}</h3>
                          {founder.title && (
                            <p className="mt-0.5 text-xs font-medium text-brand">{founder.title}</p>
                          )}
                          {founder.bio && (
                            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                              {founder.bio}
                            </p>
                          )}
                        </div>
                      </Reveal>
                    ))}
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

      {/* Team */}
      <section id="team" className="border-b border-line bg-mist/50 scroll-mt-24">
        <div className="container-site py-16 lg:py-24">
          <Reveal>
            <SectionHeader
              eyebrow={t.about.teamEyebrow}
              title={t.about.teamTitle}
              description={t.about.teamDescription}
            />
          </Reveal>
          {team.length > 0 ? (
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {team.map((member, i) => (
                <Reveal key={member.id} delay={(i % 3) * 0.06}>
                  <div className="flex h-full items-start gap-4 rounded-2xl border border-line bg-white p-5 transition-all hover:border-brand/40 hover:shadow-sm">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-brand-soft">
                      {member.photo_url ? (
                        <Image
                          src={member.photo_url}
                          alt={member.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-brand/40">
                          {member.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{member.name}</h3>
                      <p className="text-xs font-medium text-brand">{member.position}</p>
                      {member.department && (
                        <p className="mt-1 text-xs text-muted-foreground">{member.department}</p>
                      )}
                      {member.bio && (
                        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                          {member.bio}
                        </p>
                      )}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="mt-10">
              <EmptyState
                title={t.about.teamEmptyTitle}
                description={t.about.teamEmptyText}
              />
            </div>
          )}
          <Reveal className="mt-10 text-center">
            <Link
              href="/volunteer/login"
              className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
            >
              {t.about.wantToBePart}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
