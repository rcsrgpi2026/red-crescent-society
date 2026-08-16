import { Bell } from "lucide-react";
import type { DonorContactNotification } from "@/types/database";
import { formatDate } from "@/lib/constants";

export function DonorContactNotifications({
  requests,
}: {
  requests: DonorContactNotification[];
}) {
  if (requests.length === 0) return null;

  return (
    <div className="rounded-3xl border border-crescent/30 bg-crescent-soft p-5 shadow-sm sm:p-6">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-crescent">
        <Bell className="h-4 w-4" aria-hidden />
        New donor contact request{requests.length > 1 ? "s" : ""}
      </p>
      <ul className="mt-3 space-y-3">
        {requests.map((r) => (
          <li key={r.request_id} className="rounded-2xl border border-crescent/20 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">
                {r.requester_name} requested your contact
              </p>
              <span className="text-xs text-muted-foreground">{formatDate(r.created_at)}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {r.blood_group && (
                <span className="mr-1.5 inline-flex rounded-md bg-crescent-soft px-1.5 py-0.5 text-[10px] font-bold text-crescent">
                  {r.blood_group}
                </span>
              )}
              Blood needed for{" "}
              <span className="font-semibold text-foreground">
                {r.patient_name ?? "a patient"}
              </span>
              {r.hospital ? ` at ${r.hospital}` : ""}
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">
        The society team reviews every request first — you&apos;ll be connected only after it&apos;s
        approved.
      </p>
    </div>
  );
}
