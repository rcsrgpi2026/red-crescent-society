"use client";

import { Users, Download } from "lucide-react";
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
import type { EventRegistration } from "@/types/database";
import { formatDateTime } from "@/lib/constants";

export function EventRegistrations({
  eventTitle,
  registrations,
}: {
  eventTitle: string;
  registrations: EventRegistration[];
}) {
  function exportCsv() {
    const header = ["Name", "Phone", "Department", "Status", "Registered At"];
    const rows = registrations.map((r) => [
      r.name,
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
            {registrations.length} participant{registrations.length === 1 ? "" : "s"} registered.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={registrations.length === 0}>
            <Download className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            Export CSV
          </Button>
        </div>
        {registrations.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
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
                  <TableCell>{r.phone}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.department ?? "—"}</TableCell>
                  <TableCell>{r.status}</TableCell>
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
