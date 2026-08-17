import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

const EXPORT_FILTER = (domNode: HTMLElement) =>
  !domNode.classList?.contains("export-exclude");

// ---------------------------------------------------------------------------
// Font embedding
//
// html-to-image embeds fonts by reading `@font-face` rules from
// `document.styleSheets`. The card's fonts come from a Google Fonts <link>,
// which browsers fetch in no-cors mode, so `sheet.cssRules` is inaccessible
// (SecurityError) and html-to-image's fallback silently drops the faces — the
// capture then re-renders with a fallback font (Arial/system-ui) whose wider
// metrics make text bigger, wrap labels like "Designation (Member/Executive
// Member):" and shift the RCY Dept. row.
//
// Instead of relying on that, we build the @font-face CSS ourselves — reading
// the rules from the stylesheets when allowed, or fetching the stylesheet when
// not — and pass it to html-to-image via `fontEmbedCSS`, which it uses as-is.
// This is deterministic: the same fonts that paint the preview are embedded in
// the PNG/PDF.
// ---------------------------------------------------------------------------

const FONT_MIME: Record<string, string> = {
  woff2: "font/woff2",
  woff: "font/woff",
  ttf: "font/ttf",
  otf: "font/otf",
  eot: "application/vnd.ms-fontobject",
  svg: "image/svg+xml",
};

function fontMimeFor(url: string): string {
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  return FONT_MIME[ext] ?? "font/woff2";
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Reads @font-face rules from raw CSS text (fallback for cross-origin sheets). */
function parseFontFaceRules(cssText: string): CSSFontFaceRule[] {
  const rules: CSSFontFaceRule[] = [];
  const re = /@font-face\s*{([\s\S]*?)}/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(cssText)) !== null) {
    try {
      const sheet = new CSSStyleSheet();
      sheet.insertRule(`@font-face { ${match[1]} }`);
      const rule = sheet.cssRules[0];
      if (rule instanceof CSSFontFaceRule) rules.push(rule);
    } catch {
      // Ignore malformed blocks — the browser does the same.
    }
  }
  return rules;
}

/** Replaces url(...) srcs in one @font-face rule with data URLs. */
async function embedFontUrls(
  cssText: string,
  baseUrl: string | null
): Promise<string> {
  const urlRe = /url\((['"]?)([^'")]+)\1\)/g;
  let result = cssText;
  const urls: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = urlRe.exec(cssText)) !== null) {
    const url = match[2];
    if (!url.startsWith("data:") && !urls.includes(url)) urls.push(url);
  }
  for (const url of urls) {
    try {
      const absolute = /^https?:\/\//i.test(url)
        ? url
        : baseUrl
          ? new URL(url, baseUrl).href
          : url;
      const res = await fetch(absolute);
      if (!res.ok) continue;
      const blob = await res.blob();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("Font read failed"));
        reader.onload = () => resolve(String(reader.result));
        reader.readAsDataURL(blob);
      });
      const wrapped = dataUrl.replace(/^data:[^;]+/, `data:${fontMimeFor(absolute)}`);
      result = result.replace(
        new RegExp(`url\\((['"]?)${escapeRegExp(url)}\\1\\)`),
        `url(${wrapped})`
      );
    } catch {
      // Keep the original URL — better a remote font than a broken one.
    }
  }
  return result;
}

