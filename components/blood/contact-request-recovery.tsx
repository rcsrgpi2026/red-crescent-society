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
  Phone,
  HeartPulse,
  User,
  KeyRound,
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
      <form onSubmit={handleFind} className="space-y-3">
        <div>
          <Label htmlFor="cr-name" className="text-xs font-semibold text-foreground">
            {strings.nameLabel}
          </Label>
          <div className="relative mt-1">
            <User className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <Input
              id="cr-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={strings.namePlaceholder}
              className="h-10 rounded-xl pl-10 pr-4 bg-slate-50 border-line text-sm"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="cr-phone" className="text-xs font-semibold text-foreground">
              {strings.phoneLabel}
            </Label>
            <div className="relative mt-1">
              <Phone className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
              <Input
                id="cr-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={strings.phonePlaceholder}
                className="h-10 rounded-xl pl-10 pr-4 bg-slate-50 border-line text-sm"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="cr-passcode" className="text-xs font-semibold text-foreground">
              {strings.passcodeLabel}
            </Label>
            <div className="relative mt-1">
              <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
              <Input
                id="cr-passcode"
                type="password"
                inputMode="numeric"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder={strings.passcodePlaceholder}
                className="h-10 rounded-xl pl-10 pr-4 bg-slate-50 border-line text-sm tracking-widest"
                required
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="w-full inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-crescent px-4 text-sm font-bold text-white transition-all shadow-sm hover:bg-crescent-dark active:scale-[0.98] disabled:opacity-50 cursor-pointer"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Search className="h-4 w-4" aria-hidden />}
          {strings.find}
        </button>
      </form>

      {/* Helper contact card */}
      <div className="mt-3.5 rounded-xl border border-line/70 bg-slate-50/70 p-3">
        <p className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-2">
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-crescent/10 text-crescent text-[10px] font-bold">
            ?
          </span>
          লিংক হারিয়েছেন? জরুরি সহায়তা:
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="tel:01614424259"
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-semibold text-foreground shadow-2xs hover:border-crescent/40 hover:text-crescent"
          >
            <Phone className="h-3.5 w-3.5 text-crescent" />
            <span>০১৬১৪-৪২৪২৫৯</span>
          </a>
          <Link
            href="/blood-support/request"
            className="inline-flex items-center gap-1.5 rounded-lg border border-crescent/30 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-crescent shadow-2xs hover:bg-crescent hover:text-white"
          >
            <HeartPulse className="h-3.5 w-3.5" />
            <span>নতুন আবেদন করুন</span>
          </Link>
        </div>
      </div>

      {requests && requests.length > 0 && (
        <ul className="mt-4 divide-y divide-line overflow-hidden rounded-xl border border-line bg-white">
          {requests.map((r) => (
            <li key={r.requestId}>
              <Link
                href={`/blood-support/contact-request/${r.requestId}`}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 px-3.5 py-3 transition-colors hover:bg-slate-50"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-xs font-bold text-crescent border border-crescent/20">
                  {r.donorBloodGroup}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-sm text-foreground">{r.donorName}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {strings.submittedLabel} {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold",
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
