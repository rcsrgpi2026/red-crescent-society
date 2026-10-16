import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { adminGetTeamMembers } from "@/lib/queries";
import { buildTablePdf, type PdfColumn } from "@/lib/pdf/build-table-pdf";
import { formatDateTime, TEAM_MEMBER_STATUS_LABELS } from "@/lib/constants";
import type { TeamMember } from "@/types/database";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Admin-only: the middleware checks for a session, and this enforces the role.
  const profile = await requireAdmin();
  if (!profile) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || undefined;
  const search = searchParams.get("search") || undefined;
  const department = searchParams.get("department") || undefined;

  const rawMembers = await adminGetTeamMembers({
    status,
    search,
    department,
    isLegacy: false,
    limit: 1000,
  });

  // Strictly exclude legacy members so their details never appear in the team members PDF export
  const volunteers = rawMembers.filter((v) => !v.is_legacy);

  const columns: PdfColumn<TeamMember>[] = [
    { header: "#", width: 0.8, getValue: (_v, i) => String(i + 1) },
    { header: "Name", width: 3.6, getValue: (v) => v.name },
    { header: "Member ID", width: 2.2, getValue: (v) => v.member_id ?? "—" },
    { header: "Roll", width: 1.6, getValue: (v) => v.roll ?? "—" },
    { header: "Reg. No.", width: 2, getValue: (v) => v.registration_no ?? "—" },
    { header: "Session", width: 1.7, getValue: (v) => v.session ?? "—" },
    { header: "Department", width: 3.2, getValue: (v) => v.department ?? "—" },
    { header: "RCY Dept.", width: 3.4, getValue: (v) => v.rcy_department ?? "—" },
    { header: "Phone", width: 2.4, getValue: (v) => v.phone ?? "—" },
    { header: "Email", width: 2.8, getValue: (v) => v.email ?? "—" },
    { header: "Blood", width: 1.4, getValue: (v) => v.blood_group ?? "—" },
    { header: "Status", width: 1.9, getValue: (v) => TEAM_MEMBER_STATUS_LABELS[v.status as keyof typeof TEAM_MEMBER_STATUS_LABELS] ?? v.status },
    { header: "Registered", width: 2.4, getValue: (v) => formatDateTime(v.created_at) },
  ];

  const pdf = await buildTablePdf({
    title: "Registered Team Members",
    subtitle: `Team members list${status ? ` (${TEAM_MEMBER_STATUS_LABELS[status as keyof typeof TEAM_MEMBER_STATUS_LABELS] ?? status})` : ""} (${volunteers.length} members) — generated ${formatDateTime(
      new Date().toISOString()
    )}`,
    columns,
    rows: volunteers,
  });

  const filename = `team-members-${new Date().toISOString().slice(0, 10)}.pdf`;
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
