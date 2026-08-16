import { GraduationCap, CalendarDays, Hourglass, CheckCircle2, XCircle, UserX, Ban } from "lucide-react";
import type { MyTrainingEnrollment } from "@/types/database";
import { formatDate } from "@/lib/constants";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending approval",
  APPROVED: "Enrolled",
  REJECTED: "Rejected",
  COMPLETED: "Completed",
  DROPPED: "Dropped",
};

const STATUS_ICONS = {
  PENDING: Hourglass,
  APPROVED: CheckCircle2,
  REJECTED: XCircle,
  COMPLETED: CheckCircle2,
  DROPPED: Ban,
};

export function MyTrainings({ enrollments }: { enrollments: MyTrainingEnrollment[] }) {
  return (
    <div className="mt-10">
      <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
        <GraduationCap className="h-5 w-5 text-brand" aria-hidden />
        My trainings
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Join a training from the training page — requests are approved by the society leadership.
      </p>

      {enrollments.length === 0 ? (
        <div className="mt-4 rounded-xl border border-line bg-mist/50 p-6 text-sm text-muted-foreground">
          You haven't joined any trainings yet. Check the{" "}
          <a href="/training" className="font-semibold text-brand hover:underline">
            training page
          </a>{" "}
          to request a spot.
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-line rounded-xl border border-line bg-white">
          {enrollments.map((en) => {
            const Icon = STATUS_ICONS[en.status] ?? Hourglass;
            return (
              <li key={en.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-poly-soft text-poly">
                    <GraduationCap className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {en.training.title}
                    </p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      {en.training.date ? (
                        <>
                          <CalendarDays className="h-3 w-3" aria-hidden />
                          {formatDate(en.training.date)}
                        </>
                      ) : (
                        "Date to be announced"
                      )}
                      {en.training.category && <span>· {en.training.category}</span>}
                    </p>
                  </div>
                </div>

                <div className="shrink-0">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold",
                      en.status === "PENDING" && "border-amber-200 bg-amber-50 text-amber-700",
                      en.status === "APPROVED" && "border-emerald-200 bg-emerald-50 text-emerald-700",
                      en.status === "COMPLETED" && "border-emerald-200 bg-emerald-50 text-emerald-700",
                      en.status === "REJECTED" && "border-crescent/20 bg-crescent-soft text-crescent",
                      en.status === "DROPPED" && "border-line bg-mist text-muted-foreground"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                    {STATUS_LABELS[en.status] ?? en.status}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
        <UserX className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        Completed trainings earn a certificate with a unique verification link — issued by the
        society leadership.
      </p>
    </div>
  );
}
