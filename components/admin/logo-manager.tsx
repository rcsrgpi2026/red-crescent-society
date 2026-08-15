"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { ImagePlus, Loader2, Save, Trash2, UploadCloud } from "lucide-react";
import { saveSettings } from "@/lib/admin-actions";
import { Button } from "@/components/ui";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  ACCEPTED_LOGO_LABEL,
  ACCEPTED_LOGO_TYPES,
  MAX_IMAGE_SIZE,
  uploadLogoToStorage,
} from "@/lib/upload";
import { LogoCropDialog } from "@/components/admin/logo-crop-dialog";

interface LogoManagerProps {
  defaultValue?: Record<string, string>;
}

type Slot = "rpi" | "rcs";

const SLOTS: { key: Slot; label: string; hint: string }[] = [
  {
    key: "rpi",
    label: "RPI logo",
    hint: "Rajshahi Polytechnic Institute logo — the secondary identity in the header.",
  },
  {
    key: "rcs",
    label: "Red Crescent Society logo",
    hint: "Used across the header, footer, admin panel and portals.",
  },
];

export function LogoManager({ defaultValue }: LogoManagerProps) {
  const [logos, setLogos] = useState<Record<Slot, string>>({
    rpi: defaultValue?.rpi ?? "",
    rcs: defaultValue?.rcs ?? "",
  });
  const [pending, setPending] = useState<{ slot: Slot; file: File } | null>(null);
  const [saving, setSaving] = useState(false);

  function pickFile(slot: Slot, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!ACCEPTED_LOGO_TYPES.includes(file.type)) {
      toast.error(`Please choose a logo image (${ACCEPTED_LOGO_LABEL}).`);
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("Logo must be 5 MB or smaller.");
      return;
    }
    setPending({ slot, file });
  }

  async function handleCropped(blob: Blob) {
    if (!pending) return;
    const { slot } = pending;
    try {
      const url = await uploadLogoToStorage(
        new File([blob], "logo.webp", { type: blob.type }),
        slot
      );
      setLogos((prev) => ({ ...prev, [slot]: url }));
      toast.success("Logo cropped. Click “Save logos” to apply it to the site.");
    } catch {
      toast.error("Logo upload failed — please try again.");
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const result = await saveSettings("logos", { rpi: logos.rpi, rcs: logos.rcs });
      if (result.success) {
        toast.success("Logos saved. They are now live on the site.");
      } else {
        toast.error(result.message ?? "Save failed.");
      }
    } catch (error) {
      console.error("saveSettings failed:", error);
      toast.error("Save failed — please refresh the page and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSave();
      }}
      className="rounded-2xl border border-line bg-white p-6"
    >
      <h2 className="flex items-center gap-2 font-semibold text-foreground">
        <ImagePlus className="h-4 w-4 text-brand" aria-hidden />
        Site logos
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Upload the official RPI and Red Crescent Society logos. Each logo is
        cropped to a square and compressed automatically before saving.
      </p>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        {SLOTS.map((slot) => (
          <div key={slot.key} className="rounded-xl border border-line bg-mist/50 p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-white p-2">
                {logos[slot.key] ? (
                  <Image
                    src={logos[slot.key]}
                    alt=""
                    width={72}
                    height={72}
                    className="h-auto w-full object-contain"
                  />
                ) : (
                  <span className="text-center text-[11px] leading-tight text-muted-foreground">
                    No logo set
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground">{slot.label}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {slot.hint}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <label
                htmlFor={`logo-file-${slot.key}`}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-mist"
              >
                <UploadCloud className="h-3.5 w-3.5" aria-hidden />
                {logos[slot.key] ? "Change & crop" : "Upload & crop"}
              </label>
              <input
                id={`logo-file-${slot.key}`}
                type="file"
                accept={ACCEPTED_LOGO_TYPES.join(",")}
                onChange={(e) => pickFile(slot.key, e)}
                className="sr-only"
              />
              {logos[slot.key] && (
                <button
                  type="button"
                  onClick={() => setLogos((prev) => ({ ...prev, [slot.key]: "" }))}
                  className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-crescent transition-colors hover:bg-crescent-soft"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-3">
        <Button type="submit" disabled={saving} size="sm">
          {saving ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Save className="mr-1.5 h-4 w-4" aria-hidden />
          )}
          Save logos
        </Button>
        {!isSupabaseConfigured && (
          <p className="text-xs text-muted-foreground">
            Storage is not configured — add your Supabase credentials to upload
            logos.
          </p>
        )}
      </div>

      <LogoCropDialog
        open={!!pending}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
        file={pending?.file ?? null}
        onSave={handleCropped}
      />
    </form>
  );
}
