import { cn } from "@/lib/utils";

type Tone = "brand" | "crescent" | "poly" | "neutral" | "warning" | "success";

const TONES: Record<Tone, string> = {
  brand: "bg-brand-soft text-brand-ink",
  crescent: "bg-crescent-soft text-crescent",
  poly: "bg-poly-soft text-poly",
  neutral: "bg-mist text-muted-foreground border border-line",
  warning: "bg-amber-50 text-amber-700",
  success: "bg-emerald-50 text-emerald-700",
};

export function StatusBadge({
  label,
  tone = "neutral",
  className,
}: {
  label: string;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        TONES[tone],
        className
      )}
    >
      {label}
    </span>
  );
}

/** Maps a status string to a badge tone + label. */
export function statusTone(status: string): Tone {
  switch (status) {
    case "APPROVED":
    case "COMPLETED":
    case "DONOR_FOUND":
    case "AVAILABLE":
    case "PUBLISHED":
      return "success";
    case "PENDING":
    case "UPCOMING":
    case "CONTACTING_DONOR":
    case "REGISTERED":
    case "NEW":
      return "warning";
    case "REJECTED":
    case "CANCELLED":
    case "EMERGENCY":
    case "DRAFT":
      return "crescent";
    case "URGENT":
      return "crescent";
    case "ONGOING":
    case "UNPUBLISHED":
      return "brand";
    default:
      return "neutral";
  }
}
