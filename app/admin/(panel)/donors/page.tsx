import { Droplets, MessageCircle } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { InlineStatus } from "@/components/admin/inline-status";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { AdminPageHeader } from "@/components/admin/page-header";
import {
  ResponsiveTable,
  type Column,
} from "@/components/admin/responsive-table";
import { Reveal } from "@/components/shared/reveal";
import { adminGetDonors, adminGetContactRequests } from "@/lib/queries";
import {
  updateDonor,
  deleteDonor,
  updateContactRequestStatus,
} from "@/lib/admin-actions";
import { formatDate } from "@/lib/constants";

const CONTACT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};
const CONTACT_STATUS_OPTIONS = Object.entries(CONTACT_STATUS_LABELS).map(
  ([value, label]) => ({ value, label })
);

export default async function AdminDonorsPage() {
  const [donors, contactRequests] = await Promise.all([
    adminGetDonors(),
    adminGetContactRequests(),
  ]);

  const donorColumns: Column<(typeof donors)[number]>[] = [
    {
      header: "Donor",
      render: (d) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">{d.name}</span>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
              d.volunteer_id
                ? "bg-brand-soft text-brand-dark"
                : d.student_id
                  ? "bg-poly-soft text-poly"
                  : "bg-mist text-muted-foreground"
            }`}
          >
            {d.volunteer_id ? "Team member" : d.student_id ? "Student" : "Community"}
          </span>
        </div>
      ),
    },
    {
      header: "Blood",
      render: (d) => (
        <span className="inline-flex rounded-md bg-crescent-soft px-2 py-0.5 text-xs font-bold text-crescent">
          {d.blood_group}
        </span>
      ),
    },
    {
      header: "Area",
      render: (d) => (
        <span className="text-xs text-muted-foreground">{d.area ?? "—"}</span>
      ),
    },
    {
      header: "Phone",
      render: (d) => (
        <div className="text-xs text-muted-foreground">
          <p>{d.phone ?? "—"}</p>
          <span
            className={`mt-0.5 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
              d.phone_public
                ? "bg-emerald-100 text-emerald-800"
                : "bg-mist text-muted-foreground"
            }`}
          >
            {d.phone_public ? "Public" : "Private"}
          </span>
        </div>
      ),
    },
    {
      header: "Last donation",
      render: (d) => (
        <span className="text-xs text-muted-foreground">
          {d.last_donation_date ? formatDate(d.last_donation_date) : "—"}
        </span>
      ),
    },
    {
      header: "Status",
      render: (d) => (
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
      ),
      mobileRender: (d) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge
            label={d.availability === "AVAILABLE" ? "Available" : "Unavailable"}
            tone={d.availability === "AVAILABLE" ? "success" : "neutral"}
          />
          <StatusBadge
            label={d.is_active ? "Active" : "Hidden"}
            tone={d.is_active ? "success" : "neutral"}
          />
        </div>
      ),
    },
  ];

  const contactColumns: Column<(typeof contactRequests)[number]>[] = [
    {
      header: "Donor",
      render: (r) => (
        <span className="font-medium text-foreground">
          {r.blood_donors?.name ?? "Unknown donor"}
          <span className="ml-1.5 text-xs font-normal text-muted-foreground">
            {r.blood_donors?.blood_group ?? ""}
          </span>
        </span>
      ),
    },
    {
      header: "Patient / Need",
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{r.patient_name ?? "—"}</p>
          <p className="text-xs text-muted-foreground">
            {r.blood_group ? (
              <span className="mr-1.5 inline-flex rounded-md bg-crescent-soft px-1.5 py-0.5 text-[10px] font-bold text-crescent">
                {r.blood_group}
              </span>
            ) : null}
            {r.hospital ?? ""}
          </p>
        </div>
      ),
    },
    {
      header: "Requester",
      render: (r) => (
        <span className="font-medium text-foreground">{r.requester_name}</span>
      ),
    },
    {
      header: "Contact",
      render: (r) => (
        <div className="text-xs text-muted-foreground">
          <p>{r.requester_contact}</p>
          {r.email && <p className="truncate">{r.email}</p>}
        </div>
      ),
    },
    {
      header: "Message",
      render: (r) => (
        <span className="line-clamp-2 max-w-xs text-xs text-muted-foreground">
          {r.message ?? "—"}
        </span>
      ),
    },
    {
      header: "Status",
      render: (r) => (
        <InlineStatus
          action={updateContactRequestStatus}
          id={r.id}
          value={r.status}
          options={CONTACT_STATUS_OPTIONS}
        />
      ),
      mobileRender: (r) => (
        <StatusBadge
          label={CONTACT_STATUS_LABELS[r.status] ?? r.status}
          tone={statusToneFor(r.status)}
        />
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <AdminPageHeader
        icon={Droplets}
        title="Blood Donors"
        description="Donor records — phone numbers are private and never shown on the public site."
        tone="bg-gradient-to-br from-crescent to-crescent-dark"
      />

      <ResponsiveTable
        columns={donorColumns}
        rows={donors}
        keyFor={(d) => d.id}
        minWidth="min-w-[760px]"
        actions={(d) => (
          <ConfirmDelete
            action={deleteDonor}
            id={d.id}
            label="Remove"
            description={`Remove ${d.name} from the donor list?`}
          />
        )}
        empty={
          <EmptyState
            icon={Droplets}
            title="No donors registered"
            description="Public donor registrations will appear here."
          />
        }
      />

      {/* Contact requests */}
      <Reveal>
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-poly to-[#0f4d80] text-white shadow-sm">
            <MessageCircle className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <h2 className="text-lg font-bold text-foreground">Contact requests</h2>
            <p className="text-xs text-muted-foreground">
              When someone requests a donor&apos;s contact, review it here and connect them safely.
            </p>
          </div>
        </div>
      </Reveal>

      <ResponsiveTable
        columns={contactColumns}
        rows={contactRequests}
        keyFor={(r) => r.id}
        minWidth="min-w-[640px]"
        empty={
          <div className="rounded-2xl border border-dashed border-line bg-mist/50 p-10 text-center text-sm text-muted-foreground">
            No contact requests yet.
          </div>
        }
      />
    </div>
  );
}

function statusToneFor(status: string): "warning" | "success" | "crescent" {
  if (status === "APPROVED") return "success";
  if (status === "REJECTED") return "crescent";
  return "warning";
}
