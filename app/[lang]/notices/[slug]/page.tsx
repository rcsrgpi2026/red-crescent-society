import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pin, Paperclip, FileText, Download } from "lucide-react";
import { getPublicNoticeBySlug, getNoticeAttachments } from "@/lib/queries";
import { formatDate } from "@/lib/constants";
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

        <div className="mt-8 rounded-2xl border border-line bg-mist/40 p-6 sm:p-8">
          {notice.content ? (
            <div className="whitespace-pre-wrap leading-relaxed text-foreground/85">
              {notice.content}
            </div>
          ) : (
            <p className="text-muted-foreground">{t.notices.noContent}</p>
          )}
        </div>

        {attachments.length > 0 && (
          <div className="mt-8">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-foreground">
              <Paperclip className="h-4 w-4 text-brand" aria-hidden />
              {t.notices.attachments}
            </h2>
            <ul className="mt-3 space-y-2">
              {attachments.map((attachment) => (
                <li key={attachment.id}>
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl border border-line bg-white p-3.5 transition-colors hover:border-brand/40"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-soft text-brand">
                      <FileText className="h-4.5 w-4.5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {attachment.name}
                      </span>
                      {attachment.size ? (
                        <span className="text-xs text-muted-foreground">
                          {(attachment.size / 1024).toFixed(0)} KB
                        </span>
                      ) : null}
                    </span>
                    <Download className="h-4 w-4 text-muted-foreground" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
