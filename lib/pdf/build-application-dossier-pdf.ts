import "regenerator-runtime/runtime";
import fs from "fs";
import path from "path";
import { PDFDocument, PDFPage, rgb, type RGB } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import sharp from "sharp";
import type { VolunteerApplication } from "@/types/database";
import { formatDateTime, VOLUNTEER_APPLICATION_STATUS_LABELS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Server-side PDF generation for Individual Volunteer Application Dossier.
// Consolidates:
// 1. Official BDRCS Volunteer Enrollment Application Form (A4 Portrait)
// 2. Embedded Passport Photograph
// 3. Verified Student Academic & Emergency Details
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
  brandGreen: rgb(0, 0.435, 0.27),       // #006f45
  brandDark: rgb(0, 0.32, 0.2),          // #005233
  brandSoft: rgb(0.92, 0.97, 0.94),      // light green tint
  crescentRed: rgb(0.85, 0.12, 0.16),    // BDRCS red #d91f28
  crescentSoft: rgb(0.99, 0.93, 0.93),   // light red tint
  text: rgb(0.12, 0.15, 0.14),           // deep dark
  muted: rgb(0.42, 0.46, 0.44),          // slate muted
  line: rgb(0.82, 0.86, 0.84),           // border line
  lightBg: rgb(0.97, 0.985, 0.98),       // card bg
  white: rgb(1, 1, 1),
  amber: rgb(0.85, 0.55, 0.05),
  amberSoft: rgb(0.99, 0.96, 0.9),
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

/** Processes image buffer via Sharp for safe PDF embedding */
async function processImageForPdf(
  buffer: Buffer,
  maxWidth = 1600,
  maxHeight = 1600
): Promise<{ buffer: Buffer; format: "jpeg" | "png" } | null> {
  try {
    const pipeline = sharp(buffer)
      .rotate() // auto-orient based on EXIF
      .resize({
        width: maxWidth,
        height: maxHeight,
        fit: "inside",
        withoutEnlargement: true,
      });

    // Check format
    const meta = await sharp(buffer).metadata();
    if (meta.format === "png" && !meta.hasAlpha) {
      const jpeg = await pipeline.jpeg({ quality: 86, progressive: true }).toBuffer();
      return { buffer: jpeg, format: "jpeg" };
    } else if (meta.format === "png") {
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
  const font = await pdf.embedFont(loadFontBytes(), { subset: true });

  // -------------------------------------------------------------------------
  // Helper: Text Wrapping
  // -------------------------------------------------------------------------
  function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
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
        if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
          current = candidate;
        } else if (!current) {
          // Break word if it exceeds maxWidth
          let partial = "";
          for (const ch of word) {
            if (font.widthOfTextAtSize(partial + ch, fontSize) <= maxWidth) {
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

  // =========================================================================
  // PAGE 1: Official Volunteer Application Form
  // =========================================================================
  const page1: PDFPage = pdf.addPage([PAGE_W, PAGE_H]);

  // Page Border Frame
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
        y: PAGE_H - MARGIN - 64,
        width: 58,
        height: 58,
      });
    } catch (e) {
      console.warn("Could not embed logo:", e);
    }
  }

  // Title Texts
  const titleX = MARGIN + 70;
  page1.drawText("বাংলাদেশ রেড ক্রিসেন্ট সোসাইটি", {
    x: titleX,
    y: PAGE_H - MARGIN - 18,
    size: 13,
    font,
    color: COLORS.brandGreen,
  });
  page1.drawText("BANGLADESH RED CRESCENT SOCIETY", {
    x: titleX,
    y: PAGE_H - MARGIN - 31,
    size: 8.5,
    font,
    color: COLORS.crescentRed,
  });
  page1.drawText("রাজশাহী পলিটেকনিক ইনস্টিটিউট যুব রেড ক্রিসেন্ট ইউনিট", {
    x: titleX,
    y: PAGE_H - MARGIN - 45,
    size: 9.5,
    font,
    color: COLORS.text,
  });
  page1.drawText("Rajshahi Polytechnic Institute Youth Red Crescent Unit", {
    x: titleX,
    y: PAGE_H - MARGIN - 57,
    size: 8,
    font,
    color: COLORS.muted,
  });

  // Top Right: Passport Photo Box (35mm x 45mm ratio ~ 85pt x 110pt)
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
    page1.drawText("PASSPORT PHOTO", {
      x: photoX + 6,
      y: photoY + 58,
      size: 7.5,
      font,
      color: COLORS.muted,
    });
    page1.drawText("পাসপোর্ট সাইজ ছবি", {
      x: photoX + 8,
      y: photoY + 44,
      size: 7.5,
      font,
      color: COLORS.muted,
    });
  }

  // Application Title Banner Pill
  const bannerY = PAGE_H - MARGIN - 86;
  page1.drawRectangle({
    x: MARGIN,
    y: bannerY,
    width: CONTENT_W - photoW - 14,
    height: 22,
    color: COLORS.brandGreen,
  });
  page1.drawText("যুব রেড ক্রিসেন্ট সদস্যপদ আবেদনপত্র · VOLUNTEER ADMISSION DOSSIER", {
    x: MARGIN + 10,
    y: bannerY + 6,
    size: 8.5,
    font,
    color: COLORS.white,
  });

  // Meta bar: Tracking ID, Applied Date, Status
  const metaY = bannerY - 18;
  const appIdDisplay = `Tracking: #APP-${application.id.slice(0, 8).toUpperCase()}`;
  page1.drawText(appIdDisplay, {
    x: MARGIN,
    y: metaY,
    size: 7.5,
    font,
    color: COLORS.muted,
  });

  const appliedDate = `Applied: ${formatDateTime(application.created_at)}`;
  page1.drawText(appliedDate, {
    x: MARGIN + 140,
    y: metaY,
    size: 7.5,
    font,
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

  page1.drawRectangle({
    x: PAGE_W - MARGIN - photoW - 14 - 90,
    y: metaY - 3,
    width: 86,
    height: 14,
    color: statusBg,
    borderColor: statusColor,
    borderWidth: 0.5,
  });
  page1.drawText(statusLabel, {
    x: PAGE_W - MARGIN - photoW - 14 - 82,
    y: metaY,
    size: 7.5,
    font,
    color: statusColor,
  });

  // -------------------------------------------------------------------------
  // Reusable Section Header Drawer
  // -------------------------------------------------------------------------
  let currentY = metaY - 14;

  function drawSectionHeader(title: string, bengaliSubtitle: string) {
    page1.drawRectangle({
      x: MARGIN,
      y: currentY - 16,
      width: CONTENT_W,
      height: 17,
      color: COLORS.brandSoft,
      borderWidth: 0.5,
      borderColor: COLORS.line,
    });
    // Left accent bar
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
      font,
      color: COLORS.brandDark,
    });
    if (bengaliSubtitle) {
      page1.drawText(`(${bengaliSubtitle})`, {
        x: MARGIN + font.widthOfTextAtSize(title, 8.5) + 16,
        y: currentY - 12,
        size: 7.5,
        font,
        color: COLORS.muted,
      });
    }
    currentY -= 20;
  }

  // -------------------------------------------------------------------------
  // Reusable 2-Column Table Drawer
  // -------------------------------------------------------------------------
  function drawTwoColumnRow(
    label1: string,
    val1: string,
    label2: string,
    val2: string,
    rowH = 18,
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
    // Center divider
    page1.drawLine({
      start: { x: MARGIN + colW, y: currentY },
      end: { x: MARGIN + colW, y: currentY - rowH },
      thickness: 0.5,
      color: COLORS.line,
    });

    const textY = currentY - rowH + 5;
    // Col 1
    page1.drawText(label1, { x: MARGIN + 6, y: textY, size: 7.5, font, color: COLORS.muted });
    page1.drawText(val1 || "—", {
      x: MARGIN + 96,
      y: textY,
      size: 8,
      font,
      color: COLORS.text,
    });

    // Col 2
    page1.drawText(label2, { x: MARGIN + colW + 6, y: textY, size: 7.5, font, color: COLORS.muted });
    page1.drawText(val2 || "—", {
      x: MARGIN + colW + 96,
      y: textY,
      size: 8,
      font,
      color: COLORS.text,
    });

    currentY -= rowH;
  }

  // -------------------------------------------------------------------------
  // 1. Applicant Personal & Academic Information
  // -------------------------------------------------------------------------
  drawSectionHeader("1. APPLICANT IDENTIFICATION & ACADEMIC RECORD", "শিক্ষার্থীর ব্যক্তিগত ও প্রাতিষ্ঠানিক তথ্য");
  drawTwoColumnRow("Full Name (নাম):", application.name, "Student Roll (রোল):", application.roll, 17, false);
  drawTwoColumnRow(
    "Department (বিভাগ):",
    application.department,
    "College Reg. No.:",
    application.registration_no || "—",
    17,
    true
  );
  drawTwoColumnRow(
    "Semester (পর্ব):",
    `${application.semester} Semester`,
    "Academic Session:",
    application.session,
    17,
    false
  );
  drawTwoColumnRow(
    "Blood Group (রক্তের গ্রুপ):",
    application.blood_group || "—",
    "Mobile No (মোবাইল):",
    application.phone,
    17,
    true
  );
  drawTwoColumnRow(
    "Email Address (ইমেইল):",
    application.email || "—",
    "Recruitment Campaign:",
    application.recruitment_campaigns?.title || "Regular Enrollment",
    17,
    false
  );

  currentY -= 6;

  // -------------------------------------------------------------------------
  // 2. Emergency Contact Information
  // -------------------------------------------------------------------------
  drawSectionHeader("2. EMERGENCY CONTACT DETAILS", "জরুরি যোগাযোগের তথ্য");
  drawTwoColumnRow(
    "Emergency Contact Person:",
    application.emergency_contact_name || "—",
    "Emergency Phone Number:",
    application.emergency_contact_phone || "—",
    18,
    false
  );

  currentY -= 6;

  // -------------------------------------------------------------------------
  // 3. Volunteering Profile & Motivation
  // -------------------------------------------------------------------------
  drawSectionHeader("3. VOLUNTEERING PROFILE & MOTIVATION", "দক্ষতা, অভিজ্ঞতা ও যোগদানের উদ্দেশ্য");

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
  page1.drawText("Skills / Interests (দক্ষতা):", {
    x: MARGIN + 6,
    y: currentY - 13,
    size: 7.5,
    font,
    color: COLORS.muted,
  });
  page1.drawText(skillsStr, {
    x: MARGIN + 120,
    y: currentY - 13,
    size: 8,
    font,
    color: COLORS.text,
  });
  currentY -= 18;

  // Previous Experience
  const expLines = wrapText(application.previous_volunteer_experience || "None", CONTENT_W - 130, 7.5).slice(0, 2);
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
    font,
    color: COLORS.muted,
  });
  let expTextY = currentY - 13;
  for (const line of expLines) {
    page1.drawText(line, { x: MARGIN + 120, y: expTextY, size: 7.5, font, color: COLORS.text });
    expTextY -= 11;
  }
  currentY -= expRowH;

  // Motivation text
  const motLines = wrapText(application.motivation || "None", CONTENT_W - 130, 7.5).slice(0, 3);
  const motRowH = Math.max(20, motLines.length * 11 + 7);
  page1.drawRectangle({
    x: MARGIN,
    y: currentY - motRowH,
    width: CONTENT_W,
    height: motRowH,
    borderWidth: 0.5,
    borderColor: COLORS.line,
  });
  page1.drawText("Why join RCY (উদ্দেশ্য):", {
    x: MARGIN + 6,
    y: currentY - 13,
    size: 7.5,
    font,
    color: COLORS.muted,
  });
  let motTextY = currentY - 13;
  for (const line of motLines) {
    page1.drawText(line, { x: MARGIN + 120, y: motTextY, size: 7.5, font, color: COLORS.text });
    motTextY -= 11;
  }
  currentY -= motRowH;

  currentY -= 6;

  // -------------------------------------------------------------------------
  // 4. Submitted Verification Documents Checklist
  // -------------------------------------------------------------------------
  drawSectionHeader("4. VERIFICATION DOCUMENTS SUBMISSION AUDIT", "দাখিলকৃত প্রমাণ্য নথিপত্রের তালিকা");

  const docChecklist = [
    {
      title: "1. Passport Size Photograph (পাসপোর্ট সাইজ ছবি)",
      provided: Boolean(application.photo_url),
      location: application.photo_url ? "Embedded in Top-Right Box" : "Not Provided",
    },
    {
      title: "2. Applicant NID / Birth Certificate (জাতীয় পরিচয়পত্র / জন্ম নিবন্ধন)",
      provided: Boolean(application.nid_or_birth_cert_url),
      location: application.nid_or_birth_cert_url ? "Attached as Exhibit 1 (Next Page)" : "Not Provided",
    },
    {
      title: "3. College Reg. Card / Student ID (কলেজ রেজিস্ট্রেশন কার্ড / আইডি)",
      provided: Boolean(application.college_reg_card_url),
      location: application.college_reg_card_url ? "Attached as Exhibit 2" : "Not Provided",
    },
    {
      title: "4. Father's National ID Card (পিতার জাতীয় পরিচয়পত্র)",
      provided: Boolean(application.father_nid_url),
      location: application.father_nid_url ? "Attached as Exhibit 3" : "Not Provided",
    },
    {
      title: "5. Mother's National ID Card (মাতার জাতীয় পরিচয়পত্র)",
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

    // Checkbox icon
    const checkText = item.provided ? "[✓] VERIFIED" : "[ ] NOT SUBMITTED";
    const checkColor = item.provided ? COLORS.brandGreen : COLORS.muted;

    page1.drawText(item.title, {
      x: MARGIN + 8,
      y: currentY - itemH + 4,
      size: 7.5,
      font,
      color: COLORS.text,
    });
    page1.drawText(item.location, {
      x: MARGIN + 280,
      y: currentY - itemH + 4,
      size: 7,
      font,
      color: COLORS.muted,
    });
    page1.drawText(checkText, {
      x: PAGE_W - MARGIN - 90,
      y: currentY - itemH + 4,
      size: 7,
      font,
      color: checkColor,
    });

    currentY -= itemH;
  }

  currentY -= 6;

  // -------------------------------------------------------------------------
  // 5. Declaration & Official Verification Block
  // -------------------------------------------------------------------------
  drawSectionHeader("5. APPLICANT DECLARATION & OFFICIAL VERIFICATION", "অঙ্গীকারনামা ও কর্তৃপক্ষ অনুমোদন");

  // Declaration text
  const declText =
    "আমি এই মর্মে অঙ্গীকার করছি যে, আবেদনপত্রে প্রদত্ত সকল তথ্য এবং সংযুক্ত নথিপত্র সম্পূর্ণ সত্য ও নির্ভুল। রেড ক্রিসেন্ট সোসাইটির ৭টি মূলনীতি মেনে যুব সদস্য হিসেবে নিষ্ঠার সাথে আর্তমানবতার সেবায় কাজ করে যাব।";
  page1.drawRectangle({
    x: MARGIN,
    y: currentY - 26,
    width: CONTENT_W,
    height: 26,
    color: COLORS.lightBg,
    borderWidth: 0.5,
    borderColor: COLORS.line,
  });
  page1.drawText(declText, {
    x: MARGIN + 8,
    y: currentY - 17,
    size: 7,
    font,
    color: COLORS.text,
  });

  currentY -= 32;

  // Signatures Area
  const sigBoxW = (CONTENT_W - 20) / 2;
  const sigBoxH = 58;

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
    start: { x: MARGIN + 16, y: currentY - sigBoxH + 22 },
    end: { x: MARGIN + sigBoxW - 16, y: currentY - sigBoxH + 22 },
    thickness: 0.5,
    color: COLORS.line,
  });
  page1.drawText("Applicant's Signature (আবেদনকারীর স্বাক্ষর)", {
    x: MARGIN + 20,
    y: currentY - sigBoxH + 11,
    size: 7.5,
    font,
    color: COLORS.text,
  });
  page1.drawText(`Date: ${application.created_at.slice(0, 10)}`, {
    x: MARGIN + 20,
    y: currentY - sigBoxH + 3,
    size: 6.5,
    font,
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
    start: { x: rightSigX + 16, y: currentY - sigBoxH + 22 },
    end: { x: rightSigX + sigBoxW - 16, y: currentY - sigBoxH + 22 },
    thickness: 0.5,
    color: COLORS.line,
  });
  page1.drawText("Youth Unit Leader / Verifying Officer (অনুমোদনকারী)", {
    x: rightSigX + 16,
    y: currentY - sigBoxH + 11,
    size: 7.5,
    font,
    color: COLORS.brandDark,
  });
  const reviewNote = application.reviewed_at
    ? `Status: ${application.status} · Approved on ${application.reviewed_at.slice(0, 10)}`
    : `Status: ${application.status} · Verification Pending`;
  page1.drawText(reviewNote, {
    x: rightSigX + 16,
    y: currentY - sigBoxH + 3,
    size: 6.5,
    font,
    color: COLORS.muted,
  });

  // Page 1 Footer
  page1.drawText(
    "Rajshahi Polytechnic Institute Youth Red Crescent Unit · Official Confidential Enrollment Dossier",
    {
      x: MARGIN,
      y: MARGIN - 18,
      size: 7,
      font,
      color: COLORS.muted,
    }
  );
  page1.drawText("Page 1", {
    x: PAGE_W - MARGIN - 26,
    y: MARGIN - 18,
    size: 7,
    font,
    color: COLORS.muted,
  });

  // =========================================================================
  // SUBSEQUENT PAGES: Attached Verification Exhibits
  // =========================================================================
  const exhibits: Array<{
    number: number;
    title: string;
    bengaliTitle: string;
    url: string | null | undefined;
  }> = [
    {
      number: 1,
      title: "APPLICANT'S NATIONAL ID / BIRTH CERTIFICATE",
      bengaliTitle: "আবেদনকারীর জাতীয় পরিচয়পত্র / জন্ম নিবন্ধন সনদ",
      url: application.nid_or_birth_cert_url,
    },
    {
      number: 2,
      title: "COLLEGE REGISTRATION CARD / STUDENT ID",
      bengaliTitle: "কলেজ রেজিস্ট্রেশন কার্ড / স্টুডেন্ট আইডি",
      url: application.college_reg_card_url,
    },
    {
      number: 3,
      title: "FATHER'S NATIONAL ID CARD",
      bengaliTitle: "পিতার জাতীয় পরিচয়পত্র (এনআইডি)",
      url: application.father_nid_url,
    },
    {
      number: 4,
      title: "MOTHER'S NATIONAL ID CARD",
      bengaliTitle: "মাতার জাতীয় পরিচয়পত্র (এনআইডি)",
      url: application.mother_nid_url,
    },
  ];

  let pageIndex = 1;

  for (const exhibit of exhibits) {
    if (!exhibit.url) continue;

    const buffer = await fetchRemoteBuffer(exhibit.url);
    if (!buffer) {
      // Add a page noting the document could not be retrieved
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
        font,
        color: COLORS.crescentRed,
      });
      errorPage.drawText(`Storage URL: ${exhibit.url}`, {
        x: MARGIN + 20,
        y: 285,
        size: 8,
        font,
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

          // Add a stamp at the top of donor page
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
              font,
              color: COLORS.white,
            }
          );
        }
      } catch (err) {
        console.warn("Failed merging donor PDF exhibit:", err);
      }
    } else {
      // It's an image (JPG, PNG, WebP, etc.)
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

        // Dimensions available on exhibit page
        const headerH = 75;
        const footerH = 40;
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

        // Background card behind image
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

        // Image caption watermark below image
        exhibitPage.drawText(
          `Official Verification Document Copy · RPI Red Crescent Society Youth Unit · Applicant: ${application.name}`,
          {
            x: MARGIN,
            y: MARGIN - 18,
            size: 7,
            font,
            color: COLORS.muted,
          }
        );
        exhibitPage.drawText(`Page ${pageIndex}`, {
          x: PAGE_W - MARGIN - 30,
          y: MARGIN - 18,
          size: 7,
          font,
          color: COLORS.muted,
        });
      } catch (err) {
        console.warn("Failed drawing image exhibit:", err);
      }
    }
  }

  function drawExhibitBanner(
    targetPage: PDFPage,
    ex: { number: number; title: string; bengaliTitle: string },
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
      y: bannerTop - 42,
      width: CONTENT_W,
      height: 42,
      color: COLORS.brandGreen,
    });

    targetPage.drawText(`EXHIBIT ${ex.number}: ${ex.title}`, {
      x: MARGIN + 12,
      y: bannerTop - 20,
      size: 10,
      font,
      color: COLORS.white,
    });
    targetPage.drawText(ex.bengaliTitle, {
      x: MARGIN + 12,
      y: bannerTop - 34,
      size: 8,
      font,
      color: COLORS.brandSoft,
    });

    // Sub-banner info
    const subTop = bannerTop - 44;
    targetPage.drawRectangle({
      x: MARGIN,
      y: subTop - 18,
      width: CONTENT_W,
      height: 18,
      color: COLORS.lightBg,
      borderWidth: 0.5,
      borderColor: COLORS.line,
    });
    targetPage.drawText(
      `Applicant: ${application.name}  |  Roll: ${application.roll}  |  Dept: ${application.department}  |  Session: ${application.session}`,
      {
        x: MARGIN + 10,
        y: subTop - 12,
        size: 7.5,
        font,
        color: COLORS.text,
      }
    );
  }

  return pdf.save();
}
