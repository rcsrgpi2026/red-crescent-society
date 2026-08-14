"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="flex min-h-[60vh] items-center justify-center bg-white px-6 py-20">
      <div className="text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <AlertTriangle className="h-8 w-8" aria-hidden />
        </span>
        <h1 className="mt-6 text-balance text-3xl font-bold tracking-tight text-foreground">
          Something went wrong
        </h1>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          An unexpected error occurred while loading this page. Please try again — if the
          problem persists, contact the society team.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button onClick={reset}>Try again</Button>
          <Button asChild variant="outline">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
