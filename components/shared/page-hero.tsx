import { cn } from "@/lib/utils";

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  containerClassName?: string;
  tone?: "brand" | "crescent" | "poly";
  compact?: boolean;
}

export function PageHero({
  eyebrow,
  title,
  description,
  children,
  className,
  containerClassName,
  tone = "brand",
  compact = false,
}: PageHeroProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden border-b border-line bg-mist",
        tone === "crescent" && "bg-crescent-soft/60",
        tone === "poly" && "bg-poly-soft/60",
        className
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full blur-3xl",
          tone === "brand" && "bg-brand-soft",
          tone === "crescent" && "bg-crescent-soft",
          tone === "poly" && "bg-poly-soft"
        )}
        aria-hidden
      />
      <div
        className={cn(
          "container-site relative",
          compact ? "py-5 sm:py-8 lg:py-9" : "py-14 sm:py-20",
          containerClassName
        )}
      >
        {eyebrow && (
          <p
            className={cn(
              "font-semibold uppercase text-brand",
              compact
                ? "mb-1 text-[11px] tracking-wider"
                : "mb-3 text-xs tracking-[0.18em]"
            )}
          >
            {eyebrow}
          </p>
        )}
        <h1
          className={cn(
            "max-w-3xl text-balance font-bold tracking-tight text-foreground",
            compact
              ? "text-2xl sm:text-3xl font-black"
              : "text-4xl sm:text-5xl"
          )}
        >
          {title}
        </h1>
        {description && (
          <p
            className={cn(
              "max-w-2xl text-pretty leading-relaxed text-muted-foreground",
              compact
                ? "mt-1.5 text-xs sm:text-sm"
                : "mt-4 text-base sm:text-lg"
            )}
          >
            {description}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}
