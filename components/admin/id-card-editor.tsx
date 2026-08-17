"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Save,
  RotateCcw,
  UploadCloud,
  Plus,
  Trash2,
  CreditCard,
} from "lucide-react";
import type {
  CardDesignConfig,
  ContactItem,
  MemberData,
  SingleLogoConfig,
} from "@/types/id-card";
import {
  AVAILABLE_FONTS,
  DEFAULT_CARD_DESIGN,
  CARD_BASE_WIDTH,
  CARD_BASE_HEIGHT,
} from "@/lib/id-card/constants";
import { saveIdCardDesign } from "@/lib/admin-actions";
import {
  uploadImageToStorage,
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_SIZE,
} from "@/lib/upload";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { ScaledCard } from "@/components/id-card/scaled-card";
import { CardFonts } from "@/components/id-card/card-fonts";
import { Input, Label, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "logos", label: "Logos" },
  { id: "photo", label: "Photo" },
  { id: "watermark", label: "Watermark" },
  { id: "design", label: "Design" },
  { id: "header", label: "Header" },
  { id: "typography", label: "Typography" },
  { id: "fields", label: "Fields & Labels" },
  { id: "footer", label: "Footer" },
  { id: "back", label: "Back side" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const WEIGHT_OPTIONS = [
  { value: "400", label: "Regular (400)" },
  { value: "500", label: "Medium (500)" },
  { value: "600", label: "Semi-bold (600)" },
  { value: "700", label: "Bold (700)" },
  { value: "800", label: "Extra bold (800)" },
];

const BLEND_MODES = ["normal", "multiply", "darken", "overlay"] as const;
const CONTACT_TYPES = ["phone", "email", "facebook", "web", "location", "custom"] as const;

const STYLE_OPTIONS = [
  { value: "normal", label: "Normal" },
  { value: "italic", label: "Italic" },
];

const inputCls =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm";

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-xs font-semibold text-foreground">{label}</Label>
      {children}
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <Field label={label} className={className}>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-9" />
    </Field>
  );
}

function NumInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  className,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}) {
  return (
    <Field label={label} className={className}>
      <input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        step={step}
        min={min}
        max={max}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={inputCls}
      />
    </Field>
  );
}

