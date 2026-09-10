import Link from "next/link";
import Image from "next/image";
import { Download, Eye, GraduationCap, Network, Search, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge, statusTone } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { InlineStatus } from "@/components/admin/inline-status";
import { PositionDepartment } from "@/components/admin/position-department";
import { LegacyMemberDialog } from "@/components/admin/legacy-member-dialog";
import { AddToCommunityDialog } from "@/components/admin/add-to-community-dialog";
import { AdminPageHeader } from "@/components/admin/page-header";
import {
  ResponsiveTable,
  type Column,
} from "@/components/admin/responsive-table";
import { Reveal } from "@/components/shared/reveal";
import { adminGetTeamMembers, adminGetCommunityMembers } from "@/lib/queries";
import { updateTeamMemberStatus } from "@/lib/admin-actions";
import { formatDate, formatDateTime, TEAM_POSITIONS, RCY_DEPARTMENTS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

const ROSTER_TABS = [
  { value: "", label: "All Roster" },
  { value: "active", label: "Active Team" },
  { value: "legacy", label: "Legacy Members" },
];

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export default async function AdminTeamMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string; view?: string }>;
}) {
  const params = await searchParams;
  const isLegacy =
    params.view === "legacy" ? true : params.view === "active" ? false : undefined;

  const [volunteers, communityMembers] = await Promise.all([
    adminGetTeamMembers({
      status: params.status || undefined,
      search: params.search,
      isLegacy,
    }),
    adminGetCommunityMembers(),
  ]);

  const communityMap = new Map(
    communityMembers
      .filter((c) => c.team_member_id)
      .map((c) => [c.team_member_id!, c])
  );

  const columns: Column<(typeof volunteers)[number]>[] = [
    {
      header: "Team Member",
      render: (v) => (
        <div className="flex items-center gap-3">
          {v.photo_url?.trim() ? (
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-line bg-mist shadow-xs">
              <Image
                src={v.photo_url}
                alt={v.name}
                fill
                sizes="36px"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-brand-soft/60 text-brand">
              <User className="h-4.5 w-4.5" aria-hidden />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="font-semibold text-foreground">{v.name}</p>
              {v.blood_group && (
                <span className="inline-flex rounded bg-crescent-soft px-1.5 py-0.2 text-[10px] font-bold text-crescent">
                  {v.blood_group}
                </span>
              )}
              {v.is_legacy && (
                <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.2 text-[10px] font-semibold text-amber-800">
                  <GraduationCap className="h-2.5 w-2.5" />
                  Legacy
                </span>
              )}
              {communityMap.has(v.id) && (
                <span
                  className="inline-flex items-center gap-0.5 rounded border border-teal-200 bg-teal-50 px-1.5 py-0.2 text-[10px] font-semibold text-teal-800"
                  title={`In Community Tree (Level ${communityMap.get(v.id)!.level})`}
                >
                  <Network className="h-2.5 w-2.5 text-teal-600" />
                  Tree L{communityMap.get(v.id)!.level}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{v.phone ?? "—"}</p>
          </div>
        </div>
      ),
    },
    {
      header: "ID & Academic",
      render: (v) => (
        <div className="text-xs space-y-0.5">
          <span className="font-mono font-bold text-brand-dark">
            {v.member_id ?? "—"}
          </span>
          <p className="font-medium text-foreground truncate max-w-[170px]">
            {v.department || "—"}
          </p>
          {(v.roll || v.registration_no) && (
            <p className="text-[11px] text-muted-foreground">
              {[v.roll && `Roll: ${v.roll}`, v.registration_no && `Reg: ${v.registration_no}`]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
        </div>
      ),
    },
    {
      header: "Position / RCY Dept.",
      render: (v) => (
        <PositionDepartment
          memberId={v.id}
          position={v.position}
          rcyDepartment={v.rcy_department}
          positionOptions={TEAM_POSITIONS as unknown as string[]}
          departmentOptions={RCY_DEPARTMENTS as unknown as string[]}
          layout="vertical"
          positionTriggerClassName="w-38 max-w-[160px] h-7 text-xs"
          departmentTriggerClassName="w-38 max-w-[160px] h-7 text-xs"
        />
      ),
      mobileRender: (v) => (
        <PositionDepartment
          memberId={v.id}
          position={v.position}
          rcyDepartment={v.rcy_department}
          positionOptions={TEAM_POSITIONS as unknown as string[]}
          departmentOptions={RCY_DEPARTMENTS as unknown as string[]}
          positionTriggerClassName="w-full"
          departmentTriggerClassName="w-full"
        />
      ),
    },
    {
      header: "Registered",
      render: (v) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatDate(v.created_at)}
        </span>
      ),
    },
    {
      header: "Status",
      render: (v) => (
        <InlineStatus
          action={updateTeamMemberStatus}
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

  const buildFilterUrl = (newParams: { status?: string; view?: string }) => {
    const q = new URLSearchParams();
    const status = newParams.status !== undefined ? newParams.status : params.status;
    const view = newParams.view !== undefined ? newParams.view : params.view;
    if (status) q.set("status", status);
    if (view) q.set("view", view);
    if (params.search) q.set("search", params.search);
    const qs = q.toString();
    return qs ? `/admin/team?${qs}` : "/admin/team";
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Users}
        title="Team Members"
        description="Review registrations, approve members and manage the team member directory."
        actions={
          <Button asChild variant="outline" size="sm">
            <a href="/admin/team/export" download>
              <Download className="mr-1.5 h-4 w-4" aria-hidden />
              Download PDF
            </a>
          </Button>
        }
      />

      {/* Tabs + search */}
      <Reveal>
        <div className="space-y-3">
          {/* Roster Type Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-line pb-2.5">
            {ROSTER_TABS.map((tab) => {
              const active = (params.view ?? "") === tab.value;
              return (
                <Link
                  key={tab.value}
                  href={buildFilterUrl({ view: tab.value })}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition-colors",
                    active
                      ? "bg-brand-dark text-white"
                      : "bg-mist text-muted-foreground hover:bg-mist/80 hover:text-foreground"
                  )}
                >
                  {tab.value === "legacy" && <GraduationCap className="h-3.5 w-3.5" />}
                  {tab.label}
                </Link>
              );
            })}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {STATUS_TABS.map((tab) => {
                const active = (params.status ?? "") === tab.value;
                return (
                  <Link
                    key={tab.value}
                    href={buildFilterUrl({ status: tab.value })}
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
              action="/admin/team"
              className="relative w-full sm:max-w-xs"
            >
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                name="search"
                placeholder="Search team members…"
                defaultValue={params.search}
                className="pl-9"
                aria-label="Search team members"
              />
              {params.status && (
                <input type="hidden" name="status" value={params.status} />
              )}
              {params.view && (
                <input type="hidden" name="view" value={params.view} />
              )}
            </form>
          </div>
        </div>
      </Reveal>

      <ResponsiveTable
        columns={columns}
        rows={volunteers}
        keyFor={(v) => v.id}
        minWidth="min-w-full"
        mobileCardColumns={1}
        actions={(v) => (
          <div className="flex items-center gap-1.5">
            <AddToCommunityDialog
              member={v}
              linkedCommunityMember={communityMap.get(v.id)}
            />
            <LegacyMemberDialog
              member={v}
              trigger={
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-7 px-2 text-xs font-semibold",
                    v.is_legacy
                      ? "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Edit Legacy Status"
                >
                  <GraduationCap className="mr-1 h-3.5 w-3.5 text-amber-600" />
                  Legacy
                </Button>
              }
            />
            <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs">
              <Link href={`/admin/team/${v.id}`}>
                <Eye className="h-3.5 w-3.5" aria-hidden />
                <span className="ml-1">View</span>
              </Link>
            </Button>
          </div>
        )}
        empty={
          <EmptyState
            icon={Users}
            title={params.status === "PENDING" ? "No pending registrations" : "No team members found"}
            description="New registrations and search results will appear here."
          />
        }
      />
    </div>
  );
}
