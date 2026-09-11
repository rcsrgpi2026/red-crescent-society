"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  SlidersHorizontal,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  RotateCcw,
  Save,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  CalendarDays,
  UserPlus,
  HeartPulse,
  Mail,
  Loader2,
  AlertCircle,
  Info,
} from "lucide-react";
import { Button, Input, Label, Textarea, Checkbox } from "@/components/ui";
import { saveFormConfigsAction, resetFormConfigsAction } from "@/lib/admin-actions";
import { DEFAULT_FORM_CONFIGS, type FormConfig, type FormFieldConfig, type FormKey, type FieldType } from "@/types/form-editor";

interface FormEditorClientProps {
  initialConfigs: Record<FormKey, FormConfig>;
}

const FORM_META: Record<FormKey, { icon: any; color: string; bg: string }> = {
  event_registration: { icon: CalendarDays, color: "text-brand", bg: "bg-brand/10" },
  volunteer_application: { icon: UserPlus, color: "text-poly", bg: "bg-poly/10" },
  blood_request: { icon: HeartPulse, color: "text-crescent", bg: "bg-crescent/10" },
  contact: { icon: Mail, color: "text-amber-600", bg: "bg-amber-500/10" },
};

export function FormEditorClient({ initialConfigs }: FormEditorClientProps) {
  const [configs, setConfigs] = useState<Record<FormKey, FormConfig>>(initialConfigs);
  const [activeKey, setActiveKey] = useState<FormKey>("event_registration");
  const [busy, setBusy] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [previewActive, setPreviewActive] = useState(false);

  // New field modal state
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState<FieldType>("text");
  const [newFieldPlaceholder, setNewFieldPlaceholder] = useState("");
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [newFieldOptions, setNewFieldOptions] = useState("");

  const activeForm = configs[activeKey] || DEFAULT_FORM_CONFIGS[activeKey];
  const sortedFields = [...(activeForm?.fields ?? [])].sort((a, b) => a.order - b.order);

  function updateField(id: string, updates: Partial<FormFieldConfig>) {
    setConfigs((prev) => {
      const currentForm = prev[activeKey];
      const updatedFields = currentForm.fields.map((f) => (f.id === id ? { ...f, ...updates } : f));
      return {
        ...prev,
        [activeKey]: { ...currentForm, fields: updatedFields },
      };
    });
  }

  function moveField(id: string, direction: "up" | "down") {
    const list = [...sortedFields];
    const index = list.findIndex((f) => f.id === id);
    if (index === -1) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    // Swap orders
    const temp = list[index].order;
    list[index].order = list[targetIndex].order;
    list[targetIndex].order = temp;

    setConfigs((prev) => ({
      ...prev,
      [activeKey]: { ...prev[activeKey], fields: list },
    }));
  }

  function deleteField(id: string) {
    if (!confirm("Are you sure you want to remove this field?")) return;
    setConfigs((prev) => {
      const currentForm = prev[activeKey];
      return {
        ...prev,
        [activeKey]: {
          ...currentForm,
          fields: currentForm.fields.filter((f) => f.id !== id),
        },
      };
    });
    toast.success("Field removed.");
  }

  function handleAddField() {
    if (!newFieldLabel.trim()) {
      toast.error("Please provide a field label / name.");
      return;
    }

    const fieldId = `custom_${Date.now()}`;
    const name = newFieldLabel.toLowerCase().replace(/[^a-z0-9]/g, "_") || fieldId;
    const options =
      newFieldType === "select"
        ? newFieldOptions
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;

    const newField: FormFieldConfig = {
      id: fieldId,
      name,
      label: newFieldLabel.trim(),
      placeholder: newFieldPlaceholder.trim() || undefined,
      type: newFieldType,
      required: newFieldRequired,
      enabled: true,
      isCore: false,
      options,
      order: sortedFields.length + 1,
    };

    setConfigs((prev) => ({
      ...prev,
      [activeKey]: {
        ...prev[activeKey],
        fields: [...prev[activeKey].fields, newField],
      },
    }));

    setNewFieldLabel("");
    setNewFieldPlaceholder("");
    setNewFieldOptions("");
    setNewFieldRequired(false);
    setNewFieldType("text");
    setShowAddModal(false);
    toast.success("Custom field added.");
  }

  async function handleSave() {
    setBusy(true);
    try {
      const res = await saveFormConfigsAction(activeKey, JSON.stringify(activeForm.fields));
      if (res.success) {
        toast.success(res.message || "Form configuration saved!");
      } else {
        toast.error(res.message || "Could not save configuration.");
      }
    } catch (err) {
      toast.error("Failed to save changes.");
    } finally {
      setBusy(false);
    }
  }

  async function handleReset() {
    if (!confirm("Are you sure you want to reset this form to default fields? Custom changes will be removed.")) {
      return;
    }
    setBusy(true);
    try {
      const res = await resetFormConfigsAction(activeKey);
      if (res.success) {
        toast.success("Reset to default configuration!");
        window.location.reload();
      } else {
        toast.error(res.message || "Could not reset configuration.");
      }
    } catch (err) {
      toast.error("Failed to reset.");
    } finally {
      setBusy(false);
    }
  }

  const ActiveIcon = FORM_META[activeKey].icon;

  return (
    <div className="space-y-6">
      {/* Top Form Selector Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line pb-4">
        {(Object.keys(DEFAULT_FORM_CONFIGS) as FormKey[]).map((key) => {
          const cfg = configs[key] || DEFAULT_FORM_CONFIGS[key];
          const meta = FORM_META[key];
          const Icon = meta?.icon || CalendarDays;
          const isActive = key === activeKey;
          const rawTitle = cfg?.title || DEFAULT_FORM_CONFIGS[key]?.title || key;
          const shortTitle = rawTitle.includes("(") ? rawTitle.split("(")[0].trim() : rawTitle;

          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveKey(key)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                isActive
                  ? "bg-foreground text-background shadow-sm"
                  : "bg-white text-muted-foreground hover:bg-mist/70 hover:text-foreground border border-line"
              }`}
            >
              <span className={`p-1 rounded-lg ${isActive ? "bg-white/20 text-white" : `${meta?.bg || "bg-mist"} ${meta?.color || "text-foreground"}`}`}>
                <Icon className="h-4 w-4" />
              </span>
              <span>{shortTitle}</span>
            </button>
          );
        })}
      </div>

      {/* Header Info Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-gradient-to-r from-white via-mist/20 to-mist/40 p-5 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${FORM_META[activeKey].bg} ${FORM_META[activeKey].color} shadow-xs`}>
            <ActiveIcon className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span>{activeForm?.title || DEFAULT_FORM_CONFIGS[activeKey]?.title || activeKey}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand/10 text-brand">
                {sortedFields.filter((f) => f.enabled).length} Active Fields
              </span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">{activeForm?.description || DEFAULT_FORM_CONFIGS[activeKey]?.description || ""}</p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPreviewActive(!previewActive)}
            className={`gap-1.5 text-xs ${previewActive ? "border-brand text-brand bg-brand-soft/30" : "bg-white"}`}
          >
            <Eye className="h-3.5 w-3.5" />
            <span>{previewActive ? "Hide Preview" : "Live Preview"}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={busy}
            className="gap-1.5 text-xs text-muted-foreground hover:text-destructive bg-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Default</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={busy}
            className="gap-1.5 text-xs bg-brand hover:bg-brand-dark shadow-sm"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            <span>Save Configuration</span>
          </Button>
        </div>
      </div>

      {/* Main Grid: Left is Fields list, Right is Live Preview if active */}
      <div className={`grid gap-6 ${previewActive ? "lg:grid-cols-12" : "grid-cols-1"}`}>
        {/* Fields Editor Column */}
        <div className={previewActive ? "lg:col-span-7 space-y-4" : "space-y-4"}>
          <div className="flex items-center justify-between gap-2 pb-1">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-brand" />
              <span>ফর্মের ফিল্ডসমূহ (Fields Management)</span>
            </h3>
            <Button
              type="button"
              size="sm"
              onClick={() => setShowAddModal(true)}
              className="h-8 gap-1.5 text-xs bg-white text-brand border border-brand/30 hover:bg-brand-soft/40"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>+ নতুন ফিল্ড যোগ করুন</span>
            </Button>
          </div>

          <div className="space-y-3">
            {sortedFields.map((field, idx) => {
              return (
                <div
                  key={field.id}
                  className={`rounded-2xl border transition-all p-4 bg-white ${
                    field.enabled ? "border-line shadow-xs hover:border-brand/30" : "border-line/60 bg-mist/30 opacity-70"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 pb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-mist text-xs font-bold text-muted-foreground shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">{field.label}</p>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                          <span className="font-mono text-xs bg-mist px-1.5 py-0.2 rounded">{field.name}</span>
                          <span>·</span>
                          <span className="capitalize font-medium text-poly">{field.type}</span>
                          {field.isCore && (
                            <>
                              <span>·</span>
                              <span className="text-amber-600 font-medium">Core Field</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Toggles */}
                    <div className="flex items-center gap-3 shrink-0">
                      {/* Required toggle */}
                      <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
                        <Checkbox
                          checked={field.required}
                          disabled={!field.enabled}
                          onCheckedChange={(c) => updateField(field.id, { required: Boolean(c) })}
                        />
                        <span className={field.required ? "font-semibold text-crescent" : "text-muted-foreground"}>
                          {field.required ? "Required *" : "Optional"}
                        </span>
                      </label>

                      {/* Enable/Disable toggle */}
                      <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none border-l border-line pl-3">
                        <Checkbox
                          checked={field.enabled}
                          onCheckedChange={(c) => updateField(field.id, { enabled: Boolean(c) })}
                        />
                        <span className={field.enabled ? "font-semibold text-emerald-600" : "text-muted-foreground line-through"}>
                          {field.enabled ? "Enabled" : "Disabled"}
                        </span>
                      </label>

                      {/* Reorder Buttons */}
                      <div className="flex items-center gap-1 border-l border-line pl-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={idx === 0}
                          onClick={() => moveField(field.id, "up")}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                          title="Move up"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={idx === sortedFields.length - 1}
                          onClick={() => moveField(field.id, "down")}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                          title="Move down"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      {/* Delete button (only for custom fields) */}
                      {!field.isCore && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteField(field.id)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          title="Delete field"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Field Label & Placeholder Inline Editors */}
                  {field.enabled && (
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <Label className="text-[11px] font-medium text-muted-foreground">
                          ফিল্ডের নাম / শিরোনাম (Display Label)
                        </Label>
                        <Input
                          value={field.label}
                          onChange={(e) => updateField(field.id, { label: e.target.value })}
                          className="mt-1 h-8 text-xs bg-white"
                          placeholder="Label name"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] font-medium text-muted-foreground">
                          প্লেসহোল্ডার টেক্সট (Placeholder)
                        </Label>
                        <Input
                          value={field.placeholder ?? ""}
                          onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                          className="mt-1 h-8 text-xs bg-white"
                          placeholder="e.g. Enter details..."
                        />
                      </div>

                      {field.type === "select" && field.options && (
                        <div className="sm:col-span-2">
                          <Label className="text-[11px] font-medium text-muted-foreground">
                            ড্রপডাউন অপশনসমূহ (কমা দিয়ে আলাদা করুন)
                          </Label>
                          <Input
                            value={field.options.join(", ")}
                            onChange={(e) =>
                              updateField(field.id, {
                                options: e.target.value
                                  .split(",")
                                  .map((s) => s.trim())
                                  .filter(Boolean),
                              })
                            }
                            className="mt-1 h-8 text-xs bg-white"
                            placeholder="Option 1, Option 2, Option 3"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Preview Column */}
        {previewActive && (
          <div className="lg:col-span-5">
            <div className="sticky top-6 rounded-2xl border-2 border-brand/20 bg-white p-5 shadow-md">
              <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-brand" />
                  <h4 className="text-sm font-bold text-foreground">লাইভ প্রিভিউ (Live Preview)</h4>
                </div>
                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Real-time Form
                </span>
              </div>

              <div className="space-y-4">
                {sortedFields
                  .filter((f) => f.enabled)
                  .map((field) => {
                    return (
                      <div key={field.id} className="space-y-1">
                        <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                          <span>
                            {field.label} {field.required && <span className="text-crescent">*</span>}
                          </span>
                          {!field.required && <span className="text-[10px] text-muted-foreground font-normal">Optional</span>}
                        </Label>

                        {field.type === "textarea" ? (
                          <Textarea
                            placeholder={field.placeholder}
                            rows={3}
                            disabled
                            className="text-xs bg-mist/30 cursor-not-allowed"
                          />
                        ) : field.type === "select" ? (
                          <select
                            disabled
                            className="h-8 w-full rounded-md border border-input bg-mist/30 px-2 text-xs text-muted-foreground cursor-not-allowed"
                          >
                            <option>{field.placeholder || "Select option..."}</option>
                            {field.options?.map((opt) => (
                              <option key={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : field.type === "checkbox" ? (
                          <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                            <Checkbox disabled />
                            <span>{field.placeholder || field.label}</span>
                          </label>
                        ) : (
                          <Input
                            type={field.type}
                            placeholder={field.placeholder}
                            disabled
                            className="h-8 text-xs bg-mist/30 cursor-not-allowed"
                          />
                        )}
                      </div>
                    );
                  })}

                <div className="pt-2">
                  <button
                    type="button"
                    disabled
                    className="w-full rounded-xl bg-brand py-2.5 text-xs font-bold text-white shadow-xs opacity-90 cursor-not-allowed"
                  >
                    Submit Form (Preview)
                  </button>
                  <p className="text-[11px] text-muted-foreground text-center mt-2">
                    ওয়েবসাইটে ইউজাররা ঠিক এভাবেই ফর্মটি দেখতে পাবেন।
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Custom Field Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in-50 duration-150">
          <div className="w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-brand" />
                <span>নতুন কাস্টম ফিল্ড যোগ করুন</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-mist"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3.5">
              <div>
                <Label htmlFor="nf-label" className="text-xs font-semibold">
                  ফিল্ডের নাম / লেবেল *
                </Label>
                <Input
                  id="nf-label"
                  value={newFieldLabel}
                  onChange={(e) => setNewFieldLabel(e.target.value)}
                  placeholder="e.g. ট্রানজেকশন আইডি (TrxID) বা টি-শার্ট সাইজ"
                  className="mt-1 h-9 text-xs"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="nf-type" className="text-xs font-semibold">
                    ফিল্ডের ধরন (Type)
                  </Label>
                  <select
                    id="nf-type"
                    value={newFieldType}
                    onChange={(e) => setNewFieldType(e.target.value as FieldType)}
                    className="mt-1 h-9 w-full rounded-md border border-input bg-white px-2 text-xs"
                  >
                    <option value="text">Text (সাধারণ লেখা)</option>
                    <option value="number">Number (সংখ্যা)</option>
                    <option value="email">Email (ইমেইল)</option>
                    <option value="tel">Phone (ফোন নম্বর)</option>
                    <option value="textarea">Textarea (বড় প্যারাগ্রাফ)</option>
                    <option value="select">Dropdown (ড্রপডাউন লিস্ট)</option>
                    <option value="checkbox">Checkbox (টিকবক্স)</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="nf-ph" className="text-xs font-semibold">
                    প্লেসহোল্ডার (ঐচ্ছিক)
                  </Label>
                  <Input
                    id="nf-ph"
                    value={newFieldPlaceholder}
                    onChange={(e) => setNewFieldPlaceholder(e.target.value)}
                    placeholder="e.g. e.g. M, L, XL"
                    className="mt-1 h-9 text-xs"
                  />
                </div>
              </div>

              {newFieldType === "select" && (
                <div>
                  <Label htmlFor="nf-opt" className="text-xs font-semibold">
                    ড্রপডাউন অপশনসমূহ (কমা দিয়ে লিখুন) *
                  </Label>
                  <Input
                    id="nf-opt"
                    value={newFieldOptions}
                    onChange={(e) => setNewFieldOptions(e.target.value)}
                    placeholder="e.g. S, M, L, XL, XXL"
                    className="mt-1 h-9 text-xs font-mono"
                  />
                </div>
              )}

              <div className="pt-1">
                <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer select-none">
                  <Checkbox
                    checked={newFieldRequired}
                    onCheckedChange={(c) => setNewFieldRequired(Boolean(c))}
                  />
                  <span>এই ফিল্ডটি পূরণ করা বাধ্যতামূলক (Required Field)</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-line mt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddModal(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddField}
                  className="text-xs bg-brand hover:bg-brand-dark"
                >
                  Add Field
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
