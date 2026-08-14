import { ScrollText } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { adminGetAuditLogs } from "@/lib/queries";
import { formatDateTime } from "@/lib/constants";

export default async function AdminAuditPage() {
  const logs = await adminGetAuditLogs(100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Audit Log</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every important administrative action, recorded for accountability.
        </p>
      </div>

      {logs.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-mist/60">
                <TableHead>Time</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>User ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatDateTime(log.created_at)}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex rounded-md bg-mist px-2 py-0.5 font-mono text-xs text-foreground">
                      {log.action}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {log.target_type ? `${log.target_type}${log.target_id ? ` / ${log.target_id.slice(0, 8)}` : ""}` : "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {log.user_id ? log.user_id.slice(0, 8) : "system"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          icon={ScrollText}
          title="No audit entries yet"
          description="Administrative actions will be recorded here."
        />
      )}
    </div>
  );
}
