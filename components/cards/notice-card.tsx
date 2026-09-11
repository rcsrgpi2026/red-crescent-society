import Link from "next/link";
import Image from "next/image";
import { Pin, FileText, ArrowRight } from "lucide-react";
import type { Notice } from "@/types/database";
import { formatDate } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function NoticeCard({ notice }: { notice: Notice }) {
  return (
    <Link
      href={`/notices/${notice.slug}`}
      className={cn(
        "group flex w-full max-w-full min-w-0 box-border flex-col sm:flex-row overflow-hidden rounded-2xl border bg-white shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md",
        notice.pinned
          ? "border-brand/40 bg-gradient-to-br sm:bg-gradient-to-r from-brand-soft/20 via-white to-white hover:border-brand"
          : "border-line hover:border-brand/40"
      )}
    >
      {notice.cover_image ? (
        <div className="relative w-full max-w-full aspect-[2/1] sm:aspect-auto sm:w-44 md:w-48 sm:self-stretch overflow-hidden bg-mist">
          <Image
            src={notice.cover_image}
            alt={notice.title}
            fill
            sizes="(max-width: 640px) 100vw, 192px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {notice.pinned && (
            <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-crescent px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs backdrop-blur-xs">
              <Pin className="h-3 w-3" />
              Pinned
            </span>
          )}
        </div>
      ) : (
        <div className="flex h-14 sm:h-auto sm:w-24 shrink-0 items-center justify-center bg-brand-soft/50 text-brand px-4 sm:px-0">
          {notice.pinned ? (
            <Pin className="h-6 w-6 text-crescent" aria-hidden />
          ) : (
            <FileText className="h-6 w-6 text-brand" aria-hidden />
          )}
        </div>
      )}

      <div className="flex flex-1 min-w-0 max-w-full flex-col justify-between p-3.5 sm:p-4.5">
        <div className="min-w-0 max-w-full">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            {notice.pinned && !notice.cover_image && (
              <span className="rounded-full bg-crescent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                Pinned
              </span>
            )}
            {notice.category && (
              <span className="text-[11px] font-semibold uppercase tracking-wider text-poly">
                {notice.category}
              </span>
            )}
            <span className="text-[11px] text-muted-foreground">{formatDate(notice.created_at)}</span>
          </div>

          <h3 className="mt-1.5 line-clamp-2 text-sm sm:text-base font-bold leading-snug text-foreground transition-colors group-hover:text-brand-dark break-words">
            {notice.title}
          </h3>

          {notice.content && (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground break-words">
              {notice.content}
            </p>
          )}
        </div>

        <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-brand transition-colors group-hover:text-brand-dark pt-2 border-t border-line/40 sm:border-0 sm:pt-0">
          <span>বিস্তারিত দেখুন</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}
