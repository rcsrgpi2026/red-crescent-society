"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, UploadCloud } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { Label } from "@/components/ui";
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
}

export function ImageListUploadField({
  name,
  label,
  defaultValue,
  folder = "uploads",
  description,
  uploadLabel = "Upload images",
}: ImageListUploadFieldProps) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [uploadTotal, setUploadTotal] = useState(0);

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

    const uploaded: string[] = [];
    for (const file of valid) {
      try {
        const publicUrl = await uploadImageToStorage(file, folder);
        uploaded.push(publicUrl);
      } catch {
        // Keep uploading the remaining files; report the total below.
      }
      setUploadedCount((c) => c + 1);
    }

    setUploading(false);
    if (uploaded.length > 0) {
      const trimmed = value.trim();
      setValue(trimmed ? `${trimmed}\n${uploaded.join("\n")}` : uploaded.join("\n"));
      toast.success(`${uploaded.length} image${uploaded.length > 1 ? "s" : ""} added.`);
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
              ? `Uploading ${uploadedCount} of ${uploadTotal}…`
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
    </div>
  );
}
