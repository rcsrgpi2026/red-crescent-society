import Link from "next/link";
import Image from "next/image";
import { FileText, ArrowRight, CalendarDays } from "lucide-react";
import { format as formatDateFns } from "date-fns";
import { enGB, bn as bnLocale } from "date-fns/locale";
import type { Notice } from "@/types/database";
import type { Locale } from "@/lib/i18n";

/** Bulletin-board row for regular notices — date block, icon, title. */
export function NoticeListRow({
  notice,
  locale = "en",
}: {
  notice: Notice;
  locale?: Locale;
}) {
  const date = new Date(notice.created_at);
  const fnsLocale = locale === "bn" ? bnLocale : enGB;

  return (
    <Link
      href={`/notices/${notice.slug}`}
      className="group flex items-center gap-3 rounded-2xl border border-line bg-white p-4 transition-all hover:border-brand/40 hover:shadow-sm sm:gap-4"
    >
      {/* Date block */}
      <span className="hidden w-14 shrink-0 flex-col items-center rounded-xl bg-mist px-2 py-1.5 text-center sm:flex">
        <span className="text-lg font-bold leading-none text-brand-dark">
          {formatDateFns(date, "d", { locale: fnsLocale })}
        </span>
        <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {formatDateFns(date, "MMM", { locale: fnsLocale })}
        </span>
      </span>

      {/* Cover thumbnail or Icon */}
      {notice.cover_image ? (
        <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-line bg-mist">
          <Image
            src={notice.cover_image}
            alt={notice.title}
            fill
            sizes="44px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </span>
      ) : (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
          <FileText className="h-5 w-5" aria-hidden />
        </span>
      )}

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px]">
          {notice.category && (
            <span className="font-semibold uppercase tracking-wider text-poly">
              {notice.category}
            </span>
          )}
          {notice.event_id && (
            <span className="inline-flex items-center gap-1 font-semibold text-brand bg-brand-soft px-1.5 py-0.2 rounded-full">
              <CalendarDays className="h-3 w-3" />
              {locale === "bn" ? "ইভেন্ট সংযুক্ত" : "Event"}
            </span>
          )}
          <span className="text-muted-foreground">
            {formatDateFns(date, "yyyy", { locale: fnsLocale })}
          </span>
        </span>
        <span className="mt-0.5 block truncate font-semibold text-foreground transition-colors group-hover:text-brand-dark">
          {notice.title}
        </span>
      </span>

      <ArrowRight
        className="h-4 w-4 shrink-0 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-brand"
        aria-hidden
      />
    </Link>
  );
}
