import Link from "next/link";
import { HeartPulse, CheckCircle2, Circle } from "lucide-react";
import { StatusBadge, statusTone } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { InlineStatus } from "@/components/admin/inline-status";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { ClearCancelledRequestsButton } from "@/components/admin/clear-cancelled-requests";
import {
  ResponsiveTable,
  type Column,
} from "@/components/admin/responsive-table";
import { Reveal } from "@/components/shared/reveal";
import { adminGetBloodRequests } from "@/lib/queries";
import {
  updateBloodRequestStatus,
  submitConfirmBloodDonation,
  submitUnconfirmBloodDonation,
  deleteBloodRequest,
  deleteCancelledBloodRequests,
} from "@/lib/admin-actions";
import { formatDate, BLOOD_REQUEST_STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = Object.entries(BLOOD_REQUEST_STATUS_LABELS).map(
  ([value, label]) => ({ value, label })
);

export default async function AdminBloodRequestsPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const allRequests = await adminGetBloodRequests();

  const counts = {
    all: allRequests.length,
    PENDING: allRequests.filter((r) => r.status === "PENDING").length,
    CONTACTING_DONOR: allRequests.filter((r) => r.status === "CONTACTING_DONOR").length,
    DONOR_FOUND: allRequests.filter((r) => r.status === "DONOR_FOUND").length,
    COMPLETED: allRequests.filter((r) => r.status === "COMPLETED").length,
    CANCELLED: allRequests.filter((r) => r.status === "CANCELLED").length,
  };

  const requests = params.status
    ? allRequests.filter((r) => r.status === params.status)
    : allRequests;

  const STATUS_TABS = [
    { value: "", label: "All", count: counts.all },
    { value: "PENDING", label: "Pending", count: counts.PENDING },
    { value: "CONTACTING_DONOR", label: "Contacting Donor", count: counts.CONTACTING_DONOR },
    { value: "DONOR_FOUND", label: "Donor Found", count: counts.DONOR_FOUND },
    { value: "COMPLETED", label: "Completed", count: counts.COMPLETED },
    { value: "CANCELLED", label: "Cancelled", count: counts.CANCELLED },
  ];

  const columns: Column<(typeof allRequests)[number]>[] = [
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
        description="Track every request through its lifecycle. Cancelled test or duplicate requests can be permanently deleted. Pending and completed records are safely protected."
        tone="bg-gradient-to-br from-crescent to-crescent-dark"
        actions={
          counts.CANCELLED > 0 ? (
            <ClearCancelledRequestsButton
              action={deleteCancelledBloodRequests}
              count={counts.CANCELLED}
            />
          ) : undefined
        }
      />

      {/* Filter Tabs */}
      <Reveal>
        <div className="flex flex-wrap gap-2 border-b border-line pb-2.5">
          {STATUS_TABS.map((tab) => {
            const active = (params.status ?? "") === tab.value;
            return (
              <Link
                key={tab.value}
                href={tab.value ? `/admin/blood-requests?status=${tab.value}` : "/admin/blood-requests"}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                  active
                    ? "bg-brand-dark text-white shadow-xs"
                    : "bg-mist text-muted-foreground hover:bg-mist/80 hover:text-foreground"
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.2 text-[10px] font-bold tabular-nums",
                    active
                      ? "bg-white/20 text-white"
                      : "bg-white text-muted-foreground"
                  )}
                >
                  {tab.count}
                </span>
              </Link>
            );
          })}
        </div>
      </Reveal>

      <ResponsiveTable
        columns={columns}
        rows={requests}
        keyFor={(r) => r.id}
        minWidth="min-w-[760px]"
        actions={(r) =>
          r.status === "CANCELLED" ? (
            <ConfirmDelete
              action={deleteBloodRequest}
              id={r.id}
              label="Delete"
              description={`Permanently delete the cancelled request for "${r.patient_name}"? This action cannot be undone.`}
            />
          ) : null
        }
        empty={
          <EmptyState
            icon={HeartPulse}
            title="No blood requests found"
            description={
              params.status
                ? `No blood requests with status "${BLOOD_REQUEST_STATUS_LABELS[params.status] ?? params.status}".`
                : "Requests submitted through the public form appear here."
            }
          />
        }
      />
    </div>
  );
}
