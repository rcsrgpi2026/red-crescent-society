"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/actions";

interface ClearCancelledRequestsProps {
  action: () => Promise<ActionResult>;
  count: number;
}

export function ClearCancelledRequestsButton({
  action,
  count,
}: ClearCancelledRequestsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleClear() {
    setBusy(true);
    try {
      const result = await action();
      if (result.success) {
        toast.success(result.message ?? "Cancelled requests deleted.");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.message ?? "Could not delete cancelled requests.");
      }
    } catch {
      toast.error("An error occurred while deleting.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 font-semibold shadow-xs"
        >
          <Trash2 className="mr-1.5 h-3.5 w-3.5" aria-hidden />
          Delete All Cancelled ({count})
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete all cancelled requests?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2 text-sm text-muted-foreground">
            <span>
              This will permanently delete all {count} cancelled blood request
              {count === 1 ? "" : "s"} from the database.
            </span>
            <span className="block font-medium text-foreground">
              Note: Pending, in-progress, and completed requests are protected and will remain untouched.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleClear();
            }}
            disabled={busy}
            className="bg-crescent hover:bg-crescent-dark text-white font-semibold"
          >
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
            Delete {count} Request{count === 1 ? "" : "s"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
