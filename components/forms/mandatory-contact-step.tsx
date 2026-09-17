"use client";

import React, { useState } from "react";
import { ShieldCheck, UserPlus, Download, CheckCircle2, Lock, ExternalLink } from "lucide-react";

interface MandatoryContactStepProps {
  checkboxName?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  className?: string;
  required?: boolean;
}

export function MandatoryContactStep({
  checkboxName = "contact_saved_confirmed",
  checked,
  onChange,
  className = "",
  required = true,
}: MandatoryContactStepProps) {
  const [internalChecked, setInternalChecked] = useState(false);

  const isChecked = checked !== undefined ? checked : internalChecked;
  const setChecked = (val: boolean) => {
    if (onChange) onChange(val);
    else setInternalChecked(val);
  };

  const googleContactsUrl =
    "https://contacts.google.com/new?email=supportrgpircy@gmail.com&name=Red+Crescent+Youth+RGPI";

  const handleOpenGoogleContacts = () => {
    setChecked(true);
    window.open(googleContactsUrl, "_blank", "noopener,noreferrer");
  };

  const handleDownloadVcard = () => {
    setChecked(true);
  };

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 ${
        isChecked
          ? "border-emerald-300/90 bg-emerald-50/20 shadow-2xs"
          : "border-slate-200/90 bg-slate-50/70 shadow-2xs"
      } p-4.5 sm:p-5 text-left ${className}`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl shadow-xs transition-colors ${
              isChecked
                ? "bg-emerald-600 text-white"
                : "bg-slate-900 text-white"
            }`}
          >
            {isChecked ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
          </div>
          <div>
            <h4 className="text-sm font-bold tracking-tight text-slate-900 sm:text-[15px]">
              Official Communication Protocol
            </h4>
            <p className="text-[11px] font-medium text-slate-500">
              Safe Sender &amp; Primary Inbox Guarantee
            </p>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider ${
            isChecked
              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-700 border border-rose-200/80"
          }`}
        >
          {isChecked ? "Verified" : "Mandatory Step"}
        </span>
      </div>

      {/* Narrative Description */}
      <div className="mt-3 space-y-2">
        <p className="text-xs leading-relaxed text-slate-600">
          To ensure that admission confirmations, emergency blood alerts, and administrative circulars are not misclassified by email spam filters, you must add our official notification address (
          <span className="font-semibold text-slate-900 font-mono text-[11.5px]">
            supportrgpircy@gmail.com
          </span>
          ) to your address book.
        </p>

        {/* 1-Click Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleOpenGoogleContacts}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-2xs transition-all hover:bg-slate-50 hover:border-slate-400 active:scale-[0.98]"
          >
            <UserPlus className="h-3.5 w-3.5 text-blue-600" />
            Add to Google Contacts
            <ExternalLink className="h-3 w-3 text-slate-400 ml-0.5" />
          </button>

          <a
            href="/api/vcard"
            download="rcy-rgpi.vcf"
            onClick={handleDownloadVcard}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100/80 px-3 py-2 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-200/70 active:scale-[0.98]"
          >
            <Download className="h-3.5 w-3.5 text-slate-600" />
            Download vCard (.vcf)
          </a>
        </div>
      </div>

      {/* Mandatory Checkbox Agreement */}
      <div className="mt-3.5 pt-3 border-t border-slate-200/70">
        <label
          htmlFor={checkboxName}
          className="flex items-start gap-2.5 cursor-pointer select-none group"
        >
          <input
            id={checkboxName}
            name={checkboxName}
            type="checkbox"
            required={required}
            checked={isChecked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand/25 cursor-pointer shrink-0"
          />
          <span className="text-xs leading-relaxed text-slate-700 group-hover:text-slate-900 transition-colors">
            I confirm that I have added <strong className="font-semibold text-slate-900">supportrgpircy@gmail.com</strong> to my contact list, and I agree to mark any routed circulars as <strong className="font-semibold text-slate-900">&quot;Not Spam&quot;</strong> in my mail client. <span className="text-rose-600 font-bold">*</span>
          </span>
        </label>
      </div>
    </div>
  );
}
