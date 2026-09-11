"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, Mail, CheckCircle2, ArrowLeft, RefreshCw, AlertCircle } from "lucide-react";
import { requestPasswordReset } from "@/lib/auth-actions";
import { Label, Input, Button } from "@/components/ui";

export function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Check if user was redirected back with an error (e.g., token expired)
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      if (
        errorParam.includes("expired") ||
        errorParam.includes("invalid") ||
        errorParam.includes("token")
      ) {
        setErrorMessage(
          "Your reset link was invalid or has expired. Please enter your email to request a new one."
        );
      } else {
        setErrorMessage(errorParam);
      }
    }
  }, [searchParams]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email) return;

    setBusy(true);
    setErrorMessage(null);

    try {
      const res = await requestPasswordReset(email);
      if (res.success) {
        setSubmitted(true);
        setCooldown(60);
      } else {
        setErrorMessage(res.message || "Failed to send reset email. Please try again.");
      }
    } catch {
      setErrorMessage("An unexpected error occurred. Please try again later.");
    } finally {
      setBusy(false);
    }
  }

  async function handleResend() {
    if (cooldown > 0 || busy || !email) return;
    setBusy(true);
    setErrorMessage(null);

    try {
      const res = await requestPasswordReset(email);
      if (res.success) {
        setCooldown(60);
      } else {
        setErrorMessage(res.message || "Failed to resend reset link.");
      }
    } catch {
      setErrorMessage("Failed to resend email. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (submitted) {
    return (
      <div className="space-y-5 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/50 sm:h-16 sm:w-16">
          <CheckCircle2 className="h-7 w-7 sm:h-8 sm:w-8" aria-hidden />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-lg font-bold text-foreground sm:text-xl">
            Check your inbox
          </h3>
          <p className="text-xs text-muted-foreground sm:text-sm">
            We have sent a password reset link to:
          </p>
          <p className="font-semibold text-brand-dark break-all text-xs sm:text-sm">
            {email}
          </p>
        </div>

        <div className="rounded-xl border border-muted bg-slate-50/80 p-3.5 text-left text-xs text-muted-foreground sm:text-sm">
          <p className="leading-relaxed">
            Click the link in the email to set a new password. The link will remain active for <strong>1 hour</strong>.
          </p>
          <p className="mt-2 text-[11px] text-muted-foreground/80 sm:text-xs">
            Tip: If you don&apos;t see it within 2 minutes, check your <strong>Spam</strong> or <strong>Junk</strong> folder.
          </p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="rounded-xl border border-crescent/30 bg-crescent-soft p-2.5 text-xs text-crescent sm:p-3 sm:text-sm text-left flex items-start gap-2"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="space-y-2 pt-2">
          <Button
            type="button"
            variant="outline"
            disabled={busy || cooldown > 0}
            onClick={handleResend}
            className="w-full h-9 text-xs sm:h-10 sm:text-sm"
          >
            {busy ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-3.5 w-3.5" />
            )}
            {cooldown > 0 ? `Resend email in ${cooldown}s` : "Resend reset link"}
          </Button>

          <Link
            href="/volunteer/login"
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors sm:text-sm"
          >
            <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {errorMessage && (
        <div
          role="alert"
          className="rounded-xl border border-crescent/30 bg-crescent-soft p-2.5 text-xs text-crescent sm:p-3 sm:text-sm flex items-start gap-2"
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div>
        <Label htmlFor="reset-email" className="text-xs sm:text-sm">
          Email address
        </Label>
        <Input
          id="reset-email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter the email linked to your account"
          className="mt-1 h-9 text-sm sm:mt-1.5 sm:h-10"
          required
          autoFocus
        />
        <p className="mt-1.5 text-[11px] text-muted-foreground sm:text-xs">
          We will send you a secure link to reset your password.
        </p>
      </div>

      <Button type="submit" disabled={busy || !email.trim()} className="h-9 w-full text-sm sm:h-10">
        {busy ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Mail className="mr-2 h-4 w-4" aria-hidden />
        )}
        {busy ? "Sending reset link…" : "Send Reset Link"}
      </Button>

      <div className="pt-2 text-center">
        <Link
          href="/volunteer/login"
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors sm:text-sm"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Sign In
        </Link>
      </div>
    </form>
  );
}
