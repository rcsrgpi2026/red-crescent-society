"use client";

import { useState } from "react";
import {
  Loader2,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Ban,
  MapPin,
  PhoneCall,
  ShieldCheck,
} from "lucide-react";
import {
  trackMyContactRequest,
  type ContactRequestTrackingInfo,
} from "@/lib/actions";
import { Label, Input } from "@/components/ui";
import { cn } from "@/lib/utils";

export interface ContactRequestStrings {
  contactLabel: string;
  contactPlaceholder: string;
  passcodeLabel: string;
  passcodePlaceholder: string;
  checkStatus: string;
  approvedLabel: string;
  pendingLabel: string;
  rejectedLabel: string;
  donorPhoneLabel: string;
  approvedPhoneNote: string;
  pendingText: string;
  rejectedText: string;
  verifyNote: string;
  notFoundText: string;
}

export function ContactRequestTracker({
  requestId,
  strings,
}: {
  requestId: string;
  strings: ContactRequestStrings;
}) {
  const [contact, setContact] = useState("");
  const [passcode, setPasscode] = useState("");
  const [info, setInfo] = useState<ContactRequestTrackingInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleCheck(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const res = await trackMyContactRequest(requestId, contact, passcode);
    setBusy(false);
    if (res.success && res.data) {
      setInfo(res.data);
    } else {
      setInfo(null);
      setMessage({ type: "error", text: res.message || strings.notFoundText });
    }
  }

  return (
    <div>
      {!info ? (
        <form onSubmit={handleCheck} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div>
            <Label htmlFor="ct-contact">{strings.contactLabel}</Label>
            <Input
              id="ct-contact"
              type="tel"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder={strings.contactPlaceholder}
              className="mt-1.5"
              required
            />
          </div>
          <div>
            <Label htmlFor="ct-passcode">{strings.passcodeLabel}</Label>
            <Input
              id="ct-passcode"
              type="password"
              inputMode="numeric"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder={strings.passcodePlaceholder}
              className="mt-1.5"
              required
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-crescent px-4 text-sm font-semibold text-white transition-colors hover:bg-crescent-dark disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Search className="h-4 w-4" aria-hidden />}
            {strings.checkStatus}
          </button>
        </form>
      ) : (
        <div className="rounded-2xl border border-line bg-mist/40 p-5">
          {/* Status header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-crescent-soft text-sm font-bold text-crescent">
                {info.donorBloodGroup}
              </span>
              <div>
                <p className="font-semibold text-foreground">{info.donorName}</p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" aria-hidden />
                  {info.donorArea ?? "Campus area"}
                </p>
              </div>
            </div>
            {info.status === "APPROVED" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                {strings.approvedLabel}
              </span>
            )}
            {info.status === "PENDING" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                <Clock className="h-3.5 w-3.5" aria-hidden />
                {strings.pendingLabel}
              </span>
            )}
            {info.status === "REJECTED" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
                <Ban className="h-3.5 w-3.5" aria-hidden />
                {strings.rejectedLabel}
              </span>
            )}
          </div>

          {/* Body by status */}
          {info.status === "APPROVED" && info.donorPhone && (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800">
                <PhoneCall className="h-4 w-4" aria-hidden />
                {strings.donorPhoneLabel}
              </p>
              <a
                href={`tel:${info.donorPhone}`}
                className="mt-2 block text-2xl font-bold text-emerald-900 hover:underline"
              >
                {info.donorPhone}
              </a>
              <p className="mt-2 text-xs leading-relaxed text-emerald-800">
                {strings.approvedPhoneNote}
              </p>
            </div>
          )}
          {info.status === "PENDING" && (
            <p className="mt-5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
              <Clock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              {strings.pendingText}
            </p>
          )}
          {info.status === "REJECTED" && (
            <p className="mt-5 flex items-start gap-2 rounded-xl border border-muted bg-muted/40 p-4 text-sm leading-relaxed text-muted-foreground">
              <Ban className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              {strings.rejectedText}
            </p>
          )}
        </div>
      )}

      <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" aria-hidden />
        {strings.verifyNote}
      </p>

      {message && (
        <div
          role="status"
          className={cn(
            "mt-3 flex items-start gap-2 rounded-lg px-3 py-2 text-xs font-medium",
            message.type === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border border-crescent/30 bg-crescent-soft text-crescent"
          )}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          ) : (
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          )}
          <span>{message.text}</span>
        </div>
      )}
    </div>
  );
}
