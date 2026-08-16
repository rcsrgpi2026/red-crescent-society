"use client";

import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { ActionResult } from "@/lib/actions";

interface InlineStatusProps {
  action: (formData: FormData) => Promise<ActionResult>;
  id: string;
  value: string;
  options: { value: string; label: string }[];
  name?: string;
  /** Optional width classes for the trigger — defaults to a compact fixed width. */
  triggerClassName?: string;
}

export function InlineStatus({
  action,
  id,
  value,
  options,
  name = "status",
  triggerClassName,
}: InlineStatusProps) {
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
      <SelectTrigger
        className={cn("h-8 text-xs", triggerClassName ?? "w-36")}
        aria-label="Update status"
      >
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
