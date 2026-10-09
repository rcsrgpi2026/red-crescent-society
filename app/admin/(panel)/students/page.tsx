import Link from "next/link";
import {
  Download,
  GraduationCap,
  Search,
  CheckCircle2,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/empty-state";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { MakeRcyMemberDialog } from "@/components/admin/make-rcy-member-dialog";
import { RevokeRcyDialog } from "@/components/admin/revoke-rcy-dialog";
import { deleteStudent } from "@/lib/admin-actions";
import {
  ResponsiveTable,
  type Column,
} from "@/components/admin/responsive-table";
import { Reveal } from "@/components/shared/reveal";
import { adminGetStudents, adminGetTeamMembers } from "@/lib/queries";
import { formatDateTime } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Student, TeamMember } from "@/types/database";

interface StudentWithMembership extends Student {
  rcyMember?: TeamMember | null;
}

export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams?: Promise<{ search?: string; filter?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const [allStudents, allTeamMembers] = await Promise.all([
    adminGetStudents(),
    adminGetTeamMembers(),
  ]);

  // Index approved team members strictly by student_id, user_id, and email (NOT by non-unique roll)
  const teamMemberByStudentId = new Map<string, TeamMember>();
  const teamMemberByUserId = new Map<string, TeamMember>();
  const teamMemberByEmail = new Map<string, TeamMember>();

  for (const m of allTeamMembers) {
    if (m.status === "APPROVED") {
      if (m.student_id) teamMemberByStudentId.set(m.student_id, m);
      if (m.user_id) teamMemberByUserId.set(m.user_id, m);
      if (m.email?.trim()) teamMemberByEmail.set(m.email.trim().toLowerCase(), m);
    }
  }

  // Combine student records with their RCY membership status
  const studentsWithMembership: StudentWithMembership[] = allStudents.map((s) => {
    const member =
      teamMemberByStudentId.get(s.id) ||
      (s.user_id ? teamMemberByUserId.get(s.user_id) : null) ||
      (s.email?.trim() ? teamMemberByEmail.get(s.email.trim().toLowerCase()) : null) ||
      null;
    return {
      ...s,
      rcyMember: member,
    };
  });

  // Calculate counts
  const totalCount = studentsWithMembership.length;
  const rcyCount = studentsWithMembership.filter((s) => Boolean(s.rcyMember)).length;
  const nonRcyCount = totalCount - rcyCount;

  // Filter by status tab
  let filtered = studentsWithMembership;
  if (params.filter === "rcy") {
    filtered = filtered.filter((s) => Boolean(s.rcyMember));
  } else if (params.filter === "non_rcy") {
    filtered = filtered.filter((s) => !s.rcyMember);
  }

  // Filter by search query
  if (params.search?.trim()) {
    const q = params.search.trim().toLowerCase();
    filtered = filtered.filter((s) =>
      [
        s.name,
        s.roll,
        s.department,
        s.session,
        s.phone,
        s.email,
        s.rcyMember?.member_id,
        s.rcyMember?.position,
      ]
        .filter(Boolean)
        .some((val) => String(val).toLowerCase().includes(q))
    );
  }

  const FILTER_TABS = [
    { value: "", label: "All Students", count: totalCount },
    { value: "non_rcy", label: "Students Only", count: nonRcyCount },
    { value: "rcy", label: "RCY Members", count: rcyCount },
  ];

  const buildUrl = (newFilter?: string) => {
    const q = new URLSearchParams();
    const f = newFilter !== undefined ? newFilter : params.filter;
    if (f) q.set("filter", f);
    if (params.search) q.set("search", params.search);
    const qs = q.toString();
    return qs ? `/admin/students?${qs}` : "/admin/students";
  };

  const columns: Column<StudentWithMembership>[] = [
    {
      header: "Student",
      render: (s) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft/70 text-brand-dark font-bold text-xs">
            {s.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-foreground text-sm">{s.name}</span>
              {s.blood_group && (
                <span className="inline-flex rounded bg-crescent-soft px-1.5 py-0.2 text-[10px] font-bold text-crescent">
                  {s.blood_group}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">{s.phone}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Roll & Academic",
      render: (s) => (
        <div className="text-xs space-y-0.5">
          <span className="font-mono font-bold text-brand-dark">Roll: {s.roll}</span>
          <p className="text-muted-foreground">Session: {s.session}</p>
          {s.semester && (
            <p className="text-[11px] font-medium text-foreground">{s.semester} Semester</p>
          )}
        </div>
      ),
    },
    {
      header: "Department",
      render: (s) => <span className="text-xs font-medium">{s.department}</span>,
    },
    {
      header: "Email",
      render: (s) => (
        <span className="block max-w-[13rem] truncate text-xs text-muted-foreground">
          {s.email}
        </span>
      ),
    },
    {
      header: "RCY Status",
      render: (s) =>
        s.rcyMember ? (
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2.5 py-0.5 text-[11px] font-bold shadow-2xs">
              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
              RCY Member
            </span>
            {s.rcyMember.member_id && (
              <p className="font-mono text-[11px] font-bold text-brand-dark">
                {s.rcyMember.member_id}
              </p>
            )}
            <p className="text-[10px] text-muted-foreground">{s.rcyMember.position}</p>
          </div>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-0.5 text-[11px] font-medium">
            Student Only
          </span>
        ),
    },
    {
      header: "Registered",
      render: (s) => (
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {formatDateTime(s.created_at)}
        </span>
      ),
    },
    {
      header: "Actions",
      render: (s) => (
        <div className="flex items-center gap-1.5 flex-wrap">
          {!s.rcyMember ? (
            <MakeRcyMemberDialog student={s} />
          ) : (
            <>
              <Button asChild variant="outline" size="sm" className="h-8 px-2 text-xs font-semibold gap-1">
                <Link href={`/admin/team/${s.rcyMember.id}`}>
                  <Eye className="h-3.5 w-3.5" />
                  View Team
                </Link>
              </Button>
              <RevokeRcyDialog studentId={s.id} studentName={s.name} />
            </>
          )}
          <ConfirmDelete
            action={deleteStudent}
            id={s.id}
            label="Delete"
            description={`Delete ${s.name}'s student account? This also removes their login account — it cannot be undone.`}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={GraduationCap}
        title="Students Directory"
        description="Students registered through the student portal. Review academic details or enroll students directly as official RCY members."
        tone="bg-gradient-to-br from-poly to-poly-soft/60"
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <a href="/admin/students/export" download>
                <Download className="mr-1.5 h-4 w-4" aria-hidden />
                Download PDF
              </a>
            </Button>
          </div>
        }
      />

      {/* Tabs + Search */}
      <Reveal>
        <div className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              {FILTER_TABS.map((tab) => {
                const active = (params.filter ?? "") === tab.value;
                return (
                  <Link
                    key={tab.value}
                    href={buildUrl(tab.value)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-semibold transition-colors",
                      active
                        ? "border-brand bg-brand text-white shadow-sm shadow-brand/20"
                        : "border-line bg-white text-muted-foreground hover:border-brand/40 hover:text-brand-dark"
                    )}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.2 text-[10px]",
                        active ? "bg-white/20 text-white" : "bg-black/5 text-muted-foreground"
                      )}
                    >
                      {tab.count}
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* Search Input */}
            <form method="get" action="/admin/students" className="relative w-full sm:max-w-xs">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                name="search"
                placeholder="Search students or roll…"
                defaultValue={params.search}
                className="pl-9 h-9 text-xs"
                aria-label="Search students"
              />
              {params.filter && <input type="hidden" name="filter" value={params.filter} />}
            </form>
          </div>
        </div>
      </Reveal>

      {/* Main Table */}
      <Reveal>
        <ResponsiveTable
          columns={columns}
          rows={filtered}
          keyFor={(s) => s.id}
          minWidth="min-w-[840px]"
          empty={
            <EmptyState
              icon={GraduationCap}
              title={
                params.filter === "non_rcy"
                  ? "No non-RCY students found"
                  : params.filter === "rcy"
                    ? "No RCY member students found"
                    : "No students registered yet"
              }
              description={
                params.search
                  ? "No students match your search criteria. Try a different query."
                  : "Students who create an account through the student portal will appear here."
              }
            />
          }
        />
      </Reveal>
    </div>
  );
}
