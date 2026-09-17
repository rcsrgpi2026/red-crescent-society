"use client";

import React from "react";
import { ShieldCheck, UserPlus, Download, ExternalLink } from "lucide-react";

interface AddToContactsCardProps {
  className?: string;
  variant?: "default" | "compact" | "banner";
}

export function AddToContactsCard({
  className = "",
  variant = "default",
}: AddToContactsCardProps) {
  const googleContactsUrl =
    "https://contacts.google.com/new?email=supportrgpircy@gmail.com&name=Red+Crescent+Youth+RGPI";

  if (variant === "compact") {
    return (
      <div
        className={`rounded-2xl border border-slate-200/90 bg-slate-50/80 p-3.5 text-left text-xs shadow-2xs ${className}`}
      >
        <div className="flex items-start gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white shadow-xs">
            <ShieldCheck className="h-3.5 w-3.5" />
          </div>
          <div className="flex-1 space-y-1">
            <p className="font-bold text-slate-900 text-[13px]">
              Primary Inbox Safe Sender
            </p>
            <p className="text-[11.5px] leading-relaxed text-slate-600">
              Add our official email to your contacts to guarantee direct inbox delivery for time-critical alerts.
            </p>
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <a
                href={googleContactsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-800 shadow-2xs transition hover:bg-slate-50 active:scale-95"
              >
                <UserPlus className="h-3 w-3 text-blue-600" />
                Add to Google Contacts
              </a>
              <a
                href="/api/vcard"
                download="rcy-rgpi.vcf"
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100/70 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-200/60 active:scale-95"
              >
                <Download className="h-3 w-3 text-slate-500" />
                vCard (.vcf)
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`mx-auto max-w-xl rounded-2xl border border-slate-200/90 bg-slate-50/80 p-5 text-left shadow-2xs sm:p-6 ${className}`}
    >
      <div className="flex flex-col gap-3.5 sm:flex-row sm:items-start">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-200/80 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-700">
              Safe Sender Protocol
            </span>
          </div>
          <h3 className="text-sm font-bold text-slate-900 sm:text-base">
            Ensure Inbox Delivery for Official Notices
          </h3>
          <p className="text-xs leading-relaxed text-slate-600 sm:text-[13px]">
            To prevent automatic spam filter misclassification on upcoming verification results, member dispatches, and emergency blood appeals, add our official notification address (
            <span className="font-semibold text-slate-900 font-mono text-[11.5px]">
              supportrgpircy@gmail.com
            </span>
            ) to your contacts.
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <a
              href={googleContactsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-2xs transition-all hover:bg-slate-50 hover:border-slate-400 active:scale-[0.98]"
            >
              <UserPlus className="h-3.5 w-3.5 text-blue-600" />
              Add to Google Contacts
              <ExternalLink className="h-3 w-3 text-slate-400 ml-0.5" />
            </a>
            <a
              href="/api/vcard"
              download="rcy-rgpi.vcf"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-200/70 active:scale-[0.98]"
            >
              <Download className="h-3.5 w-3.5 text-slate-600" />
              Download vCard (.vcf)
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
