import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { adminGetEvents, adminGetEventRegistrations } from "@/lib/queries";
import { buildTablePdf, type PdfColumn } from "@/lib/pdf/build-table-pdf";
import { formatDateTime } from "@/lib/constants";
import type { EventRegistration } from "@/types/database";

/** Short identity label for a registration, e.g. "TM-0042" or "Roll 20190". */
function identityLabel(r: EventRegistration): string | null {
  if (r.team_members?.member_id) return r.team_members.member_id;
  if (r.students?.roll) return `Roll ${r.students.roll}`;
  return null;
}

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Admin-only: the middleware checks for a session, and this enforces the role.
  const profile = await requireAdmin();
  if (!profile) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const eventId = request.nextUrl.searchParams.get("eventId");
  if (!eventId) {
    return new NextResponse("Missing eventId", { status: 400 });
  }

  const events = await adminGetEvents();
  const event = events.find((e) => e.id === eventId);
  if (!event) {
    return new NextResponse("Event not found", { status: 404 });
  }

  const registrations = await adminGetEventRegistrations(eventId);

  const columns: PdfColumn<EventRegistration>[] = [
    { header: "#", width: 0.8, getValue: (_v, i) => String(i + 1) },
    { header: "Name", width: 3.6, getValue: (v) => v.name },
    { header: "Identity", width: 2.4, getValue: (v) => identityLabel(v) ?? "Community" },
    { header: "Phone", width: 2.6, getValue: (v) => v.phone },
    { header: "Department", width: 3.2, getValue: (v) => v.department ?? "—" },
    { header: "Status", width: 1.9, getValue: (v) => v.status },
    { header: "Registered", width: 2.6, getValue: (v) => formatDateTime(v.created_at) },
  ];

  const pdf = await buildTablePdf({
    title: `Event Registrations — ${event.title}`,
    subtitle: `Registrations list — generated ${formatDateTime(new Date().toISOString())}`,
    columns,
    rows: registrations,
  });

  const filename = `event-registrations-${event.slug}-${new Date()
    .toISOString()
    .slice(0, 10)}.pdf`;
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
