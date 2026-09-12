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

      {/* Forgotten passcode or lost link helper options */}
      <div className="mt-4 rounded-2xl border border-line/70 bg-mist/30 p-3.5 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground flex items-center gap-1.5 mb-0.5">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-crescent/10 text-crescent text-[10px] font-bold">
                ?
              </span>
              পাসকোড বা ট্র্যাকিং লিংক হারিয়েছেন? / Lost passcode or link?
            </span>
            আপনার রিকোয়েস্টটি অ্যাডমিন প্যানেলে সুরক্ষিত রয়েছে। জরুরি প্রয়োজনে সরাসরি যোগাযোগ করুন:
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <a
              href="tel:01614424259"
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-1.5 text-xs font-semibold text-foreground shadow-xs transition-colors hover:border-crescent/40 hover:bg-crescent-soft hover:text-crescent"
            >
              <Phone className="h-3.5 w-3.5 text-crescent" />
              <span>জরুরি হটলাইন: ০১৬১৪-৪২৪২৫৯</span>
            </a>
            <Link
              href="/blood-support/request"
              className="inline-flex items-center gap-1.5 rounded-xl border border-crescent/30 bg-crescent-soft px-3 py-1.5 text-xs font-semibold text-crescent shadow-xs transition-colors hover:bg-crescent hover:text-white"
            >
              <HeartPulse className="h-3.5 w-3.5" />
              <span>জরুরি রক্তের পোস্ট করুন</span>
            </Link>
          </div>
        </div>
      </div>

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
