"use client";

import { useActionState } from "react";
import { Loader2, Hourglass, CheckCircle2, Award } from "lucide-react";
import { joinTraining } from "@/lib/actions";
import { cn } from "@/lib/utils";

type EnrollmentStatus = "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED" | "DROPPED";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  COMPLETED: "border-brand/25 bg-brand-soft text-brand-dark",
};

export function TrainingJoinButton({
  trainingId,
  label,
  requestAgainLabel,
  status,
  statusLabels,
}: {
  trainingId: string;
  label: string;
  requestAgainLabel: string;
  status: string | null;
  statusLabels: Record<"PENDING" | "APPROVED" | "COMPLETED" | "DROPPED", string>;
}) {
  const [state, formAction, pending] = useActionState(joinTraining, null);

  // Already requested or enrolled — show the state instead of the join button.
  if (status && status !== "REJECTED" && status !== "DROPPED") {
    const key = status as "PENDING" | "APPROVED" | "COMPLETED";
    const Icon =
      key === "PENDING" ? Hourglass : key === "APPROVED" ? CheckCircle2 : Award;
    return (
      <div className="mt-auto pt-4">
        <span
          className={cn(
            "inline-flex w-full items-center justify-center gap-1.5 rounded-full border px-5 py-2.5 text-sm font-semibold",
            STATUS_STYLES[key]
          )}
        >
          <Icon className="h-4 w-4" aria-hidden />
          {statusLabels[key]}
        </span>
      </div>
    );
  }

  const canRequestAgain = status === "REJECTED" || status === "DROPPED";

  return (
    <div className="mt-auto pt-4">
      <form action={formAction}>
        <input type="hidden" name="trainingId" value={trainingId} />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {canRequestAgain ? requestAgainLabel : label}
        </button>
      </form>
      {state?.message && (
        <p
          className={`mt-2 text-center text-xs font-medium ${
            state.success ? "text-brand-dark" : "text-crescent"
          }`}
        >
          {state.message}
        </p>
      )}
    </div>
  );
}
