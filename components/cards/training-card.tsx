import { GraduationCap, CalendarDays, MapPin, UserRound } from "lucide-react";
import type { Training } from "@/types/database";
import { StatusBadge, statusTone } from "@/components/shared/status-badge";
import { formatDate } from "@/lib/constants";

export function TrainingCard({
  training,
  locale = "en",
}: {
  training: Training;
  locale?: string;
}) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-line bg-white p-6 transition-all hover:border-brand/40 hover:shadow-sm">
      <div className="flex items-center justify-between">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-poly-soft text-poly">
          <GraduationCap className="h-5.5 w-5.5" aria-hidden />
        </span>
        <StatusBadge
          label={training.status}
          tone={statusTone(training.status)}
        />
      </div>
      <h3 className="mt-4 font-semibold text-foreground">{training.title}</h3>
      {training.category && (
        <p className="mt-1 text-xs font-medium text-brand">{training.category}</p>
      )}
      <div className="mt-4 space-y-2 text-sm text-muted-foreground">
        {training.date && (
          <p className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-poly" aria-hidden />
            {formatDate(training.date, locale === "bn" ? "bn-BD" : "en-GB")}
          </p>
        )}
        {training.trainer && (
          <p className="flex items-center gap-2">
            <UserRound className="h-4 w-4 text-poly" aria-hidden />
            {training.trainer}
          </p>
        )}
        {training.location && (
          <p className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-poly" aria-hidden />
            {training.location}
          </p>
        )}
      </div>
      {training.description && (
        <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {training.description}
        </p>
      )}
    </div>
  );
}
