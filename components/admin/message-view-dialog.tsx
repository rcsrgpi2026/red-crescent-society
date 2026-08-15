"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Mail, Phone, Clock, Check, Archive } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { updateMessageStatus } from "@/lib/admin-actions";
import { formatDateTime } from "@/lib/constants";
import type { AdminMessage } from "@/lib/queries";

export function MessageViewDialog({ message }: { message: AdminMessage }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(message.status);

  // When the dialog is opened and the message is still NEW, mark it as read so
  // it no longer counts as unread in the admin list.
  useEffect(() => {
    if (!open || status !== "NEW") return;
    const fd = new FormData();
    fd.set("id", message.id);
    fd.set("status", "READ");
    updateMessageStatus(fd).then((res) => {
      if (res.success) setStatus("READ");
    });
  }, [open, status, message.id]);

  async function setStatusVia(next: "READ" | "ARCHIVED") {
    setBusy(true);
    const fd = new FormData();
    fd.set("id", message.id);
    fd.set("status", next);
    const res = await updateMessageStatus(fd);
    setBusy(false);
    if (res.success) {
      setStatus(next);
      toast.success(res.message ?? `Marked ${next.toLowerCase()}.`);
    } else {
      toast.error(res.message ?? "Could not update the message.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Read message
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto p-5 sm:max-w-3xl lg:max-w-4xl sm:p-6">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <DialogTitle className="flex-1 text-lg">
              {message.subject || "Message"}
            </DialogTitle>
          </div>
          <DialogDescription>
            Sent through the public contact form.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Sender details */}
          <dl className="grid gap-x-6 gap-y-3 rounded-xl border border-line bg-mist/40 p-4 sm:grid-cols-2 sm:p-5">
            <div className="min-w-0">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Name
              </dt>
              <dd className="mt-0.5 text-sm font-medium break-words text-foreground">
                {message.name}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Received
              </dt>
              <dd className="mt-0.5 flex items-center gap-1.5 text-sm text-foreground">
                <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                {formatDateTime(message.created_at)}
              </dd>
            </div>
            {message.email && (
              <div className="min-w-0">
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Email
                </dt>
                <dd className="mt-0.5 flex items-center gap-1.5 text-sm text-brand-dark">
                  <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <a
                    href={`mailto:${message.email}`}
                    className="break-all hover:underline"
                  >
                    {message.email}
                  </a>
                </dd>
              </div>
            )}
            {message.phone && (
              <div className="min-w-0">
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Phone
                </dt>
                <dd className="mt-0.5 flex items-center gap-1.5 text-sm break-words text-foreground">
                  <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                  {message.phone}
                </dd>
              </div>
            )}
          </dl>

          {/* Full message body */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Message
            </p>
            <div className="mt-2 whitespace-pre-wrap rounded-xl border border-line bg-white p-4 text-sm leading-relaxed break-words text-foreground/90 sm:p-5">
              {message.message || "—"}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-4">
            {status !== "READ" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => setStatusVia("READ")}
              >
                <Check className="mr-1.5 h-4 w-4" aria-hidden />
                Mark as read
              </Button>
            )}
            {status !== "ARCHIVED" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => setStatusVia("ARCHIVED")}
              >
                <Archive className="mr-1.5 h-4 w-4" aria-hidden />
                Archive
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
