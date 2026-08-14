import { HeartPulse } from "lucide-react";
import { StatusBadge, statusTone } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { InlineStatus } from "@/components/admin/inline-status";
import { AdminPageHeader } from "@/components/admin/page-header";
import {
  ResponsiveTable,
  type Column,
} from "@/components/admin/responsive-table";
import { adminGetBloodRequests } from "@/lib/queries";
import { updateBloodRequestStatus } from "@/lib/admin-actions";
import { formatDate, BLOOD_REQUEST_STATUS_LABELS } from "@/lib/constants";

const STATUS_OPTIONS = Object.entries(BLOOD_REQUEST_STATUS_LABELS).map(
  ([value, label]) => ({ value, label })
);

export default async function AdminBloodRequestsPage() {
  const requests = await adminGetBloodRequests();

  const columns: Column<(typeof requests)[number]>[] = [
    {
      header: "Patient",
      render: (r) => (
        <div>
          <p className="font-medium text-foreground">{r.patient_name}</p>
          <p className="text-xs text-muted-foreground">
            {r.units} unit{r.units > 1 ? "s" : ""} · {formatDate(r.created_at)}
          </p>
        </div>
      ),
    },
    {
      header: "Blood",
      render: (r) => (
        <span
          className={`inline-flex rounded-md px-2 py-0.5 text-xs font-bold ${
            r.emergency_level === "EMERGENCY"
              ? "bg-crescent text-white"
              : "bg-crescent-soft text-crescent"
          }`}
        >
          {r.blood_group}
        </span>
      ),
    },
    {
      header: "Hospital / Location",
      render: (r) => (
        <span className="block max-w-[10rem] text-xs text-muted-foreground">
          <span className="block truncate">{r.hospital ?? "—"}</span>
          <span className="block truncate">{r.location ?? ""}</span>
        </span>
      ),
    },
    {
      header: "Requester",
      render: (r) => (
        <span className="text-xs text-muted-foreground">{r.requester_name}</span>
      ),
    },
    {
      header: "Contact (private)",
      render: (r) => (
        <span className="text-xs text-muted-foreground">{r.contact}</span>
      ),
    },
    {
      header: "Level",
      render: (r) => (
        <StatusBadge label={r.emergency_level} tone={statusTone(r.emergency_level)} />
      ),
    },
    {
      header: "Status",
      render: (r) => (
        <InlineStatus
          action={updateBloodRequestStatus}
          id={r.id}
          value={r.status}
          options={STATUS_OPTIONS}
        />
      ),
      mobileRender: (r) => (
        <StatusBadge
          label={BLOOD_REQUEST_STATUS_LABELS[r.status] ?? r.status}
          tone={statusTone(r.status)}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={HeartPulse}
        title="Blood Requests"
        description="Track every request through its lifecycle — from pending to completed."
        tone="bg-gradient-to-br from-crescent to-crescent-dark"
      />

      <ResponsiveTable
        columns={columns}
        rows={requests}
        keyFor={(r) => r.id}
        minWidth="min-w-[760px]"
        empty={
          <EmptyState
            icon={HeartPulse}
            title="No blood requests yet"
            description="Requests submitted through the public form appear here."
          />
        }
      />
    </div>
  );
}
