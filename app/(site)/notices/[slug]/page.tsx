import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Pin,
  Paperclip,
  FileText,
  Download,
  ExternalLink,
  CalendarDays,
  Clock,
  MapPin,
  ArrowRight,
  UserCheck,
  Sparkles,
} from "lucide-react";
import { getPublicNoticeBySlug, getNoticeAttachments } from "@/lib/queries";
import { formatDate, formatEventDateRange, resolveEventStatus, EVENT_STATUS_LABELS } from "@/lib/constants";
import { StatusBadge, statusTone } from "@/components/shared/status-badge";
import { getServerLocale, getServerMessages } from "@/lib/i18n/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [t, notice] = await Promise.all([getServerMessages(), getPublicNoticeBySlug(slug)]);
  if (!notice) return { title: t.common.notFound };
  return {
    title: notice.title,
    description: notice.content?.slice(0, 160) ?? undefined,
    openGraph: {
      title: notice.title,
      description: notice.content?.slice(0, 200) ?? undefined,
      images: notice.cover_image ? [{ url: notice.cover_image }] : undefined,
    },
  };
}

export default async function NoticeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [t, locale, notice] = await Promise.all([
    getServerMessages(),
    getServerLocale(),
    getPublicNoticeBySlug(slug),
  ]);
  if (!notice) notFound();

  const attachments = await getNoticeAttachments(notice.id);
  const coverUrl = notice.cover_image || attachments[0]?.url;
  // Exclude the banner/cover image from the attachments list so it doesn't duplicate at the bottom
  const nonCoverAttachments = attachments.filter(
    (a) => a.url.trim() !== coverUrl?.trim()
  );

  return (
    <section className="border-b border-line bg-white">
      <div className="container-site max-w-3xl py-12 lg:py-16">
        <Link
          href="/notices"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand-dark"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t.notices.allNoticesBack}
        </Link>

        <div className="mt-6">
          {notice.pinned && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-crescent px-3 py-1 text-xs font-bold text-white">
              <Pin className="h-3.5 w-3.5" aria-hidden />
              {t.notices.pinnedNotice}
            </span>
          )}
          <h1 className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {notice.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {notice.category && <span className="font-semibold text-poly">{notice.category}</span>}
            <span>{formatDate(notice.created_at, locale === "bn" ? "bn-BD" : "en-GB")}</span>
          </div>
        </div>

        {coverUrl && (
          <div className="mt-8 overflow-hidden rounded-3xl border border-line bg-mist shadow-xs">
            <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full max-h-[460px] overflow-hidden">
              <Image
                src={coverUrl}
                alt={notice.title}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-cover"
              />
              <a
                href={coverUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-xl bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md transition-all hover:bg-slate-900 shadow-md"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View Full
              </a>
            </div>
          </div>
        )}

        <div className="mt-8 rounded-2xl border border-line bg-mist/40 p-6 sm:p-8">
          {notice.content ? (
            <div className="whitespace-pre-wrap leading-relaxed text-foreground/85">
              {notice.content}
            </div>
          ) : (
            <p className="text-muted-foreground">{t.notices.noContent}</p>
          )}
        </div>

        {notice.events && (
          <div className="mt-8 overflow-hidden rounded-2xl border-2 border-brand/20 bg-gradient-to-br from-brand-soft/60 via-white to-poly-soft/30 p-6 sm:p-7 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand/10 pb-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand px-3 py-1 text-xs font-bold text-white shadow-xs">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden />
                  {locale === "bn" ? "সম্পর্কিত ইভেন্ট / কর্মসূচি" : "Associated Event"}
                </span>
                {notice.events.category && (
                  <span className="text-xs font-semibold text-brand-dark bg-brand/10 px-2.5 py-0.5 rounded-full">
                    {notice.events.category}
                  </span>
                )}
              </div>
              <StatusBadge
                label={EVENT_STATUS_LABELS[resolveEventStatus(notice.events)] ?? notice.events.status}
                tone={statusTone(resolveEventStatus(notice.events))}
              />
            </div>

            <div className="mt-4">
              <h3 className="text-xl font-bold text-foreground sm:text-2xl">
                {notice.events.title}
              </h3>

              <div className="mt-3 flex flex-wrap gap-y-2 gap-x-5 text-sm text-muted-foreground">
                {notice.events.date && (
                  <span className="flex items-center gap-1.5 font-medium text-foreground">
                    <CalendarDays className="h-4 w-4 text-brand" />
                    {formatEventDateRange(notice.events.date, (notice.events as any).end_date, locale === "bn" ? "bn-BD" : "en-GB")}
                  </span>
                )}
                {notice.events.time && (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-4 w-4 text-brand" />
                    {notice.events.time}
                  </span>
                )}
                {notice.events.location && (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="h-4 w-4 text-poly" />
                    {notice.events.location}
                  </span>
                )}
              </div>

              {notice.events.description && (
                <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                  {notice.events.description}
                </p>
              )}

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href={`/events/${notice.events.slug}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-dark hover:shadow-md"
                >
                  {notice.events.registration_enabled &&
                  ["UPCOMING", "ONGOING"].includes(notice.events.status) ? (
                    <>
                      <UserCheck className="h-4 w-4" />
                      {locale === "bn" ? "ইভেন্টে অংশ নিতে রেজিস্টার করুন" : "Register for this Event"}
                    </>
                  ) : (
                    <>
                      {locale === "bn" ? "ইভেন্ট বিস্তারিত দেখুন" : "View Event Details"}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Link>
                <Link
                  href={`/events/${notice.events.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-mist hover:text-brand-dark"
                >
                  {locale === "bn" ? "কর্মসূচি শিডিউল" : "Event Schedule"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {nonCoverAttachments.length > 0 && (
          <div className="mt-8">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-foreground">
              <Paperclip className="h-4 w-4 text-brand" aria-hidden />
              {t.notices.attachments}
            </h2>
            <ul className="mt-3 space-y-2.5">
              {nonCoverAttachments.map((attachment) => {
                const isImage =
                  attachment.url.match(/\.(jpg|jpeg|png|webp|gif|svg|avif)$/i) ||
                  attachment.url.includes("images/notices");
                const isDrive =
                  attachment.url.includes("drive.google.com") ||
                  attachment.url.includes("docs.google.com");
                const isExternal =
                  !attachment.url.includes("supabase.co/storage") &&
                  (attachment.url.startsWith("http://") || attachment.url.startsWith("https://"));

                let domain = "";
                if (isExternal) {
                  try {
                    domain = new URL(attachment.url).hostname;
                  } catch {
                    domain = "external link";
                  }
                }

                return (
                  <li key={attachment.id || attachment.url}>
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-3.5 rounded-2xl border border-line bg-white p-3.5 transition-all hover:border-brand/40 hover:shadow-xs"
                    >
                      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-mist">
                        {isImage ? (
                          <Image
                            src={attachment.url}
                            alt={attachment.name}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                            sizes="44px"
                          />
                        ) : isDrive || isExternal ? (
                          <span className="flex h-full w-full items-center justify-center bg-poly-soft text-poly">
                            <ExternalLink className="h-5 w-5" aria-hidden />
                          </span>
                        ) : (
                          <span className="flex h-full w-full items-center justify-center bg-brand-soft text-brand">
                            <FileText className="h-5 w-5" aria-hidden />
                          </span>
                        )}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-foreground group-hover:text-brand transition-colors">
                          {attachment.name}
                        </span>
                        <span className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          {domain ? (
                            <span className="text-poly font-medium">🔗 {domain}</span>
                          ) : attachment.size ? (
                            <span>{(attachment.size / 1024).toFixed(0)} KB</span>
                          ) : isImage ? (
                            <span>Image</span>
                          ) : (
                            <span>Document</span>
                          )}
                        </span>
                      </span>

                      {isExternal ? (
                        <span className="inline-flex items-center gap-1 rounded-lg border border-line bg-mist/60 px-2.5 py-1 text-xs font-medium text-foreground group-hover:bg-brand-soft group-hover:text-brand group-hover:border-brand/30 transition-all shrink-0">
                          <span>{locale === "bn" ? "ভিজিট করুন" : "Open Link"}</span>
                          <ExternalLink className="h-3 w-3" />
                        </span>
                      ) : (
                        <Download className="h-4 w-4 text-muted-foreground group-hover:text-brand transition-colors shrink-0" aria-hidden />
                      )}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
