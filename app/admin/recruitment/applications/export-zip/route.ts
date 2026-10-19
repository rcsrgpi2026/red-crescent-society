import { NextResponse } from "next/server";
import JSZip from "jszip";
import { requireAdmin } from "@/lib/auth";
import { adminGetVolunteerApplications, getFormConfigs } from "@/lib/queries";
import { buildApplicationDossierPdf } from "@/lib/pdf/build-application-dossier-pdf";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Allow sufficient time for batch PDF generation if needed

export async function GET(request: Request) {
  const profile = await requireAdmin();
  if (!profile) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || undefined;
  const campaignId = searchParams.get("campaignId") || undefined;
  const search = searchParams.get("search") || undefined;

  const [applications, formConfigs] = await Promise.all([
    adminGetVolunteerApplications({
      status,
      campaignId,
      search,
    }),
    getFormConfigs(),
  ]);

  if (!applications || applications.length === 0) {
    return new NextResponse(
      JSON.stringify({ message: "No volunteer applications found to export." }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const zip = new JSZip();
    const dateStr = new Date().toISOString().slice(0, 10);
    const statusLabel = status ? status.toLowerCase() : "all";
    const folderName = `Student_Dossiers_${statusLabel}_${dateStr}`;
    const folder = zip.folder(folderName) || zip;

    const usedFilenames = new Map<string, number>();

    // Process applications in controlled concurrent chunks to optimize speed and memory
    const CONCURRENCY = 4;
    for (let i = 0; i < applications.length; i += CONCURRENCY) {
      const chunk = applications.slice(i, i + CONCURRENCY);
      await Promise.all(
        chunk.map(async (app) => {
          try {
            const pdfBytes = await buildApplicationDossierPdf(app, formConfigs.volunteer_application);

            const safeName = (app.name || "Student")
              .replace(/[\s\t\n]+/g, "-")
              .replace(/[^a-zA-Z0-9_\u0980-\u09FF-]/g, "")
              .slice(0, 30);
            const roll = app.roll || "ID";
            const baseFilename = `Application-${roll}-${safeName || "Volunteer"}.pdf`;

            let filename = baseFilename;
            if (usedFilenames.has(baseFilename)) {
              const count = usedFilenames.get(baseFilename)! + 1;
              usedFilenames.set(baseFilename, count);
              filename = `Application-${roll}-${safeName || "Volunteer"}-${count}.pdf`;
            } else {
              usedFilenames.set(baseFilename, 1);
            }

            folder.file(filename, pdfBytes);
          } catch (err: any) {
            console.error(`Failed to generate PDF for application ${app.id} (${app.name}):`, err);
            folder.file(
              `_ERROR_${app.roll || app.id}.txt`,
              `Could not generate PDF dossier for ${app.name} (${app.roll || "No Roll"}):\n${err?.message || "Unknown error"}\n`
            );
          }
        })
      );
    }

    const zipBuffer = await zip.generateAsync({
      type: "uint8array",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    const zipFilename = `Student-Dossiers-${statusLabel}-${dateStr}.zip`;

    return new NextResponse(zipBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${zipFilename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error("Failed to build student dossiers ZIP:", error);
    return new NextResponse(`Failed to generate ZIP archive: ${error?.message || "Unknown error"}`, {
      status: 500,
    });
  }
}
