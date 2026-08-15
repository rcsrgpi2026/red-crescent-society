"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, UploadCloud } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { Label } from "@/components/ui";
import { cn } from "@/lib/utils";
import { PhotoCropDialog } from "@/components/admin/photo-crop-dialog";
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
  /** Width / height ratio of the crop box (default 4/3 = landscape photos). */
  aspectRatio?: number;
}

export function ImageListUploadField({
  name,
  label,
  defaultValue,
  folder = "uploads",
  description,
  uploadLabel = "Upload images",
  aspectRatio = 4 / 3,
}: ImageListUploadFieldProps) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [uploadTotal, setUploadTotal] = useState(0);
  // Queue of files waiting to be cropped (one at a time) then uploaded.
  const [queue, setQueue] = useState<File[]>([]);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const doneRef = useRef<string[]>([]);

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
      toast.error(`${skipped} file(s) skipped — ${ACCEPTED_IMAGE_LABEL}, max 5 MB each.`);
    }
    if (valid.length === 0) return;

    setUploading(true);
    setUploadedCount(0);
    setUploadTotal(valid.length);
    doneRef.current = [];
    setQueue(valid);
    setCropFile(valid[0]);
  }

  function cancelQueue() {
    doneRef.current = [];
    setQueue([]);
    setCropFile(null);
    setUploading(false);
    setUploadTotal(0);
    toast.error("Upload cancelled.");
  }

  async function handleCropped(blob: Blob) {
    // Upload the cropped photo before moving on to the next file.
    try {
      const url = await uploadImageToStorage(
        new File([blob], "photo.webp", { type: blob.type }),
        folder
      );
      doneRef.current.push(url);
    } catch {
      // Keep going; the summary at the end reports failures.
    }
    setUploadedCount((c) => c + 1);

    const rest = queue.slice(1);
    setQueue(rest);
    if (rest.length > 0) {
      setCropFile(rest[0]);
      return;
    }

    // Queue finished — append everything that uploaded.
    setCropFile(null);
    setUploading(false);
    setUploadTotal(0);
    const urls = doneRef.current;
    doneRef.current = [];
    if (urls.length > 0) {
      const trimmed = value.trim();
      setValue(trimmed ? `${trimmed}\n${urls.join("\n")}` : urls.join("\n"));
      toast.success(`${urls.length} image${urls.length > 1 ? "s" : ""} added.`);
    } else {
      toast.error("Upload failed — paste image URLs instead.");
    }
  }

  return (
    <div>
      <Label htmlFor={`${name}-list`}>{label}</Label>
      <textarea
        id={`${name}-list`}
        name={name}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={5}
        placeholder={"https://…\nhttps://…"}
        className="mt-1.5 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
      />
      {isSupabaseConfigured && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <label
            htmlFor={`${name}-files`}
            className={cn(
              "inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-mist",
              uploading && "pointer-events-none opacity-60"
            )}
          >
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <UploadCloud className="h-3.5 w-3.5" aria-hidden />
            )}
            {uploading
              ? `Cropping & uploading ${uploadedCount + 1} of ${uploadTotal}…`
              : uploadLabel}
          </label>
          <input
            id={`${name}-files`}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(",")}
            multiple
            onChange={handleFiles}
            disabled={uploading}
            className="sr-only"
          />
          <span className="text-xs text-muted-foreground">
            {ACCEPTED_IMAGE_LABEL} · max 5 MB each
          </span>
        </div>
      )}
      {description && <p className="mt-1.5 text-xs text-muted-foreground">{description}</p>}

      <PhotoCropDialog
        open={!!cropFile}
        onOpenChange={(open) => {
          if (!open) cancelQueue();
        }}
        file={cropFile}
        onSave={handleCropped}
        aspectRatio={aspectRatio}
        title="Crop photo"
        description={
          uploadTotal > 1
            ? `Photo ${uploadedCount + 1} of ${uploadTotal}. Drag to position and zoom, then save.`
            : "Drag to position the photo and use the slider to zoom. The visible area is what gets saved."
        }
      />
    </div>
  );
}
