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
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {state.message && !state.success && (
        <div
          role="alert"
          className="rounded-xl border border-crescent/30 bg-crescent-soft p-3.5 text-sm text-crescent"
        >
          {state.message}
        </div>
      )}
      <div>
        <Label htmlFor="portal-email">Email</Label>
        <Input
          id="portal-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className="mt-1.5"
          required
        />
      </div>
      <div>
        <Label htmlFor="portal-password">Password</Label>
        <Input
          id="portal-password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          className="mt-1.5"
          required
        />
      </div>
      <Button type="submit" disabled={busy} className="w-full">
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
