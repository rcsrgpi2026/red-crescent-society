"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarDays, CheckCircle2, Hourglass, XCircle, CalendarHeart, HandHeart, Users } from "lucide-react";
import { submitParticipationRequest } from "@/lib/admin-actions";
import { formatDate } from "@/lib/constants";
import type { ParticipationRequest } from "@/types/database";
import { cn } from "@/lib/utils";

interface Item {
  id: string;
  title: string;
  date: string | null;
}

export function ParticipationPanel({
  volunteerId,
  events,
  activities,
  requests,
}: {
  volunteerId: string;
  events: Item[];
  activities: Item[];
  requests: ParticipationRequest[];
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function request(kind: "event" | "activity", id: string) {
    setPendingId(id);
    const fd = new FormData();
    fd.set("volunteerId", volunteerId);
    if (kind === "event") fd.set("eventId", id);
    else fd.set("activityId", id);
    const res = await submitParticipationRequest(fd);
    if (res.success) {
      toast.success(res.message ?? "Request submitted.");
    } else {
      toast.error(res.message ?? "Could not submit the request.");
    }
    setPendingId(null);
    startTransition(() => router.refresh());
  }

  const statusOf = (r: ParticipationRequest[], kind: "event" | "activity", id: string) =>
    r.find((x) => (kind === "event" ? x.event_id === id : x.activity_id === id));

  return (
    <div className="mt-10 space-y-8">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
          <CalendarHeart className="h-5 w-5 text-brand" aria-hidden />
          Events &amp; activities
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Request to participate — the society leadership approves every request.
        </p>

        {events.length === 0 && activities.length === 0 ? (
          <div className="mt-4 rounded-xl border border-line bg-mist/50 p-6 text-sm text-muted-foreground">
            No upcoming events or activities right now.
          </div>
        ) : (
          <>
            {events.length > 0 && (
              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Events</p>
                <ul className="mt-2 divide-y divide-line rounded-xl border border-line bg-white">
                  {events.map((item) => (
                    <RequestRow
                      key={item.id}
                      item={item}
                      kind="event"
                      request={statusOf(requests, "event", item.id)}
                      pending={pendingId === item.id || isPending}
                      onRequest={() => request("event", item.id)}
                    />
                  ))}
                </ul>
              </div>
            )}
            {activities.length > 0 && (
              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Activities</p>
                <ul className="mt-2 divide-y divide-line rounded-xl border border-line bg-white">
                  {activities.map((item) => (
                    <RequestRow
                      key={item.id}
                      item={item}
                      kind="activity"
                      request={statusOf(requests, "activity", item.id)}
                      pending={pendingId === item.id || isPending}
                      onRequest={() => request("activity", item.id)}
                    />
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function RequestRow({
  item,
  kind,
  request,
  pending,
  onRequest,
}: {
  item: Item;
  kind: "event" | "activity";
  request: ParticipationRequest | undefined;
  pending: boolean;
  onRequest: () => void;
}) {
  const Icon = kind === "event" ? CalendarDays : HandHeart;
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{item.title}</p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            {item.date ? (
              <>
                <CalendarDays className="h-3 w-3" aria-hidden />
                {formatDate(item.date)}
              </>
            ) : (
              "Date to be announced"
            )}
          </p>
        </div>
      </div>

      <div className="shrink-0">
        {!request || request.status === "REJECTED" ? (
          <button
            type="button"
            onClick={onRequest}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
          >
            <Users className="h-3.5 w-3.5" aria-hidden />
            {request?.status === "REJECTED" ? "Request again" : "Request to participate"}
          </button>
        ) : (
          <StatusBadge status={request.status} />
        )}
      </div>
    </li>
  );
}

function StatusBadge({ status }: { status: ParticipationRequest["status"] }) {
  const styles = {
    PENDING: "bg-amber-50 text-amber-700 border-amber-200",
    APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    REJECTED: "bg-crescent-soft text-crescent border-crescent/20",
  }[status];
  const Icon =
    status === "PENDING" ? Hourglass : status === "APPROVED" ? CheckCircle2 : XCircle;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold",
        styles
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {status === "PENDING" ? "Pending approval" : status === "APPROVED" ? "Approved" : "Rejected"}
    </span>
  );
}
