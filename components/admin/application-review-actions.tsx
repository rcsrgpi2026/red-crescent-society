"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  adminApproveVolunteerApplication,
  adminRejectVolunteerApplication,
} from "@/lib/recruitment-actions";
import type { VolunteerApplication } from "@/types/database";

interface ApplicationReviewActionsProps {
  application: VolunteerApplication;
}

export function ApplicationReviewActions({
  application,
}: ApplicationReviewActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleApprove = () => {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await adminApproveVolunteerApplication(application.id);
      if (res.success) {
        setApproveDialogOpen(false);
        router.refresh();
      } else {
        setErrorMsg(res.message || "Failed to approve application.");
      }
    });
  };

  const handleReject = () => {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await adminRejectVolunteerApplication(
        application.id,
        rejectionReason
      );
      if (res.success) {
        setRejectDialogOpen(false);
        router.refresh();
      } else {
        setErrorMsg(res.message || "Failed to reject application.");
      }
    });
  };

  if (application.status !== "PENDING") {
    return (
      <div className="rounded-2xl border border-line bg-mist/40 p-4 text-center">
        <p className="text-xs font-semibold text-muted-foreground">
          This application has been reviewed ({application.status.toLowerCase()}). No further actions required.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          onClick={() => {
            setErrorMsg(null);
            setApproveDialogOpen(true);
          }}
          disabled={isPending}
          className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 font-semibold"
        >
          <CheckCircle2 className="h-4 w-4" />
          Approve Application
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setErrorMsg(null);
            setRejectDialogOpen(true);
          }}
          disabled={isPending}
          className="gap-2 border-crescent/30 text-crescent hover:bg-crescent-soft hover:text-crescent-dark font-semibold"
        >
          <XCircle className="h-4 w-4" />
          Reject Application
        </Button>
      </div>

      {/* Approve Confirmation Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 mb-2">
              <Award className="h-6 w-6" />
            </div>
            <DialogTitle className="text-center text-lg font-bold">
              Approve Volunteer Application
            </DialogTitle>
            <DialogDescription className="text-center text-xs leading-relaxed text-muted-foreground">
              Are you sure you want to approve <strong>{application.name}</strong> (Roll: {application.roll}) as an official RGPI Red Crescent Youth volunteer?
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 text-xs text-emerald-950 space-y-2">
            <p className="font-semibold flex items-center gap-1.5 text-emerald-800">
              <ShieldCheck className="h-4 w-4" />
              Automated actions upon approval:
            </p>
            <ul className="list-disc list-inside space-y-1 text-emerald-900/90 pl-1">
              <li>Student role will be converted to <strong>VOLUNTEER</strong>.</li>
              <li>A sequential Member ID (RCR-{new Date().getFullYear()}-XXXX) will be generated.</li>
              <li>Official Team Member portal and ID Card access will be unlocked.</li>
              <li>An automated celebration notification will be dispatched.</li>
              <li>Student account data remains fully preserved.</li>
            </ul>
          </div>

          {errorMsg && (
            <p className="text-xs font-medium text-crescent">{errorMsg}</p>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setApproveDialogOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleApprove}
              disabled={isPending}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              {isPending ? "Approving…" : "Confirm Approval"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-crescent-soft text-crescent mb-2">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <DialogTitle className="text-center text-lg font-bold">
              Reject Volunteer Application
            </DialogTitle>
            <DialogDescription className="text-center text-xs leading-relaxed text-muted-foreground">
              Please confirm the rejection for <strong>{application.name}</strong>. The applicant will remain a student and receive a notification.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="rejection-reason" className="text-xs font-semibold">
              Rejection Reason (Optional)
            </Label>
            <Textarea
              id="rejection-reason"
              rows={3}
              placeholder="e.g. Ineligible semester requirements or incomplete details..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="text-xs"
            />
            <p className="text-[11px] text-muted-foreground">
              This note will be included respectfully in the applicant's notification.
            </p>
          </div>

          {errorMsg && (
            <p className="text-xs font-medium text-crescent">{errorMsg}</p>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleReject}
              disabled={isPending}
              className="gap-2 bg-crescent hover:bg-crescent-dark text-white font-semibold"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              ) : (
                <XCircle className="h-4 w-4 text-white" />
              )}
              {isPending ? "Rejecting…" : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
