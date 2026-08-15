"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Camera, Loader2, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";
import { uploadImageToStorage, ACCEPTED_IMAGE_LABEL } from "@/lib/upload";
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFeedback(null);
    setUploading(true);

    // Show temporary local object URL preview
    const tempUrl = URL.createObjectURL(file);
    setPreviewUrl(tempUrl);

    try {
      // 1. Upload to Supabase images bucket
      const uploadedUrl = await uploadImageToStorage(file, folder, {
        maxDimension: 800,
        compress: true,
      });

      // 2. Persist to database
      const result = await onPhotoSaved(uploadedUrl);
      if (result.success) {
        setPhotoUrl(uploadedUrl);
        setFeedback({
          type: "success",
          message: "Profile picture updated successfully!",
        });
      } else {
        throw new Error(result.message || "Failed to update profile picture in database.");
      }
    } catch (err: any) {
      console.error("Avatar upload error:", err);
      setPreviewUrl(null);
      setFeedback({
        type: "error",
        message: err.message || "Could not upload image. Please try again.",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  const activeDisplayUrl = previewUrl || photoUrl;

  return (
    <div className="flex flex-col items-center sm:flex-row sm:items-start gap-5">
      <div className="relative group">
        <div className="relative h-28 w-28 sm:h-32 sm:w-32 overflow-hidden rounded-3xl border-2 border-line bg-brand-soft shadow-sm transition-all group-hover:border-brand/50">
          {activeDisplayUrl ? (
            <Image
              src={activeDisplayUrl}
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
            {activeDisplayUrl ? "Change Photo" : "Upload Photo"}
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
    </div>
  );
}
