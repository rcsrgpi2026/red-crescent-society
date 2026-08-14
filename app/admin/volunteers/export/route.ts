import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { adminGetVolunteers } from "@/lib/queries";
import { buildTablePdf, type PdfColumn } from "@/lib/pdf/build-table-pdf";
import { formatDateTime, VOLUNTEER_STATUS_LABELS } from "@/lib/constants";
import type { Volunteer } from "@/types/database";

export const dynamic = "force-dynamic";

export async function GET() {
  // Admin-only: the middleware checks for a session, and this enforces the role.
  const profile = await requireAdmin();
  if (!profile) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const volunteers = await adminGetVolunteers();

  const columns: PdfColumn<Volunteer>[] = [
    { header: "#", width: 0.8, getValue: (_v, i) => String(i + 1) },
    { header: "Name", width: 3.6, getValue: (v) => v.name },
    { header: "Member ID", width: 2.2, getValue: (v) => v.member_id ?? "—" },
    { header: "Roll", width: 1.6, getValue: (v) => v.roll ?? "—" },
    { header: "Reg. No.", width: 2, getValue: (v) => v.registration_no ?? "—" },
    { header: "Department", width: 3.2, getValue: (v) => v.department ?? "—" },
    { header: "Semester", width: 1.5, getValue: (v) => v.semester ?? "—" },
    { header: "Phone", width: 2.4, getValue: (v) => v.phone ?? "—" },
    { header: "Email", width: 2.8, getValue: (v) => v.email ?? "—" },
    { header: "Blood", width: 1.4, getValue: (v) => v.blood_group ?? "—" },
    { header: "Status", width: 1.9, getValue: (v) => VOLUNTEER_STATUS_LABELS[v.status] ?? v.status },
    { header: "Registered", width: 2.4, getValue: (v) => formatDateTime(v.created_at) },
  ];

  const pdf = await buildTablePdf({
    title: "Registered Volunteers",
    subtitle: `Volunteers list — generated ${formatDateTime(new Date().toISOString())}`,
    columns,
    rows: volunteers,
  });

  const filename = `volunteers-${new Date().toISOString().slice(0, 10)}.pdf`;
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
