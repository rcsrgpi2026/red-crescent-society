import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { adminGetEvents, adminGetEventRegistrations, getFormConfigs } from "@/lib/queries";
import { buildTablePdf, type PdfColumn } from "@/lib/pdf/build-table-pdf";
import { formatDateTime } from "@/lib/constants";
import type { EventRegistration } from "@/types/database";
import type { FormFieldConfig } from "@/types/form-editor";

export const dynamic = "force-dynamic";

/** Parse raw registration note and extract extra custom fields */
function parseNoteAndExtras(rawNote: string | null | undefined): {
  noteText: string;
  extraFields: Record<string, string>;
} {
  if (!rawNote) return { noteText: "", extraFields: {} };

  const marker = "[Extra Fields]:";
  const markerIndex = rawNote.indexOf(marker);

  let noteText = "";
  let extraStr = "";

  if (markerIndex !== -1) {
    noteText = rawNote.slice(0, markerIndex).trim();
    extraStr = rawNote.slice(markerIndex + marker.length).trim();
  } else {
    noteText = rawNote.trim();
  }

  const extraFields: Record<string, string> = {};
  if (extraStr) {
    const parts = extraStr.split(" | ");
    for (const part of parts) {
      const colIdx = part.indexOf(":");
      if (colIdx !== -1) {
        const key = part.slice(0, colIdx).trim().toLowerCase().replace(/[\s_-]+/g, "");
        const val = part.slice(colIdx + 1).trim();
        extraFields[key] = val;
      }
    }
  }

  return { noteText, extraFields };
}

/** Short identity label for a registration, e.g. "TM-0042" or "Roll 20190". */
function identityLabel(r: EventRegistration): string | null {
  if (r.team_members?.member_id) return r.team_members.member_id;
  if (r.students?.roll) return `Roll ${r.students.roll}`;
  if (r.roll) return `Roll ${r.roll}`;
  return null;
}

export async function GET(request: NextRequest) {
  // Admin-only
  const profile = await requireAdmin();
  if (!profile) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const eventId = request.nextUrl.searchParams.get("eventId");
  if (!eventId) {
    return new NextResponse("Missing eventId", { status: 400 });
  }

  const [events, formConfigs, registrations] = await Promise.all([
    adminGetEvents(),
    getFormConfigs(),
    adminGetEventRegistrations(eventId),
  ]);

  const event = events.find((e) => e.id === eventId);
  if (!event) {
    return new NextResponse("Event not found", { status: 404 });
  }

  // Pre-parse notes and extra fields for every registration
  const parsedDataMap = new Map<
    string,
    { noteText: string; extraFields: Record<string, string> }
  >();
  registrations.forEach((r) => {
    parsedDataMap.set(r.id, parseNoteAndExtras(r.note));
  });

  // Get active fields from Form Editor for event_registration
  const eventForm = formConfigs?.event_registration;
  const activeFields: FormFieldConfig[] = (eventForm?.fields || [])
    .filter((f) => f.enabled)
    .sort((a, b) => a.order - b.order);

  // Dynamic columns list
  const columns: PdfColumn<EventRegistration>[] = [
    { header: "#", width: 0.8, getValue: (_v, i) => String(i + 1) },
  ];

  // Helper to extract custom field value
  const getCustomValue = (r: EventRegistration, field: FormFieldConfig) => {
    const parsed = parsedDataMap.get(r.id);
    if (!parsed) return "—";
    const normId = field.id.toLowerCase().replace(/[\s_-]+/g, "");
    const normName = field.name.toLowerCase().replace(/[\s_-]+/g, "");
    const normLabel = field.label.toLowerCase().replace(/[\s_-]+/g, "");

    return (
      parsed.extraFields[normId] ||
      parsed.extraFields[normName] ||
      parsed.extraFields[normLabel] ||
      "—"
    );
  };

  // Add columns based on Form Editor configuration
  activeFields.forEach((field) => {
    const fieldName = (field.name || field.id).toLowerCase();
    // Clean label for PDF header (strip explanatory parentheses if too long)
    const cleanHeader = field.label.replace(/\s*\([^)]*\)/g, "").trim() || field.label;

    if (fieldName === "name") {
      columns.push({
        header: cleanHeader || "Name",
        width: 3.4,
        getValue: (r) => r.name,
      });
    } else if (fieldName === "phone") {
      columns.push({
        header: cleanHeader || "Phone",
        width: 2.6,
        getValue: (r) => r.phone,
      });
    } else if (fieldName === "department") {
      columns.push({
        header: cleanHeader || "Department",
        width: 2.8,
        getValue: (r) => r.department ?? "—",
      });
    } else if (fieldName === "roll") {
      columns.push({
        header: cleanHeader || "Roll",
        width: 2.0,
        getValue: (r) => (r.roll ? String(r.roll) : identityLabel(r) ?? "—"),
      });
    } else if (fieldName === "email") {
      columns.push({
        header: cleanHeader || "Email",
        width: 3.0,
        getValue: (r) => r.email ?? "—",
      });
    } else if (fieldName === "note") {
      columns.push({
        header: cleanHeader || "Notes / Comments",
        width: 3.2,
        getValue: (r) => parsedDataMap.get(r.id)?.noteText || "—",
      });
    } else {
      // Custom extra field added in Form Editor
      columns.push({
        header: cleanHeader,
        width: 2.6,
        getValue: (r) => getCustomValue(r, field),
      });
    }
  });

  // Always include Status and Registered Date at the end
  columns.push({
    header: "Status",
    width: 1.8,
    getValue: (v) => v.status,
  });

  columns.push({
    header: "Registered",
    width: 2.4,
    getValue: (v) => formatDateTime(v.created_at),
  });

  const pdf = await buildTablePdf({
    title: `Event Registrations — ${event.title}`,
    subtitle: `Registrations list (${registrations.length} total) — generated ${formatDateTime(
      new Date().toISOString()
    )}`,
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
