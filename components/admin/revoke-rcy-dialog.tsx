"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserMinus, Loader2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { revokeStudentRcyMembership } from "@/lib/admin-actions";

interface RevokeRcyDialogProps {
  studentId: string;
  studentName: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function RevokeRcyDialog({
  studentId,
  studentName,
  trigger,
  onSuccess,
}: RevokeRcyDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleRevoke = () => {
    startTransition(async () => {
      try {
        const res = await revokeStudentRcyMembership(studentId);
        if (res.success) {
          toast.success(res.message);
          setOpen(false);
          router.refresh();
          onSuccess?.();
        } else {
          toast.error(res.message);
        }
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to revoke RCY membership.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-amber-700 hover:bg-amber-50 hover:text-amber-800 dark:text-amber-400"
            title="Revoke RCY membership (revert to Student)"
          >
            <UserMinus className="mr-1 h-3.5 w-3.5" />
            Revoke RCY
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Revoke RCY Membership?
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Remove RCY volunteer status for {studentName}.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <p className="text-xs leading-relaxed text-muted-foreground">
          This will remove {studentName}&apos;s team member record and return their portal account to a standard <strong>Student</strong> role. Their academic profile and student login will <strong>not</strong> be deleted.
        </p>

        <DialogFooter className="mt-4 flex-row justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={handleRevoke}
            disabled={isPending}
            className="gap-1.5"
          >
            {isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Revoking…
              </>
            ) : (
              <>
                <UserMinus className="h-3.5 w-3.5" />
                Revoke Membership
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
