import Link from "next/link";
import { Pin, FileText } from "lucide-react";
import type { Notice } from "@/types/database";
import { formatDate } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function NoticeCard({ notice }: { notice: Notice }) {
  return (
    <Link
      href={`/notices/${notice.slug}`}
      className={cn(
        "group flex gap-4 rounded-2xl border bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-md",
        notice.pinned
          ? "border-brand/50 bg-brand-soft/40 hover:border-brand"
          : "border-line hover:border-brand/40"
      )}
    >
      <span
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
          notice.pinned ? "bg-crescent text-white" : "bg-brand-soft text-brand"
        )}
      >
        {notice.pinned ? (
          <Pin className="h-5 w-5" aria-hidden />
        ) : (
          <FileText className="h-5 w-5" aria-hidden />
        )}
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          {notice.pinned && (
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
        <h3 className="mt-1 line-clamp-2 font-semibold text-foreground transition-colors group-hover:text-brand-dark">
          {notice.title}
        </h3>
      </div>
    </Link>
  );
}
