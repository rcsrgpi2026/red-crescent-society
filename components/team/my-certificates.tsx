import { Award, BadgeCheck, Download, ExternalLink } from "lucide-react";
import type { Certificate } from "@/types/database";
import { formatDate } from "@/lib/constants";

export function MyCertificates({ certificates }: { certificates: Certificate[] }) {
  return (
    <div className="mt-10">
      <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
        <Award className="h-5 w-5 text-amber-500" aria-hidden />
        My certificates
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Certificates issued to you come with a public verification link anyone can check.
      </p>

      {certificates.length === 0 ? (
        <div className="mt-4 rounded-xl border border-line bg-mist/50 p-6 text-sm text-muted-foreground">
          No certificates issued yet. Complete trainings or volunteer work to earn one.
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-line rounded-xl border border-line bg-white">
          {certificates.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <Award className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{c.title}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <BadgeCheck className="h-3 w-3 text-emerald-600" aria-hidden />
                    Verifiable{c.issued_at ? ` · issued ${formatDate(c.issued_at)}` : ""}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                {c.file_url && (
                  <a
                    href={c.file_url}
                    download
                    className="inline-flex items-center gap-1.5 rounded-full bg-brand px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-dark"
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden />
                    Download
                  </a>
                )}
                <a
                  href={`/verify/certificate/${c.verify_token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-mist"
                >
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  View
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3 text-xs text-muted-foreground">
        Share the verification link so anyone can confirm this certificate is genuine.
      </p>
    </div>
  );
}
