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
  Link as LinkIcon,
  Image as ImageIcon,
  ExternalLink,
  FileText,
  Paperclip,
} from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { Label, Input, Button } from "@/components/ui";
import {
  ACCEPTED_IMAGE_LABEL,
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_SIZE,
  uploadImageToStorage,
} from "@/lib/upload";

export interface AttachmentItem {
  id?: string;
  name?: string;
  url: string;
  type?: "image" | "link";
}

interface NoticeAttachmentsManagerProps {
  initialAttachments?: AttachmentItem[];
}

export function NoticeAttachmentsManager({
  initialAttachments = [],
}: NoticeAttachmentsManagerProps) {
  const [items, setItems] = useState<AttachmentItem[]>(() => {
    return initialAttachments.map((a, idx) => ({
      ...a,
      type: a.url.match(/\.(jpg|jpeg|png|webp|gif|svg|avif)$/i) || a.url.includes("images/notices")
        ? "image"
        : "link",
      name: a.name || (idx === 0 ? "Cover Photo" : `Attachment ${idx + 1}`),
    }));
  });

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

  // Upload handler for 1 or more images at once
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    if (!isSupabaseConfigured) {
      toast.error("Storage is not configured yet — please add direct links instead.");
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

    const newItems: AttachmentItem[] = [];

    for (let i = 0; i < valid.length; i++) {
      setUploadProgress({ current: i + 1, total: valid.length });
      try {
        const file = valid[i];
        const url = await uploadImageToStorage(file, "notices");
        if (url) {
          // Clean default title from original file name without extension
          const originalName = file.name.replace(/\.[^/.]+$/, "") || `Photo ${items.length + i + 1}`;
          newItems.push({
            name: originalName,
            url,
            type: "image",
          });
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to upload image");
      }
    }

    setUploading(false);
    if (newItems.length > 0) {
      setItems((prev) => [...prev, ...newItems]);
      toast.success(`${newItems.length} photo(s) added successfully!`);
    }
  }

  // Add an external link item
  function addExternalLink() {
    const newItem: AttachmentItem = {
      name: `External Link ${items.filter((i) => i.type === "link").length + 1}`,
      url: "",
      type: "link",
    };
    setItems((prev) => [...prev, newItem]);
  }

  function updateItem(index: number, field: "name" | "url", value: string) {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function makeCover(index: number) {
    setItems((prev) => {
      const target = prev[index];
      const without = prev.filter((_, i) => i !== index);
      return [target, ...without];
    });
  }

  // JSON payload sent to the backend
  const jsonPayload = JSON.stringify(items.filter((i) => i.url.trim()));
  const legacyUrls = items.map((i) => i.url.trim()).filter(Boolean).join("\n");

  const images = items.filter((i) => i.type === "image");
  const links = items.filter((i) => i.type === "link");

  return (
    <div className="space-y-4 rounded-2xl border border-line bg-mist/25 p-4">
      {/* Hidden inputs to pass data to server action */}
      <input type="hidden" name="attachments_json" value={jsonPayload} />
      <input type="hidden" name="attachments" value={legacyUrls} />

      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
        <div>
          <Label className="flex items-center gap-1.5 font-semibold text-foreground text-sm">
            <Paperclip className="h-4 w-4 text-brand" />
            অ্যাটাচমেন্ট ও এক্সটার্নাল লিংক (Attachments & Links)
          </Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            একাধিক ছবি এবং গুগল ড্রাইভ/পিডিএফ/ওয়েবসাইট লিংক একসাথে যোগ করতে পারেন।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Multi-photo upload button */}
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-brand/30 bg-brand-soft/50 px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand-soft transition-colors">
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={handleImageUpload}
              disabled={uploading}
            />
            {uploading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>আপলোড হচ্ছে ({uploadProgress.current}/{uploadProgress.total})...</span>
              </>
            ) : (
              <>
                <UploadCloud className="h-3.5 w-3.5" />
                <span>+ ছবি আপলোড করুন</span>
              </>
            )}
          </label>

          {/* Add link button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addExternalLink}
            className="h-8 gap-1.5 text-xs bg-white"
          >
            <Plus className="h-3.5 w-3.5 text-poly" />
            <span>+ এক্সটার্নাল লিংক যোগ করুন</span>
          </Button>
        </div>
      </div>

      {/* Uploaded Photos Section */}
      {images.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <ImageIcon className="h-3.5 w-3.5" />
            <span>আপলোডকৃত ছবি ({images.length}টি) — প্রথম ছবিটি মূল কভার (Cover) ফটো হবে</span>
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {items.map((item, idx) => {
              if (item.type !== "image") return null;
              const isFirstImage = items.findIndex((i) => i.type === "image") === idx;
              return (
                <div
                  key={idx}
                  className={`flex items-center gap-3 rounded-xl border p-2.5 transition-all bg-white ${
                    isFirstImage ? "border-brand shadow-xs" : "border-line"
                  }`}
                >
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-line bg-mist">
                    <Image
                      src={item.url}
                      alt={item.name ?? "Photo"}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                    {isFirstImage && (
                      <span className="absolute top-1 left-1 rounded bg-brand p-0.5 text-white shadow-xs" title="Main Cover">
                        <Star className="h-3 w-3 fill-current" />
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <Input
                      value={item.name ?? ""}
                      onChange={(e) => updateItem(idx, "name", e.target.value)}
                      placeholder="ছবির নাম বা বিবরণ"
                      className="h-7 text-xs"
                    />
                    <div className="flex items-center gap-2">
                      {!isFirstImage && (
                        <button
                          type="button"
                          onClick={() => makeCover(idx)}
                          className="text-[11px] font-medium text-brand hover:underline"
                        >
                          Make Cover
                        </button>
                      )}
                      {isFirstImage && (
                        <span className="text-[11px] font-semibold text-brand">★ Cover Photo</span>
                      )}
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(idx)}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    title="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* External Links Section */}
      {links.length > 0 && (
        <div className="space-y-2 pt-1">
          <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <LinkIcon className="h-3.5 w-3.5 text-poly" />
            <span>এক্সটার্নাল লিংক / গুগল ড্রাইভ / পিডিএফ ({links.length}টি)</span>
          </Label>

          <div className="space-y-2">
            {items.map((item, idx) => {
              if (item.type !== "link") return null;
              return (
                <div
                  key={idx}
                  className="flex flex-wrap sm:flex-nowrap items-center gap-2 rounded-xl border border-poly/30 bg-white p-2.5 shadow-2xs"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-poly-soft text-poly">
                    <ExternalLink className="h-4 w-4" />
                  </div>

                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                    <div>
                      <Input
                        value={item.name ?? ""}
                        onChange={(e) => updateItem(idx, "name", e.target.value)}
                        placeholder="লিংকের শিরোনাম (e.g. অফিশিয়াল সার্কুলার PDF)"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Input
                        value={item.url}
                        onChange={(e) => updateItem(idx, "url", e.target.value)}
                        placeholder="URL (e.g. https://drive.google.com/...)"
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(idx)}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive shrink-0"
                    title="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {items.length === 0 && (
        <div className="rounded-xl border border-dashed border-line bg-white/70 py-6 px-4 text-center">
          <Paperclip className="h-6 w-6 text-muted-foreground/50 mx-auto mb-1.5" />
          <p className="text-xs font-medium text-foreground">এখনও কোনো ছবি বা লিংক যোগ করা হয়নি</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            উপরের বাটন দিয়ে এক বা একাধিক ছবি আপলোড করুন অথবা গুগল ড্রাইভ/পিডিএফ লিংক যোগ করুন।
          </p>
        </div>
      )}
    </div>
  );
}
