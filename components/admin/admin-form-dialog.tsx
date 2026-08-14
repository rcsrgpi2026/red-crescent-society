"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FormErrorProvider } from "@/components/admin/form-error";
import type { ActionResult } from "@/lib/actions";

export { FieldError } from "@/components/admin/form-error";

type AdminAction = (formData: FormData) => Promise<ActionResult>;

interface AdminFormDialogProps {
  trigger: React.ReactNode;
  title: string;
  description?: string;
  action: AdminAction;
  children: React.ReactNode;
  submitLabel?: string;
}

export function AdminFormDialog({
  trigger,
  title,
  description,
  action,
  children,
  submitLabel = "Save",
}: AdminFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]> | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErrors(undefined);
    setError(undefined);
    const fd = new FormData(e.currentTarget);
    const result = await action(fd);
    setBusy(false);
    if (result.success) {
      setOpen(false);
      setResetKey((k) => k + 1);
      toast.success(result.message ?? "Saved.");
    } else if (result.errors) {
      setErrors(result.errors);
      setError(result.message);
    } else {
      setError(result.message ?? "Something went wrong.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <form key={resetKey} onSubmit={onSubmit} className="space-y-4" noValidate>
          {error && (
            <p role="alert" className="rounded-lg bg-crescent-soft px-3 py-2 text-sm text-crescent">
              {error}
            </p>
          )}
          <FormErrorProvider errors={errors}>{children}</FormErrorProvider>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
              {submitLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