function ColorInput({
  label,
  value,
  onChange,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  const isHex = /^#[0-9a-fA-F]{6}$/.test(value);
  return (
    <Field label={label} className={className}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={isHex ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-10 shrink-0 cursor-pointer rounded-md border border-input bg-transparent p-0.5"
          aria-label={`${label} color picker`}
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="h-9 font-mono text-xs" />
      </div>
    </Field>
  );
}

function Toggle({
  label,
  checked,
  onChange,
  className,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  className?: string;
}) {
  return (
    <label className={cn("flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-line bg-mist/40 px-3 py-2.5", className)}>
      <span className="text-xs font-semibold text-foreground">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-line text-brand focus:ring-brand"
      />
    </label>
  );
}

function FontSelect({
  label,
  value,
  onChange,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <Field label={label} className={className}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="mt-0 h-9">
          <SelectValue placeholder="Select font" />
        </SelectTrigger>
        <SelectContent>
          {AVAILABLE_FONTS.map((f) => (
            <SelectItem key={f.value} value={f.value}>
              {f.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

function WeightSelect({
  label,
  value,
  onChange,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <Field label={label} className={className}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="mt-0 h-9">
          <SelectValue placeholder="Weight" />
        </SelectTrigger>
        <SelectContent>
          {WEIGHT_OPTIONS.map((w) => (
            <SelectItem key={w.value} value={w.value}>
              {w.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

function StyleSelect({
  label,
  value,
  onChange,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <Field label={label} className={className}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="mt-0 h-9">
          <SelectValue placeholder="Style" />
        </SelectTrigger>
        <SelectContent>
          {STYLE_OPTIONS.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

function ImageInput({
  label,
  value,
  onChange,
  description,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  description?: string;
  className?: string;
}) {
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Please choose a PNG, JPG, WebP or GIF image.");
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
      const url = await uploadImageToStorage(file, "id-card");
      onChange(url);
      toast.success("Image uploaded.");
    } catch (err) {
      console.error(err);
      toast.error("Upload failed — paste the image URL instead.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Field label={label} className={className}>
      <div className="flex items-start gap-2">
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-line bg-white">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-contain" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-muted-foreground">
              <CreditCard className="h-4 w-4" aria-hidden />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Paste an image URL, or upload"
            className="h-9"
          />
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-mist">
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <UploadCloud className="h-3.5 w-3.5" aria-hidden />
            )}
            {uploading ? "Uploading…" : "Upload image"}
            <input
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(",")}
              onChange={handleFile}
              disabled={uploading}
              className="sr-only"
            />
          </label>
        </div>
      </div>
      {description && <p className="pt-1 text-xs text-muted-foreground">{description}</p>}
    </Field>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <h3 className="font-semibold text-foreground">{title}</h3>
      {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

interface IdCardDesignEditorProps {
  initialDesign: CardDesignConfig;
  previewMember: MemberData;
  /** Photo of the preview member, shown on the card so the design reads realistically. */
  previewPhoto?: string | null;
}

export function IdCardDesignEditor({
  initialDesign,
  previewMember,
  previewPhoto,
}: IdCardDesignEditorProps) {
  const [design, setDesign] = useState<CardDesignConfig>(() => initialDesign);
  const [activeTab, setActiveTab] = useState<TabId>("logos");
  const [saving, setSaving] = useState(false);

  const previewConfig = useMemo(
    () => ({
      ...design,
      member: previewMember,
      photo: { ...design.photo, src: previewPhoto || design.photo.src || "" },
    }),
    [design, previewMember, previewPhoto]
  );

  // Only object sections can be patched key-by-key (strings / arrays are replaced wholesale).
  type SectionKey =
    | "photo"
    | "logos"
    | "watermark"
    | "header"
    | "labels"
    | "typography"
    | "fields"
    | "footer"
    | "design"
    | "layout"
    | "backSide";

  function patch<K extends SectionKey>(key: K, changes: Partial<CardDesignConfig[K]>) {
    setDesign((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] as unknown as Record<string, unknown>),
        ...(changes as unknown as Record<string, unknown>),
      } as unknown as CardDesignConfig[K],
    }));
  }

  function patchLogo(key: keyof CardDesignConfig["logos"], changes: Partial<SingleLogoConfig>) {
    setDesign((prev) => ({
      ...prev,
      logos: { ...prev.logos, [key]: { ...prev.logos[key], ...changes } },
    }));
  }

  function patchContact(id: string, changes: Partial<ContactItem>) {
    setDesign((prev) => ({
      ...prev,
      footer: {
        ...prev.footer,
        contacts: prev.footer.contacts.map((c) => (c.id === id ? { ...c, ...changes } : c)),
      },
    }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const result = await saveIdCardDesign(JSON.stringify(design));
      if (result.success) toast.success(result.message ?? "Card design saved.");
      else toast.error(result.message ?? "Save failed.");
    } catch (err) {
      console.error(err);
      toast.error("Save failed — please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    if (!window.confirm("Restore the default official card design? Your current design will be replaced.")) return;
    setDesign(structuredClone(DEFAULT_CARD_DESIGN));
    toast.success("Default design restored — press Save to apply it.");
  }

  /** Switches the card orientation and swaps the dimensions to match. */
  function handleOrientationChange(orientation: string) {
    const o = orientation === "portrait" ? "portrait" : "landscape";
    setDesign((prev) => ({
      ...prev,
      design: {
        ...prev.design,
        orientation: o,
        width: o === "portrait" ? CARD_BASE_HEIGHT : CARD_BASE_WIDTH,
        height: o === "portrait" ? CARD_BASE_WIDTH : CARD_BASE_HEIGHT,
        aspectRatio: o === "portrait" ? "0.6305" : "1.586",
      },
    }));
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white">
      <CardFonts />
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <h2 className="font-bold text-foreground">Card design</h2>
          <p className="text-xs text-muted-foreground">
            Saved globally — every member card uses this design with their own details.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-crescent/40 hover:text-crescent"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            Reset
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Save className="h-3.5 w-3.5" aria-hidden />}
            {saving ? "Saving…" : "Save design"}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Tabs */}
        <aside className="flex shrink-0 gap-1 overflow-x-auto border-b border-line bg-mist/30 p-3 lg:w-52 lg:flex-col lg:border-b-0 lg:border-r">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors",
                activeTab === tab.id
                  ? "bg-brand text-white shadow-sm"
                  : "text-muted-foreground hover:bg-white hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </aside>

        {/* Settings */}
        <div className="min-w-0 flex-1 space-y-5 p-5">
          {activeTab === "logos" && (
            <div className="space-y-5">
              <SectionCard title="Institute logo" description="Top-left logo on the card front.">
                <Toggle label="Visible" checked={design.logos.instituteLogo.visible} onChange={(v) => patchLogo("instituteLogo", { visible: v })} className="sm:col-span-2" />
                <ImageInput label="Logo image" value={design.logos.instituteLogo.src} onChange={(v) => patchLogo("instituteLogo", { src: v })} className="sm:col-span-2" />
                <NumInput label="Width" value={design.logos.instituteLogo.width} onChange={(v) => patchLogo("instituteLogo", { width: v })} min={20} max={300} />
                <NumInput label="Height" value={design.logos.instituteLogo.height} onChange={(v) => patchLogo("instituteLogo", { height: v })} min={20} max={300} />
                <NumInput label="Opacity" value={design.logos.instituteLogo.opacity} onChange={(v) => patchLogo("instituteLogo", { opacity: v })} min={0} max={1} step={0.05} />
              </SectionCard>

              <SectionCard title="Red Crescent logo" description="Top-right logo on the card front.">
                <Toggle label="Visible" checked={design.logos.redCrescentLogo.visible} onChange={(v) => patchLogo("redCrescentLogo", { visible: v })} className="sm:col-span-2" />
                <ImageInput label="Logo image" value={design.logos.redCrescentLogo.src} onChange={(v) => patchLogo("redCrescentLogo", { src: v })} className="sm:col-span-2" />
                <NumInput label="Width" value={design.logos.redCrescentLogo.width} onChange={(v) => patchLogo("redCrescentLogo", { width: v })} min={20} max={300} />
                <NumInput label="Height" value={design.logos.redCrescentLogo.height} onChange={(v) => patchLogo("redCrescentLogo", { height: v })} min={20} max={300} />
                <NumInput label="Opacity" value={design.logos.redCrescentLogo.opacity} onChange={(v) => patchLogo("redCrescentLogo", { opacity: v })} min={0} max={1} step={0.05} />
              </SectionCard>

              <SectionCard title="Footer logos" description="Small logos inside the bottom footer bar.">
                <Toggle label="Show left logo (RCY)" checked={design.footer.showLeftLogo && design.logos.footerLogoLeft.visible} onChange={(v) => { patchLogo("footerLogoLeft", { visible: v }); patch("footer", { showLeftLogo: v }); }} className="sm:col-span-2" />
                <ImageInput label="Left logo image" value={design.logos.footerLogoLeft.src} onChange={(v) => patchLogo("footerLogoLeft", { src: v })} className="sm:col-span-2" />
                <NumInput label="Left logo width" value={design.logos.footerLogoLeft.width} onChange={(v) => patchLogo("footerLogoLeft", { width: v })} min={16} max={120} />
                <NumInput label="Left logo height" value={design.logos.footerLogoLeft.height} onChange={(v) => patchLogo("footerLogoLeft", { height: v })} min={16} max={120} />
                <Toggle label="Show right logo (RPI)" checked={design.footer.showRightLogo && design.logos.footerLogoRight.visible} onChange={(v) => { patchLogo("footerLogoRight", { visible: v }); patch("footer", { showRightLogo: v }); }} className="sm:col-span-2" />
                <ImageInput label="Right logo image" value={design.logos.footerLogoRight.src} onChange={(v) => patchLogo("footerLogoRight", { src: v })} className="sm:col-span-2" />
                <NumInput label="Right logo width" value={design.logos.footerLogoRight.width} onChange={(v) => patchLogo("footerLogoRight", { width: v })} min={16} max={120} />
                <NumInput label="Right logo height" value={design.logos.footerLogoRight.height} onChange={(v) => patchLogo("footerLogoRight", { height: v })} min={16} max={120} />
              </SectionCard>
            </div>
          )}

          {activeTab === "photo" && (
            <>
            <SectionCard
              title="Card photo"
              description="Size and styling of the member photo box on the card. The member's own profile photo fills this box."
            >
              <Toggle
                label="Show photo"
                checked={design.photo.visible}
                onChange={(v) => patch("photo", { visible: v })}
                className="sm:col-span-2"
              />
              <NumInput
                label="Box width"
                value={design.photo.width}
                onChange={(v) => patch("photo", { width: v })}
                min={60}
                max={420}
              />
              <NumInput
                label="Box height"
                value={design.photo.height}
                onChange={(v) => patch("photo", { height: v })}
                min={80}
                max={520}
              />
              <NumInput
                label="Border radius"
                value={design.photo.borderRadius}
                onChange={(v) => patch("photo", { borderRadius: v })}
                min={0}
                max={60}
              />
              <NumInput
                label="Border width"
                value={design.photo.borderWidth}
                onChange={(v) => patch("photo", { borderWidth: v })}
                min={0}
                max={12}
                step={0.5}
              />
              <ColorInput
                label="Border color"
                value={design.photo.borderColor}
                onChange={(v) => patch("photo", { borderColor: v })}
              />
              <NumInput
                label="Outer ring width"
                value={design.photo.outerBorderWidth}
                onChange={(v) => patch("photo", { outerBorderWidth: v })}
                min={0}
                max={8}
                step={0.5}
              />
              <ColorInput
                label="Outer ring color"
                value={design.photo.outerBorderColor}
                onChange={(v) => patch("photo", { outerBorderColor: v })}
              />
              <Toggle
                label="Drop shadow"
                checked={design.photo.shadow}
                onChange={(v) => patch("photo", { shadow: v })}
              />
              <NumInput
                label="Image pan X (inside frame)"
                value={design.photo.x}
                onChange={(v) => patch("photo", { x: v })}
                min={-120}
                max={120}
              />
              <NumInput
                label="Image pan Y (inside frame)"
                value={design.photo.y}
                onChange={(v) => patch("photo", { y: v })}
                min={-120}
                max={120}
              />
            </SectionCard>
            <SectionCard
              title="Placeholder position"
              description="Move the photo box itself around the card. Vertical position (up/down) works in both landscape and portrait layouts."
            >
              <NumInput
                label="Position X (left/right)"
                value={design.layout.photoOffsetX}
                onChange={(v) => patch("layout", { photoOffsetX: v })}
                min={-260}
                max={260}
              />
              <NumInput
                label="Position Y (up/down)"
                value={design.layout.photoOffsetY}
                onChange={(v) => patch("layout", { photoOffsetY: v })}
                min={-260}
                max={260}
              />
            </SectionCard>
            </>
          )}

          {activeTab === "watermark" && (
            <SectionCard title="Watermark" description="Faded emblem behind the card content.">
              <Toggle label="Show watermark" checked={design.watermark.visible} onChange={(v) => patch("watermark", { visible: v })} className="sm:col-span-2" />
              <ImageInput label="Watermark image" value={design.watermark.src} onChange={(v) => patch("watermark", { src: v })} className="sm:col-span-2" />
              <NumInput label="Opacity" value={design.watermark.opacity} onChange={(v) => patch("watermark", { opacity: v })} min={0} max={1} step={0.01} />
              <NumInput label="Scale" value={design.watermark.scale} onChange={(v) => patch("watermark", { scale: v })} min={0.1} max={3} step={0.05} />
              <NumInput label="Rotation (deg)" value={design.watermark.rotation} onChange={(v) => patch("watermark", { rotation: v })} min={-180} max={180} />
              <NumInput label="X offset" value={design.watermark.x} onChange={(v) => patch("watermark", { x: v })} min={-300} max={300} />
              <NumInput label="Y offset" value={design.watermark.y} onChange={(v) => patch("watermark", { y: v })} min={-300} max={300} />
              <Field label="Blend mode">
                <Select value={design.watermark.blendMode} onValueChange={(v) => patch("watermark", { blendMode: v as CardDesignConfig["watermark"]["blendMode"] })}>
                  <SelectTrigger className="mt-0 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BLEND_MODES.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </SectionCard>
          )}

          {activeTab === "design" && (
            <SectionCard title="Card design" description="Background, border and overall style.">
              <Field label="Orientation" className="sm:col-span-2">
                <Select value={design.design.orientation} onValueChange={handleOrientationChange}>
                  <SelectTrigger className="mt-0 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="landscape">Landscape (1012 × 638)</SelectItem>
                    <SelectItem value="portrait">Portrait / Vertical (638 × 1012)</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <ColorInput label="Background color" value={design.design.backgroundColor} onChange={(v) => patch("design", { backgroundColor: v })} />
              <NumInput label="Border radius" value={design.design.borderRadius} onChange={(v) => patch("design", { borderRadius: v })} min={0} max={48} />
              <ColorInput label="Border color" value={design.design.borderColor} onChange={(v) => patch("design", { borderColor: v })} />
              <NumInput label="Border width" value={design.design.borderWidth} onChange={(v) => patch("design", { borderWidth: v })} min={0} max={8} step={0.5} />
              <ColorInput label="Primary text color" value={design.design.primaryTextColor} onChange={(v) => patch("design", { primaryTextColor: v })} />
              <ColorInput label="Secondary text color" value={design.design.secondaryTextColor} onChange={(v) => patch("design", { secondaryTextColor: v })} />
              <ColorInput label="Accent color" value={design.design.accentColor} onChange={(v) => patch("design", { accentColor: v })} />
              <Field label="Background gradient (CSS)" className="sm:col-span-2">
                <Textarea rows={2} value={design.design.backgroundGradient ?? ""} onChange={(e) => patch("design", { backgroundGradient: e.target.value })} className="mt-0 font-mono text-xs" placeholder="linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)" />
              </Field>
            </SectionCard>
          )}

          {activeTab === "header" && (
            <SectionCard title="Header" description="Institute and society titles at the top of the card.">
              <TextInput label="Institute title" value={design.header.instituteTitle} onChange={(v) => patch("header", { instituteTitle: v })} className="sm:col-span-2" />
              <TextInput label="Society title" value={design.header.orgTitle} onChange={(v) => patch("header", { orgTitle: v })} className="sm:col-span-2" />
              <FontSelect label="Institute title font" value={design.header.instituteTitleFont} onChange={(v) => patch("header", { instituteTitleFont: v })} />
              <FontSelect label="Society title font" value={design.header.orgTitleFont} onChange={(v) => patch("header", { orgTitleFont: v })} />
              <NumInput label="Institute title size" value={design.header.instituteTitleSize} onChange={(v) => patch("header", { instituteTitleSize: v })} min={10} max={60} />
              <NumInput label="Society title size" value={design.header.orgTitleSize} onChange={(v) => patch("header", { orgTitleSize: v })} min={10} max={60} />
              <StyleSelect label="Institute title style" value={design.header.instituteTitleStyle} onChange={(v) => patch("header", { instituteTitleStyle: v })} />
              <StyleSelect label="Society title style" value={design.header.orgTitleStyle} onChange={(v) => patch("header", { orgTitleStyle: v })} />
              <WeightSelect label="Institute title weight" value={design.header.instituteTitleWeight} onChange={(v) => patch("header", { instituteTitleWeight: v })} />
              <WeightSelect label="Society title weight" value={design.header.orgTitleWeight} onChange={(v) => patch("header", { orgTitleWeight: v })} />
              <ColorInput label="Institute title color" value={design.header.instituteTitleColor} onChange={(v) => patch("header", { instituteTitleColor: v })} />
              <ColorInput label="Society title color" value={design.header.orgTitleColor} onChange={(v) => patch("header", { orgTitleColor: v })} />
              <NumInput label="Letter spacing (institute)" value={design.header.instituteTitleTracking} onChange={(v) => patch("header", { instituteTitleTracking: v })} min={0} max={5} step={0.1} />
              <NumInput label="Letter spacing (society)" value={design.header.orgTitleTracking} onChange={(v) => patch("header", { orgTitleTracking: v })} min={0} max={5} step={0.1} />
              <NumInput label="Line spacing" value={design.header.lineSpacing} onChange={(v) => patch("header", { lineSpacing: v })} min={0} max={30} />
              <NumInput label="Top margin" value={design.header.marginTop} onChange={(v) => patch("header", { marginTop: v })} min={0} max={80} />
              <NumInput label="Bottom margin" value={design.header.marginBottom} onChange={(v) => patch("header", { marginBottom: v })} min={0} max={80} />
            </SectionCard>
          )}

          {activeTab === "typography" && (
            <SectionCard title="Typography" description="Fonts and styling of the member details.">
              <FontSelect label="Base font" value={design.typography.fontFamily} onChange={(v) => patch("typography", { fontFamily: v })} />
              <FontSelect label="Label font" value={design.typography.labelFontFamily} onChange={(v) => patch("typography", { labelFontFamily: v })} />
              <FontSelect label="Value font" value={design.typography.valueFontFamily} onChange={(v) => patch("typography", { valueFontFamily: v })} />
              <NumInput label="Label size" value={design.typography.labelFontSize} onChange={(v) => patch("typography", { labelFontSize: v })} min={8} max={48} />
              <NumInput label="Value size" value={design.typography.valueFontSize} onChange={(v) => patch("typography", { valueFontSize: v })} min={8} max={48} />
              <WeightSelect label="Label weight" value={design.typography.labelFontWeight} onChange={(v) => patch("typography", { labelFontWeight: v })} />
              <WeightSelect label="Value weight" value={design.typography.valueFontWeight} onChange={(v) => patch("typography", { valueFontWeight: v })} />
              <ColorInput label="Label color" value={design.typography.labelColor} onChange={(v) => patch("typography", { labelColor: v })} />
              <ColorInput label="Value color" value={design.typography.valueColor} onChange={(v) => patch("typography", { valueColor: v })} />
              <ColorInput label="Underline color" value={design.typography.underlineColor} onChange={(v) => patch("typography", { underlineColor: v })} />
              <NumInput label="Underline thickness" value={design.typography.underlineThickness} onChange={(v) => patch("typography", { underlineThickness: v })} min={0} max={8} step={0.5} />
              <NumInput label="Underline gap" value={design.typography.underlineGap} onChange={(v) => patch("typography", { underlineGap: v })} min={0} max={20} />
              <NumInput label="Line height" value={design.typography.lineHeight} onChange={(v) => patch("typography", { lineHeight: v })} min={1} max={2} step={0.05} />
            </SectionCard>
          )}

          {activeTab === "fields" && (
            <div className="space-y-5">
              <SectionCard title="Visible fields" description="Which member details appear on the card.">
                {(
                  [
                    ["name", "Name"],
                    ["roll", "Roll"],
                    ["register", "Registration no."],
                    ["session", "Session"],
                    ["department", "Department"],
                    ["designation", "Designation"],
                    ["validUntil", "Valid until"],
                    ["rcyDept", "RCY Dept."],
                    ["phone", "Phone"],
                    ["email", "Email"],
                    ["facebook", "Facebook"],
                  ] as const
                ).map(([key, label]) => (
                  <Toggle key={key} label={label} checked={design.fields[key]} onChange={(v) => patch("fields", { [key]: v })} />
                ))}
              </SectionCard>
              <SectionCard title="Field labels" description="The text shown next to each value.">
                {(
                  [
                    ["name", "Name"],
                    ["roll", "Roll"],
                    ["register", "Registration"],
                    ["session", "Session"],
                    ["department", "Department"],
                    ["designation", "Designation"],
                    ["validUntil", "Valid until"],
                    ["rcyDept", "RCY Dept."],
                    ["phone", "Phone"],
                    ["email", "Email"],
                    ["facebook", "Facebook"],
                  ] as const
                ).map(([key, label]) => (
                  <TextInput key={key} label={`${label} label`} value={design.labels[key]} onChange={(v) => patch("labels", { [key]: v })} />
                ))}
              </SectionCard>
            </div>
          )}

          {activeTab === "footer" && (
            <div className="space-y-5">
              <SectionCard title="Footer" description="The bottom band with the society name and contacts.">
                <Toggle label="Show footer" checked={design.footer.visible} onChange={(v) => patch("footer", { visible: v })} className="sm:col-span-2" />
                <ColorInput label="Background color" value={design.footer.bgColor} onChange={(v) => patch("footer", { bgColor: v })} />
                <NumInput label="Height" value={design.footer.height} onChange={(v) => patch("footer", { height: v })} min={40} max={140} />
                <TextInput label="Society name" value={design.footer.orgName} onChange={(v) => patch("footer", { orgName: v })} />
                <TextInput label="Subtitle" value={design.footer.subtitle} onChange={(v) => patch("footer", { subtitle: v })} />
                <NumInput label="Society name size" value={design.footer.orgNameFontSize} onChange={(v) => patch("footer", { orgNameFontSize: v })} min={8} max={40} step={0.5} />
                <NumInput label="Subtitle size" value={design.footer.subtitleFontSize} onChange={(v) => patch("footer", { subtitleFontSize: v })} min={8} max={30} step={0.5} />
                <ColorInput label="Text color" value={design.footer.textColor} onChange={(v) => patch("footer", { textColor: v })} />
                <ColorInput label="Subtitle color" value={design.footer.subtitleColor} onChange={(v) => patch("footer", { subtitleColor: v })} />
              </SectionCard>
              <SectionCard title="Contacts" description="Contact items shown in the footer (e.g. phone, Facebook, email).">
                <div className="space-y-3 sm:col-span-2">
                  {design.footer.contacts.map((contact) => (
                    <div key={contact.id} className="rounded-xl border border-line bg-mist/30 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                          {contact.type}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            patch("footer", {
                              contacts: design.footer.contacts.filter((c) => c.id !== contact.id),
                            })
                          }
                          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-crescent-soft hover:text-crescent"
                          aria-label={`Remove ${contact.type} contact`}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      </div>
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        <Field label="Type">
                          <Select value={contact.type} onValueChange={(v) => patchContact(contact.id, { type: v as ContactItem["type"] })}>
                            <SelectTrigger className="mt-0 h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CONTACT_TYPES.map((t) => (
                                <SelectItem key={t} value={t}>
                                  {t}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Field>
                        <Toggle label="Visible" checked={contact.visible} onChange={(v) => patchContact(contact.id, { visible: v })} />
                        <Input
                          value={contact.value}
                          onChange={(e) => patchContact(contact.id, { value: e.target.value })}
                          placeholder="Value (e.g. +8801XXX-XXXXXX)"
                          className="sm:col-span-2"
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      patch("footer", {
                        contacts: [
                          ...design.footer.contacts,
                          {
                            id: `c${Date.now()}`,
                            type: "custom",
                            label: "Custom",
                            value: "",
                            visible: true,
                          },
                        ],
                      })
                    }
                    className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-line px-3.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-brand/40 hover:text-brand"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden />
                    Add contact
                  </button>
                </div>
              </SectionCard>
            </div>
          )}

          {activeTab === "back" && (
            <div className="space-y-5">
              <SectionCard title="Back side" description="Terms, instructions, QR and signatures.">
                <Toggle label="Enable back side" checked={design.backSide.enabled} onChange={(v) => patch("backSide", { enabled: v })} className="sm:col-span-2" />
                <ColorInput label="Background color" value={design.backSide.bgColor} onChange={(v) => patch("backSide", { bgColor: v })} />
                <ColorInput label="Text color" value={design.backSide.textColor} onChange={(v) => patch("backSide", { textColor: v })} />
                <TextInput label="Section title" value={design.backSide.title} onChange={(v) => patch("backSide", { title: v })} />
                <TextInput label="Issued by" value={design.backSide.issuedByTitle} onChange={(v) => patch("backSide", { issuedByTitle: v })} />
                <TextInput label="Authorized signature" value={design.backSide.authorizedSignatureTitle} onChange={(v) => patch("backSide", { authorizedSignatureTitle: v })} />
                <TextInput label="Emergency contact" value={design.backSide.emergencyContact} onChange={(v) => patch("backSide", { emergencyContact: v })} className="sm:col-span-2" />
                <Field label="Instructions (one per line)" className="sm:col-span-2">
                  <Textarea
                    rows={5}
                    value={design.backSide.instructions.join("\n")}
                    onChange={(e) => patch("backSide", { instructions: e.target.value.split("\n") })}
                    className="mt-0"
                  />
                </Field>
                <Toggle label="Show verification QR code" checked={design.backSide.showQrCode} onChange={(v) => patch("backSide", { showQrCode: v })} className="sm:col-span-2" />
                <TextInput
                  label="QR code data"
                  value={design.backSide.qrCodeData}
                  onChange={(v) => patch("backSide", { qrCodeData: v })}
                  className="sm:col-span-2"
                />
                <p className="text-xs text-muted-foreground sm:col-span-2">
                  Supports <code className="rounded bg-mist px-1">{"{member_id}"}</code>,{" "}
                  <code className="rounded bg-mist px-1">{"{roll}"}</code> and{" "}
                  <code className="rounded bg-mist px-1">{"{name}"}</code> placeholders.
                </p>
                <Toggle label="Show blood group" checked={design.backSide.bloodGroupVisible} onChange={(v) => patch("backSide", { bloodGroupVisible: v })} className="sm:col-span-2" />
              </SectionCard>
            </div>
          )}
        </div>

        {/* Live preview — both sides shown stacked, like the member portals */}
        <div className="shrink-0 border-t border-line bg-slate-950 p-4 lg:w-[46%] lg:border-l lg:border-t-0">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Live preview
          </p>
          <div className="flex flex-col items-center gap-4 overflow-hidden rounded-xl bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06),transparent_70%)] p-4">
            <ScaledCard
              config={previewConfig}
              side="front"
              id="admin-card-preview-front"
              className="rounded-xl shadow-2xl shadow-black/40"
            />
            <ScaledCard
              config={previewConfig}
              side="back"
              id="admin-card-preview-back"
              className="rounded-xl shadow-2xl shadow-black/40"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
