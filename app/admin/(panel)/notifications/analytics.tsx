import {
  Send,
  Eye,
  CheckCheck,
  TrendingUp,
  HeartPulse,
  Megaphone,
  ShieldAlert,
  Calendar,
  Users,
  Settings,
} from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/constants";
import type { NotificationType } from "@/lib/notifications/types";

function getNotificationTypeBadge(type: NotificationType) {
  switch (type) {
    case "blood_request":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-crescent/15 px-2.5 py-0.5 text-xs font-semibold text-crescent">
          <HeartPulse className="h-3 w-3" /> Blood Request
        </span>
      );
    case "emergency":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
          <ShieldAlert className="h-3 w-3" /> Emergency
        </span>
      );
    case "notice":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-poly/15 px-2.5 py-0.5 text-xs font-semibold text-poly">
          <Megaphone className="h-3 w-3" /> Notice
        </span>
      );
    case "volunteer":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 px-2.5 py-0.5 text-xs font-semibold text-sky-700 dark:text-sky-400">
          <Users className="h-3 w-3" /> Volunteer
        </span>
      );
    case "event":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/15 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:text-indigo-400">
          <Calendar className="h-3 w-3" /> Event
        </span>
      );
    case "system":
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
          <Settings className="h-3 w-3" /> System
        </span>
      );
  }
}

export function NotificationAnalytics({ history }: { history: any[] }) {
  const totalBroadcasts = history.length;
  const totalDelivered = history.reduce((sum, h) => sum + (h.stats?.sentCount || 0), 0);
  const totalOpened = history.reduce((sum, h) => sum + (h.stats?.openedCount || 0), 0);
  const avgOpenRate =
    totalDelivered > 0 ? Math.round((totalOpened / totalDelivered) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Broadcasts
            </span>
            <Send className="h-4 w-4 text-poly" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-foreground">{totalBroadcasts}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Dispatched campaigns</p>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Delivered
            </span>
            <CheckCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-foreground">{totalDelivered}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Targeted recipient deliveries</p>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Opened
            </span>
            <Eye className="h-4 w-4 text-sky-600 dark:text-sky-400" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-foreground">{totalOpened}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Engaged user interactions</p>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Engagement Rate
            </span>
            <TrendingUp className="h-4 w-4 text-poly" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-poly">{avgOpenRate}%</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Average open/read rate</p>
        </div>
      </div>

      {/* History Table */}
      <div className="rounded-2xl border bg-card shadow-xs overflow-hidden">
        <div className="border-b px-6 py-4 bg-muted/20">
          <h3 className="font-semibold text-sm text-foreground">
            Notification Delivery History & Performance
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-semibold">Notification</th>
                <th className="px-6 py-3 font-semibold">Type</th>
                <th className="px-6 py-3 font-semibold">Priority</th>
                <th className="px-6 py-3 font-semibold">Targeted</th>
                <th className="px-6 py-3 font-semibold">Opened</th>
                <th className="px-6 py-3 font-semibold">Open Rate</th>
                <th className="px-6 py-3 font-semibold">Sent At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-muted-foreground">
                    No broadcast history yet. Create your first notification above!
                  </td>
                </tr>
              ) : (
                history.map((item) => (
                  <tr key={item.id} className="transition hover:bg-muted/30">
                    <td className="px-6 py-3.5 font-medium text-foreground max-w-xs truncate">
                      <div>
                        <p className="font-semibold truncate">{item.title}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{item.body}</p>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">{getNotificationTypeBadge(item.type)}</td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-bold uppercase ${
                          item.priority === "critical"
                            ? "bg-amber-500/20 text-amber-700 dark:text-amber-400"
                            : item.priority === "high"
                            ? "bg-crescent/15 text-crescent"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {item.priority}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-foreground">
                      {item.stats?.sentCount ?? 0}
                    </td>
                    <td className="px-6 py-3.5 text-sky-600 dark:text-sky-400 font-semibold">
                      {item.stats?.openedCount ?? 0}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="font-bold text-poly">
                        {item.stats?.openRate ?? 0}%
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-muted-foreground whitespace-nowrap">
                      {formatDateTime(item.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
