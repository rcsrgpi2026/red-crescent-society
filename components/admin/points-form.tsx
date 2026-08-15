"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { addPoints } from "@/lib/admin-actions";
import { Input, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui";
import { POINT_CATEGORIES } from "@/lib/constants";

type PointKey = keyof typeof POINT_CATEGORIES;

export function PointsForm({
  volunteerId,
  pointValues,
}: {
  volunteerId: string;
  /** Per-category point values from Admin → Settings; falls back to defaults. */
  pointValues?: Partial<Record<PointKey, number>>;
}) {
  const [busy, setBusy] = useState(false);
  const [category, setCategory] = useState<PointKey>("EVENT_PARTICIPATION");
  const [points, setPoints] = useState(
    () => String(pointValues?.EVENT_PARTICIPATION ?? POINT_CATEGORIES.EVENT_PARTICIPATION)
  );
  const reasonRef = useRef<HTMLInputElement>(null);

  const pointFor = (key: PointKey) => pointValues?.[key] ?? POINT_CATEGORIES[key];

  function onCategoryChange(key: string) {
    setCategory(key as PointKey);
    setPoints(String(pointFor(key as PointKey)));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    try {
      const fd = new FormData(e.currentTarget);
      fd.set("volunteerId", volunteerId);
      fd.set("category", category);
      const result = await addPoints(fd);
      if (result.success) {
        toast.success(result.message ?? "Points added.");
        setPoints(String(pointFor(category)));
        if (reasonRef.current) reasonRef.current.value = "";
      } else {
        toast.error(result.message ?? "Failed.");
      }
    } catch (error) {
      console.error("addPoints failed:", error);
      toast.error("Failed to add points — please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-2">
      <div className="flex-1">
        <Select value={category} onValueChange={onCategoryChange}>
          <SelectTrigger aria-label="Points category" className="h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(POINT_CATEGORIES).map((key) => {
              const k = key as PointKey;
              return (
                <SelectItem key={k} value={k}>
                  {k.replace(/_/g, " ").toLowerCase()} (+{pointFor(k)})
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
      <Input
        name="points"
        type="number"
        placeholder="Points"
        value={points}
        onChange={(e) => setPoints(e.target.value)}
        className="h-9 w-20"
        aria-label="Points value"
      />
      <Input ref={reasonRef} name="reason" placeholder="Reason (optional)" className="h-9 flex-1" aria-label="Reason" />
      <Button type="submit" size="sm" disabled={busy} className="h-9">
        {busy ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" aria-hidden /> : <Plus className="mr-1 h-3.5 w-3.5" aria-hidden />}
        Add
      </Button>
    </form>
  );
}
