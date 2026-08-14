import Link from "next/link";
import { Download, Eye, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge, statusTone } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { InlineStatus } from "@/components/admin/inline-status";
import { AdminPageHeader } from "@/components/admin/page-header";
import {
  ResponsiveTable,
  type Column,
} from "@/components/admin/responsive-table";
import { Reveal } from "@/components/shared/reveal";
import { adminGetVolunteers } from "@/lib/queries";
import { updateVolunteerStatus } from "@/lib/admin-actions";
import { formatDateTime } from "@/lib/constants";
import { cn } from "@/lib/utils";

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export default async function AdminVolunteersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>;
}) {
  const params = await searchParams;
  const volunteers = await adminGetVolunteers({
    status: params.status || undefined,
    search: params.search,
  });

  const columns: Column<(typeof volunteers)[number]>[] = [
    {
      header: "Volunteer",
      render: (v) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-dark text-sm font-bold text-white">
            {v.name.charAt(0)}
          </span>
          <div>
            <p className="font-medium text-foreground">{v.name}</p>
            <p className="text-xs text-muted-foreground">{v.phone ?? "—"}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Member ID",
      render: (v) => (
        <span className="text-xs font-semibold text-brand-dark">
          {v.member_id ?? "—"}
        </span>
      ),
    },
    {
      header: "Roll / Reg. No.",
      render: (v) => (
        <span className="text-xs text-muted-foreground">
          {[v.roll, v.registration_no].filter(Boolean).join(" / ") || "—"}
        </span>
      ),
    },
    {
      header: "Department / Semester",
      render: (v) => (
        <span className="text-xs text-muted-foreground">
          {[v.department, v.semester].filter(Boolean).join(" · ") || "—"}
        </span>
      ),
    },
    {
      header: "Blood",
      render: (v) => (
        <span className="inline-flex rounded-md bg-crescent-soft px-2 py-0.5 text-xs font-bold text-crescent">
          {v.blood_group ?? "—"}
        </span>
      ),
    },
    {
      header: "Registered",
      render: (v) => (
        <span className="text-xs text-muted-foreground">
          {formatDateTime(v.created_at)}
        </span>
      ),
    },
    {
      header: "Status",
      render: (v) => (
        <InlineStatus
          action={updateVolunteerStatus}
          id={v.id}
          value={v.status}
          options={[
            { value: "PENDING", label: "Pending" },
            { value: "APPROVED", label: "Approve" },
            { value: "REJECTED", label: "Reject" },
          ]}
        />
      ),
      mobileRender: (v) => (
        <StatusBadge
          label={STATUS_LABELS[v.status] ?? v.status}
          tone={statusTone(v.status)}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Users}
        title="Volunteers"
        description="Review registrations, approve members and manage the volunteer directory."
        actions={
          <Button asChild variant="outline" size="sm">
            <a href="/admin/volunteers/export" download>
              <Download className="mr-1.5 h-4 w-4" aria-hidden />
              Download PDF
            </a>
          </Button>
        }
      />

      {/* Tabs + search */}
      <Reveal>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {STATUS_TABS.map((tab) => {
              const active = (params.status ?? "") === tab.value;
              return (
                <Link
                  key={tab.value}
                  href={tab.value ? `/admin/volunteers?status=${tab.value}` : "/admin/volunteers"}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "border-brand bg-brand text-white shadow-sm shadow-brand/20"
                      : "border-line bg-white text-muted-foreground hover:border-brand/40 hover:text-brand-dark"
                  )}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>

          <form
            method="get"
            action="/admin/volunteers"
            className="relative w-full sm:max-w-xs"
          >
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              name="search"
              placeholder="Search volunteers…"
              defaultValue={params.search}
              className="pl-9"
              aria-label="Search volunteers"
            />
            {params.status && (
              <input type="hidden" name="status" value={params.status} />
            )}
          </form>
        </div>
      </Reveal>

      <ResponsiveTable
        columns={columns}
        rows={volunteers}
        keyFor={(v) => v.id}
        minWidth="min-w-[760px]"
        actions={(v) => (
          <Button asChild variant="ghost" size="sm">
            <Link href={`/admin/volunteers/${v.id}`}>
              <Eye className="h-3.5 w-3.5" aria-hidden />
              <span className="ml-1">View</span>
            </Link>
          </Button>
        )}
        empty={
          <EmptyState
            icon={Users}
            title={params.status === "PENDING" ? "No pending registrations" : "No volunteers found"}
            description="New registrations and search results will appear here."
          />
        }
      />
    </div>
  );
}
