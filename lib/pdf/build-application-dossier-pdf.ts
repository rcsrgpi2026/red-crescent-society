import "regenerator-runtime/runtime";
import fs from "fs";
import path from "path";
import { PDFDocument, PDFPage, rgb, type RGB, StandardFonts, type PDFFont } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import sharp from "sharp";
import type { VolunteerApplication } from "@/types/database";
import { formatDateTime, VOLUNTEER_APPLICATION_STATUS_LABELS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Server-side PDF generation for Individual Volunteer Application Dossier.
// Official BDRCS Red Crescent Youth (RCY) Standard.
// Consolidates:
// 1. Official RCY Volunteer Enrollment Application Form (A4 Portrait)
// 2. Embedded Passport Photograph
// 3. Verified Student Academic & Emergency Records
// 4. Verification Exhibits (NID, College Reg Card, Parents' NIDs)
// ---------------------------------------------------------------------------

let fontBytesCache: Uint8Array | null = null;
let logoPngCache: Buffer | null = null;

function loadFontBytes(): Uint8Array {
  if (!fontBytesCache) {
    const file = path.join(process.cwd(), "lib", "pdf", "fonts", "NotoSansBengali.ttf");
    fontBytesCache = fs.readFileSync(file);
  }
  return fontBytesCache;
}

async function loadLogoPng(): Promise<Buffer | null> {
  if (logoPngCache) return logoPngCache;
  const logoPath = path.join(process.cwd(), "public", "icon-512.png");
  if (fs.existsSync(logoPath)) {
    try {
      logoPngCache = await sharp(logoPath)
        .resize(160, 160, { fit: "contain" })
        .png()
        .toBuffer();
      return logoPngCache;
    } catch (e) {
      console.warn("Could not load logo PNG for PDF:", e);
    }
  }
  return null;
}

const COLORS = {
  brandGreen: rgb(0, 0.435, 0.27),       // BDRCS green #006f45
  brandDark: rgb(0, 0.30, 0.18),         // #004d30
  brandSoft: rgb(0.92, 0.965, 0.94),     // light green background
  crescentRed: rgb(0.85, 0.12, 0.16),    // BDRCS red #d91f28
  crescentSoft: rgb(0.99, 0.93, 0.93),   // light red background
  text: rgb(0.12, 0.15, 0.14),           // dark body text
  muted: rgb(0.42, 0.46, 0.44),          // slate label text
  line: rgb(0.82, 0.86, 0.84),           // border line
  lightBg: rgb(0.97, 0.985, 0.98),       // alternating card bg
  white: rgb(1, 1, 1),
  amber: rgb(0.78, 0.48, 0.05),
  amberSoft: rgb(0.99, 0.96, 0.90),
};

const PAGE_W = 595.28; // A4 portrait width
const PAGE_H = 841.89; // A4 portrait height
const MARGIN = 36;
const CONTENT_W = PAGE_W - MARGIN * 2; // 523.28 pt

/** Helper to fetch remote file buffer with timeout */
async function fetchRemoteBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(12000),
      headers: {
        "User-Agent": "RGPI-RedCrescent-PDFGenerator/1.0",
      },
    });
    if (!res.ok) {
      console.warn(`Failed to fetch remote asset [${res.status}] ${url}`);
      return null;
    }
    const arr = await res.arrayBuffer();
    return Buffer.from(arr);
  } catch (err) {
    console.warn(`Error fetching remote asset: ${url}`, err);
    return null;
  }
}

/** Processes image buffer via Sharp for safe PDF embedding with auto-rotation */
async function processImageForPdf(
  buffer: Buffer,
  maxWidth = 1600,
  maxHeight = 1600
): Promise<{ buffer: Buffer; format: "jpeg" | "png" } | null> {
  try {
    const pipeline = sharp(buffer)
      .rotate() // auto-orient based on EXIF orientation
      .resize({
        width: maxWidth,
        height: maxHeight,
        fit: "inside",
        withoutEnlargement: true,
      });

    const meta = await sharp(buffer).metadata();
    if (meta.format === "png" && meta.hasAlpha) {
      const png = await pipeline.png({ compressionLevel: 8 }).toBuffer();
      return { buffer: png, format: "png" };
    } else {
      const jpeg = await pipeline.jpeg({ quality: 86, progressive: true }).toBuffer();
      return { buffer: jpeg, format: "jpeg" };
    }
  } catch (e) {
    console.warn("Sharp image processing error:", e);
    return null;
  }
}

