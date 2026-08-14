"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Loader2, UploadCloud, Image as ImageIcon, X } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { Input, Label } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  ACCEPTED_IMAGE_LABEL,
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_SIZE,
  uploadImageToStorage,
} from "@/lib/upload";

interface ImageUploadFieldProps {
  /** Form field name that receives the final image URL. */
  name: string;
  label: string;
  defaultValue?: string | null;
  /** Folder inside the "images" bucket, e.g. "founders". */
  folder?: string;
  description?: string;
}

export function ImageUploadField({
  name,
  label,
  defaultValue,
  folder = "uploads",
  description,
}: ImageUploadFieldProps) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error(`Please choose an image file (${ACCEPTED_IMAGE_LABEL}).`);
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("Image must be 5 MB or smaller.");
      return;
    }
    if (!isSupabaseConfigured) {
      toast.error("Storage is not configured yet — paste an image URL instead.");
      return;
    }

    setUploading(true);
    try {
      const publicUrl = await uploadImageToStorage(file, folder);
      setUrl(publicUrl);
      toast.success("Image uploaded.");
    } catch (err) {
      const message =
        err instanceof Error && /bucket|not found|does not exist/i.test(err.message)
          ? `Storage bucket "images" does not exist. Create it in Supabase (see README) or paste a URL instead.`
          : "Upload failed — paste the image URL instead.";
      toast.error(message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <Label htmlFor={`${name}-url`}>{label}</Label>
      <input type="hidden" name={name} value={url} />
      <div className="mt-1.5 flex items-start gap-3">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-line bg-mist">
          {url ? (
            <>
              <Image src={url} alt="" fill sizes="64px" className="object-cover" />
              <button
                type="button"
                onClick={() => setUrl("")}
                className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white transition-colors hover:bg-black/80"
                aria-label="Remove image"
              >
                <X className="h-3 w-3" aria-hidden />
              </button>
            </>
          ) : (
            <span className="flex h-full w-full items-center justify-center text-muted-foreground">
              <ImageIcon className="h-5 w-5" aria-hidden />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <Input
            id={`${name}-url`}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste an image URL, or upload one below"
            className="h-9"
          />
          {isSupabaseConfigured && (
            <div className="flex flex-wrap items-center gap-2">
              <label
                htmlFor={`${name}-file`}
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
                {uploading ? "Uploading…" : "Upload image"}
              </label>
              <input
                id={`${name}-file`}
                type="file"
                accept={ACCEPTED_IMAGE_TYPES.join(",")}
                onChange={handleFile}
                disabled={uploading}
                className="sr-only"
              />
              <span className="text-xs text-muted-foreground">
                {ACCEPTED_IMAGE_LABEL} · max 5 MB
              </span>
            </div>
          )}
        </div>
      </div>
      {description && <p className="mt-1.5 text-xs text-muted-foreground">{description}</p>}
    </div>
  );
}
