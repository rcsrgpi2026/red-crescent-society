"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Loader2,
  Mail,
  CheckCircle2,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  Edit3,
  ShieldCheck,
} from "lucide-react";
import { requestPasswordReset, resetPasswordWithCode } from "@/lib/auth-actions";
import { Label, Input, Button } from "@/components/ui";

function getPasswordStrength(pwd: string): { score: number; label: string; color: string } {
  if (!pwd) return { score: 0, label: "", color: "bg-slate-200" };
  let score = 0;
  if (pwd.length >= 8) score += 1;
  if (/[A-Z]/.test(pwd)) score += 1;
  if (/[0-9]/.test(pwd)) score += 1;
  if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

  if (score <= 1) return { score: 1, label: "Weak", color: "bg-red-500" };
  if (score === 2) return { score: 2, label: "Fair", color: "bg-amber-500" };
  if (score === 3) return { score: 3, label: "Good", color: "bg-blue-500" };
  return { score: 4, label: "Strong", color: "bg-emerald-500" };
}

export function ForgotPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<"request" | "verify" | "success">("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Pre-fill email from query param if available
  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam.trim());
    }

    const codeParam = searchParams.get("code") || searchParams.get("otp");
    if (codeParam) {
      setCode(codeParam.trim());
      setStep("verify");
    }

    const errorParam = searchParams.get("error");
    if (errorParam) {
      setErrorMessage(errorParam);
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

  // Step 1: Send 6-digit verification code to email
  async function handleSendCode(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    setBusy(true);
    setErrorMessage(null);

    try {
      const res = await requestPasswordReset(cleanEmail);
      if (res.success) {
        setStep("verify");
        setCooldown(60);
      } else {
        setErrorMessage(res.message || "Failed to send verification code. Please try again.");
      }
    } catch {
      setErrorMessage("An unexpected error occurred. Please try again later.");
    } finally {
      setBusy(false);
    }
  }

  // Step 2: Verify 6-digit code & reset password
  async function handleResetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);

    const cleanCode = code.trim().replace(/\s+/g, "");
    if (!cleanCode || cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
      setErrorMessage("Please enter the 6-digit verification code sent to your email.");
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please verify.");
      return;
    }

    setBusy(true);

    try {
      const res = await resetPasswordWithCode({
        email: email.trim(),
        code: cleanCode,
        newPassword,
      });

      if (res.success) {
        setStep("success");
        const destination = res.redirectTo || "/volunteer/login";
        setTimeout(() => {
          router.push(destination);
          router.refresh();
        }, 1800);
      } else {
        setErrorMessage(res.message || "Failed to reset password. Please check your 6-digit code.");
      }
    } catch {
      setErrorMessage("An error occurred while resetting your password. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  // Resend code handler
  async function handleResendCode() {
    if (cooldown > 0 || busy || !email.trim()) return;
    setBusy(true);
    setErrorMessage(null);

    try {
      const res = await requestPasswordReset(email.trim());
      if (res.success) {
        setCooldown(60);
      } else {
        setErrorMessage(res.message || "Failed to resend code.");
      }
    } catch {
      setErrorMessage("Failed to resend code. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  // -------------------------------------------------------------
  // SUCCESS STATE
  // -------------------------------------------------------------
  if (step === "success") {
    return (
      <div className="space-y-5 text-center py-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/50">
          <CheckCircle2 className="h-8 w-8" aria-hidden />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-xl font-bold text-foreground">Password Reset Successful!</h3>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Your new password has been set. Logging you into your account…
          </p>
        </div>
        <div className="flex justify-center pt-2">
          <Loader2 className="h-6 w-6 animate-spin text-crescent" />
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STEP 2: VERIFY 6-DIGIT CODE & SET NEW PASSWORD
  // -------------------------------------------------------------
  if (step === "verify") {
    const strength = getPasswordStrength(newPassword);

    return (
      <form onSubmit={handleResetPassword} className="space-y-4" noValidate>
        {/* Email badge with Edit option */}
        <div className="flex items-center justify-between rounded-xl border border-line/60 bg-slate-50/80 p-3 text-xs">
          <div className="min-w-0 pr-2">
            <span className="text-muted-foreground block text-[11px]">Verification code sent to</span>
            <span className="font-semibold text-foreground truncate block">{email}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setStep("request");
              setErrorMessage(null);
            }}
            className="inline-flex items-center gap-1 text-xs font-semibold text-crescent hover:text-crescent-dark transition-colors shrink-0"
          >
            <Edit3 className="h-3 w-3" />
            Edit
          </button>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="rounded-xl border border-crescent/30 bg-crescent-soft p-3 text-xs text-crescent flex items-start gap-2"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 6-Digit Code Input */}
        <div>
          <Label htmlFor="reset-code" className="font-semibold text-foreground text-xs sm:text-sm flex items-center justify-between">
            <span>6-Digit Verification Code</span>
            <span className="text-[11px] font-normal text-muted-foreground">Check inbox & spam</span>
          </Label>
          <div className="relative mt-1.5">
            <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <Input
              id="reset-code"
              name="code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
                setCode(val);
              }}
              placeholder="123456"
              className="pl-10 text-center font-mono text-xl tracking-[0.35em] font-bold h-12"
              required
              autoFocus
            />
          </div>
        </div>

        {/* New Password */}
        <div>
          <Label htmlFor="new-password" className="font-medium text-foreground text-xs sm:text-sm">
            New Password
          </Label>
          <div className="relative mt-1.5">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <Input
              id="new-password"
              name="newPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="pl-10 pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {/* Strength Bar */}
          {newPassword && (
            <div className="mt-2 space-y-1">
              <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full transition-all duration-300 ${strength.color}`}
                  style={{ width: `${(strength.score / 4) * 100}%` }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Password strength: <span className="font-semibold text-foreground">{strength.label}</span>
              </p>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <Label htmlFor="confirm-password" className="font-medium text-foreground text-xs sm:text-sm">
            Confirm New Password
          </Label>
          <div className="relative mt-1.5">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <Input
              id="confirm-password"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your new password"
              className="pl-10 pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-foreground"
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={busy || code.trim().length !== 6 || newPassword.length < 8}
          className="h-11 w-full rounded-full bg-crescent hover:bg-crescent-dark text-white font-bold shadow-md shadow-crescent/20 active:scale-[0.98] transition-all text-sm mt-2"
        >
          {busy ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <ShieldCheck className="mr-2 h-4 w-4" aria-hidden />
          )}
          {busy ? "Resetting Password…" : "Reset Password & Sign In"}
        </Button>

        {/* Resend Code Options */}
        <div className="flex items-center justify-between pt-2 border-t border-line/50 text-xs">
          <button
            type="button"
            disabled={busy || cooldown > 0}
            onClick={handleResendCode}
            className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${busy ? "animate-spin" : ""}`} />
            {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend 6-digit code"}
          </button>

          <Link
            href="/volunteer/login"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Back to Sign In
          </Link>
        </div>
      </form>
    );
  }

  // -------------------------------------------------------------
  // STEP 1: REQUEST CODE (Enter Email)
  // -------------------------------------------------------------
  return (
    <form onSubmit={handleSendCode} className="space-y-4" noValidate>
      {errorMessage && (
        <div
          role="alert"
          className="rounded-xl border border-crescent/30 bg-crescent-soft p-3 text-xs text-crescent flex items-start gap-2"
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div>
        <Label htmlFor="reset-email" className="font-medium text-foreground text-xs sm:text-sm">
          Email address
        </Label>
        <div className="relative mt-1.5">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
          <Input
            id="reset-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your registered email address"
            className="pl-10"
            required
            autoFocus
          />
        </div>
        <p className="mt-1.5 text-[11px] text-muted-foreground sm:text-xs">
          We will send a 6-digit verification code to this email to reset your password.
        </p>
      </div>

      <Button
        type="submit"
        disabled={busy || !email.trim()}
        className="h-11 w-full rounded-full bg-crescent hover:bg-crescent-dark text-white font-bold shadow-md shadow-crescent/20 active:scale-[0.98] transition-all text-sm"
      >
        {busy ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <KeyRound className="mr-2 h-4 w-4" aria-hidden />
        )}
        {busy ? "Sending 6-digit code…" : "Send 6-Digit Code"}
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
