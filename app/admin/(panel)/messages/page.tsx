import { MessageSquare } from "lucide-react";
import { StatusBadge, statusTone } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { InlineStatus } from "@/components/admin/inline-status";
import { AdminPageHeader } from "@/components/admin/page-header";
import {
  ResponsiveTable,
  type Column,
} from "@/components/admin/responsive-table";
import { adminGetMessages } from "@/lib/queries";
import { updateMessageStatus } from "@/lib/admin-actions";
import { formatDateTime } from "@/lib/constants";

const STATUS_LABELS: Record<string, string> = {
  NEW: "New",
  READ: "Read",
  ARCHIVED: "Archived",
};
const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export default async function AdminMessagesPage() {
  const messages = await adminGetMessages();

  const columns: Column<(typeof messages)[number]>[] = [
    {
      header: "From",
      render: (m) => (
        <span className="font-medium text-foreground">{m.name}</span>
      ),
    },
    {
      header: "Subject",
      render: (m) => (
        <span className="line-clamp-2 max-w-[16rem] text-sm text-muted-foreground">
          {m.subject ?? "—"}
        </span>
      ),
    },
    {
      header: "Received",
      render: (m) => (
        <span className="text-xs text-muted-foreground">
          {formatDateTime(m.created_at)}
        </span>
      ),
    },
    {
      header: "Status",
      render: (m) => (
        <InlineStatus
          action={updateMessageStatus}
          id={m.id}
          value={m.status}
          options={STATUS_OPTIONS}
        />
      ),
      mobileRender: (m) => (
        <StatusBadge
          label={STATUS_LABELS[m.status] ?? m.status}
          tone={statusTone(m.status)}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={MessageSquare}
        title="Messages"
        description="Messages submitted through the public contact form."
        tone="bg-gradient-to-br from-emerald-400 to-emerald-600"
      />

      <ResponsiveTable
        columns={columns}
        rows={messages}
        keyFor={(m) => m.id}
        minWidth="min-w-[600px]"
        empty={
          <EmptyState
            icon={MessageSquare}
            title="No messages yet"
            description="Contact form submissions appear here."
          />
        }
      />
    </div>
  );
}
