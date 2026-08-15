import { UserCheck, CalendarDays, HandHeart } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { InlineStatus } from "@/components/admin/inline-status";
import { AdminPageHeader } from "@/components/admin/page-header";
import {
  ResponsiveTable,
  type Column,
} from "@/components/admin/responsive-table";
import { adminGetParticipationRequests } from "@/lib/queries";
import { updateParticipationRequestStatus } from "@/lib/admin-actions";
import { formatDateTime } from "@/lib/constants";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};
const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export default async function AdminParticipantsPage() {
  const requests = await adminGetParticipationRequests();

  const columns: Column<(typeof requests)[number]>[] = [
    {
      header: "Volunteer",
      render: (r) => (
        <div>
          <p className="font-medium text-foreground">{r.volunteer_name}</p>
          {r.volunteer_member_id && (
            <p className="text-xs text-muted-foreground">{r.volunteer_member_id}</p>
          )}
        </div>
      ),
    },
    {
      header: "Wants to join",
      render: (r) => (
        <div className="flex items-start gap-2">
          {r.event_title ? (
            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
          ) : (
            <HandHeart className="mt-0.5 h-4 w-4 shrink-0 text-poly" aria-hidden />
          )}
          <div>
            <p className="text-sm font-medium text-foreground">
              {r.event_title ?? r.activity_title ?? "—"}
            </p>
            <p className="text-xs text-muted-foreground">
              {r.event_title ? "Event" : "Activity"}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Requested",
      render: (r) => (
        <span className="text-xs text-muted-foreground">{formatDateTime(r.created_at)}</span>
      ),
    },
    {
      header: "Status",
      render: (r) => (
        <InlineStatus
          action={updateParticipationRequestStatus}
          id={r.id}
          value={r.status}
          options={STATUS_OPTIONS}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={UserCheck}
        title="Participation requests"
        description="Volunteers request to join events and activities — approve or reject them here. Approved volunteers count as participants on the public pages."
        tone="bg-gradient-to-br from-rose-400 to-red-600"
        actions={
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-1.5 text-sm font-medium text-foreground">
            <span className="h-2 w-2 rounded-full bg-amber-400" aria-hidden />
            {requests.filter((r) => r.status === "PENDING").length} pending
          </span>
        }
      />

      <ResponsiveTable
        columns={columns}
        rows={requests}
        keyFor={(r) => r.id}
        minWidth="min-w-[640px]"
        empty={
          <EmptyState
            icon={UserCheck}
            title="No participation requests yet"
            description="Volunteers will appear here when they request to join an event or activity."
          />
        }
      />
    </div>
  );
}
