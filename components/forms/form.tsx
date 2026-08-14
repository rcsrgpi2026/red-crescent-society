"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/actions";

interface FormShellProps {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  children: (errors: Record<string, string[]> | undefined) => React.ReactNode;
  className?: string;
}

export function FormShell({ action, children, className }: FormShellProps) {
  const [state, formAction] = useActionState<ActionResult, FormData>(action, {
    success: false,
  });

  return (
    <form action={formAction} className={cn("space-y-5", className)} noValidate>
      {state.success && (
        <div
          role="status"
          className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm text-emerald-800"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>{state.message}</p>
        </div>
      )}
      {!state.success && state.message && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-crescent/30 bg-crescent-soft p-3.5 text-sm text-crescent"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>{state.message}</p>
        </div>
      )}
      {children(state.errors)}
      {state.success && (
        <div className="rounded-xl bg-brand-soft p-4 text-sm text-brand-ink">
          <p className="font-semibold">What happens next?</p>
          <p className="mt-1 text-brand-ink/90">
            Our leadership reviews every submission. Approved volunteers receive a member ID
            and digital membership card from the admin panel.
          </p>
        </div>
      )}
    </form>
  );
}

export function FieldError({
  errors,
  name,
}: {
  errors?: Record<string, string[]>;
  name: string;
}) {
  if (!errors?.[name]) return null;
  return (
    <p id={`${name}-error`} role="alert" className="mt-1.5 text-xs font-medium text-crescent">
      {errors[name][0]}
    </p>
  );
}

export function SubmitButton({
  children,
  className,
  variant = "default",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary";
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} disabled={pending} className={className}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
      {pending ? "Submitting…" : children}
    </Button>
  );
}
