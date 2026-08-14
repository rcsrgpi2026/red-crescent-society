import { Droplets, MessageCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { InlineStatus } from "@/components/admin/inline-status";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { adminGetDonors, adminGetContactRequests } from "@/lib/queries";
import {
  updateDonor,
  deleteDonor,
  updateContactRequestStatus,
} from "@/lib/admin-actions";
import { formatDate } from "@/lib/constants";

export default async function AdminDonorsPage() {
  const [donors, contactRequests] = await Promise.all([
    adminGetDonors(),
    adminGetContactRequests(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Blood Donors</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Donor records — phone numbers are private and never shown on the public site.
        </p>
      </div>

      {donors.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-mist/60">
                <TableHead>Donor</TableHead>
                <TableHead>Blood</TableHead>
                <TableHead>Area</TableHead>
                <TableHead>Phone (private)</TableHead>
                <TableHead>Last donation</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {donors.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium text-foreground">{d.name}</TableCell>
                  <TableCell>
                    <span className="inline-flex rounded-md bg-crescent-soft px-2 py-0.5 text-xs font-bold text-crescent">
                      {d.blood_group}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{d.area ?? "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{d.phone ?? "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {d.last_donation_date ? formatDate(d.last_donation_date) : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <InlineStatus
                        action={updateDonor}
                        id={d.id}
                        value={d.availability}
                        name="availability"
                        options={[
                          { value: "AVAILABLE", label: "Available" },
                          { value: "UNAVAILABLE", label: "Unavailable" },
                        ]}
                      />
                      <StatusBadge
                        label={d.is_active ? "Active" : "Hidden"}
                        tone={d.is_active ? "success" : "neutral"}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <ConfirmDelete
                      action={deleteDonor}
                      id={d.id}
                      label="Remove"
                      description={`Remove ${d.name} from the donor list?`}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          icon={Droplets}
          title="No donors registered"
          description="Public donor registrations will appear here."
        />
      )}

      {/* Contact requests */}
      <div>
        <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
          <MessageCircle className="h-5 w-5 text-brand" aria-hidden />
          Contact requests
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          When someone requests a donor&apos;s contact, review it here and connect them safely.
        </p>
        {contactRequests.length > 0 ? (
          <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-white">
            <Table>
              <TableHeader>
                <TableRow className="bg-mist/60">
                  <TableHead>Requester</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contactRequests.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium text-foreground">{r.requester_name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.requester_contact}</TableCell>
                    <TableCell className="max-w-xs text-xs text-muted-foreground">
                      {r.message ?? "—"}
                    </TableCell>
                    <TableCell>
                      <InlineStatus
                        action={updateContactRequestStatus}
                        id={r.id}
                        value={r.status}
                        options={[
                          { value: "PENDING", label: "Pending" },
                          { value: "APPROVED", label: "Approved" },
                          { value: "REJECTED", label: "Rejected" },
                        ]}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-line bg-mist/50 p-10 text-center text-sm text-muted-foreground">
            No contact requests yet.
          </div>
        )}
      </div>
    </div>
  );
}
