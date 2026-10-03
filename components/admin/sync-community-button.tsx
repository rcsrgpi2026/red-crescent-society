"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/actions";

interface SyncCommunityButtonProps {
  action: () => Promise<ActionResult>;
}

export function SyncCommunityButton({ action }: SyncCommunityButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleSync() {
    setBusy(true);
    try {
      const result = await action();
      if (result.success) {
        toast.success(result.message ?? "Executive members synced successfully!");
        router.refresh();
      } else {
        toast.error(result.message ?? "Could not sync community members.");
      }
    } catch {
      toast.error("An error occurred during synchronization.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleSync}
      disabled={busy}
      className="border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100 hover:text-teal-800 font-medium"
    >
      {busy ? (
        <>
          <Loader2 className="mr-1.5 h-4 w-4 animate-spin text-teal-600" aria-hidden />
          Syncing...
        </>
      ) : (
        <>
          <RefreshCw className="mr-1.5 h-4 w-4 text-teal-600" aria-hidden />
          Sync from Volunteers
        </>
      )}
    </Button>
  );
}
