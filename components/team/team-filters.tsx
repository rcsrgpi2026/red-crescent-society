"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { Input, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui";

interface TeamMemberFiltersProps {
  departments: readonly string[];
  semesters: readonly string[];
  current: { search?: string; department?: string; semester?: string };
}

export function TeamMemberFilters({ departments, semesters, current }: TeamMemberFiltersProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const apply = (next: { search?: string; department?: string; semester?: string }) => {
    const params = new URLSearchParams();
    if (next.search) params.set("search", next.search);
    if (next.department) params.set("department", next.department);
    if (next.semester) params.set("semester", next.semester);
    startTransition(() => router.push(`/team?${params.toString()}`));
  };

  const hasFilters = Boolean(current.search || current.department || current.semester);

  return (
    <div className="rounded-2xl border border-line bg-mist/60 p-4">
      <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            apply({ ...current, search: (fd.get("search") as string) || undefined });
          }}
          className="relative"
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            name="search"
            placeholder="Search by name…"
            defaultValue={current.search}
            className="pl-9"
            aria-label="Search team members by name"
          />
        </form>
        <Select
          value={current.department || "__all"}
          onValueChange={(v) =>
            apply({ ...current, department: v === "__all" ? undefined : v })
          }
        >
          <SelectTrigger className="md:w-56" aria-label="Filter by department">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={current.semester || "__all"}
          onValueChange={(v) =>
            apply({ ...current, semester: v === "__all" ? undefined : v })
          }
        >
          <SelectTrigger className="md:w-40" aria-label="Filter by semester">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All semesters</SelectItem>
            {semesters.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button
            variant="ghost"
            onClick={() => router.push("/team")}
            className="text-muted-foreground"
          >
            {pending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" aria-hidden /> : <X className="mr-1 h-4 w-4" aria-hidden />}
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
