"use client";

import { useRef, useState } from "react";
import { CreditCard, ImageDown, FileDown, Loader2, Printer, Camera } from "lucide-react";
import { toast } from "sonner";
import type { CardConfig, CardSide } from "@/types/id-card";
import { downloadCardAsPng, downloadCardsAsPng, downloadCardAsPdf } from "@/lib/id-card/export";
import {
  uploadImageToStorage,
  ACCEPTED_IMAGE_LABEL,
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_SIZE,
} from "@/lib/upload";
import { PhotoCropDialog } from "@/components/admin/photo-crop-dialog";
import { ScaledCard } from "@/components/id-card/scaled-card";
import { CardFonts } from "@/components/id-card/card-fonts";
import { cn } from "@/lib/utils";

interface MemberCardPanelProps {
  config: CardConfig;
  title?: string;
  description?: string;
  /** Unique element id — lets several cards coexist on one page. */
  cardId?: string;
  /** When provided, shows a "Change photo" control that crops + uploads the card photo. */
  onPhotoSaved?: (url: string) => Promise<{ success: boolean; message?: string }>;
  /** Storage folder for the uploaded card photo. */
  photoFolder?: "students" | "volunteers";
  /**
   * When true, shows front and back side-by-side stacked vertically and the
   * PNG / PDF exports include both sides (combined PNG, two-page PDF).
   */
  showBothSides?: boolean;
}

/**
 * The member-facing ID card panel: shows the cardholder's own membership card
 * (front and back) at full print resolution, with one-click PNG / PDF export.
 */
export function MemberCardPanel({
  config,
  title = "Membership ID Card",
  description = "Your official Red Crescent Youth membership card. Download it or take a screenshot to keep it on your phone.",
  cardId = "member-id-card",
  onPhotoSaved,
  photoFolder,
  showBothSides = false,
}: MemberCardPanelProps) {
  const [side, setSide] = useState<CardSide>("front");
  const [exporting, setExporting] = useState<"png" | "pdf" | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const memberName = config.member.name || "member";
  const slug = memberName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const canEditPhoto = Boolean(onPhotoSaved && photoFolder);
  // In two-sided mode each side is its own element so exports can capture both.
  const frontCardId = showBothSides ? `${cardId}-front` : cardId;
  const backCardId = `${cardId}-back`;

  function handlePhotoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error(`Invalid file type. Allowed formats: ${ACCEPTED_IMAGE_LABEL}.`);
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error(`File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is 5 MB.`);
      return;
    }
    setCropFile(file);
  }

  async function handleCropped(blob: Blob) {
    if (!onPhotoSaved || !photoFolder) return;
    setPhotoUploading(true);
    try {
      const uploadedUrl = await uploadImageToStorage(
        new File([blob], "card-photo.webp", { type: blob.type }),
        photoFolder
      );
      const result = await onPhotoSaved(uploadedUrl);
      if (!result.success) {
        throw new Error(result.message || "Failed to update the card photo.");
      }
      toast.success("Card photo updated!");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Could not update the card photo.");
    } finally {
      setPhotoUploading(false);
      setCropFile(null);
    }
  }

  async function exportPng() {
    setExporting("png");
    try {
      if (showBothSides) {
        await downloadCardsAsPng(
          [frontCardId, backCardId],
          `rcy-id-card-${slug || "member"}.png`
        );
      } else {
        await downloadCardAsPng(cardId, `rcy-id-card-${slug || "member"}.png`);
      }
      toast.success(
        showBothSides
          ? "ID card downloaded as PNG (front + back)."
          : "ID card downloaded as PNG."
      );
    } catch (err) {
      console.error(err);
      toast.error("Could not export the card — please try again.");
    } finally {
      setExporting(null);
    }
  }

  async function exportPdf() {
    setExporting("pdf");
    try {
      await downloadCardAsPdf(
        showBothSides ? [frontCardId, backCardId] : cardId,
        `rcy-id-card-${slug || "member"}.pdf`,
        config.design.orientation
      );
      toast.success(
        showBothSides
          ? "ID card downloaded as PDF (CR80, front + back)."
          : "ID card downloaded as PDF (CR80)."
      );
    } catch (err) {
      console.error(err);
      toast.error("Could not export the card — please try again.");
    } finally {
      setExporting(null);
    }
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-line bg-white shadow-sm">
      <CardFonts />
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-6 py-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-soft text-brand-dark">
            <CreditCard className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h2 className="font-bold text-foreground">{title}</h2>
            <p className="mt-0.5 max-w-xl text-xs leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!showBothSides && (
            <button
              type="button"
              onClick={() => setSide(side === "front" ? "back" : "front")}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-brand/40 hover:text-brand-dark"
            >
              <CreditCard className="h-3.5 w-3.5" aria-hidden />
              {side === "front" ? "View back" : "View front"}
            </button>
          )}
          {canEditPhoto && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={photoUploading}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-brand/40 hover:text-brand-dark disabled:opacity-60"
              title="Upload and crop your photo shown on the card"
            >
              {photoUploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              ) : (
                <Camera className="h-3.5 w-3.5" aria-hidden />
              )}
              Change photo
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(",")}
            onChange={handlePhotoFile}
            className="sr-only"
          />
          <button
            type="button"
            onClick={exportPng}
            disabled={exporting !== null}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-brand/40 hover:text-brand-dark disabled:opacity-60"
          >
            {exporting === "png" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <ImageDown className="h-3.5 w-3.5" aria-hidden />
            )}
            PNG
          </button>
          <button
            type="button"
            onClick={exportPdf}
            disabled={exporting !== null}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-brand/40 hover:text-brand-dark disabled:opacity-60"
          >
            {exporting === "pdf" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <FileDown className="h-3.5 w-3.5" aria-hidden />
            )}
            PDF
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-brand/40 hover:text-brand-dark"
          >
            <Printer className="h-3.5 w-3.5" aria-hidden />
            Print
          </button>
        </div>
      </div>

      <div
        className={cn(
          "flex justify-center overflow-hidden bg-gradient-to-br from-mist to-white px-3 py-6",
          !showBothSides && side === "back" && "bg-slate-900/95"
        )}
      >
        {showBothSides ? (
          <div className="flex w-full flex-col items-center gap-5">
            <ScaledCard
              config={config}
              side="front"
              id={frontCardId}
              className="rounded-2xl shadow-2xl shadow-black/10"
            />
            <ScaledCard
              config={config}
              side="back"
              id={backCardId}
              className="rounded-2xl shadow-2xl shadow-black/10"
            />
          </div>
        ) : (
          <ScaledCard
            config={config}
            side={side}
            id={cardId}
            className="rounded-2xl shadow-2xl shadow-black/10"
          />
        )}
      </div>

      <p className="border-t border-line bg-mist/40 px-6 py-3 text-center text-[11px] text-muted-foreground">
        Standard CR80 card · {config.design.width} × {config.design.height}px · 300 DPI ready — the
        card design is maintained by society administrators.
      </p>

      <PhotoCropDialog
        open={!!cropFile}
        onOpenChange={(open) => {
          if (!open) setCropFile(null);
        }}
        file={cropFile}
        onSave={handleCropped}
        aspectRatio={1}
        exportSize={800}
        title="Crop card photo"
        description="Drag to position the photo and use the slider to zoom. The visible area is what appears on your ID card."
      />
    </section>
  );
}