export async function buildApplicationDossierPdf(
  application: VolunteerApplication
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);

  // Fonts: Helvetica for razor-sharp official English typography; NotoSansBengali for Bengali values
  const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const fontBengali = await pdf.embedFont(loadFontBytes(), { subset: true });

  function selectFont(text: string, bold = false): PDFFont {
    if (/[\u0980-\u09FF]/.test(text)) {
      return fontBengali;
    }
    return bold ? fontBold : fontRegular;
  }

  // -------------------------------------------------------------------------
  // Helper: Text Wrapping with font measurement
  // -------------------------------------------------------------------------
  function wrapText(text: string, maxWidth: number, fontSize: number, bold = false): string[] {
    if (!text) return ["—"];
    const clean = String(text).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const paragraphs = clean.split("\n");
    const result: string[] = [];

    for (const para of paragraphs) {
      if (!para.trim()) {
        result.push("");
        continue;
      }
      const words = para.split(/\s+/);
      let current = "";
      for (const word of words) {
        const candidate = current ? `${current} ${word}` : word;
        const font = selectFont(candidate, bold);
        if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
          current = candidate;
        } else if (!current) {
          let partial = "";
          for (const ch of word) {
            const f = selectFont(partial + ch, bold);
            if (f.widthOfTextAtSize(partial + ch, fontSize) <= maxWidth) {
              partial += ch;
            } else {
              if (partial) result.push(partial);
              partial = ch;
            }
          }
          current = partial;
        } else {
          result.push(current);
          current = word;
        }
      }
      if (current) result.push(current);
    }
    return result.length ? result : ["—"];
  }

  function drawTextUniversal(
    page: PDFPage,
    text: string,
    x: number,
    y: number,
    size: number,
    color: RGB,
    bold = false
  ) {
    const font = selectFont(text, bold);
    page.drawText(text, { x, y, size, font, color });
  }

  // =========================================================================
  // PAGE 1: Official Volunteer Application Form
  // =========================================================================
  const page1: PDFPage = pdf.addPage([PAGE_W, PAGE_H]);

  // Double Border Frame
  page1.drawRectangle({
    x: MARGIN - 8,
    y: MARGIN - 8,
    width: CONTENT_W + 16,
    height: PAGE_H - (MARGIN - 8) * 2,
    borderWidth: 1,
    borderColor: COLORS.brandGreen,
  });
  page1.drawRectangle({
    x: MARGIN - 5,
    y: MARGIN - 5,
    width: CONTENT_W + 10,
    height: PAGE_H - (MARGIN - 5) * 2,
    borderWidth: 0.5,
    borderColor: COLORS.line,
  });

  // Top Organization Header
  const logoBuf = await loadLogoPng();
  if (logoBuf) {
    try {
      const embeddedLogo = await pdf.embedPng(logoBuf);
      page1.drawImage(embeddedLogo, {
        x: MARGIN + 4,
        y: PAGE_H - MARGIN - 66,
        width: 58,
        height: 58,
      });
    } catch (e) {
      console.warn("Could not embed logo:", e);
    }
  }

  // Header Titles (With RED CRESCENT YOUTH prominently in the title)
  const titleX = MARGIN + 70;
  page1.drawText("BANGLADESH RED CRESCENT SOCIETY", {
    x: titleX,
    y: PAGE_H - MARGIN - 18,
    size: 13,
    font: fontBold,
    color: COLORS.brandGreen,
  });
  page1.drawText("RED CRESCENT YOUTH (RCY)", {
    x: titleX,
    y: PAGE_H - MARGIN - 33,
    size: 11,
    font: fontBold,
    color: COLORS.crescentRed,
  });
  page1.drawText("RAJSHAHI POLYTECHNIC INSTITUTE UNIT", {
    x: titleX,
    y: PAGE_H - MARGIN - 47,
    size: 9.5,
    font: fontBold,
    color: COLORS.text,
  });
  page1.drawText("Official Volunteer Enrollment & Verification Dossier", {
    x: titleX,
    y: PAGE_H - MARGIN - 59,
    size: 8,
    font: fontRegular,
    color: COLORS.muted,
  });

  // Top Right: Passport Photo Box (35mm x 45mm ratio ~ 86pt x 108pt)
  const photoW = 86;
  const photoH = 108;
  const photoX = PAGE_W - MARGIN - photoW - 4;
  const photoY = PAGE_H - MARGIN - photoH - 4;

  let photoEmbedded = false;
  if (application.photo_url) {
    const pBuf = await fetchRemoteBuffer(application.photo_url);
    if (pBuf) {
      const processed = await processImageForPdf(pBuf, 300, 380);
      if (processed) {
        try {
          const img =
            processed.format === "png"
              ? await pdf.embedPng(processed.buffer)
              : await pdf.embedJpg(processed.buffer);
          page1.drawImage(img, {
            x: photoX,
            y: photoY,
            width: photoW,
            height: photoH,
          });
          page1.drawRectangle({
            x: photoX,
            y: photoY,
            width: photoW,
            height: photoH,
            borderWidth: 1,
            borderColor: COLORS.brandGreen,
          });
          photoEmbedded = true;
        } catch (e) {
          console.warn("Failed embedding passport photo:", e);
        }
      }
    }
  }

  if (!photoEmbedded) {
    page1.drawRectangle({
      x: photoX,
      y: photoY,
      width: photoW,
      height: photoH,
      color: COLORS.lightBg,
      borderWidth: 1,
      borderColor: COLORS.line,
    });
    page1.drawText("AFFIX PASSPORT", {
      x: photoX + 6,
      y: photoY + 58,
      size: 7.5,
      font: fontBold,
      color: COLORS.muted,
    });
    page1.drawText("PHOTOGRAPH", {
      x: photoX + 12,
      y: photoY + 45,
      size: 7.5,
      font: fontBold,
      color: COLORS.muted,
    });
  }

  // Title Banner Pill (Prominently displaying RED CRESCENT YOUTH)
  const bannerY = PAGE_H - MARGIN - 86;
  const bannerW = CONTENT_W - photoW - 14;
  page1.drawRectangle({
    x: MARGIN,
    y: bannerY,
    width: bannerW,
    height: 20,
    color: COLORS.brandGreen,
  });
  page1.drawText("RED CRESCENT YOUTH · VOLUNTEER ENROLLMENT APPLICATION", {
    x: MARGIN + 10,
    y: bannerY + 6,
    size: 8.5,
    font: fontBold,
    color: COLORS.white,
  });

  // Meta bar: Tracking ID, Applied Date, Status
  const metaY = bannerY - 17;
  const appIdDisplay = `Tracking: #APP-${application.id.slice(0, 8).toUpperCase()}`;
  page1.drawText(appIdDisplay, {
    x: MARGIN,
    y: metaY,
    size: 7.5,
    font: fontBold,
    color: COLORS.muted,
  });

  const appliedDate = `Applied: ${formatDateTime(application.created_at)}`;
  page1.drawText(appliedDate, {
    x: MARGIN + 130,
    y: metaY,
    size: 7.5,
    font: fontRegular,
    color: COLORS.muted,
  });

  // Status Pill
  const statusLabel = VOLUNTEER_APPLICATION_STATUS_LABELS[application.status] || application.status;
  const statusBg =
    application.status === "APPROVED"
      ? COLORS.brandSoft
      : application.status === "REJECTED"
      ? COLORS.crescentSoft
      : COLORS.amberSoft;
  const statusColor =
    application.status === "APPROVED"
      ? COLORS.brandGreen
      : application.status === "REJECTED"
      ? COLORS.crescentRed
      : COLORS.amber;

  const statusBoxW = 92;
  const statusBoxX = bannerW + MARGIN - statusBoxW;
  page1.drawRectangle({
    x: statusBoxX,
    y: metaY - 3,
    width: statusBoxW,
    height: 14,
    color: statusBg,
    borderColor: statusColor,
    borderWidth: 0.5,
  });
  const statusTextW = fontBold.widthOfTextAtSize(statusLabel, 7.5);
  page1.drawText(statusLabel, {
    x: statusBoxX + (statusBoxW - statusTextW) / 2,
    y: metaY,
    size: 7.5,
    font: fontBold,
    color: statusColor,
  });

  // -------------------------------------------------------------------------
  // Reusable Section Header
  // -------------------------------------------------------------------------
  let currentY = metaY - 15;

  function drawSectionHeader(title: string) {
    page1.drawRectangle({
      x: MARGIN,
      y: currentY - 16,
      width: CONTENT_W,
      height: 17,
      color: COLORS.brandSoft,
      borderWidth: 0.5,
      borderColor: COLORS.line,
    });
    // Left brand accent line
    page1.drawRectangle({
      x: MARGIN,
      y: currentY - 16,
      width: 4,
      height: 17,
      color: COLORS.brandGreen,
    });
    page1.drawText(title, {
      x: MARGIN + 10,
      y: currentY - 12,
      size: 8.5,
      font: fontBold,
      color: COLORS.brandDark,
    });
    currentY -= 20;
  }

  // -------------------------------------------------------------------------
  // Reusable 2-Column Row (Without Any Label/Value Collisions)
  // -------------------------------------------------------------------------
  function drawTwoColumnRow(
    label1: string,
    val1: string,
    label2: string,
    val2: string,
    rowH = 17,
    isAlt = false
  ) {
    const colW = CONTENT_W / 2;
    if (isAlt) {
      page1.drawRectangle({
        x: MARGIN,
        y: currentY - rowH,
        width: CONTENT_W,
        height: rowH,
        color: COLORS.lightBg,
      });
    }
    page1.drawRectangle({
      x: MARGIN,
      y: currentY - rowH,
      width: CONTENT_W,
      height: rowH,
      borderWidth: 0.5,
      borderColor: COLORS.line,
    });
    // Center column divider line
    page1.drawLine({
      start: { x: MARGIN + colW, y: currentY },
      end: { x: MARGIN + colW, y: currentY - rowH },
      thickness: 0.5,
      color: COLORS.line,
    });

    const textY = currentY - rowH + 5;
    const labelColOffset = 88; // generous fixed space for labels so values NEVER collide

    // Col 1
    page1.drawText(label1, { x: MARGIN + 6, y: textY, size: 7.5, font: fontBold, color: COLORS.muted });
    drawTextUniversal(page1, val1 || "—", MARGIN + labelColOffset, textY, 8, COLORS.text, false);

    // Col 2
    page1.drawText(label2, { x: MARGIN + colW + 6, y: textY, size: 7.5, font: fontBold, color: COLORS.muted });
    drawTextUniversal(page1, val2 || "—", MARGIN + colW + labelColOffset, textY, 8, COLORS.text, false);

    currentY -= rowH;
  }

  // -------------------------------------------------------------------------
  // 1. Applicant Personal & Academic Information
  // -------------------------------------------------------------------------
  drawSectionHeader("1. APPLICANT IDENTIFICATION & ACADEMIC RECORD");
  drawTwoColumnRow("Full Name:", application.name, "Student Roll:", application.roll, 17, false);
  drawTwoColumnRow(
    "Department:",
    application.department,
    "College Reg. No.:",
    application.registration_no || "—",
    17,
    true
  );
  drawTwoColumnRow(
    "Semester:",
    `${application.semester} Semester`,
    "Academic Session:",
    application.session,
    17,
    false
  );
  drawTwoColumnRow(
    "Blood Group:",
    application.blood_group || "—",
    "Mobile Phone:",
    application.phone,
    17,
    true
  );
  drawTwoColumnRow(
    "Email Address:",
    application.email || "—",
    "Campaign:",
    application.recruitment_campaigns?.title || "Regular Enrollment",
    17,
    false
  );

  currentY -= 6;

  // -------------------------------------------------------------------------
  // 2. Emergency Contact Information (Short labels to prevent collisions)
  // -------------------------------------------------------------------------
  drawSectionHeader("2. EMERGENCY CONTACT DETAILS");
  drawTwoColumnRow(
    "Contact Person:",
    application.emergency_contact_name || "—",
    "Contact Phone:",
    application.emergency_contact_phone || "—",
    18,
    false
  );

  currentY -= 6;

  // -------------------------------------------------------------------------
  // 3. Volunteering Profile & Motivation
  // -------------------------------------------------------------------------
  drawSectionHeader("3. VOLUNTEERING PROFILE & MOTIVATION");

  // Skills row
  const skillsStr = Array.isArray(application.skills)
    ? application.skills.join(", ")
    : application.skills || "None specified";
  page1.drawRectangle({
    x: MARGIN,
    y: currentY - 18,
    width: CONTENT_W,
    height: 18,
    borderWidth: 0.5,
    borderColor: COLORS.line,
  });
  page1.drawText("Skills & Interests:", {
    x: MARGIN + 6,
    y: currentY - 13,
    size: 7.5,
    font: fontBold,
    color: COLORS.muted,
  });
  drawTextUniversal(page1, skillsStr, MARGIN + 115, currentY - 13, 8, COLORS.text, false);
  currentY -= 18;

  // Previous Experience
  const expLines = wrapText(application.previous_volunteer_experience || "None", CONTENT_W - 125, 7.5).slice(0, 2);
  const expRowH = Math.max(18, expLines.length * 11 + 6);
  page1.drawRectangle({
    x: MARGIN,
    y: currentY - expRowH,
    width: CONTENT_W,
    height: expRowH,
    color: COLORS.lightBg,
    borderWidth: 0.5,
    borderColor: COLORS.line,
  });
  page1.drawText("Previous Experience:", {
    x: MARGIN + 6,
    y: currentY - 13,
    size: 7.5,
    font: fontBold,
    color: COLORS.muted,
  });
  let expTextY = currentY - 13;
  for (const line of expLines) {
    drawTextUniversal(page1, line, MARGIN + 115, expTextY, 7.5, COLORS.text, false);
    expTextY -= 11;
  }
  currentY -= expRowH;

  // Motivation text
  const motLines = wrapText(application.motivation || "None", CONTENT_W - 125, 7.5).slice(0, 3);
  const motRowH = Math.max(20, motLines.length * 11 + 7);
  page1.drawRectangle({
    x: MARGIN,
    y: currentY - motRowH,
    width: CONTENT_W,
    height: motRowH,
    borderWidth: 0.5,
    borderColor: COLORS.line,
  });
  page1.drawText("Reason for Joining RCY:", {
    x: MARGIN + 6,
    y: currentY - 13,
    size: 7.5,
    font: fontBold,
    color: COLORS.muted,
  });
  let motTextY = currentY - 13;
  for (const line of motLines) {
    drawTextUniversal(page1, line, MARGIN + 115, motTextY, 7.5, COLORS.text, false);
    motTextY -= 11;
  }
  currentY -= motRowH;

  currentY -= 6;

  // -------------------------------------------------------------------------
  // 4. Submitted Verification Documents Audit Checklist
  // -------------------------------------------------------------------------
  drawSectionHeader("4. VERIFICATION DOCUMENTS SUBMISSION AUDIT");

  const docChecklist = [
    {
      title: "1. Passport Size Photograph",
      provided: Boolean(application.photo_url),
      location: application.photo_url ? "Embedded in Form (Top-Right Box)" : "Not Provided",
    },
    {
      title: "2. Applicant National ID / Birth Certificate",
      provided: Boolean(application.nid_or_birth_cert_url),
      location: application.nid_or_birth_cert_url ? "Attached as Exhibit 1 (Next Page)" : "Not Provided",
    },
    {
      title: "3. College Registration Card / Student ID",
      provided: Boolean(application.college_reg_card_url),
      location: application.college_reg_card_url ? "Attached as Exhibit 2" : "Not Provided",
    },
    {
      title: "4. Father's National ID Card",
      provided: Boolean(application.father_nid_url),
      location: application.father_nid_url ? "Attached as Exhibit 3" : "Not Provided",
    },
    {
      title: "5. Mother's National ID Card",
      provided: Boolean(application.mother_nid_url),
      location: application.mother_nid_url ? "Attached as Exhibit 4" : "Not Provided",
    },
  ];

  for (let i = 0; i < docChecklist.length; i++) {
    const item = docChecklist[i];
    const itemH = 15;
    const isAlt = i % 2 === 1;
    if (isAlt) {
      page1.drawRectangle({
        x: MARGIN,
        y: currentY - itemH,
        width: CONTENT_W,
        height: itemH,
        color: COLORS.lightBg,
      });
    }
    page1.drawRectangle({
      x: MARGIN,
      y: currentY - itemH,
      width: CONTENT_W,
      height: itemH,
      borderWidth: 0.5,
      borderColor: COLORS.line,
    });

    // Badge styling for submission status
    const statusText = item.provided ? "ATTACHED" : "NOT SUBMITTED";
    const statusBgColor = item.provided ? COLORS.brandSoft : COLORS.lightBg;
    const statusBorderColor = item.provided ? COLORS.brandGreen : COLORS.line;
    const statusTextColor = item.provided ? COLORS.brandDark : COLORS.muted;

    page1.drawText(item.title, {
      x: MARGIN + 8,
      y: currentY - itemH + 4,
      size: 7.5,
      font: fontBold,
      color: COLORS.text,
    });

    page1.drawText(item.location, {
      x: MARGIN + 235,
      y: currentY - itemH + 4,
      size: 7,
      font: fontRegular,
      color: COLORS.muted,
    });

    // Draw clean status pill
    const pillW = 82;
    const pillH = 11;
    const pillX = PAGE_W - MARGIN - pillW - 6;
    const pillY = currentY - itemH + 2;

    page1.drawRectangle({
      x: pillX,
      y: pillY,
      width: pillW,
      height: pillH,
      color: statusBgColor,
      borderColor: statusBorderColor,
      borderWidth: 0.5,
    });
    const textWidth = fontBold.widthOfTextAtSize(statusText, 6.5);
    page1.drawText(statusText, {
      x: pillX + (pillW - textWidth) / 2,
      y: pillY + 2.5,
      size: 6.5,
      font: fontBold,
      color: statusTextColor,
    });

    currentY -= itemH;
  }

  currentY -= 6;

  // -------------------------------------------------------------------------
  // 5. Declaration & Official Verification Signatures
  // -------------------------------------------------------------------------
  drawSectionHeader("5. APPLICANT DECLARATION & OFFICIAL VERIFICATION");

  const declText =
    "I hereby solemnly declare that all information provided in this volunteer application and all attached verification documents are true, complete, and correct. I pledge to strictly adhere to the Seven Fundamental Principles of the Red Cross and Red Crescent Movement and serve humanity with utmost integrity.";
  const declLines = wrapText(declText, CONTENT_W - 16, 7);
  const declBoxH = Math.max(26, declLines.length * 10 + 6);

  page1.drawRectangle({
    x: MARGIN,
    y: currentY - declBoxH,
    width: CONTENT_W,
    height: declBoxH,
    color: COLORS.lightBg,
    borderWidth: 0.5,
    borderColor: COLORS.line,
  });

  let declY = currentY - 9;
  for (const line of declLines) {
    page1.drawText(line, {
      x: MARGIN + 8,
      y: declY,
      size: 7,
      font: fontRegular,
      color: COLORS.text,
    });
    declY -= 10;
  }

  currentY -= declBoxH + 6;

  // Signatures Area
  const sigBoxW = (CONTENT_W - 20) / 2;
  const sigBoxH = 54;

  // Left: Applicant
  page1.drawRectangle({
    x: MARGIN,
    y: currentY - sigBoxH,
    width: sigBoxW,
    height: sigBoxH,
    borderWidth: 0.5,
    borderColor: COLORS.line,
  });
  page1.drawLine({
    start: { x: MARGIN + 16, y: currentY - sigBoxH + 20 },
    end: { x: MARGIN + sigBoxW - 16, y: currentY - sigBoxH + 20 },
    thickness: 0.5,
    color: COLORS.line,
  });
  page1.drawText("Applicant's Signature", {
    x: MARGIN + 20,
    y: currentY - sigBoxH + 10,
    size: 7.5,
    font: fontBold,
    color: COLORS.text,
  });
  page1.drawText(`Date: ${application.created_at.slice(0, 10)}`, {
    x: MARGIN + 20,
    y: currentY - sigBoxH + 2,
    size: 6.5,
    font: fontRegular,
    color: COLORS.muted,
  });

  // Right: Verifying Officer
  const rightSigX = MARGIN + sigBoxW + 20;
  page1.drawRectangle({
    x: rightSigX,
    y: currentY - sigBoxH,
    width: sigBoxW,
    height: sigBoxH,
    borderWidth: 0.5,
    borderColor: COLORS.line,
  });
  page1.drawLine({
    start: { x: rightSigX + 16, y: currentY - sigBoxH + 20 },
    end: { x: rightSigX + sigBoxW - 16, y: currentY - sigBoxH + 20 },
    thickness: 0.5,
    color: COLORS.line,
  });
  page1.drawText("Youth Unit Leader / Verifying Authority", {
    x: rightSigX + 16,
    y: currentY - sigBoxH + 10,
    size: 7.5,
    font: fontBold,
    color: COLORS.brandDark,
  });
  const reviewNote = application.reviewed_at
    ? `Status: ${application.status} · Approved on ${application.reviewed_at.slice(0, 10)}`
    : `Status: ${application.status} · Verification Pending`;
  page1.drawText(reviewNote, {
    x: rightSigX + 16,
    y: currentY - sigBoxH + 2,
    size: 6.5,
    font: fontRegular,
    color: COLORS.muted,
  });

  // Page 1 Footer
  page1.drawText(
    "Rajshahi Polytechnic Institute Youth Red Crescent Unit · Official Confidential Enrollment Dossier",
    {
      x: MARGIN,
      y: MARGIN - 18,
      size: 7,
      font: fontRegular,
      color: COLORS.muted,
    }
  );
  page1.drawText("Page 1", {
    x: PAGE_W - MARGIN - 26,
    y: MARGIN - 18,
    size: 7,
    font: fontBold,
    color: COLORS.muted,
  });

  // =========================================================================
  // SUBSEQUENT PAGES: Attached Verification Exhibits
  // =========================================================================
  const exhibits: Array<{
    number: number;
    title: string;
    url: string | null | undefined;
  }> = [
    {
      number: 1,
      title: "APPLICANT'S NATIONAL ID / BIRTH CERTIFICATE",
      url: application.nid_or_birth_cert_url,
    },
    {
      number: 2,
      title: "COLLEGE REGISTRATION CARD / STUDENT ID",
      url: application.college_reg_card_url,
    },
    {
      number: 3,
      title: "FATHER'S NATIONAL ID CARD",
      url: application.father_nid_url,
    },
    {
      number: 4,
      title: "MOTHER'S NATIONAL ID CARD",
      url: application.mother_nid_url,
    },
  ];

  let pageIndex = 1;

  for (const exhibit of exhibits) {
    if (!exhibit.url) continue;

    const buffer = await fetchRemoteBuffer(exhibit.url);
    if (!buffer) {
      pageIndex++;
      const errorPage = pdf.addPage([PAGE_W, PAGE_H]);
      drawExhibitBanner(errorPage, exhibit, pageIndex);
      errorPage.drawRectangle({
        x: MARGIN,
        y: 200,
        width: CONTENT_W,
        height: 200,
        color: COLORS.crescentSoft,
        borderColor: COLORS.crescentRed,
        borderWidth: 1,
      });
      errorPage.drawText("DOCUMENT COULD NOT BE RETRIEVED FROM STORAGE", {
        x: MARGIN + 20,
        y: 310,
        size: 10,
        font: fontBold,
        color: COLORS.crescentRed,
      });
      errorPage.drawText(`Storage URL: ${exhibit.url}`, {
        x: MARGIN + 20,
        y: 285,
        size: 8,
        font: fontRegular,
        color: COLORS.text,
      });
      continue;
    }

    // Check if buffer is a PDF
    const isPdf = buffer.length > 4 && buffer.slice(0, 4).toString() === "%PDF";

    if (isPdf) {
      try {
        const donorDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
        const donorIndices = donorDoc.getPageIndices();
        const copiedPages = await pdf.copyPages(donorDoc, donorIndices);

        for (let i = 0; i < copiedPages.length; i++) {
          pageIndex++;
          const donorPage = copiedPages[i];
          pdf.addPage(donorPage);

          // Stamp header at top of donor page
          donorPage.drawRectangle({
            x: 10,
            y: donorPage.getHeight() - 24,
            width: donorPage.getWidth() - 20,
            height: 18,
            color: COLORS.brandGreen,
          });
          donorPage.drawText(
            `EXHIBIT ${exhibit.number}: ${exhibit.title} · Applicant: ${application.name} (Roll: ${application.roll})`,
            {
              x: 16,
              y: donorPage.getHeight() - 17,
              size: 7.5,
              font: fontBold,
              color: COLORS.white,
            }
          );
        }
      } catch (err) {
        console.warn("Failed merging donor PDF exhibit:", err);
      }
    } else {
      // Image (JPG, PNG, WebP, etc.)
      const processed = await processImageForPdf(buffer, 1800, 2400);
      if (!processed) continue;

      pageIndex++;
      const exhibitPage = pdf.addPage([PAGE_W, PAGE_H]);
      drawExhibitBanner(exhibitPage, exhibit, pageIndex);

      try {
        const embeddedImg =
          processed.format === "png"
            ? await pdf.embedPng(processed.buffer)
            : await pdf.embedJpg(processed.buffer);

        const headerH = 68;
        const footerH = 38;
        const availW = CONTENT_W;
        const availH = PAGE_H - MARGIN * 2 - headerH - footerH;

        const imgRatio = embeddedImg.width / embeddedImg.height;
        let drawW = availW;
        let drawH = drawW / imgRatio;

        if (drawH > availH) {
          drawH = availH;
          drawW = drawH * imgRatio;
        }

        const drawX = MARGIN + (availW - drawW) / 2;
        const drawY = MARGIN + footerH + (availH - drawH) / 2;

        // Card background behind document
        exhibitPage.drawRectangle({
          x: drawX - 3,
          y: drawY - 3,
          width: drawW + 6,
          height: drawH + 6,
          color: COLORS.white,
          borderWidth: 1,
          borderColor: COLORS.line,
        });

        // Draw image
        exhibitPage.drawImage(embeddedImg, {
          x: drawX,
          y: drawY,
          width: drawW,
          height: drawH,
        });

        // Watermark footer
        exhibitPage.drawText(
          `Official Verification Document Copy · Red Crescent Youth · Rajshahi Polytechnic Institute Unit · Applicant: ${application.name}`,
          {
            x: MARGIN,
            y: MARGIN - 18,
            size: 7,
            font: fontRegular,
            color: COLORS.muted,
          }
        );
        exhibitPage.drawText(`Page ${pageIndex}`, {
          x: PAGE_W - MARGIN - 30,
          y: MARGIN - 18,
          size: 7,
          font: fontBold,
          color: COLORS.muted,
        });
      } catch (err) {
        console.warn("Failed drawing image exhibit:", err);
      }
    }
  }

  function drawExhibitBanner(
    targetPage: PDFPage,
    ex: { number: number; title: string },
    pageNum: number
  ) {
    // Outer border frame
    targetPage.drawRectangle({
      x: MARGIN - 8,
      y: MARGIN - 8,
      width: CONTENT_W + 16,
      height: PAGE_H - (MARGIN - 8) * 2,
      borderWidth: 1,
      borderColor: COLORS.brandGreen,
    });

    // Top Green Header
    const bannerTop = PAGE_H - MARGIN;
    targetPage.drawRectangle({
      x: MARGIN,
      y: bannerTop - 36,
      width: CONTENT_W,
      height: 36,
      color: COLORS.brandGreen,
    });

    targetPage.drawText(`EXHIBIT ${ex.number}: ${ex.title}`, {
      x: MARGIN + 12,
      y: bannerTop - 18,
      size: 10,
      font: fontBold,
      color: COLORS.white,
    });
    targetPage.drawText("Official Verification Document · Red Crescent Youth (RCY)", {
      x: MARGIN + 12,
      y: bannerTop - 30,
      size: 7.5,
      font: fontRegular,
      color: COLORS.brandSoft,
    });

    // Sub-banner info
    const subTop = bannerTop - 38;
    targetPage.drawRectangle({
      x: MARGIN,
      y: subTop - 16,
      width: CONTENT_W,
      height: 16,
      color: COLORS.lightBg,
      borderWidth: 0.5,
      borderColor: COLORS.line,
    });
    drawTextUniversal(
      targetPage,
      `Applicant: ${application.name}  |  Roll: ${application.roll}  |  Dept: ${application.department}  |  Session: ${application.session}`,
      MARGIN + 10,
      subTop - 11,
      7.5,
      COLORS.text,
      false
    );
  }

  return pdf.save();
}
