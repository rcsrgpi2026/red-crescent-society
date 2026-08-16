"use client";

import Link from "next/link";
import { Users, Download, FileText } from "lucide-react";
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
import { updateEventRegistrationStatus } from "@/lib/admin-actions";
import type { EventRegistration } from "@/types/database";
import { formatDateTime } from "@/lib/constants";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "REGISTERED", label: "Registered" },
  { value: "ATTENDED", label: "Attended" },
  { value: "CANCELLED", label: "Cancelled" },
];

function statusTone(status: string) {
  if (status === "ATTENDED") return "bg-emerald-100 text-emerald-800";
  if (status === "CANCELLED") return "bg-muted text-muted-foreground";
  return "bg-amber-100 text-amber-800";
}

/** Short identity label for a registration, e.g. "TM-0042" or "Roll 20190". */
function identityLabel(r: EventRegistration): string | null {
  if (r.team_members?.member_id) return r.team_members.member_id;
  if (r.students?.roll) return `Roll ${r.students.roll}`;
  return null;
}

function IdentityBadge({ r }: { r: EventRegistration }) {
  const label = identityLabel(r);
  if (!label) {
    return (
      <span className="inline-flex items-center rounded-full bg-mist px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
        Community
      </span>
    );
  }
  const isTeam = Boolean(r.team_members?.member_id);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold",
        isTeam ? "bg-brand-soft text-brand-dark" : "bg-poly-soft text-poly"
      )}
    >
      {isTeam ? "Team · " : "Student · "}
      {label}
    </span>
  );
}

export function EventRegistrations({
  eventId,
  eventTitle,
  registrations,
}: {
  eventId: string;
  eventTitle: string;
  registrations: EventRegistration[];
}) {
  const attendedCount = registrations.filter((r) => r.status === "ATTENDED").length;
  const cancelledCount = registrations.filter((r) => r.status === "CANCELLED").length;

  function exportCsv() {
    const header = ["Name", "Identity", "Phone", "Department", "Status", "Registered At"];
    const rows = registrations.map((r) => [
      r.name,
      identityLabel(r) ?? "Community",
      r.phone,
      r.department ?? "",
      r.status,
      r.created_at,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${eventTitle.replace(/[^a-z0-9]+/gi, "-")}-registrations.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Users className="mr-1.5 h-3.5 w-3.5" aria-hidden />
          Registrations ({registrations.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Registrations — {eventTitle}</DialogTitle>
          <DialogDescription>
            {registrations.length} participant{registrations.length === 1 ? "" : "s"} ·{" "}
            {attendedCount} attended · {cancelledCount} cancelled
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 font-semibold text-emerald-800">
              {attendedCount} attended
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 font-semibold text-amber-800">
              {registrations.length - attendedCount - cancelledCount} registered
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 font-semibold text-muted-foreground">
              {cancelledCount} cancelled
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {registrations.length > 0 ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/events/export?eventId=${encodeURIComponent(eventId)}`}>
                  <FileText className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                  Export PDF
                </Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" disabled>
                <FileText className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                Export PDF
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={registrations.length === 0}>
              <Download className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              Export CSV
            </Button>
          </div>
        </div>
        {registrations.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Identity</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registered</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registrations.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>
                    <IdentityBadge r={r} />
                  </TableCell>
                  <TableCell>{r.phone}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.department ?? "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold",
                          statusTone(r.status)
                        )}
                      >
                        {r.status}
                      </span>
                      <InlineStatus
                        action={updateEventRegistrationStatus}
                        id={r.id}
                        value={r.status}
                        options={STATUS_OPTIONS}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDateTime(r.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">No registrations yet.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
