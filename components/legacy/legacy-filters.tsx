"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Loader2, Search, X } from "lucide-react";
import {
  Input,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";

interface LegacyFiltersProps {
  departments: readonly string[];
  sessions: readonly string[];
  current: { search?: string; department?: string; session?: string };
}

export function LegacyFilters({ departments, sessions, current }: LegacyFiltersProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const apply = (next: { search?: string; department?: string; session?: string }) => {
    const params = new URLSearchParams();
    if (next.search) params.set("search", next.search);
    if (next.department) params.set("department", next.department);
    if (next.session) params.set("session", next.session);
    startTransition(() => router.push(`/legacy-members?${params.toString()}`));
  };

  const hasFilters = Boolean(current.search || current.department || current.session);

  return (
    <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50/40 via-white to-amber-50/40 p-4 shadow-xs">
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-[1fr_auto_auto_auto]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            apply({ ...current, search: (fd.get("search") as string) || undefined });
          }}
          className="relative"
        >
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-700/60"
            aria-hidden
          />
          <Input
            name="search"
            placeholder="Search legacy members by name…"
            defaultValue={current.search}
            className="border-amber-200/80 bg-white pl-9 text-xs focus-visible:ring-amber-500/30"
            aria-label="Search legacy members by name"
          />
        </form>

        <Select
          value={current.department || "__all"}
          onValueChange={(v) =>
            apply({ ...current, department: v === "__all" ? undefined : v })
          }
        >
          <SelectTrigger className="border-amber-200/80 bg-white text-xs sm:w-48" aria-label="Filter by department">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All Departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={current.session || "__all"}
          onValueChange={(v) =>
            apply({ ...current, session: v === "__all" ? undefined : v })
          }
        >
          <SelectTrigger className="border-amber-200/80 bg-white text-xs sm:w-36" aria-label="Filter by session">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All Sessions</SelectItem>
            {sessions.map((s) => (
              <SelectItem key={s} value={s}>
                Session {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => apply({})}
            disabled={pending}
            className="text-xs text-amber-900 hover:bg-amber-100 hover:text-amber-950"
          >
            {pending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <X className="mr-1 h-3.5 w-3.5" />
            )}
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
