import Link from "next/link";
import {
  UserPlus,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Reveal } from "@/components/shared/reveal";
import { Button } from "@/components/ui/button";
import { RecruitmentSettingsForm } from "@/components/admin/recruitment-settings-form";
import { adminGetRecruitmentStats } from "@/lib/queries";

export const metadata = {
  title: "Volunteer Recruitment Control & Settings",
  robots: { index: false, follow: false },
};

export default async function AdminRecruitmentPage() {
  const stats = await adminGetRecruitmentStats();

  const metricCards = [
    {
      label: "Total Applications",
      value: stats.total,
      icon: Users,
      href: "/admin/recruitment/applications",
      tone: "bg-gradient-to-br from-brand to-brand-dark",
    },
    {
      label: "Pending Review",
      value: stats.pending,
      icon: Clock,
      href: "/admin/recruitment/applications?status=PENDING",
      tone: "bg-gradient-to-br from-amber-400 to-orange-500",
    },
    {
      label: "Approved Volunteers",
      value: stats.approved,
      icon: CheckCircle2,
      href: "/admin/recruitment/applications?status=APPROVED",
      tone: "bg-gradient-to-br from-emerald-400 to-emerald-600",
    },
    {
      label: "Not Approved",
      value: stats.rejected,
      icon: XCircle,
      href: "/admin/recruitment/applications?status=REJECTED",
      tone: "bg-gradient-to-br from-slate-400 to-slate-600",
    },
  ];

  return (
    <div className="space-y-8">
      <AdminPageHeader
        icon={UserPlus}
        title="Volunteer Recruitment"
        description="Control volunteer recruitment status, configure semester eligibility, manage announcement popups and review student applications."
        actions={
          <Button asChild size="sm" className="gap-2">
            <Link href="/admin/recruitment/applications">
              <Users className="h-4 w-4" />
              View Applications ({stats.pending} pending)
            </Link>
          </Button>
        }
      />

      {/* Metrics Bar */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((card, i) => (
          <Reveal key={card.label} delay={i * 0.05}>
            <Link
              href={card.href}
              className="group flex flex-col rounded-2xl border border-line bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-lg hover:shadow-brand/10"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm transition-transform duration-300 group-hover:scale-110 ${card.tone}`}
                >
                  <card.icon className="h-5 w-5" aria-hidden />
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-brand" />
              </div>
              <p className="mt-3 text-2xl font-bold text-foreground tabular-nums">
                {card.value}
              </p>
              <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                {card.label}
              </p>
            </Link>
          </Reveal>
        ))}
      </div>

      {/* Recruitment Controls & Settings */}
      <Reveal delay={0.15}>
        <RecruitmentSettingsForm campaign={stats.activeCampaign} />
      </Reveal>
    </div>
  );
}
