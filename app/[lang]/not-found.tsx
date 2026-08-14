import Link from "next/link";
import { SearchX, HeartPulse } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="flex min-h-[60vh] items-center justify-center bg-white px-6 py-20">
      <div className="text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-crescent-soft text-crescent">
          <SearchX className="h-8 w-8" aria-hidden />
        </span>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-brand">
          404 · Not found
        </p>
        <h1 className="mt-3 text-balance text-4xl font-bold tracking-tight text-foreground">
          This page has gone off duty
        </h1>
        <p className="mx-auto mt-4 max-w-md text-muted-foreground">
          The page you are looking for does not exist or has been moved. Let&apos;s get you back
          to serving the community.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild>
            <Link href="/">Back to Home</Link>
          </Button>
          <Button asChild variant="outline" className="border-crescent/30 text-crescent hover:bg-crescent-soft">
            <Link href="/blood-support">
              <HeartPulse className="mr-1.5 h-4 w-4" aria-hidden />
              Blood Support
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
