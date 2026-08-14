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

interface ConfirmDeleteProps {
  action: (id: string) => Promise<ActionResult>;
  id: string;
  label?: string;
  description?: string;
  /** Navigate here after a successful delete (e.g. back to a list page). */
  redirectTo?: string;
}

export function ConfirmDelete({
  action,
  id,
  label = "Delete",
  description = "This action cannot be undone.",
  redirectTo,
}: ConfirmDeleteProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    setBusy(true);
    const result = await action(id);
    setBusy(false);
    if (result.success) {
      toast.success(result.message ?? "Deleted.");
      // Detail pages that deleted their own record must leave — the record
      // no longer exists and re-rendering it would show a 404.
      if (redirectTo) router.push(redirectTo);
    } else {
      toast.error(result.message ?? "Could not delete.");
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-crescent hover:bg-crescent-soft">
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
          <span className="ml-1">{label}</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={busy}
            className="bg-crescent hover:bg-crescent-dark"
          >
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
