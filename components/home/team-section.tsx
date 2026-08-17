import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { SectionHeader } from "@/components/shared/section-header";
import { Reveal } from "@/components/shared/reveal";
import { EmptyState } from "@/components/shared/empty-state";
import type { Messages } from "@/lib/i18n";
import type { PublicTeamMember } from "@/types/database";

export function TeamSection({ t, team }: { t: Messages; team: PublicTeamMember[] }) {
  return (
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
                    <p className="text-xs font-medium text-brand">
                      {member.position || "Team Member"}
                    </p>
                    {member.department && (
                      <p className="mt-1 text-xs text-muted-foreground">{member.department}</p>
                    )}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="mt-10">
            <EmptyState title={t.about.teamEmptyTitle} description={t.about.teamEmptyText} />
          </div>
        )}
        <Reveal className="mt-10 text-center">
          <Link
            href="/team"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand transition-colors hover:text-brand-dark hover:underline"
          >
            {t.home.meetOurTeam}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Reveal>
        <Reveal className="mt-6 text-center">
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
  );
}
