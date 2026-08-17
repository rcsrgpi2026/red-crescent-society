import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

const EXPORT_FILTER = (domNode: HTMLElement) =>
  !domNode.classList?.contains("export-exclude");

/**
 * Captures a card element as a PNG data URL at full resolution. Printed CR80
 * cards have square corners, so the on-screen border radius is flattened for
 * the capture and restored afterwards.
 */
async function captureCardNode(elementId: string, pixelRatio: number): Promise<string> {
  const node = document.getElementById(elementId);
  if (!node) throw new Error(`Card element #${elementId} not found`);

  const originalRadius = node.style.borderRadius;
  node.style.borderRadius = "0";
  try {
    return await toPng(node, {
      pixelRatio,
      quality: 1,
      cacheBust: true,
      filter: EXPORT_FILTER,
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
