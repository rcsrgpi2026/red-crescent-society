import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { BadgeCheck, ShieldAlert, Award } from "lucide-react";
import { formatDate } from "@/lib/constants";
import { SiteLogo } from "@/components/layout/site-logo";
import { getServerMessages } from "@/lib/i18n/server";
import { format } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerMessages();
  return {
    title: t.meta.verify.title,
    description: t.meta.verify.description,
    robots: { index: false, follow: false },
  };
}

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const t = await getServerMessages();

  let result: {
    certificate_title: string;
    issued_at: string | null;
    volunteer_name: string;
    member_id: string | null;
    valid: boolean;
  } | null = null;

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const { data } = await supabase.rpc("verify_certificate", { p_token: token });
    result = data && data.length > 0 ? data[0] : null;
  }

  if (!result) notFound();

  return (
    <section className="flex min-h-[60vh] items-center justify-center bg-mist/50 py-16">
      <div className="container-site max-w-lg">
        <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-line bg-mist/60 px-6 py-4">
            <div className="flex items-center gap-2">
              <SiteLogo variant="society" className="w-8" />
              <p className="text-xs font-bold uppercase tracking-wider text-brand-dark">
                {t.verify.title}
              </p>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              <BadgeCheck className="h-4 w-4" aria-hidden />
              {t.verify.valid}
            </span>
          </div>
          <div className="px-6 py-8 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-brand">
              <Award className="h-7 w-7" aria-hidden />
            </span>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-brand">
              {t.verify.certifiesThat}
            </p>
            <h1 className="mt-2 text-3xl font-bold text-foreground">{result.volunteer_name}</h1>
            {result.member_id && (
              <p className="mt-1 text-sm text-muted-foreground">
                {t.verify.memberId}
                {result.member_id}
              </p>
            )}
            <p className="mt-5 text-base font-medium text-foreground">
              {t.verify.hasSuccessfullyCompleted}
            </p>
            <p className="mt-1 text-xl font-bold text-brand-dark">{result.certificate_title}</p>
            {result.issued_at && (
              <p className="mt-4 text-sm text-muted-foreground">
                {format(t.verify.issuedOn, { date: formatDate(result.issued_at) })}
              </p>
            )}
            <p className="mt-6 text-sm text-muted-foreground">{t.verify.bySociety}</p>
          </div>
          <div className="flex items-center gap-2 border-t border-line bg-mist/60 px-6 py-4 text-xs text-muted-foreground">
            <ShieldAlert className="h-4 w-4 shrink-0 text-brand" aria-hidden />
            <p>{t.verify.officialNote}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
