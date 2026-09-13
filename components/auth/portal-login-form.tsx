"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, LogIn, Mail, Lock } from "lucide-react";
import { portalLogin, type LoginResult } from "@/lib/auth-actions";
import { Label, Input, Button } from "@/components/ui";

export function PortalLoginForm() {
  const router = useRouter();
  const [state, setState] = useState<LoginResult>({ success: false });
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setState({ success: false });
    const fd = new FormData(e.currentTarget);
    const result = await portalLogin(
      String(fd.get("email") ?? ""),
      String(fd.get("password") ?? "")
    );
    setBusy(false);
    if (result.success && result.redirectTo) {
      router.push(result.redirectTo);
      router.refresh();
    } else {
      setState(result);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {state.message && !state.success && (
        <div
          role="alert"
          className="rounded-2xl border border-crescent/30 bg-crescent-soft p-3 text-xs text-crescent sm:text-sm"
        >
          {state.message}
        </div>
      )}
      <div>
        <Label htmlFor="portal-email" className="font-medium text-foreground text-xs sm:text-sm">
          Email
        </Label>
        <div className="relative mt-1.5">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
          <Input
            id="portal-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className="pl-10"
            required
          />
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="portal-password" className="font-medium text-foreground text-xs sm:text-sm">
            Password
          </Label>
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-crescent hover:underline transition-colors"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative mt-1.5">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
          <Input
            id="portal-password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            className="pl-10"
            required
          />
        </div>
      </div>
      <Button
        type="submit"
        disabled={busy}
        className="h-11 w-full rounded-full bg-crescent hover:bg-crescent-dark text-white font-bold shadow-md shadow-crescent/20 active:scale-[0.98] transition-all text-sm"
      >
        {busy ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <LogIn className="mr-2 h-4 w-4" aria-hidden />
        )}
        {busy ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
