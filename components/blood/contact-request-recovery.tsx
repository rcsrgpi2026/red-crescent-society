"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Loader2,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Ban,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import {
  findMyContactRequests,
  type ContactRequestRecoveryInfo,
} from "@/lib/actions";
import { Label, Input } from "@/components/ui";
import { cn } from "@/lib/utils";

export interface ContactRecoveryStrings {
  nameLabel: string;
  namePlaceholder: string;
  phoneLabel: string;
  phonePlaceholder: string;
  passcodeLabel: string;
  passcodePlaceholder: string;
  find: string;
  notFound: string;
  note: string;
  view: string;
  submittedLabel: string;
  approvedLabel: string;
  pendingLabel: string;
  rejectedLabel: string;
}

function statusTone(status: string) {
  if (status === "APPROVED") return "bg-emerald-100 text-emerald-800";
  if (status === "PENDING") return "bg-amber-100 text-amber-800";
  return "bg-muted text-muted-foreground";
}

function statusIcon(status: string) {
  if (status === "APPROVED") return <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />;
  if (status === "PENDING") return <Clock className="h-3.5 w-3.5" aria-hidden />;
  return <Ban className="h-3.5 w-3.5" aria-hidden />;
}

export function ContactRequestRecovery({ strings }: { strings: ContactRecoveryStrings }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [passcode, setPasscode] = useState("");
  const [requests, setRequests] = useState<ContactRequestRecoveryInfo[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleFind(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const res = await findMyContactRequests(name, phone, passcode);
    setBusy(false);
    if (res.success && res.data) {
      setRequests(res.data);
      if (res.data.length === 0) {
        setMessage({ type: "error", text: strings.notFound });
      }
    } else {
      setRequests(null);
      setMessage({ type: "error", text: res.message || strings.notFound });
    }
  }

  return (
    <div>
      <form onSubmit={handleFind} className="grid gap-4 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
        <div>
          <Label htmlFor="cr-name">{strings.nameLabel}</Label>
          <Input
            id="cr-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={strings.namePlaceholder}
            className="mt-1.5"
            required
          />
        </div>
        <div>
          <Label htmlFor="cr-phone">{strings.phoneLabel}</Label>
          <Input
            id="cr-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={strings.phonePlaceholder}
            className="mt-1.5"
            required
          />
        </div>
        <div>
          <Label htmlFor="cr-passcode">{strings.passcodeLabel}</Label>
          <Input
            id="cr-passcode"
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
          {strings.find}
        </button>
      </form>

      {requests && requests.length > 0 && (
        <ul className="mt-5 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
          {requests.map((r) => (
            <li key={r.requestId}>
              <Link
                href={`/blood-support/contact-request/${r.requestId}`}
                className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3.5 transition-colors hover:bg-mist/60"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-crescent-soft text-sm font-bold text-crescent">
                  {r.donorBloodGroup}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">{r.donorName}</p>
                  <p className="text-xs text-muted-foreground">
                    {strings.submittedLabel} {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold",
                    statusTone(r.status)
                  )}
                >
                  {statusIcon(r.status)}
                  {r.status === "APPROVED"
                    ? strings.approvedLabel
                    : r.status === "PENDING"
                      ? strings.pendingLabel
                      : strings.rejectedLabel}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-crescent">
                  {strings.view}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" aria-hidden />
        {strings.note}
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
