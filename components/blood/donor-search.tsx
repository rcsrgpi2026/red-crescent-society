"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Search, Loader2, Droplets } from "lucide-react";
import { Input, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui";
import { BLOOD_GROUPS } from "@/lib/constants";

interface DonorSearchProps {
  current: { bloodGroup?: string; area?: string };
}

export function DonorSearch({ current }: DonorSearchProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const apply = (next: { bloodGroup?: string; area?: string }) => {
    const params = new URLSearchParams();
    if (next.bloodGroup) params.set("bloodGroup", next.bloodGroup);
    if (next.area) params.set("area", next.area);
    startTransition(() => router.push(`/blood-support?${params.toString()}`));
  };

  return (
    <div className="rounded-2xl border border-line bg-mist/60 p-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            apply({ ...current, area: (fd.get("area") as string) || undefined });
          }}
          className="relative"
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            name="area"
            placeholder="Search by area (e.g. Kazla, Rajshahi)…"
            defaultValue={current.area}
            className="pl-9"
            aria-label="Search donors by area"
          />
        </form>
        <Select
          value={current.bloodGroup ?? ""}
          onValueChange={(v) => apply({ ...current, bloodGroup: v || undefined })}
        >
          <SelectTrigger className="sm:max-w-44" aria-label="Filter by blood group">
            <SelectValue placeholder="All blood groups" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All blood groups</SelectItem>
            {BLOOD_GROUPS.map((bg) => (
              <SelectItem key={bg} value={bg}>
                <span className="flex items-center gap-2">
                  <Droplets className="h-3.5 w-3.5 text-crescent" aria-hidden />
                  {bg}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(current.bloodGroup || current.area) && (
          <Button variant="ghost" onClick={() => router.push("/blood-support")} className="text-muted-foreground">
            {pending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" aria-hidden /> : null}
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
