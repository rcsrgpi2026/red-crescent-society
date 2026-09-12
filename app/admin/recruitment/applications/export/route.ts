import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { adminGetVolunteerApplications, getFormConfigs } from "@/lib/queries";
import { buildTablePdf, type PdfColumn } from "@/lib/pdf/build-table-pdf";
import { formatDateTime, VOLUNTEER_APPLICATION_STATUS_LABELS } from "@/lib/constants";
import type { VolunteerApplication } from "@/types/database";
import type { FormFieldConfig } from "@/types/form-editor";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const profile = await requireAdmin();
  if (!profile) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || undefined;

  const [applications, formConfigs] = await Promise.all([
    adminGetVolunteerApplications({ status }),
    getFormConfigs(),
  ]);

  const volunteerForm = formConfigs?.volunteer_application;
  const activeFields: FormFieldConfig[] = (volunteerForm?.fields || [])
    .filter((f) => f.enabled)
    .sort((a, b) => a.order - b.order);

  const columns: PdfColumn<VolunteerApplication>[] = [
    { header: "#", width: 0.8, getValue: (_v, i) => String(i + 1) },
  ];

  // Map each active Form Editor field to the PDF column
  activeFields.forEach((field) => {
    const fieldId = (field.name || field.id).toLowerCase();
    const cleanHeader = field.label.replace(/\s*\([^)]*\)/g, "").trim() || field.label;

    if (fieldId === "name") {
      columns.push({
        header: cleanHeader || "Name",
        width: 3.2,
        getValue: (v) => v.name,
      });
    } else if (fieldId === "studentid" || fieldId === "roll") {
      columns.push({
        header: cleanHeader || "Roll",
        width: 1.8,
        getValue: (v) => v.roll,
      });
    } else if (fieldId === "department") {
      columns.push({
        header: cleanHeader || "Department",
        width: 2.8,
        getValue: (v) => v.department,
      });
    } else if (fieldId === "session") {
      columns.push({
        header: cleanHeader || "Session",
        width: 1.8,
        getValue: (v) => v.session,
      });
    } else if (fieldId === "semester") {
      columns.push({
        header: cleanHeader || "Semester",
        width: 1.8,
        getValue: (v) => (v.semester ? `${v.semester} Sem` : "—"),
      });
    } else if (fieldId === "phone") {
      columns.push({
        header: cleanHeader || "Mobile",
        width: 2.4,
        getValue: (v) => v.phone,
      });
    } else if (fieldId === "email") {
      columns.push({
        header: cleanHeader || "Email",
        width: 2.8,
        getValue: (v) => v.email || "—",
      });
    } else if (fieldId === "bloodgroup" || fieldId === "blood_group") {
      columns.push({
        header: cleanHeader || "Blood Group",
        width: 1.8,
        getValue: (v) => v.blood_group || "—",
      });
    } else if (fieldId === "area") {
      columns.push({
        header: cleanHeader || "Area / Hall",
        width: 2.2,
        getValue: (v) => (v as any).area || "—",
      });
    } else if (fieldId === "emergencycontactname") {
      columns.push({
        header: cleanHeader || "Emergency Contact",
        width: 2.4,
        getValue: (v) => v.emergency_contact_name || "—",
      });
    } else if (fieldId === "emergencycontactphone") {
      columns.push({
        header: cleanHeader || "Emergency Phone",
        width: 2.2,
        getValue: (v) => v.emergency_contact_phone || "—",
      });
    } else if (fieldId === "skills") {
      columns.push({
        header: cleanHeader || "Skills",
        width: 2.8,
        getValue: (v) => (Array.isArray(v.skills) ? v.skills.join(", ") : (v.skills as string) || "—"),
      });
    } else if (fieldId === "experience") {
      columns.push({
        header: cleanHeader || "Experience",
        width: 3.0,
        getValue: (v) => v.previous_volunteer_experience || "—",
      });
    } else if (fieldId === "motivation") {
      columns.push({
        header: cleanHeader || "Motivation",
        width: 3.2,
        getValue: (v) => v.motivation || "—",
      });
    }
  });

  // Always append Status and Applied Date at the end
  columns.push({
    header: "Status",
    width: 2.0,
    getValue: (v) => VOLUNTEER_APPLICATION_STATUS_LABELS[v.status] || v.status,
  });

  columns.push({
    header: "Applied Date",
    width: 2.2,
    getValue: (v) => (v.created_at ? v.created_at.slice(0, 10) : "—"),
  });

  const pdf = await buildTablePdf({
    title: "Volunteer Recruitment Applications",
    subtitle: `Applications list${status ? ` (${status})` : ""} (${applications.length} total) — generated ${formatDateTime(
      new Date().toISOString()
    )}`,
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
