"use client";

import { useRef, useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Move } from "lucide-react";

const VIEWPORT_W = 320;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

const CHECKERBOARD = {
  backgroundImage:
    "conic-gradient(#e2e8e5 0 25%, #f6f8f7 0 50%, #e2e8e5 0 75%, #f6f8f7 0)",
  backgroundSize: "16px 16px",
};

interface PhotoCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The image file picked by the user. */
  file: File | null;
  /** Called with the cropped blob when the user confirms. */
  onSave: (blob: Blob) => Promise<void> | void;
  /** Width / height ratio of the crop box, e.g. 1 for square, 4/3 for landscape. */
  aspectRatio?: number;
  /** Longest edge in pixels of the exported image. */
  exportSize?: number;
  /** WebP quality (0–1) of the exported image. */
  quality?: number;
  title?: string;
  description?: string;
}

/**
 * Generic pan/zoom photo cropper (same UX as the logo cropper) that exports
 * the visible box at a configurable aspect ratio — used by every admin photo
 * upload (community members, team, founders, gallery, activities, hero…).
 */
export function PhotoCropDialog({
  open,
  onOpenChange,
  file,
  onSave,
  aspectRatio = 1,
  exportSize = 1024,
  quality = 0.92,
  title = "Crop photo",
  description = "Drag to position the photo and use the slider to zoom. The visible area is what gets saved.",
}: PhotoCropDialogProps) {
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const drag = useRef<{
    id: number;
    startX: number;
    startY: number;
    ox: number;
    oy: number;
  } | null>(null);

  const ratio = aspectRatio > 0 ? aspectRatio : 1;
  const viewH = Math.round(VIEWPORT_W / ratio);
  const exportW = exportSize;
  const exportH = Math.max(1, Math.round(exportSize / ratio));

  // Load the picked file into an <img> so we can measure and export it.
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const el = new Image();
    el.onload = () => {
      setImage(el);
      setSourceUrl(url);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
    el.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const iw = image?.naturalWidth ?? 0;
  const ih = image?.naturalHeight ?? 0;
  // Cover the crop box: the image always fills it in both dimensions.
  const baseScale =
    iw > 0 && ih > 0 ? Math.max(VIEWPORT_W / iw, viewH / ih) : 1;
  const dispW = iw * baseScale * zoom;
  const dispH = ih * baseScale * zoom;
  const maxX = Math.max(0, (dispW - VIEWPORT_W) / 2);
  const maxY = Math.max(0, (dispH - viewH) / 2);

  function clamp(p: { x: number; y: number }) {
    return {
      x: Math.min(maxX, Math.max(-maxX, p.x)),
      y: Math.min(maxY, Math.max(-maxY, p.y)),
    };
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    drag.current = {
      id: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      ox: offset.x,
      oy: offset.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.startX;
    const dy = e.clientY - drag.current.startY;
    setOffset(clamp({ x: drag.current.ox + dx, y: drag.current.oy + dy }));
  }

  function endDrag() {
    drag.current = null;
  }

  function onZoomChange(v: number) {
    setZoom(v);
    const scale = baseScale * v;
    const mw = Math.max(0, (iw * scale - VIEWPORT_W) / 2);
    const mh = Math.max(0, (ih * scale - viewH) / 2);
    setOffset((prev) => ({
      x: Math.min(mw, Math.max(-mw, prev.x)),
      y: Math.min(mh, Math.max(-mh, prev.y)),
    }));
  }

  async function handleSave() {
    if (!image) return;
    setSaving(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = exportW;
      canvas.height = exportH;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas 2D is not supported");

      const scale = baseScale * zoom;
      // Source rect (image pixels) currently visible inside the crop box.
      const sx = (dispW / 2 - VIEWPORT_W / 2 - offset.x) / scale;
      const sy = (dispH / 2 - viewH / 2 - offset.y) / scale;
      const sw = VIEWPORT_W / scale;
      const sh = viewH / scale;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(image, sx, sy, sw, sh, 0, 0, exportW, exportH);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/webp", quality)
      );
      if (!blob) throw new Error("Could not encode the cropped photo");

      // The parent decides when to close — single-photo fields close right
      // after saving, multi-photo fields advance to the next file in the queue.
      await onSave(blob);
    } catch {
      // onSave surfaces its own errors; encoding failures are silent.
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex justify-center">
          <div
            className="relative cursor-grab touch-none overflow-hidden rounded-xl active:cursor-grabbing"
            style={{ ...CHECKERBOARD, width: VIEWPORT_W, height: viewH }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            {sourceUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- custom pan/zoom preview; next/image can't position blob URLs with transforms
              <img
                src={sourceUrl}
                alt=""
                draggable={false}
                className="pointer-events-none absolute select-none"
                style={{
                  left: "50%",
                  top: "50%",
                  width: dispW,
                  height: dispH,
                  maxWidth: "none",
                  transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                Loading image…
              </div>
            )}
            <div className="pointer-events-none absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[11px] text-white">
              <Move className="h-3 w-3" aria-hidden />
              Drag to position
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-1">
          <span className="text-xs text-muted-foreground">Zoom</span>
          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.05}
            value={zoom}
            onChange={(e) => onZoomChange(Number(e.target.value))}
            className="flex-1 accent-brand"
            aria-label="Zoom"
          />
          <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
            {Math.round(zoom * 100)}%
          </span>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={saving}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSave} disabled={saving || !image}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
            {saving ? "Saving…" : "Crop & upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
