import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { adminGetVolunteerApplication } from "@/lib/queries";
import { buildApplicationDossierPdf } from "@/lib/pdf/build-application-dossier-pdf";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const profile = await requireAdmin();
  if (!profile) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const application = await adminGetVolunteerApplication(id);

  if (!application) {
    return new NextResponse("Volunteer Application not found", { status: 404 });
  }

  try {
    const pdf = await buildApplicationDossierPdf(application);

    // Clean name for safe filename
    const safeName = application.name
      .replace(/[\s\t\n]+/g, "-")
      .replace(/[^a-zA-Z0-9_\u0980-\u09FF-]/g, "")
      .slice(0, 30);
    const filename = `Application-${application.roll || "ID"}-${safeName || "Volunteer"}.pdf`;

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error("Failed to generate volunteer application dossier PDF:", error);
    return new NextResponse(`Failed to generate PDF dossier: ${error?.message || "Unknown error"}`, {
      status: 500,
    });
  }
}
