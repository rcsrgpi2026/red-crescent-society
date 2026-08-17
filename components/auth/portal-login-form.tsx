"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogIn } from "lucide-react";
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
    <form onSubmit={onSubmit} className="space-y-3 sm:space-y-4" noValidate>
      {state.message && !state.success && (
        <div
          role="alert"
          className="rounded-xl border border-crescent/30 bg-crescent-soft p-2.5 text-xs text-crescent sm:p-3.5 sm:text-sm"
        >
          {state.message}
        </div>
      )}
      <div>
        <Label htmlFor="portal-email" className="text-xs sm:text-sm">
          Email
        </Label>
        <Input
          id="portal-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className="mt-1 h-9 text-sm sm:mt-1.5 sm:h-10"
          required
        />
      </div>
      <div>
        <Label htmlFor="portal-password" className="text-xs sm:text-sm">
          Password
        </Label>
        <Input
          id="portal-password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          className="mt-1 h-9 text-sm sm:mt-1.5 sm:h-10"
          required
        />
      </div>
      <Button type="submit" disabled={busy} className="h-9 w-full text-sm sm:h-10">
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
