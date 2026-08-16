import Link from "next/link";
import { Pin, ArrowRight } from "lucide-react";
import type { Notice } from "@/types/database";
import { formatDate } from "@/lib/constants";
import type { Locale } from "@/lib/i18n";

/**
 * Large bulletin-board style card for pinned notices — the accent bar, badge
 * and bigger type make it read as a posted announcement.
 */
export function NoticeFeatureCard({
  notice,
  locale = "en",
  pinnedLabel,
  readLabel,
}: {
  notice: Notice;
  locale?: Locale;
  pinnedLabel: string;
  readLabel: string;
}) {
  return (
    <Link
      href={`/notices/${notice.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-brand/40 bg-gradient-to-br from-brand-soft/60 via-white to-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand hover:shadow-md sm:p-7"
    >
      {/* Accent band */}
      <span
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand via-crescent to-crescent"
        aria-hidden
      />
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="inline-flex items-center gap-1 rounded-full bg-crescent px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
          <Pin className="h-3 w-3" aria-hidden />
          {pinnedLabel}
        </span>
        {notice.category && (
          <span className="text-[11px] font-semibold uppercase tracking-wider text-poly">
            {notice.category}
          </span>
        )}
        <span className="text-[11px] text-muted-foreground">
          {formatDate(notice.created_at, locale === "bn" ? "bn-BD" : "en-GB")}
        </span>
      </div>
      <h3 className="mt-3 line-clamp-2 text-lg font-bold leading-snug text-foreground transition-colors group-hover:text-brand-dark sm:text-xl">
        {notice.title}
      </h3>
      {notice.content && (
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {notice.content}
        </p>
      )}
      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand transition-colors group-hover:text-brand-dark">
        {readLabel}
        <ArrowRight
          className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </span>
    </Link>
  );
}
