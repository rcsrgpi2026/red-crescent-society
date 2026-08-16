"use client";

import { useState } from "react";
import {
  Loader2,
  Search,
  CheckCircle2,
  AlertCircle,
  Ban,
  UserX,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  findMyDonorListing,
  toggleDonorAvailabilityByPhone,
  toggleDonorPhonePublic,
  removeDonorListingByPhone,
  setMyDonorPasscode,
  type DonorListingInfo,
} from "@/lib/actions";
import { Label, Input } from "@/components/ui";
import { cn } from "@/lib/utils";

export function DonorSelfService() {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [passcode, setPasscode] = useState("");
  const [newPasscode, setNewPasscode] = useState("");
  const [listing, setListing] = useState<DonorListingInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleFind(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const res = await findMyDonorListing(phone, name, passcode);
    setBusy(false);
    if (res.success && res.data) {
      setListing(res.data);
    } else {
      setListing(null);
      setMessage({ type: "error", text: res.message || "Could not find your listing." });
    }
  }

  async function handleSetPasscode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!listing) return;
    setBusy(true);
    setMessage(null);
    const res = await setMyDonorPasscode(listing.id, phone, name, newPasscode);
    setBusy(false);
    if (res.success) {
      setPasscode(newPasscode);
      setNewPasscode("");
      setListing({ ...listing, needsPasscode: false });
      setMessage({
        type: "success",
        text: "Passcode set! Your listing is now protected — use your name, number and passcode to manage it.",
      });
    } else {
      setMessage({ type: "error", text: res.message || "Could not set your passcode." });
    }
  }

  async function handleToggle() {
    if (!listing) return;
    setBusy(true);
    setMessage(null);
    const res = await toggleDonorAvailabilityByPhone(listing.id, phone, name, passcode);
    setBusy(false);
    if (res.success && res.data) {
      setListing({ ...listing, availability: res.data });
      setMessage({
        type: "success",
        text:
          res.data === "AVAILABLE"
            ? "You are listed as available again — donors can now find you."
            : "You are marked as unavailable and removed from the public donor list.",
      });
    } else {
      setMessage({ type: "error", text: res.message || "Could not update your listing." });
    }
  }

  async function handleTogglePhonePublic() {
    if (!listing) return;
    if (!listing.phonePublic) {
      const ok = window.confirm(
        "Make your number public? Anyone browsing the donor list will see it without needing a contact request. You can hide it again anytime."
      );
      if (!ok) return;
    }
    setBusy(true);
    setMessage(null);
    const res = await toggleDonorPhonePublic(listing.id, phone, name, passcode);
    setBusy(false);
    if (res.success && typeof res.data === "boolean") {
      setListing({ ...listing, phonePublic: res.data });
      setMessage({
        type: "success",
        text: res.data
          ? "Your number is now public — visitors can call you directly from the donor list."
          : "Your number is private again — visitors will use the contact request flow instead.",
      });
    } else {
      setMessage({ type: "error", text: res.message || "Could not update your number's visibility." });
    }
  }

  async function handleRemove() {
    if (!listing) return;
    if (!window.confirm("Remove your donor listing permanently? You can register again anytime.")) {
      return;
    }
    setBusy(true);
    setMessage(null);
    const res = await removeDonorListingByPhone(listing.id, phone, name, passcode);
    setBusy(false);
    if (res.success) {
      setListing(null);
      setPhone("");
      setName("");
      setPasscode("");
      setMessage({ type: "success", text: res.message || "Your donor listing has been removed." });
    } else {
      setMessage({ type: "error", text: res.message || "Could not remove your listing." });
    }
  }

  return (
    <div>
      {!listing ? (
        <form onSubmit={handleFind} className="grid gap-4 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
          <div>
            <Label htmlFor="ds-name">Full name</Label>
            <Input
              id="ds-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name used at registration"
              className="mt-1.5"
              required
            />
          </div>
          <div>
            <Label htmlFor="ds-phone">Mobile number</Label>
            <Input
              id="ds-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="017XXXXXXXX"
              className="mt-1.5"
              required
            />
          </div>
          <div>
            <Label htmlFor="ds-passcode">Passcode</Label>
            <Input
              id="ds-passcode"
              type="password"
              inputMode="numeric"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Your 4–6 digit code"
              className="mt-1.5"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-crescent px-4 text-sm font-semibold text-white transition-colors hover:bg-crescent-dark disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Search className="h-4 w-4" aria-hidden />}
            Find my listing
          </button>
        </form>
      ) : listing.needsPasscode ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="flex items-center gap-2 text-sm font-bold text-amber-900">
            <KeyRound className="h-4 w-4" aria-hidden />
            Your listing needs a passcode
          </p>
          <p className="mt-1 text-xs leading-relaxed text-amber-800">
            This listing was created before passcodes existed. Set a 4–6 digit passcode now to
            protect it — you&apos;ll use it with your name and number from then on.
          </p>
          <form onSubmit={handleSetPasscode} className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <Label htmlFor="ds-new-passcode">New passcode (4–6 digits)</Label>
              <Input
                id="ds-new-passcode"
                type="password"
                inputMode="numeric"
                pattern="[0-9]{4,6}"
                value={newPasscode}
                onChange={(e) => setNewPasscode(e.target.value)}
                placeholder="••••"
                className="mt-1.5"
                required
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-crescent px-4 text-sm font-semibold text-white transition-colors hover:bg-crescent-dark disabled:opacity-50"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              Set passcode
            </button>
          </form>
        </div>
      ) : (
        <div className="rounded-2xl border border-line bg-mist/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-foreground">{listing.name}</p>
              <p className="text-xs text-muted-foreground">
                {listing.blood_group} · {listing.area || "Campus area"}
              </p>
            </div>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold",
                listing.availability === "AVAILABLE"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {listing.availability === "AVAILABLE" ? (
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <Ban className="h-3.5 w-3.5" aria-hidden />
              )}
              {listing.availability === "AVAILABLE" ? "Available to donate" : "Unavailable"}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleToggle}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-full border border-crescent/30 bg-white px-3 py-1.5 text-xs font-semibold text-crescent transition-colors hover:bg-crescent-soft disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Ban className="h-3.5 w-3.5" aria-hidden />}
              {listing.availability === "AVAILABLE" ? "Mark unavailable" : "Mark available again"}
            </button>
            <button
              type="button"
              onClick={handleTogglePhonePublic}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-full border border-crescent/30 bg-white px-3 py-1.5 text-xs font-semibold text-crescent transition-colors hover:bg-crescent-soft disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : listing.phonePublic ? <EyeOff className="h-3.5 w-3.5" aria-hidden /> : <Eye className="h-3.5 w-3.5" aria-hidden />}
              {listing.phonePublic ? "Hide my number" : "Show my number publicly"}
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-full border border-crescent/30 bg-white px-3 py-1.5 text-xs font-semibold text-crescent transition-colors hover:bg-crescent-soft disabled:opacity-50"
            >
              <UserX className="h-3.5 w-3.5" aria-hidden />
              Remove my listing
            </button>
          </div>
        </div>
      )}

      <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" aria-hidden />
        Only the name, phone number and passcode you registered with can manage this listing. Your
        number and passcode are never shown publicly — the passcode is stored only as a secure hash.
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
