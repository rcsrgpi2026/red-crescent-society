"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, X, Loader2 } from "lucide-react";
import type { Volunteer } from "@/types/database";
import type { ActionResult } from "@/lib/actions";

interface AttendanceSheetProps {
  volunteers: Volunteer[];
  attendanceMap: Map<string, string>;
  eventId: string;
  action: (formData: FormData) => Promise<ActionResult>;
}

export function AttendanceSheet({
  volunteers,
  attendanceMap,
  eventId,
  action,
}: AttendanceSheetProps) {
  const [busyId, setBusyId] = useState<string | null>(null);

  async function mark(volunteerId: string, status: "PRESENT" | "ABSENT") {
    setBusyId(volunteerId);
    const fd = new FormData();
    fd.set("eventId", eventId);
    fd.set("volunteerId", volunteerId);
    fd.set("mark", status);
    const result = await action(fd);
    setBusyId(null);
    if (result.success) {
      toast.success(`Marked ${status.toLowerCase()}.`);
    } else {
      toast.error(result.message ?? "Failed.");
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white">
      {volunteers.length > 0 ? (
        <ul className="divide-y divide-line">
          {volunteers.map((v) => {
            const current = attendanceMap.get(v.id);
            return (
              <li key={v.id} className="flex items-center gap-3 px-5 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-bold text-brand">
                  {v.name.charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{v.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {v.member_id ?? "—"} · {[v.department, v.semester].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                {current ? (
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      current === "PRESENT"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-crescent-soft text-crescent"
                    }`}
                  >
                    {current}
                  </span>
                ) : busyId === v.id ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden />
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => mark(v.id, "PRESENT")}
                      className="flex items-center gap-1 rounded-full bg-brand px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-dark"
                    >
                      <Check className="h-3.5 w-3.5" aria-hidden />
                      Present
                    </button>
                    <button
                      onClick={() => mark(v.id, "ABSENT")}
                      className="flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-mist"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden />
                      Absent
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No approved volunteers yet.
        </p>
      )}
    </div>
  );
}
