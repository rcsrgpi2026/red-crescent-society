import { HeartPulse, CheckCircle2, Circle } from "lucide-react";
import { StatusBadge, statusTone } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { InlineStatus } from "@/components/admin/inline-status";
import { AdminPageHeader } from "@/components/admin/page-header";
import {
  ResponsiveTable,
  type Column,
} from "@/components/admin/responsive-table";
import { adminGetBloodRequests } from "@/lib/queries";
import {
  updateBloodRequestStatus,
  submitConfirmBloodDonation,
  submitUnconfirmBloodDonation,
} from "@/lib/admin-actions";
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
        <div className="flex flex-col items-start gap-1.5">
          <StatusBadge
            label={BLOOD_REQUEST_STATUS_LABELS[r.status] ?? r.status}
            tone={statusTone(r.status)}
          />
          <InlineStatus
            action={updateBloodRequestStatus}
            id={r.id}
            value={r.status}
            options={STATUS_OPTIONS}
            triggerClassName="w-full max-w-56"
          />
        </div>
      ),
    },
    {
      header: "Donation",
      render: (r) =>
        r.status === "COMPLETED" ? (
          r.donation_confirmed ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                {r.units_donated ?? r.units} unit{(r.units_donated ?? r.units) === 1 ? "" : "s"} donated
              </span>
              <form action={submitUnconfirmBloodDonation}>
                <input type="hidden" name="id" value={r.id} />
                <button
                  type="submit"
                  className="rounded-full border border-line bg-white px-2.5 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-mist hover:text-foreground"
                  title="Remove the confirmation"
                >
                  Undo
                </button>
              </form>
            </div>
          ) : (
            <form action={submitConfirmBloodDonation} className="flex items-center gap-1.5">
              <input type="hidden" name="id" value={r.id} />
              <input
                type="number"
                name="unitsDonated"
                min={1}
                max={r.units}
                defaultValue={r.units}
                aria-label="Units actually donated"
                className="w-14 rounded-md border border-input bg-white px-2 py-1 text-xs tabular-nums"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-2.5 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-mist hover:text-foreground"
                title="Confirm this donation so it counts toward Blood Units Donated"
              >
                <Circle className="h-3.5 w-3.5" aria-hidden />
                Confirm
              </button>
            </form>
          )
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
      mobileRender: (r) =>
        r.status === "COMPLETED" ? (
          r.donation_confirmed ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                {r.units_donated ?? r.units} unit{(r.units_donated ?? r.units) === 1 ? "" : "s"} donated
              </span>
              <form action={submitUnconfirmBloodDonation}>
                <input type="hidden" name="id" value={r.id} />
                <button
                  type="submit"
                  className="rounded-full border border-line bg-white px-2.5 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-mist hover:text-foreground"
                >
                  Undo
                </button>
              </form>
            </div>
          ) : (
            <form action={submitConfirmBloodDonation} className="flex flex-wrap items-center gap-1.5">
              <input type="hidden" name="id" value={r.id} />
              <input
                type="number"
                name="unitsDonated"
                min={1}
                max={r.units}
                defaultValue={r.units}
                aria-label="Units actually donated"
                className="w-14 rounded-md border border-input bg-white px-2 py-1 text-xs tabular-nums"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-2.5 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-mist hover:text-foreground"
              >
                <Circle className="h-3.5 w-3.5" aria-hidden />
                Confirm donation
              </button>
            </form>
          )
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={HeartPulse}
        title="Blood Requests"
        description="Track every request through its lifecycle. When you confirm a completed donation, enter how many units were actually donated — only those count toward Blood Units Donated."
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
