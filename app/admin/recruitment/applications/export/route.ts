import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { adminGetVolunteerApplications } from "@/lib/queries";
import { buildTablePdf, type PdfColumn } from "@/lib/pdf/build-table-pdf";
import { formatDateTime, VOLUNTEER_APPLICATION_STATUS_LABELS } from "@/lib/constants";
import type { VolunteerApplication } from "@/types/database";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const profile = await requireAdmin();
  if (!profile) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || undefined;

  const applications = await adminGetVolunteerApplications({ status });

  const columns: PdfColumn<VolunteerApplication>[] = [
    { header: "#", width: 0.8, getValue: (_v, i) => String(i + 1) },
    { header: "Name", width: 3.2, getValue: (v) => v.name },
    { header: "Roll", width: 1.8, getValue: (v) => v.roll },
    { header: "Session", width: 1.8, getValue: (v) => v.session },
    { header: "Semester", width: 1.8, getValue: (v) => v.semester ? `${v.semester} Sem` : "—" },
    { header: "Department", width: 3.0, getValue: (v) => v.department },
    { header: "Blood Group", width: 1.8, getValue: (v) => v.blood_group || "—" },
    { header: "Mobile", width: 2.5, getValue: (v) => v.phone },
    { header: "Status", width: 2.0, getValue: (v) => VOLUNTEER_APPLICATION_STATUS_LABELS[v.status] || v.status },
    { header: "Applied Date", width: 2.4, getValue: (v) => v.created_at ? v.created_at.slice(0, 10) : "—" },
  ];

  const pdf = await buildTablePdf({
    title: "Volunteer Recruitment Applications",
    subtitle: `Applications list${status ? ` (${status})` : ""} — generated ${formatDateTime(new Date().toISOString())}`,
    columns,
    rows: applications,
  });

  const filename = `volunteer-applications-${new Date().toISOString().slice(0, 10)}.pdf`;
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
