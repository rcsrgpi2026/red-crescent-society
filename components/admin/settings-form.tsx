"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { saveSettings } from "@/lib/admin-actions";
import { Input, Label, Button } from "@/components/ui";

interface SettingsFormProps {
  title: string;
  description?: string;
  group: string;
  fields: { key: string; label: string; placeholder?: string; type?: string }[];
  values: Record<string, string | number>;
}

export function SettingsForm({ title, description, group, fields, values }: SettingsFormProps) {
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const value: Record<string, string> = {};
    for (const field of fields) {
      value[field.key] = String(fd.get(field.key) ?? "");
    }
    const result = await saveSettings(group, value);
    setBusy(false);
    if (result.success) {
      toast.success(`${title} saved.`);
    } else {
      toast.error(result.message ?? "Save failed.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-line bg-white p-6">
      <h2 className="font-semibold text-foreground">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.key} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
            <Label htmlFor={`${group}-${field.key}`}>{field.label}</Label>
            {field.type === "textarea" ? (
              <textarea
                id={`${group}-${field.key}`}
                name={field.key}
                rows={3}
                placeholder={field.placeholder}
                defaultValue={String(values[field.key] ?? "")}
                className="mt-1.5 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              />
            ) : (
              <Input
                id={`${group}-${field.key}`}
                name={field.key}
                type={field.type ?? "text"}
                placeholder={field.placeholder}
                defaultValue={String(values[field.key] ?? "")}
                className="mt-1.5"
              />
            )}
          </div>
        ))}
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
