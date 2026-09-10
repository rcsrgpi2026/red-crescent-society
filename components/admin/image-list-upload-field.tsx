"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  UploadCloud,
  Loader2,
  Trash2,
  Star,
  Plus,
  ArrowLeft,
  ArrowRight,
  Link as LinkIcon,
  Image as ImageIcon,
  Check,
} from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { Label, Input, Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  ACCEPTED_IMAGE_LABEL,
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_SIZE,
  uploadImageToStorage,
} from "@/lib/upload";

interface ImageListUploadFieldProps {
  /** Form field name that receives the newline-separated image URLs. */
  name: string;
  label: string;
  /** Newline-separated URLs to pre-fill (e.g. existing images). */
  defaultValue?: string;
  /** Folder inside the "images" bucket. */
  folder?: string;
  description?: string;
  uploadLabel?: string;
  aspectRatio?: number;
  exportSize?: number;
  quality?: number;
  skipCompression?: boolean;
}

export function ImageListUploadField({
  name,
  label,
  defaultValue,
  folder = "activities",
  description,
  uploadLabel = "Upload photos",
  skipCompression = false,
}: ImageListUploadFieldProps) {
  // Parse initial URLs
  const initialUrls = (defaultValue ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const [images, setImages] = useState<string[]>(initialUrls);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [urlInput, setUrlInput] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [showRawTextarea, setShowRawTextarea] = useState(false);

  // Keep hidden input in sync with newline-separated URLs
  const hiddenValue = images.join("\n");

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    if (!isSupabaseConfigured) {
      toast.error("Storage is not configured yet — paste image URLs instead.");
      return;
    }

    const valid = files.filter(
      (f) => ACCEPTED_IMAGE_TYPES.includes(f.type) && f.size <= MAX_IMAGE_SIZE
    );
    const skipped = files.length - valid.length;
    if (skipped > 0) {
      toast.error(`${skipped} file(s) skipped — must be ${ACCEPTED_IMAGE_LABEL}, max 5 MB each.`);
    }
    if (valid.length === 0) return;

    setUploading(true);
    setUploadProgress({ current: 0, total: valid.length });

    const newUploadedUrls: string[] = [];

    for (let i = 0; i < valid.length; i++) {
      setUploadProgress({ current: i + 1, total: valid.length });
      try {
        const url = await uploadImageToStorage(valid[i], folder, {
          compress: !skipCompression,
        });
        if (url) {
          newUploadedUrls.push(url);
        }
      } catch (err) {
        console.error("Upload error for file:", valid[i].name, err);
      }
    }

    setUploading(false);
    setUploadProgress({ current: 0, total: 0 });

    if (newUploadedUrls.length > 0) {
      setImages((prev) => [...prev, ...newUploadedUrls]);
      toast.success(`${newUploadedUrls.length} image${newUploadedUrls.length > 1 ? "s" : ""} added.`);
    } else {
      toast.error("Failed to upload images. Please try again.");
    }
  }

  function handleAddUrl() {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://") && !trimmed.startsWith("/")) {
      toast.error("Please enter a valid image URL starting with https://");
      return;
    }
    setImages((prev) => [...prev, trimmed]);
    setUrlInput("");
    toast.success("Image URL added.");
  }

  function handleRemove(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
    toast.success("Image removed.");
  }

  function handleMakeCover(index: number) {
    if (index === 0) return;
    setImages((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      return [item, ...copy];
    });
    toast.success("Set as cover photo.");
  }

  function handleMove(index: number, direction: "left" | "right") {
    const target = direction === "left" ? index - 1 : index + 1;
    if (target < 0 || target >= images.length) return;
    setImages((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[target];
      copy[target] = temp;
      return copy;
    });
  }

  return (
    <div className="space-y-2">
      {/* Hidden input to pass value in form submission */}
      <input type="hidden" name={name} value={hiddenValue} />

      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-foreground">
          {label} ({images.length})
        </Label>
        <button
          type="button"
          onClick={() => setShowRawTextarea((prev) => !prev)}
          className="text-[11px] text-muted-foreground hover:text-foreground hover:underline"
        >
          {showRawTextarea ? "Hide raw URLs" : "Edit as text/URLs"}
        </button>
      </div>

      {/* Raw Textarea toggle for power users */}
      {showRawTextarea && (
        <textarea
          value={hiddenValue}
          onChange={(e) => {
            const next = e.target.value
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean);
            setImages(next);
          }}
          rows={4}
          placeholder="https://...&#10;https://..."
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 font-mono text-xs"
        />
      )}

      {/* Visual Image Grid */}
      {images.length > 0 ? (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
          {images.map((url, i) => (
            <div
              key={`${url}-${i}`}
              className={cn(
                "group relative aspect-[16/10] overflow-hidden rounded-xl border bg-mist transition-all",
                i === 0
                  ? "border-amber-400 ring-2 ring-amber-400/30"
                  : "border-line hover:border-brand/50"
              )}
            >
              <Image
                src={url}
                alt={`Photo ${i + 1}`}
                fill
                sizes="(max-width: 640px) 50vw, 25vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                unoptimized={url.startsWith("http://") || url.includes("supabase.co")}
              />

              {/* Badges */}
              <div className="absolute left-1.5 top-1.5 z-10 flex items-center gap-1">
                {i === 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/90 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-xs backdrop-blur-xs">
                    <Star className="h-2.5 w-2.5 fill-current" />
                    Cover
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-xs">
                    #{i + 1}
                  </span>
                )}
              </div>

              {/* Action Buttons overlay */}
              <div className="absolute inset-0 z-20 flex flex-col justify-between bg-black/40 p-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <div className="flex items-center justify-end gap-1">
                  {i !== 0 && (
                    <button
                      type="button"
                      onClick={() => handleMakeCover(i)}
                      className="rounded bg-black/70 p-1 text-amber-300 hover:bg-amber-500 hover:text-white transition-colors"
                      title="Set as Cover Photo"
                    >
                      <Star className="h-3 w-3" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemove(i)}
                    className="rounded bg-black/70 p-1 text-red-300 hover:bg-red-600 hover:text-white transition-colors"
                    title="Remove Photo"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  {i > 0 ? (
                    <button
                      type="button"
                      onClick={() => handleMove(i, "left")}
                      className="rounded bg-black/70 p-1 text-white hover:bg-white hover:text-black transition-colors"
                      title="Move Left"
                    >
                      <ArrowLeft className="h-3 w-3" />
                    </button>
                  ) : (
                    <span />
                  )}
                  {i < images.length - 1 && (
                    <button
                      type="button"
                      onClick={() => handleMove(i, "right")}
                      className="rounded bg-black/70 p-1 text-white hover:bg-white hover:text-black transition-colors"
                      title="Move Right"
                    >
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty Dropzone preview */
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-mist/40 p-6 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-brand">
            <ImageIcon className="h-5 w-5" />
          </div>
          <p className="mt-2 text-xs font-semibold text-foreground">No photos added yet</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Upload multiple photos at once. The 1st photo will be the main cover.
          </p>
        </div>
      )}

      {/* Upload Controls */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {isSupabaseConfigured && (
          <label
            htmlFor={`${name}-files`}
            className={cn(
              "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-brand/30 bg-brand-soft/60 px-3 py-1.5 text-xs font-semibold text-brand-dark transition-colors hover:bg-brand-soft hover:border-brand/60 shadow-xs",
              uploading && "pointer-events-none opacity-60"
            )}
          >
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <UploadCloud className="h-3.5 w-3.5" aria-hidden />
            )}
            {uploading
              ? `Uploading ${uploadProgress.current} of ${uploadProgress.total}…`
              : uploadLabel}
            <input
              id={`${name}-files`}
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(",")}
              multiple
              onChange={handleFiles}
              disabled={uploading}
              className="sr-only"
            />
          </label>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowUrlInput((prev) => !prev)}
          className="h-8 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <LinkIcon className="mr-1.5 h-3 w-3" />
          {showUrlInput ? "Hide URL input" : "Add by URL"}
        </Button>

        <span className="text-[11px] text-muted-foreground">
          {ACCEPTED_IMAGE_LABEL} · max 5 MB each
        </span>
      </div>

      {/* URL Input Bar */}
      {showUrlInput && (
        <div className="flex items-center gap-2 pt-1">
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddUrl();
              }
            }}
            placeholder="Paste image URL (https://...)"
            className="h-8 text-xs"
          />
          <Button
            type="button"
            size="sm"
            onClick={handleAddUrl}
            className="h-8 shrink-0 bg-brand text-white hover:bg-brand-dark text-xs font-semibold"
          >
            <Plus className="mr-1 h-3 w-3" />
            Add URL
          </Button>
        </div>
      )}

      {description && (
        <p className="text-[11px] text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
