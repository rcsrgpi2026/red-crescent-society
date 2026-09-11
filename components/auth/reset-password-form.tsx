"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { updatePassword } from "@/lib/auth-actions";
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

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successDestination, setSuccessDestination] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // Check if recovery session or existing active session is available
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setHasSession(true);
      }
      setCheckingSession(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setHasSession(true);
        setCheckingSession(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please verify.");
      return;
    }

    setBusy(true);

    try {
      const res = await updatePassword(password);
      if (res.success) {
        const dest = res.redirectTo || "/volunteer/login";
        setSuccessDestination(dest);
        setTimeout(() => {
          router.push(dest);
          router.refresh();
        }, 2000);
      } else {
        setErrorMessage(res.message || "Failed to update password.");
      }
    } catch {
      setErrorMessage("An unexpected error occurred while updating your password.");
    } finally {
      setBusy(false);
    }
  }

  if (checkingSession) {
    return (
      <div className="flex h-44 flex-col items-center justify-center space-y-3">
        <Loader2 className="h-7 w-7 animate-spin text-crescent" />
        <p className="text-xs text-muted-foreground sm:text-sm">
          Verifying your reset session…
        </p>
      </div>
    );
  }

  if (!hasSession && !successDestination) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-8 ring-amber-50/50 sm:h-16 sm:w-16">
          <ShieldAlert className="h-7 w-7 sm:h-8 sm:w-8" aria-hidden />
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-bold text-foreground sm:text-xl">
            Reset Link Invalid or Expired
          </h3>
          <p className="text-xs text-muted-foreground sm:text-sm">
            For your security, password reset links expire after 1 hour or after being used.
          </p>
        </div>

        <div className="pt-2">
          <Link href="/forgot-password">
            <Button className="w-full h-9 text-xs sm:h-10 sm:text-sm">
              Request a New Reset Link
            </Button>
          </Link>
        </div>

        <div className="pt-1">
          <Link
            href="/volunteer/login"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors sm:text-sm"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (successDestination) {
    return (
      <div className="space-y-5 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/50 sm:h-16 sm:w-16">
          <CheckCircle2 className="h-7 w-7 sm:h-8 sm:w-8" aria-hidden />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-lg font-bold text-foreground sm:text-xl">
            Password Updated!
          </h3>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Your password has been successfully reset. Redirecting you to your portal…
          </p>
        </div>

        <div className="pt-2">
          <Button
            onClick={() => {
              router.push(successDestination);
              router.refresh();
            }}
            className="w-full h-9 text-xs sm:h-10 sm:text-sm"
          >
            Continue to Portal <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  const strength = getPasswordStrength(password);

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
        <Label htmlFor="new-password" className="text-xs sm:text-sm">
          New password
        </Label>
        <div className="relative mt-1 sm:mt-1.5">
          <Input
            id="new-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            className="h-9 pr-10 text-sm sm:h-10"
            required
            autoFocus
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors"
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Strength Indicator */}
        {password.length > 0 && (
          <div className="mt-2 space-y-1">
            <div className="flex h-1.5 w-full gap-1 overflow-hidden rounded-full bg-slate-100">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`h-full flex-1 rounded-full transition-all duration-300 ${
                    strength.score >= step ? strength.color : "bg-slate-200"
                  }`}
                />
              ))}
            </div>
            <p className="text-right text-[11px] font-medium text-muted-foreground">
              Strength: <span className="text-foreground">{strength.label}</span>
            </p>
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="confirm-password" className="text-xs sm:text-sm">
          Confirm new password
        </Label>
        <div className="relative mt-1 sm:mt-1.5">
          <Input
            id="confirm-password"
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your new password"
            className="h-9 pr-10 text-sm sm:h-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors"
            tabIndex={-1}
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        disabled={busy || password.length < 8 || !confirmPassword}
        className="h-9 w-full text-sm sm:h-10"
      >
        {busy ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Lock className="mr-2 h-4 w-4" aria-hidden />
        )}
        {busy ? "Saving new password…" : "Reset Password"}
      </Button>

      <div className="pt-2 text-center">
        <Link
          href="/volunteer/login"
          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors sm:text-sm"
        >
          Cancel and return to Sign In
        </Link>
      </div>
    </form>
  );
}
