"use client";

import { Users, Award, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InlineStatus } from "@/components/admin/inline-status";
import {
  updateTrainingParticipantStatus,
  issueTrainingCertificate,
} from "@/lib/admin-actions";
import type { AdminTrainingParticipant } from "@/types/database";
import { formatDateTime } from "@/lib/constants";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "COMPLETED", label: "Completed" },
  { value: "DROPPED", label: "Dropped" },
];

function statusTone(status: string) {
  if (status === "COMPLETED") return "bg-emerald-100 text-emerald-800";
  if (status === "APPROVED") return "bg-brand-soft text-brand-dark";
  if (status === "REJECTED" || status === "DROPPED") return "bg-muted text-muted-foreground";
  return "bg-amber-100 text-amber-800";
}

export function TrainingParticipants({
  trainingId,
  trainingTitle,
  participants,
}: {
  trainingId: string;
  trainingTitle: string;
  participants: AdminTrainingParticipant[];
}) {
  const approvedCount = participants.filter(
    (p) => p.status === "APPROVED" || p.status === "COMPLETED"
  ).length;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Users className="mr-1.5 h-3.5 w-3.5" aria-hidden />
          Participants ({participants.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Participants — {trainingTitle}</DialogTitle>
          <DialogDescription>
            {participants.length} member{participants.length === 1 ? "" : "s"} ·{" "}
            {approvedCount} approved/enrolled · {participants.filter((p) => p.status === "COMPLETED").length} completed
          </DialogDescription>
        </DialogHeader>
        {participants.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Certificate</TableHead>
                <TableHead>Requested</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {participants.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <p className="font-medium">{p.team_members?.name ?? "—"}</p>
                    {p.team_members?.member_id && (
                      <p className="text-[10px] font-semibold text-muted-foreground">
                        {p.team_members.member_id}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {p.team_members?.position ?? "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold",
                          statusTone(p.status)
                        )}
                      >
                        {p.status}
                      </span>
                      <InlineStatus
                        action={updateTrainingParticipantStatus}
                        id={p.id}
                        value={p.status}
                        options={STATUS_OPTIONS}
                        triggerClassName="w-32"
                        ariaLabel="Update enrollment status"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <IssueCertificateButton participantId={p.id} />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDateTime(p.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No join requests yet. Members see the Join button on the training page.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

function IssueCertificateButton({ participantId }: { participantId: string }) {
  const [busy, setBusy] = useState(false);

  async function onClick() {
    setBusy(true);
    const fd = new FormData();
    fd.set("participantId", participantId);
    const result = await issueTrainingCertificate(fd);
    setBusy(false);
    if (result.success) {
      toast.success(result.message ?? "Certificate issued.");
    } else {
      toast.error(result.message ?? "Could not issue certificate.");
    }
  }

  return (
    <Button variant="ghost" size="sm" onClick={onClick} disabled={busy}>
      {busy ? (
        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden />
      ) : (
        <Award className="mr-1.5 h-3.5 w-3.5" aria-hidden />
      )}
      Issue
    </Button>
  );
}
