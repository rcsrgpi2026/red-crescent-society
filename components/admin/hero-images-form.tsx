"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Save, ImageIcon } from "lucide-react";
import { saveSettings } from "@/lib/admin-actions";
import { Button } from "@/components/ui";
import { ImageListUploadField } from "@/components/admin/image-list-upload-field";

interface HeroImagesFormProps {
  /** Newline-separated URLs already stored in settings. */
  defaultValue: string;
}

export function HeroImagesForm({ defaultValue }: HeroImagesFormProps) {
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    try {
      const fd = new FormData(e.currentTarget);
      const heroImages = String(fd.get("heroImages") ?? "").trim();
      const result = await saveSettings("homepage", { heroImages });
      if (result.success) {
        toast.success("Hero photos saved.");
      } else {
        toast.error(result.message ?? "Save failed.");
      }
    } catch (error) {
      console.error("saveSettings failed:", error);
      toast.error("Save failed — please refresh the page and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-line bg-white p-6">
      <h2 className="flex items-center gap-2 font-semibold text-foreground">
        <ImageIcon className="h-4 w-4 text-brand" aria-hidden />
        Hero photo carousel
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Photos that rotate in the homepage hero background. Leave empty to use the newest
        activity and album photos automatically. Order matters — the first photo shows on load.
      </p>
      <div className="mt-5">
        <ImageListUploadField
          name="heroImages"
          label="Carousel photos"
          defaultValue={defaultValue}
          folder="hero"
          uploadLabel="Upload photos"
          description="Upload multiple photos at once, or paste image URLs — one per line. PNG, JPG, WebP, GIF or AVIF, max 5 MB each."
        />
      </div>
      <div className="mt-5">
        <Button type="submit" disabled={busy} size="sm">
          {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden /> : <Save className="mr-1.5 h-4 w-4" aria-hidden />}
          Save
        </Button>
      </div>
    </form>
  );
}
