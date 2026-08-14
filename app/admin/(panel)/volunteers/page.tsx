import Link from "next/link";
import { Eye, Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { InlineStatus } from "@/components/admin/inline-status";
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Volunteers</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review registrations, approve members and manage the volunteer directory.
          </p>
        </div>
        <Link href="/admin/volunteers" className="hidden">
          placeholder
        </Link>
      </div>

      {/* Tabs */}
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
                  ? "border-brand bg-brand text-white"
                  : "border-line bg-white text-muted-foreground hover:border-brand/40"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Search */}
      <form method="get" action="/admin/volunteers" className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          name="search"
          placeholder="Search volunteers…"
          defaultValue={params.search}
          className="pl-9"
          aria-label="Search volunteers"
        />
        {params.status && <input type="hidden" name="status" value={params.status} />}
      </form>

      {/* Table */}
      {volunteers.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-mist/60">
                <TableHead>Volunteer</TableHead>
                <TableHead>Member ID</TableHead>
                <TableHead>Department / Semester</TableHead>
                <TableHead>Blood</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {volunteers.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-bold text-brand">
                        {v.name.charAt(0)}
                      </span>
                      <div>
                        <p className="font-medium text-foreground">{v.name}</p>
                        <p className="text-xs text-muted-foreground">{v.phone ?? "—"}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-brand-dark">
                    {v.member_id ?? "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {[v.department, v.semester].filter(Boolean).join(" · ") || "—"}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex rounded-md bg-crescent-soft px-2 py-0.5 text-xs font-bold text-crescent">
                      {v.blood_group ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDateTime(v.created_at)}
                  </TableCell>
                  <TableCell>
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
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/volunteers/${v.id}`}>
                        <Eye className="h-3.5 w-3.5" aria-hidden />
                        <span className="ml-1">View</span>
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          title={params.status === "PENDING" ? "No pending registrations" : "No volunteers found"}
          description="New registrations and search results will appear here."
        />
      )}
    </div>
  );
}
