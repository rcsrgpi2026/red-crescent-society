import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { adminGetStudents } from "@/lib/queries";
import { buildTablePdf, type PdfColumn } from "@/lib/pdf/build-table-pdf";
import { formatDateTime } from "@/lib/constants";
import type { Student } from "@/types/database";

export const dynamic = "force-dynamic";

export async function GET() {
  // Admin-only: the middleware checks for a session, and this enforces the role.
  const profile = await requireAdmin();
  if (!profile) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const students = await adminGetStudents();

  const columns: PdfColumn<Student>[] = [
    { header: "#", width: 0.8, getValue: (_v, i) => String(i + 1) },
    { header: "Name", width: 3.5, getValue: (v) => v.name },
    { header: "Roll", width: 2, getValue: (v) => v.roll },
    { header: "Session", width: 2, getValue: (v) => v.session },
    { header: "Department", width: 4, getValue: (v) => v.department },
    { header: "Phone", width: 2.6, getValue: (v) => v.phone },
    { header: "Email", width: 3.5, getValue: (v) => v.email },
  ];

  const pdf = await buildTablePdf({
    title: "Registered Students",
    subtitle: `Students list — generated ${formatDateTime(new Date().toISOString())}`,
    columns,
    rows: students,
  });

  const filename = `students-${new Date().toISOString().slice(0, 10)}.pdf`;
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