function normalizeFamily(family: string): string {
  return family.trim().replace(/^['"]|['"]$/g, "");
}

function isGenericFamily(family: string): boolean {
  return ["sans-serif", "serif", "monospace", "cursive", "fantasy", "system-ui"].includes(
    family.toLowerCase()
  );
}

/** Collects the non-generic font families actually used on the card. */
function usedFontFamilies(node: HTMLElement): Set<string> {
  const used = new Set<string>();
  const walk = (el: HTMLElement) => {
    const family = el.style.fontFamily || getComputedStyle(el).fontFamily;
    for (const part of family.split(",")) {
      const fam = normalizeFamily(part);
      if (fam && !isGenericFamily(fam) && !fam.startsWith("ui-")) {
        used.add(fam);
      }
    }
    for (const child of Array.from(el.children)) {
      if (child instanceof HTMLElement) walk(child);
    }
  };
  walk(node);
  return used;
}

/** Caches the built font CSS per used-family set (the design is global). */
let fontEmbedCssCache: { key: string; css: string } | null = null;

/**
 * Builds the @font-face CSS for every family used on the card, with each font
 * file inlined as a data URL, ready to pass as html-to-image's `fontEmbedCSS`.
 */
async function buildFontEmbedCSS(node: HTMLElement): Promise<string> {
  const used = usedFontFamilies(node);
  if (used.size === 0) return "";

  const key = [...used].sort().join("|");
  if (fontEmbedCssCache && fontEmbedCssCache.key === key) {
    return fontEmbedCssCache.css;
  }

  const faces: { family: string; cssText: string; baseUrl: string | null }[] = [];

  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRule[] = [];
    try {
      rules = Array.from(sheet.cssRules ?? []);
    } catch {
      // Cross-origin stylesheet (Google Fonts <link>): fetch the CSS instead.
      if (sheet.href) {
        try {
          const css = await (await fetch(sheet.href)).text();
          rules = parseFontFaceRules(css);
        } catch {
          rules = [];
        }
      }
    }
    for (const rule of rules) {
      if (!(rule instanceof CSSFontFaceRule)) continue;
      const family = normalizeFamily(rule.style.getPropertyValue("font-family"));
      // Embed every face for the used families — Google serves one face per
      // unicode range (latin, bengali, …) with its own subsetted font file.
      if (used.has(family)) {
        faces.push({ family, cssText: rule.cssText, baseUrl: sheet.href });
      }
    }
  }

  const cssParts: string[] = [];
  for (const face of faces) {
    try {
      cssParts.push(await embedFontUrls(face.cssText, face.baseUrl));
    } catch {
      // Skip this face if embedding fails.
    }
  }
  const css = cssParts.join("\n");
  fontEmbedCssCache = { key, css };
  console.log(
    `[id-card-export] embedded ${faces.length} font face(s) for [${[...used].join(", ")}] → ${css.length} bytes of @font-face CSS`
  );
  return css;
}

// ---------------------------------------------------------------------------
// Asset readiness
// ---------------------------------------------------------------------------

/**
 * Forces every web font used by the card to finish loading before capture.
 * We both wait for the document's fonts to settle and explicitly `load()` each
 * family+weight+style actually used on the card.
 */
async function ensureFontsReady(node: HTMLElement) {
  const families = new Set<string>();
  const weights = new Set<string>();
  const styles = new Set<string>();

  for (const el of [node, ...node.querySelectorAll<HTMLElement>("*")]) {
    const cs = getComputedStyle(el);
    const familyList = cs.fontFamily || "";
    const weight = cs.fontWeight || "400";
    const style = cs.fontStyle || "normal";
    for (const part of familyList.split(",")) {
      const fam = normalizeFamily(part);
      if (fam && !isGenericFamily(fam)) {
        families.add(fam);
        weights.add(weight);
        styles.add(style);
      }
    }
  }

  const sample = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const pending: Promise<unknown>[] = [];
  for (const fam of families) {
    for (const weight of weights) {
      for (const style of styles) {
        pending.push(document.fonts.load(`${style} ${weight} 20px "${fam}"`, sample));
      }
    }
  }
  await Promise.allSettled(pending);
  if (document.fonts.status !== "loaded") {
    await document.fonts.ready;
  }
}

/** Waits until every raster image inside the card has finished loading. */
async function ensureImagesReady(node: HTMLElement) {
  const images = [...node.querySelectorAll<HTMLImageElement>("img")];
  await Promise.all(
    images.map((img) => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise<void>((resolve) => {
        const done = () => resolve();
        img.addEventListener("load", done, { once: true });
        img.addEventListener("error", done, { once: true });
        setTimeout(done, 5000);
      });
    })
  );
}

// ---------------------------------------------------------------------------
// Capture
// ---------------------------------------------------------------------------

