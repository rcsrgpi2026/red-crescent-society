"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { addPoints } from "@/lib/admin-actions";
import { Input, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui";
import { POINT_CATEGORIES } from "@/lib/constants";

export function PointsForm({ volunteerId }: { volunteerId: string }) {
  const [busy, setBusy] = useState(false);
  const [category, setCategory] = useState("EVENT_PARTICIPATION");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    fd.set("volunteerId", volunteerId);
    fd.set("category", category);
    const result = await addPoints(fd);
    setBusy(false);
    if (result.success) {
      toast.success(result.message ?? "Points added.");
      e.currentTarget.reset();
    } else {
      toast.error(result.message ?? "Failed.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-2">
      <div className="flex-1">
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger aria-label="Points category" className="h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(POINT_CATEGORIES).map(([key, pts]) => (
              <SelectItem key={key} value={key}>
                {key.replace(/_/g, " ").toLowerCase()} (+{pts})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Input name="points" type="number" placeholder="Points" className="h-9 w-20" aria-label="Points value" />
      <Input name="reason" placeholder="Reason (optional)" className="h-9 flex-1" aria-label="Reason" />
      <Button type="submit" size="sm" disabled={busy} className="h-9">
        {busy ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" aria-hidden /> : <Plus className="mr-1 h-3.5 w-3.5" aria-hidden />}
        Add
      </Button>
    </form>
  );
}
