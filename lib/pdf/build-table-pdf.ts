import fs from "fs";
import path from "path";
import { PDFDocument, PDFPage, rgb, type RGB } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

// ---------------------------------------------------------------------------
// Server-side PDF generation for admin list exports (volunteers, students).
// Uses pdf-lib + fontkit with the Noto Sans Bengali font so both English and
// Bengali names render correctly.
// ---------------------------------------------------------------------------

let fontBytesCache: Uint8Array | null = null;

function loadFontBytes(): Uint8Array {
  if (!fontBytesCache) {
    const file = path.join(process.cwd(), "lib", "pdf", "fonts", "NotoSansBengali.ttf");
    fontBytesCache = fs.readFileSync(file);
  }
  return fontBytesCache;
}

const COLORS = {
  text: rgb(0.13, 0.16, 0.14),
  muted: rgb(0.4, 0.44, 0.42),
  headerBg: rgb(0, 0.435, 0.27), // brand green
  headerText: rgb(1, 1, 1),
  line: rgb(0.86, 0.89, 0.87),
  altRow: rgb(0.965, 0.98, 0.975),
};

export interface PdfColumn<T> {
  header: string;
  /** Relative width (any unit — scaled to fit the page). */
  width: number;
  getValue: (row: T, index: number) => string;
}

export interface PdfTableSpec<T> {
  /** Main title at the top of the PDF. */
  title: string;
  /** Subtitle line, e.g. "Volunteers — generated 14 Aug 2026, 20:56". */
  subtitle: string;
  columns: PdfColumn<T>[];
  rows: T[];
}

const PAGE_W = 842; // A4 landscape
const PAGE_H = 595;
const MARGIN = 36;
const FONT_SIZE = 9;
const LINE_HEIGHT = 13;
const PAD = 5;
const HEADER_SIZE = 9.5;

export async function buildTablePdf<T>(spec: PdfTableSpec<T>): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(loadFontBytes(), { subset: true });

  let page: PDFPage = pdf.addPage([PAGE_W, PAGE_H]);

  // Fit the (relative) column widths to the printable width.
  const total = spec.columns.reduce((sum, c) => sum + c.width, 0);
  const scale = (PAGE_W - MARGIN * 2) / total;
  const widths = spec.columns.map((c) => c.width * scale);
  const xs: number[] = [];
  {
    let acc = MARGIN;
    for (const w of widths) {
      xs.push(acc);
      acc += w;
    }
  }

  /** Wraps text to fit a column, breaking long words by character. */
  function wrap(text: string, maxWidth: number): string[] {
    if (!text) return [""];
    const words = String(text).split(/\s+/);
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, FONT_SIZE) <= maxWidth) {
        current = candidate;
      } else if (!current) {
        let partial = "";
        for (const ch of word) {
          if (font.widthOfTextAtSize(partial + ch, FONT_SIZE) <= maxWidth) {
            partial += ch;
          } else {
            lines.push(partial);
            partial = ch;
          }
        }
        if (partial) lines.push(partial);
        current = "";
      } else {
        lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
    return lines.length ? lines : [""];
  }

  function rowHeight(cells: string[][]): number {
    const maxLines = Math.max(...cells.map((lines) => lines.length));
    return maxLines * LINE_HEIGHT + PAD * 2 + 2;
  }

  function drawCell(
    colIndex: number,
    y: number,
    h: number,
    lines: string[],
    textColor: RGB,
    bg: RGB | null
  ) {
    const x = xs[colIndex];
    const w = widths[colIndex];
    if (bg) page.drawRectangle({ x, y: y - h, width: w, height: h, color: bg });
    let ty = y - PAD - FONT_SIZE;
    for (const line of lines) {
      page.drawText(line, { x: x + PAD, y: ty, size: FONT_SIZE, font, color: textColor });
      ty -= LINE_HEIGHT;
    }
    page.drawRectangle({ x, y: y - h, width: w, height: h, borderColor: COLORS.line, borderWidth: 0.5 });
  }

  function drawHeader() {
    const cells = spec.columns.map((c, i) => wrap(c.header, widths[i] - PAD * 2));
    const h = rowHeight(cells) + 2;
    for (let i = 0; i < cells.length; i++) {
      const x = xs[i];
      const w = widths[i];
      page.drawRectangle({ x, y: y - h, width: w, height: h, color: COLORS.headerBg });
      const lines = cells[i];
      let ty = y - PAD - HEADER_SIZE;
      for (const line of lines) {
        page.drawText(line, {
          x: x + PAD,
          y: ty,
          size: HEADER_SIZE,
          font,
          color: COLORS.headerText,
        });
        ty -= LINE_HEIGHT;
      }
    }
    y -= h;
  }

  function ensureRoom(h: number) {
    if (y - h < MARGIN + 10) {
      page = pdf.addPage([PAGE_W, PAGE_H]);
      y = page.getHeight() - 46;
      drawHeader();
    }
  }

  // ---- Title block ----
  page.drawText(spec.title, {
    x: MARGIN,
    y: PAGE_H - 46,
    size: 16,
    font,
    color: COLORS.text,
  });
  page.drawText(spec.subtitle, {
    x: MARGIN,
    y: PAGE_H - 64,
    size: 10.5,
    font,
    color: COLORS.muted,
  });
  page.drawRectangle({
    x: MARGIN,
    y: PAGE_H - 76,
    width: PAGE_W - MARGIN * 2,
    height: 1,
    color: COLORS.line,
  });

  // ---- Table ----
  let y = PAGE_H - 92;
  drawHeader();

  const rowCount = spec.rows.length;
  spec.rows.forEach((row, i) => {
    const cells = spec.columns.map((c, ci) => wrap(c.getValue(row, i), widths[ci] - PAD * 2));
    const h = rowHeight(cells);
    ensureRoom(h);
    const bg = i % 2 === 1 ? COLORS.altRow : null;
    for (let ci = 0; ci < cells.length; ci++) {
      drawCell(ci, y, h, cells[ci], COLORS.text, bg);
    }
    y -= h;
  });

  // ---- Footer with row count ----
  page.drawText(
    `Total: ${rowCount} record${rowCount === 1 ? "" : "s"} · Rajshahi Polytechnic Institute Red Crescent Society`,
    { x: MARGIN, y: MARGIN - 14, size: 8.5, font, color: COLORS.muted }
  );

  return pdf.save();
}