/**
 * Captures a card element as a PNG data URL at full resolution. Printed CR80
 * cards have square corners, so the on-screen border radius is flattened for
 * the capture and restored afterwards. Fonts (embedded as data URLs) and
 * images are awaited first so the capture is pixel-identical to the preview.
 */
async function captureCardNode(elementId: string, pixelRatio: number): Promise<string> {
  const node = document.getElementById(elementId);
  if (!node) throw new Error(`Card element #${elementId} not found`);

  await ensureFontsReady(node);
  await ensureImagesReady(node);
  const fontEmbedCSS = await buildFontEmbedCSS(node);
  if (fontEmbedCSS) {
    console.log(`[id-card-export] capture #${elementId} will embed ${fontEmbedCSS.length} bytes of fonts`);
  } else {
    console.warn(`[id-card-export] capture #${elementId}: no fonts embedded — export may use fallback fonts`);
  }

  const originalRadius = node.style.borderRadius;
  node.style.borderRadius = "0";
  try {
    return await toPng(node, {
      pixelRatio,
      quality: 1,
      cacheBust: true,
      filter: EXPORT_FILTER,
      fontEmbedCSS: fontEmbedCSS || undefined,
    });
  } finally {
    node.style.borderRadius = originalRadius;
  }
}

function triggerDownload(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load captured card image"));
    img.src = src;
  });
}

/**
 * Downloads a high-resolution PNG of the card element (≈300 DPI at 3× pixel
 * ratio). Throws when the element is not in the DOM.
 */
export async function downloadCardAsPng(
  elementId: string,
  filename = "rcy-id-card.png",
  pixelRatio = 3
): Promise<string> {
  const dataUrl = await captureCardNode(elementId, pixelRatio);
  triggerDownload(dataUrl, filename);
  return dataUrl;
}

/**
 * Downloads a single PNG containing several card sides (front on top, back
 * below, etc.) stacked vertically at full resolution — the on-screen layout
 * mirrored in the exported file.
 */
export async function downloadCardsAsPng(
  elementIds: string[],
  filename = "rcy-id-card.png",
  pixelRatio = 3
): Promise<string> {
  if (elementIds.length === 0) throw new Error("No card elements to export");

  const urls = await Promise.all(elementIds.map((id) => captureCardNode(id, pixelRatio)));
  const images = await Promise.all(urls.map(loadImage));

  const GAP = 24;
  const width = Math.max(...images.map((img) => img.width));
  const height =
    images.reduce((sum, img) => sum + img.height, 0) + GAP * (images.length - 1);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  let y = 0;
  for (const img of images) {
    ctx.drawImage(img, Math.round((width - img.width) / 2), y);
    y += img.height + GAP;
  }

  const dataUrl = canvas.toDataURL("image/png");
  triggerDownload(dataUrl, filename);
  return dataUrl;
}

/**
 * Renders the card(s) into a standard CR80 ID card PDF (85.6 × 53.98 mm).
 * Accepts a single element id or several — multiple sides become multiple
 * pages (front on page 1, back on page 2, …).
 */
export async function downloadCardAsPdf(
  elementId: string | string[],
  filename = "rcy-id-card.pdf",
  orientation: "landscape" | "portrait" = "landscape"
): Promise<void> {
  const ids = Array.isArray(elementId) ? elementId : [elementId];
  if (ids.length === 0) throw new Error("No card elements to export");

  const urls = await Promise.all(ids.map((id) => captureCardNode(id, 3)));

  const cardWidth = orientation === "landscape" ? 85.6 : 53.98;
  const cardHeight = orientation === "landscape" ? 53.98 : 85.6;

  const pdf = new jsPDF({
    orientation,
    unit: "mm",
    format: [cardWidth, cardHeight],
  });

  urls.forEach((dataUrl, i) => {
    if (i > 0) pdf.addPage([cardWidth, cardHeight], orientation);
    pdf.addImage(dataUrl, "PNG", 0, 0, cardWidth, cardHeight, undefined, "FAST");
  });

  pdf.save(filename);
}
