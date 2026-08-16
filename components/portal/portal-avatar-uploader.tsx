"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Camera, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import {
  uploadImageToStorage,
  ACCEPTED_IMAGE_LABEL,
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_SIZE,
} from "@/lib/upload";
import { PhotoCropDialog } from "@/components/admin/photo-crop-dialog";
import { Button } from "@/components/ui/button";

export function PortalAvatarUploader({
  initialPhotoUrl,
  name,
  folder,
  onPhotoSaved,
}: {
  initialPhotoUrl?: string | null;
  name: string;
  folder: "students" | "volunteers";
  onPhotoSaved: (url: string) => Promise<{ success: boolean; message?: string }>;
}) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(initialPhotoUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Allow picking the same file again after an error or cancel.
    e.target.value = "";
    setFeedback(null);

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setFeedback({
        type: "error",
        message: `Invalid file type (${file.type || "unknown"}). Allowed formats: ${ACCEPTED_IMAGE_LABEL}.`,
      });
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setFeedback({
        type: "error",
        message: `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is 5 MB.`,
      });
      return;
    }

    // Open the crop dialog — the cropped photo is what gets uploaded.
    setCropFile(file);
  }

  async function handleCropped(blob: Blob) {
    setUploading(true);
    try {
      // 1. Upload the cropped photo to the Supabase images bucket
      const uploadedUrl = await uploadImageToStorage(
        new File([blob], "profile.webp", { type: blob.type }),
        folder
      );

      // 2. Persist to database
      const result = await onPhotoSaved(uploadedUrl);
      if (!result.success) {
        throw new Error(result.message || "Failed to update profile picture in database.");
      }

      setPhotoUrl(uploadedUrl);
      setFeedback({
        type: "success",
        message: "Profile picture updated successfully!",
      });
    } catch (err) {
      console.error("Avatar upload error:", err);
      setFeedback({
        type: "error",
        message:
          err instanceof Error ? err.message : "Could not upload image. Please try again.",
      });
    } finally {
      setUploading(false);
      setCropFile(null);
    }
  }

  return (
    <div className="flex flex-col items-center sm:flex-row sm:items-start gap-5">
      <div className="relative group">
        <div className="relative h-28 w-28 sm:h-32 sm:w-32 overflow-hidden rounded-3xl border-2 border-line bg-brand-soft shadow-sm transition-all group-hover:border-brand/50">
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt={`${name}'s profile picture`}
              fill
              sizes="128px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-brand/40">
              {name.charAt(0).toUpperCase()}
            </div>
          )}

          {uploading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider">
                Uploading…
              </span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white shadow-md transition-transform hover:scale-105 hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:opacity-50"
          aria-label="Upload new photo"
        >
          <Camera className="h-4 w-4" />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
          onChange={handleFileSelected}
          className="sr-only"
        />
      </div>

      <div className="flex-1 text-center sm:text-left space-y-1.5">
        <h3 className="text-base font-bold text-foreground">{name}</h3>
        <p className="text-xs text-muted-foreground">
          Recommended: square photo (e.g. 500×500 px). Max 5 MB ({ACCEPTED_IMAGE_LABEL}).
        </p>

        <div className="pt-2 flex flex-wrap justify-center sm:justify-start gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="text-xs h-8"
          >
            {uploading ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Camera className="mr-1.5 h-3.5 w-3.5" />
            )}
            {photoUrl ? "Change Photo" : "Upload Photo"}
          </Button>
        </div>

        {feedback && (
          <div
            className={`mt-2 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-crescent-soft text-crescent border border-crescent/30"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}
      </div>

      <PhotoCropDialog
        open={!!cropFile}
        onOpenChange={(open) => {
          if (!open) setCropFile(null);
        }}
        file={cropFile}
        onSave={handleCropped}
        aspectRatio={1}
        exportSize={800}
        title="Crop profile picture"
      />
    </div>
  );
}
