import { ScrollText } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { AdminPageHeader } from "@/components/admin/page-header";
import {
  ResponsiveTable,
  type Column,
} from "@/components/admin/responsive-table";
import { adminGetAuditLogs } from "@/lib/queries";
import { formatDateTime } from "@/lib/constants";

export default async function AdminAuditPage() {
  const logs = await adminGetAuditLogs(100);

  const columns: Column<(typeof logs)[number]>[] = [
    {
      header: "Time",
      render: (log) => (
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {formatDateTime(log.created_at)}
        </span>
      ),
    },
    {
      header: "Action",
      render: (log) => (
        <span className="inline-flex rounded-md bg-mist px-2 py-0.5 font-mono text-xs text-foreground">
          {log.action}
        </span>
      ),
    },
    {
      header: "Target",
      render: (log) => (
        <span className="text-xs text-muted-foreground">
          {log.target_type
            ? `${log.target_type}${log.target_id ? ` / ${log.target_id.slice(0, 8)}` : ""}`
            : "—"}
        </span>
      ),
    },
    {
      header: "User ID",
      render: (log) => (
        <span className="text-xs text-muted-foreground">
          {log.user_id ? log.user_id.slice(0, 8) : "system"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={ScrollText}
        title="Audit Log"
        description="Every important administrative action, recorded for accountability."
        tone="bg-gradient-to-br from-slate-600 to-slate-800"
      />

      <ResponsiveTable
        columns={columns}
        rows={logs}
        keyFor={(log) => log.id}
        minWidth="min-w-[560px]"
        empty={
          <EmptyState
            icon={ScrollText}
            title="No audit entries yet"
            description="Administrative actions will be recorded here."
          />
        }
      />
    </div>
  );
}
