"use client";

import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ActionResult } from "@/lib/actions";

interface InlineStatusProps {
  action: (formData: FormData) => Promise<ActionResult>;
  id: string;
  value: string;
  options: { value: string; label: string }[];
  name?: string;
}

export function InlineStatus({ action, id, value, options, name = "status" }: InlineStatusProps) {
  async function onChange(next: string) {
    const fd = new FormData();
    fd.set("id", id);
    fd.set(name, next);
    const result = await action(fd);
    if (result.success) {
      toast.success(result.message ?? "Updated.");
    } else {
      toast.error(result.message ?? "Update failed.");
    }
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-8 w-36 text-xs" aria-label="Update status">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
