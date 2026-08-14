import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/shared/reveal";

interface AdminPageHeaderProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  /** Gradient classes for the icon chip, e.g. "from-crescent to-crescent-dark". */
  tone?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function AdminPageHeader({
  icon: Icon,
  title,
  description,
  tone = "bg-gradient-to-br from-brand to-brand-dark",
  actions,
  className,
}: AdminPageHeaderProps) {
  return (
    <Reveal
      className={cn(
        "flex flex-wrap items-center justify-between gap-4",
        className
      )}
    >
      <div className="flex items-center gap-3.5">
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-md shadow-black/10",
            tone
          )}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {description && (
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </Reveal>
  );
}
