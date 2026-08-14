import { MessageSquare } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { InlineStatus } from "@/components/admin/inline-status";
import { adminGetMessages } from "@/lib/queries";
import { updateMessageStatus } from "@/lib/admin-actions";
import { formatDateTime } from "@/lib/constants";

export default async function AdminMessagesPage() {
  const messages = await adminGetMessages();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Messages</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Messages submitted through the public contact form.
        </p>
      </div>

      {messages.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-mist/60">
                <TableHead>From</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Received</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium text-foreground">{m.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{m.subject ?? "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDateTime(m.created_at)}
                  </TableCell>
                  <TableCell>
                    <InlineStatus
                      action={updateMessageStatus}
                      id={m.id}
                      value={m.status}
                      options={[
                        { value: "NEW", label: "New" },
                        { value: "READ", label: "Read" },
                        { value: "ARCHIVED", label: "Archived" },
                      ]}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          icon={MessageSquare}
          title="No messages yet"
          description="Contact form submissions appear here."
        />
      )}
    </div>
  );
}
