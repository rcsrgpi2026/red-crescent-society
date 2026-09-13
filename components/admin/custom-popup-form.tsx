"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  Save,
  Loader2,
  Eye,
  Calendar,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  Link as LinkIcon,
  Image as ImageIcon,
  Sliders,
  X,
  ArrowRight,
} from "lucide-react";
import { saveCustomPopupConfig } from "@/lib/admin-actions";
import { Button, Input, Label } from "@/components/ui";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import type { CustomPopupConfig } from "@/types/database";

interface CustomPopupFormProps {
  initialConfig: CustomPopupConfig;
}

export function CustomPopupForm({ initialConfig }: CustomPopupFormProps) {
  const [config, setConfig] = useState<CustomPopupConfig>(initialConfig);
  const [busy, setBusy] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [cropEnabled, setCropEnabled] = useState(true);
  const [cropAspectRatio, setCropAspectRatio] = useState<number>(3 / 4);

  // Status calculation
  const now = new Date();
  const end = config.endDate ? new Date(config.endDate) : null;

  let statusText = "Disabled";
  let statusBadgeClass = "bg-slate-100 text-slate-700 border-slate-200";

  if (config.enabled) {
    if (end && now > end) {
      statusText = "Expired (Schedule ended)";
      statusBadgeClass = "bg-amber-50 text-amber-700 border-amber-200";
    } else {
      statusText = "Active & Live";
      statusBadgeClass = "bg-emerald-50 text-emerald-700 border-emerald-300 ring-1 ring-emerald-500/20";
    }
  }

  const handleQuickSchedule = (days: number) => {
    const endObj = new Date();
    endObj.setDate(endObj.getDate() + days);
    const endIso = endObj.toISOString();
    setConfig((prev) => ({
      ...prev,
      endDate: endIso,
    }));
    toast.info(`Expiration set to ${days} day${days > 1 ? "s" : ""} from now.`);
  };

  const clearSchedule = () => {
    setConfig((prev) => ({
      ...prev,
      endDate: null,
    }));
    toast.info("Expiration cleared. Popup will remain active until manually disabled.");
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (config.enabled && !config.imageUrl?.trim()) {
      toast.error("Please upload or provide an image/poster URL before enabling the popup.");
      return;
    }
    setBusy(true);
    try {
      const res = await saveCustomPopupConfig(config);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message || "Failed to save settings.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while saving.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Top Banner with Toggle & Status */}
      <div className="rounded-2xl border border-line bg-gradient-to-r from-white via-white to-emerald-50/40 p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Custom Popup & Banner Modal
                </h2>
                <p className="text-xs text-muted-foreground">
                  Display special announcements, event posters, or alerts with custom action buttons.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${statusBadgeClass}`}
            >
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  config.enabled && (!end || now <= end)
                    ? "bg-emerald-500 animate-pulse"
                    : "bg-slate-400"
                }`}
              />
              {statusText}
            </span>

            <button
              type="button"
              onClick={() =>
                setConfig((prev) => ({ ...prev, enabled: !prev.enabled }))
              }
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-xs border ${
                config.enabled
                  ? "bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700 shadow-emerald-500/20"
                  : "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  config.enabled ? "bg-white animate-pulse" : "bg-slate-400"
                }`}
              />
              {config.enabled ? "Live on Website (ON)" : "Disabled / Off (Click to turn ON)"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Column: Image & Media Upload */}
        <div className="space-y-6 rounded-2xl border border-line bg-white p-6 shadow-xs">
          <div className="flex items-center gap-2 border-b border-line pb-3">
            <ImageIcon className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              1. Image / Poster Flyer
            </h3>
          </div>

          {/* Crop & Ratio Controls */}
          <div className="rounded-xl border border-line bg-mist/30 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cropEnabled}
                  onChange={(e) => setCropEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-line text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs font-semibold text-foreground">
                  Crop & Pan photo before uploading
                </span>
              </label>

              {cropEnabled && (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Cropping Active
                </span>
              )}
            </div>

            {cropEnabled && (
              <div className="space-y-1.5 pt-1">
                <Label className="text-[11px] font-medium text-muted-foreground">
                  Crop Aspect Ratio
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {[
                    { label: "3:4 Poster (Default)", val: 3 / 4 },
                    { label: "4:3 Banner", val: 4 / 3 },
                    { label: "16:9 Wide", val: 16 / 9 },
                    { label: "1:1 Square", val: 1 },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => setCropAspectRatio(opt.val)}
                      className={`rounded-lg border px-2 py-1.5 text-xs font-semibold transition-all ${
                        Math.abs(cropAspectRatio - opt.val) < 0.01
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-2xs"
                          : "border-line bg-white text-muted-foreground hover:bg-mist"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <ImageUploadField
              name="imageUrl"
              label="Poster or Banner Image"
              value={config.imageUrl}
              onChange={(url) =>
                setConfig((prev) => ({ ...prev, imageUrl: url }))
              }
              folder="popups"
              crop={cropEnabled}
              aspectRatio={cropAspectRatio}
              description={
                cropEnabled
                  ? "When you select a photo, a crop window will appear allowing you to pan, zoom, and fit the image precisely."
                  : "Uploads image as-is without cropping."
              }
            />
            {/* Direct URL input fallback or override */}
            <div className="mt-3 space-y-1">
              <Label className="text-xs text-muted-foreground">Or direct Image URL</Label>
              <Input
                type="url"
                placeholder="https://..."
                value={config.imageUrl}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, imageUrl: e.target.value }))
                }
                className="text-xs"
              />
            </div>
          </div>

          {/* Image Fit Mode in Popup Frame */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Image Display Fit</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  setConfig((prev) => ({ ...prev, imageFit: "contain" }))
                }
                className={`rounded-xl border p-2.5 text-left text-xs transition-all ${
                  config.imageFit !== "cover"
                    ? "border-emerald-500 bg-emerald-50/60 text-emerald-900 ring-1 ring-emerald-500/20"
                    : "border-line bg-white text-muted-foreground hover:bg-mist"
                }`}
              >
                <div className="font-bold">Fit (Contain)</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  Shows whole image without clipping
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  setConfig((prev) => ({ ...prev, imageFit: "cover" }))
                }
                className={`rounded-xl border p-2.5 text-left text-xs transition-all ${
                  config.imageFit === "cover"
                    ? "border-emerald-500 bg-emerald-50/60 text-emerald-900 ring-1 ring-emerald-500/20"
                    : "border-line bg-white text-muted-foreground hover:bg-mist"
                }`}
              >
                <div className="font-bold">Fill Frame (Cover)</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  Fills the frame edge-to-edge
                </div>
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Image Alt / Accessible Description</Label>
            <Input
              type="text"
              placeholder="e.g. Special Blood Drive Poster 2026"
              value={config.imageAlt || ""}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, imageAlt: e.target.value }))
              }
              className="text-xs"
            />
          </div>

          {/* Optional Title & Message text */}
          <div className="space-y-4 pt-2 border-t border-line/60">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Headline / Title (Optional)</Label>
              <Input
                type="text"
                placeholder="e.g. Emergency Blood Camp · Join Us This Friday"
                value={config.title || ""}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, title: e.target.value }))
                }
                className="text-sm font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Description / Notice Text (Optional)</Label>
              <textarea
                rows={3}
                placeholder="Write a short message or leave empty if the flyer already contains all text..."
                value={config.description || ""}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, description: e.target.value }))
                }
                className="w-full rounded-xl border border-line bg-mist/20 p-3 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Action Button & Scheduling */}
        <div className="space-y-6">
          {/* Action Button & Link (User's primary request) */}
          <div className="rounded-2xl border border-line bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-line pb-3">
              <LinkIcon className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                2. Action Button & Link Address
              </h3>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Button Label (Text)</Label>
              <Input
                type="text"
                placeholder="e.g. Register Now, Learn More, View Circular"
                value={config.buttonText || ""}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, buttonText: e.target.value }))
                }
                className="text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                Text displayed on the call-to-action button inside the popup.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Button Link Address (URL)</Label>
              <Input
                type="text"
                placeholder="e.g. https://forms.gle/... or /events/annual-blood-camp"
                value={config.buttonUrl || ""}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, buttonUrl: e.target.value }))
                }
                className="text-xs font-mono"
              />
              <p className="text-[11px] text-muted-foreground">
                Where the visitor will be directed when clicking the button.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                id="popup-open-new-tab"
                type="checkbox"
                checked={Boolean(config.buttonOpenInNewTab)}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    buttonOpenInNewTab: e.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-line text-emerald-600 focus:ring-emerald-500"
              />
              <label
                htmlFor="popup-open-new-tab"
                className="cursor-pointer text-xs font-medium text-foreground"
              >
                Open link in a new tab / window
              </label>
            </div>
          </div>

          {/* Time & Scheduling */}
          <div className="rounded-2xl border border-line bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                  3. Expiration & End Date
                </h3>
              </div>
              {config.endDate && (
                <button
                  type="button"
                  onClick={clearSchedule}
                  className="text-[11px] font-semibold text-rose-600 hover:underline"
                >
                  Clear expiration
                </button>
              )}
            </div>

            <div className="rounded-xl bg-emerald-50/60 border border-emerald-500/20 p-3 text-xs text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Starts immediately:</strong> The popup goes live as soon as it is enabled.
              </span>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">End Date & Time / Expiration (Optional)</Label>
              <Input
                type="datetime-local"
                value={config.endDate ? config.endDate.slice(0, 16) : ""}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    endDate: e.target.value ? new Date(e.target.value).toISOString() : null,
                  }))
                }
                className="text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                Leave empty to run indefinitely until manually disabled.
              </p>
            </div>

            {/* Quick scheduling presets */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] text-muted-foreground">Quick set:</span>
              <button
                type="button"
                onClick={() => handleQuickSchedule(1)}
                className="rounded-lg border border-line bg-mist/40 px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
              >
                Next 24 Hours
              </button>
              <button
                type="button"
                onClick={() => handleQuickSchedule(3)}
                className="rounded-lg border border-line bg-mist/40 px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
              >
                Next 3 Days
              </button>
              <button
                type="button"
                onClick={() => handleQuickSchedule(7)}
                className="rounded-lg border border-line bg-mist/40 px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
              >
                Next 7 Days
              </button>
            </div>
          </div>

          {/* Display & Frequency Settings */}
          <div className="rounded-2xl border border-line bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-line pb-3">
              <Sliders className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                4. Display Scope & Frequency
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Page Scope</Label>
                <select
                  value={config.showScope || "home_only"}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      showScope: e.target.value as "home_only" | "all_pages",
                    }))
                  }
                  className="w-full rounded-xl border border-line bg-white p-2 text-xs font-medium text-foreground focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="home_only">Homepage Only (Recommended)</option>
                  <option value="all_pages">All Public Pages</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Visitor Dismissal</Label>
                <select
                  value={config.frequency || "once_per_session"}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      frequency: e.target.value as "once_per_session" | "always" | "once_per_day",
                    }))
                  }
                  className="w-full rounded-xl border border-line bg-white p-2 text-xs font-medium text-foreground focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="once_per_session">Once per browser session (Recommended)</option>
                  <option value="once_per_day">Once per day</option>
                  <option value="always">Show on every visit (until closed)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar: Save & Preview Buttons */}
      <div className="sticky bottom-4 z-30 flex items-center justify-between rounded-2xl border border-line bg-white/90 p-4 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setPreviewOpen(true)}
            className="flex items-center gap-1.5 text-xs font-semibold"
          >
            <Eye className="h-4 w-4 text-emerald-600" />
            Live Preview
          </Button>
          <span className="hidden sm:inline text-xs text-muted-foreground">
            Test how the popup looks on desktop & mobile
          </span>
        </div>

        <Button
          type="submit"
          disabled={busy}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-6"
        >
          {busy ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-1.5 h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </div>

      {/* Live Preview Modal Overlay */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="relative w-[92vw] max-w-[360px] sm:w-full sm:max-w-md overflow-hidden rounded-3xl border border-line bg-white shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Gradient Header Banner (Matches Main Announcement Theme) */}
            <div className="relative bg-gradient-to-br from-brand-dark via-brand to-crescent px-4 py-4 sm:px-6 sm:py-5 text-white shrink-0">
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="absolute right-3.5 top-3.5 rounded-full bg-black/20 p-1.5 text-white/80 transition-colors hover:bg-black/40 hover:text-white sm:right-4 sm:top-4"
                aria-label="Close preview"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="text-left pr-8 sm:pr-10">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="inline-flex items-center gap-1 rounded-full bg-black/20 px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase text-white/90">
                    <Eye className="h-2.5 w-2.5 text-emerald-300" />
                    Live Preview
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white leading-tight">
                  {config.title || "জরুরি বিজ্ঞপ্তি ও তথ্য"}
                </h2>
                <p className="mt-1 text-[11px] sm:text-xs leading-relaxed text-white/90">
                  {config.description || "বিস্তারিত নিচে দেখে জেনে নিন।"}
                </p>
              </div>
            </div>

            {/* Modal Body with 3:4 Poster Image */}
            <div className="overflow-y-auto p-4 sm:p-5 space-y-4 bg-white">
              {/* Poster Image (3:4 Ratio) */}
              <div className="relative w-full aspect-[3/4] max-h-[52vh] rounded-2xl overflow-hidden border border-line/80 bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 flex items-center justify-center shadow-xs shrink-0">
                {config.imageUrl ? (
                  <Image
                    src={config.imageUrl}
                    alt={config.imageAlt || "Popup Preview"}
                    fill
                    sizes="(max-width: 640px) 100vw, 420px"
                    className={config.imageFit === "cover" ? "object-cover" : "object-contain"}
                  />
                ) : (
                  <div className="text-center p-6 text-white/60">
                    <ImageIcon className="mx-auto h-12 w-12 mb-2 opacity-40" />
                    <p className="text-xs font-semibold">No image provided yet</p>
                    <p className="text-[11px] opacity-70">Upload an image to see it here</p>
                  </div>
                )}
              </div>

              {/* Action Button */}
              {config.buttonUrl && (
                <div>
                  <a
                    href={config.buttonUrl}
                    target={config.buttonOpenInNewTab ? "_blank" : undefined}
                    rel={config.buttonOpenInNewTab ? "noopener noreferrer" : undefined}
                    className="group flex w-full items-center justify-center gap-2 rounded-xl bg-crescent px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-red-500/20 transition-all hover:bg-crescent-dark active:scale-[0.99]"
                  >
                    <span>{config.buttonText || "Learn More"}</span>
                    {config.buttonOpenInNewTab ? (
                      <ExternalLink className="h-4 w-4 transition-transform group-hover:scale-110" />
                    ) : (
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    )}
                  </a>
                </div>
              )}

              {/* Footer with "Got it, Close" Button */}
              <div className="flex items-center justify-end pt-2 border-t border-line/60">
                <button
                  type="button"
                  onClick={() => setPreviewOpen(false)}
                  className="inline-flex items-center justify-center rounded-xl border border-line bg-mist/50 px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-mist hover:text-foreground"
                >
                  Got it, Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
