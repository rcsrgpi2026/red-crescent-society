import Link from "next/link";
import {
  Users,
  Search,
  Eye,
  Settings,
  ArrowLeft,
  GraduationCap,
  Download,
} from "lucide-react";

import { AdminPageHeader } from "@/components/admin/page-header";
import { ResponsiveTable, type Column } from "@/components/admin/responsive-table";
import { StatusBadge, statusTone } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Reveal } from "@/components/shared/reveal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { adminGetVolunteerApplications } from "@/lib/queries";
import { formatDateTime, VOLUNTEER_APPLICATION_STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { VolunteerApplication } from "@/types/database";

const STATUS_TABS = [
  { value: "", label: "All Applications" },
  { value: "PENDING", label: "Pending Review" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

export const metadata = {
  title: "Volunteer Applications Management",
  robots: { index: false, follow: false },
};

export default async function AdminVolunteerApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>;
}) {
  const params = await searchParams;
  const applications = await adminGetVolunteerApplications({
    status: params.status || undefined,
    search: params.search,
  });

  const columns: Column<VolunteerApplication>[] = [
    {
      header: "Applicant",
      render: (app) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-dark text-sm font-bold text-white">
            {app.name.charAt(0)}
          </span>
          <div className="min-w-0">
            <p className="break-words font-medium text-foreground">{app.name}</p>
            <p className="break-words text-xs text-muted-foreground">{app.phone}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Roll & Session",
      render: (app) => (
        <div>
          <p className="text-xs font-semibold text-brand-dark">Roll: {app.roll}</p>
          <p className="text-[11px] text-muted-foreground">Session: {app.session}</p>
        </div>
      ),
    },
    {
      header: "Department & Semester",
      render: (app) => (
        <div>
          <p className="text-xs font-medium text-foreground">{app.department}</p>
          <p className="text-[11px] font-semibold text-muted-foreground">{app.semester} Semester</p>
        </div>
      ),
    },
    {
      header: "Blood Group",
      render: (app) => (
        <span className="inline-flex rounded-md bg-crescent-soft px-2 py-0.5 text-xs font-bold text-crescent">
          {app.blood_group || "—"}
        </span>
      ),
    },
    {
      header: "Applied",
      render: (app) => (
        <span className="text-xs text-muted-foreground">
          {formatDateTime(app.created_at)}
        </span>
      ),
    },
    {
      header: "Status",
      render: (app) => (
        <StatusBadge
          label={VOLUNTEER_APPLICATION_STATUS_LABELS[app.status] ?? app.status}
          tone={statusTone(app.status)}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Users}
        title="Volunteer Applications"
        description="Review student volunteer applications, verify applicant credentials, and approve or reject candidates."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm" className="gap-2">
              <a
                href={`/admin/recruitment/applications/export${params.status ? `?status=${params.status}` : ""}`}
                download
              >
                <Download className="h-4 w-4" />
                Download PDF
              </a>
            </Button>
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link href="/admin/recruitment">
                <Settings className="h-4 w-4" />
                Recruitment Settings
              </Link>
            </Button>
          </div>
        }
      />


      {/* Tabs and Search */}
      <Reveal>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {STATUS_TABS.map((tab) => {
              const active = (params.status ?? "") === tab.value;
              return (
                <Link
                  key={tab.value}
                  href={
                    tab.value
                      ? `/admin/recruitment/applications?status=${tab.value}`
                      : "/admin/recruitment/applications"
                  }
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
            action="/admin/recruitment/applications"
            className="relative w-full sm:max-w-xs"
          >
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              name="search"
              placeholder="Search by name, roll, dept…"
              defaultValue={params.search}
              className="pl-9"
              aria-label="Search applications"
            />
            {params.status && (
              <input type="hidden" name="status" value={params.status} />
            )}
          </form>
        </div>
      </Reveal>

      {/* Table */}
      <ResponsiveTable
        columns={columns}
        rows={applications}
        keyFor={(app) => app.id}
        minWidth="min-w-[760px]"
        mobileCardColumns={1}
        actions={(app) => (
          <Button asChild variant="ghost" size="sm" className="gap-1 text-brand">
            <Link href={`/admin/recruitment/applications/${app.id}`}>
              <Eye className="h-3.5 w-3.5" />
              <span>Review Details</span>
            </Link>
          </Button>
        )}
        empty={
          <EmptyState
            icon={GraduationCap}
            title={
              params.status === "PENDING"
                ? "No pending applications"
                : "No volunteer applications found"
            }
            description="When eligible students submit applications, they will appear here for leadership review."
          />
        }
      />
    </div>
  );
}
