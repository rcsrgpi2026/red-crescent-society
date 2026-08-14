import { HeartPulse } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge, statusTone } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { InlineStatus } from "@/components/admin/inline-status";
import { adminGetBloodRequests } from "@/lib/queries";
import { updateBloodRequestStatus } from "@/lib/admin-actions";
import { formatDate, BLOOD_REQUEST_STATUS_LABELS } from "@/lib/constants";

const STATUS_OPTIONS = Object.entries(BLOOD_REQUEST_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export default async function AdminBloodRequestsPage() {
  const requests = await adminGetBloodRequests();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Blood Requests</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track every request through its lifecycle — from pending to completed.
        </p>
      </div>

      {requests.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-mist/60">
                <TableHead>Patient</TableHead>
                <TableHead>Blood</TableHead>
                <TableHead>Hospital / Location</TableHead>
                <TableHead>Requester</TableHead>
                <TableHead>Contact (private)</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <p className="font-medium text-foreground">{r.patient_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.units} unit{r.units > 1 ? "s" : ""} · {formatDate(r.created_at)}
                    </p>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex rounded-md px-2 py-0.5 text-xs font-bold ${
                        r.emergency_level === "EMERGENCY"
                          ? "bg-crescent text-white"
                          : "bg-crescent-soft text-crescent"
                      }`}
                    >
                      {r.blood_group}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-[10rem] text-xs text-muted-foreground">
                    <p className="truncate">{r.hospital ?? "—"}</p>
                    <p className="truncate">{r.location ?? ""}</p>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.requester_name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.contact}</TableCell>
                  <TableCell>
                    <StatusBadge label={r.emergency_level} tone={statusTone(r.emergency_level)} />
                  </TableCell>
                  <TableCell>
                    <InlineStatus
                      action={updateBloodRequestStatus}
                      id={r.id}
                      value={r.status}
                      options={STATUS_OPTIONS}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          icon={HeartPulse}
          title="No blood requests yet"
          description="Requests submitted through the public form appear here."
        />
      )}
    </div>
  );
}
