import { cn } from "@/lib/utils";

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  tone?: "brand" | "crescent" | "poly";
}

export function PageHero({
  eyebrow,
  title,
  description,
  children,
  className,
  tone = "brand",
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
      <div className="container-site relative py-14 sm:py-20">
        {eyebrow && (
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-brand">
            {eyebrow}
          </p>
        )}
        <h1 className="max-w-3xl text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="mt-4 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            {description}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}
