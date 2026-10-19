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
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import {
  adminApproveVolunteerApplication,
  adminRejectVolunteerApplication,
  adminDeleteVolunteerApplication,
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
  const [customSerialNo, setCustomSerialNo] = useState(
    application.serial_no || ""
  );
  const [rejectionReason, setRejectionReason] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleApprove = () => {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await adminApproveVolunteerApplication(
        application.id,
        customSerialNo
      );
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
      <div className="flex flex-wrap items-center gap-3">
        <div className="rounded-xl border border-line bg-mist/40 px-3.5 py-1.5 text-xs font-semibold text-muted-foreground">
          Application status: {application.status}
        </div>
        <ConfirmDelete
          action={adminDeleteVolunteerApplication}
          id={application.id}
          label="Delete Application"
          description={`Are you sure you want to delete ${application.name}'s application? If approved, its assigned roll number (${application.serial_no || application.roll}) will be permanently deleted and freed for subsequent registrations.`}
          redirectTo="/admin/recruitment/applications"
        />
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
            setCustomSerialNo(application.serial_no || "");
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

        <ConfirmDelete
          action={adminDeleteVolunteerApplication}
          id={application.id}
          label="Delete"
          description={`Delete this volunteer application for ${application.name}? This will remove the application and completely free any associated registration roll.`}
          redirectTo="/admin/recruitment/applications"
        />
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
              Are you sure you want to approve <strong>{application.name}</strong>&apos;s volunteer admission application?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 text-xs text-emerald-950 space-y-2">
              <p className="font-semibold flex items-center gap-1.5 text-emerald-800">
                <ShieldCheck className="h-4 w-4" />
                অনুমোদনের পর স্বয়ংক্রিয় কার্যক্রম:
              </p>
              <ul className="list-disc list-inside space-y-1 text-emerald-900/90 pl-1">
                <li>আবেদনের স্ট্যাটাস <strong>APPROVED</strong> হবে এবং ক্রমিক/রোল নম্বর ইস্যু হবে।</li>
                <li>অফিসিয়াল <strong>প্রবেশপত্র (Admit Card)</strong> স্টুডেন্ট পোর্টালে উন্মুক্ত হবে।</li>
                <li>আবেদনকারী <strong>STUDENT</strong> হিসেবেই থাকবে। ইন্টারভিউ ও ট্রেইনিং সম্পন্ন হলে অ্যাডমিন তাকে পরবর্তীতে অফিসিয়াল RCY সদস্যপদে প্রমোট করতে পারবেন।</li>
              </ul>
            </div>

            {/* Custom / Confirmed Form Serial or Roll No */}
            <div className="space-y-1.5 pt-1">
              <Label htmlFor="custom-serial-no" className="text-xs font-semibold text-foreground">
                অফিসিয়াল ফর্ম এর ক্রমিক/রোল নং (Form Serial / Roll No)
              </Label>
              <input
                id="custom-serial-no"
                type="text"
                value={customSerialNo}
                onChange={(e) => setCustomSerialNo(e.target.value)}
                placeholder="স্বয়ংক্রিয়ভাবে তৈরি হবে: online-reg-1 (বা কাস্টম লিখুন)"
                className="w-full rounded-xl border border-line bg-white px-3 py-2 text-xs font-mono font-medium focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
              <p className="text-[11px] text-muted-foreground">
                অনুমোদনের পর এই রোল নম্বরটি (online-reg-1, online-reg-2...) স্বয়ংক্রিয়ভাবে তৈরি হয়ে প্রবেশপত্রে ও স্টুডেন্ট পোর্টালে যুক্ত হবে। খালি রাখলে ক্রমানুসারে তৈরি হবে।
              </p>
            </div>
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
              This note will be included respectfully in the applicant&apos;s notification.
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
