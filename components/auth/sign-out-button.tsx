"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function SignOutButton({
  redirectTo,
  label = "Sign out",
  className,
}: {
  redirectTo: string;
  label?: string;
  className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onClick() {
    setBusy(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      disabled={busy}
      className={className}
    >
      {busy ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <LogOut className="mr-2 h-4 w-4" aria-hidden />
      )}
      {busy ? "Signing out…" : label}
    </Button>
  );
}
