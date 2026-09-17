"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Loader2, Search, X, GraduationCap, Calendar } from "lucide-react";
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
    <div className="space-y-4">
      {/* Session Quick Selection Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mr-1 flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-amber-700" />
          সেশন আর্কাইভ:
        </span>
        <button
          type="button"
          onClick={() => apply({ ...current, session: undefined })}
          className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
            !current.session
              ? "bg-amber-700 text-white shadow-xs"
              : "border border-line bg-white text-muted-foreground hover:bg-mist hover:text-foreground"
          }`}
        >
          সব সেশন
        </button>
        {sessions.map((s) => {
          const isSelected = current.session === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => apply({ ...current, session: isSelected ? undefined : s })}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                isSelected
                  ? "bg-amber-700 text-white shadow-xs"
                  : "border border-line bg-white text-muted-foreground hover:bg-mist hover:text-foreground"
              }`}
            >
              সেশন {s}
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-line bg-white p-4 sm:p-5 shadow-xs">
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
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60"
            aria-hidden
          />
          <Input
            name="search"
            placeholder="Search legacy members by name…"
            defaultValue={current.search}
            className="h-11 rounded-full border-slate-200 bg-slate-50/60 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:bg-white focus:border-crescent focus:ring-4 focus:ring-crescent/15 transition-all"
            aria-label="Search legacy members by name"
          />
        </form>

        <div className="relative">
          <GraduationCap className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 z-10" />
          <Select
            value={current.department || "__all"}
            onValueChange={(v) =>
              apply({ ...current, department: v === "__all" ? undefined : v })
            }
          >
            <SelectTrigger
              className="h-11 rounded-full border-slate-200 bg-slate-50/60 pl-10 pr-4 text-sm text-foreground focus:bg-white focus-visible:border-crescent focus-visible:ring-4 focus-visible:ring-crescent/15 transition-all sm:w-52"
              aria-label="Filter by department"
            >
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
        </div>

        <div className="relative">
          <Calendar className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 z-10" />
          <Select
            value={current.session || "__all"}
            onValueChange={(v) =>
              apply({ ...current, session: v === "__all" ? undefined : v })
            }
          >
            <SelectTrigger
              className="h-11 rounded-full border-slate-200 bg-slate-50/60 pl-10 pr-4 text-sm text-foreground focus:bg-white focus-visible:border-crescent focus-visible:ring-4 focus-visible:ring-crescent/15 transition-all sm:w-40"
              aria-label="Filter by session"
            >
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
        </div>

        {hasFilters && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => apply({})}
            disabled={pending}
            className="h-11 rounded-full border border-slate-200 bg-slate-100/70 px-5 text-xs font-semibold text-muted-foreground hover:bg-slate-200 hover:text-foreground transition-all"
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
  </div>
  );
}
