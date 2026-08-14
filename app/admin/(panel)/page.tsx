import Link from "next/link";
import {
  Users,
  UserPlus,
  HeartPulse,
  CalendarDays,
  MessageSquare,
  ArrowRight,
  Droplets,
  Megaphone,
} from "lucide-react";
import {
  adminGetVolunteers,
  adminGetBloodRequests,
  adminGetEvents,
  adminGetMessages,
} from "@/lib/queries";
import { formatDate, formatDateTime, BLOOD_REQUEST_STATUS_LABELS } from "@/lib/constants";
import { StatusBadge, statusTone } from "@/components/shared/status-badge";

export default async function AdminDashboardPage() {
  const [volunteers, requests, events, messages] = await Promise.all([
    adminGetVolunteers({ limit: 500 }),
    adminGetBloodRequests(),
    adminGetEvents(),
    adminGetMessages(),
  ]);

  const pendingVolunteers = volunteers.filter((v) => v.status === "PENDING");
  const pendingRequests = requests.filter((r) => r.status === "PENDING");
  const upcomingEvents = events.filter((e) => ["UPCOMING", "ONGOING"].includes(e.status));
  const unreadMessages = messages.filter((m) => m.status === "NEW");

  const stats = [
    { label: "Total volunteers", value: volunteers.length, icon: Users, href: "/admin/volunteers", tone: "bg-brand-soft text-brand" },
    { label: "Pending registrations", value: pendingVolunteers.length, icon: UserPlus, href: "/admin/volunteers?status=PENDING", tone: "bg-amber-50 text-amber-600" },
    { label: "Open blood requests", value: requests.filter((r) => !["COMPLETED", "CANCELLED"].includes(r.status)).length, icon: HeartPulse, href: "/admin/blood-requests", tone: "bg-crescent-soft text-crescent" },
    { label: "Upcoming events", value: upcomingEvents.length, icon: CalendarDays, href: "/admin/events", tone: "bg-poly-soft text-poly" },
    { label: "Unread messages", value: unreadMessages.length, icon: MessageSquare, href: "/admin/messages", tone: "bg-emerald-50 text-emerald-700" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Live overview of the society&apos;s activity — everything comes from the real database.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group rounded-2xl border border-line bg-white p-5 transition-all hover:border-brand/40 hover:shadow-sm"
          >
            <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${stat.tone}`}>
              <stat.icon className="h-5 w-5" aria-hidden />
            </span>
            <p className="mt-3 text-2xl font-bold tabular-nums text-foreground">{stat.value}</p>
            <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent volunteer registrations */}
        <div className="rounded-2xl border border-line bg-white">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-semibold text-foreground">Recent registrations</h2>
            <Link href="/admin/volunteers?status=PENDING" className="flex items-center gap-1 text-xs font-semibold text-brand hover:underline">
              Review
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
          {volunteers.length > 0 ? (
            <ul className="divide-y divide-line">
              {volunteers.slice(0, 6).map((v) => (
                <li key={v.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-bold text-brand">
                    {v.name.charAt(0)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{v.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {[v.department, v.semester].filter(Boolean).join(" · ") || "—"} · {formatDateTime(v.created_at)}
                    </p>
                  </div>
                  <StatusBadge label={v.status} tone={statusTone(v.status)} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">No volunteers yet.</p>
          )}
        </div>

        {/* Recent blood requests */}
        <div className="rounded-2xl border border-line bg-white">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-semibold text-foreground">Blood requests</h2>
            <Link href="/admin/blood-requests" className="flex items-center gap-1 text-xs font-semibold text-brand hover:underline">
              Manage
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
          {requests.length > 0 ? (
            <ul className="divide-y divide-line">
              {requests.slice(0, 6).map((r) => (
                <li key={r.id} className="flex items-center gap-3 px-5 py-3">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${r.emergency_level === "EMERGENCY" ? "bg-crescent text-white" : "bg-crescent-soft text-crescent"}`}>
                    {r.blood_group}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{r.patient_name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {r.hospital || r.location} · {formatDate(r.created_at)}
                    </p>
                  </div>
                  <StatusBadge
                    label={BLOOD_REQUEST_STATUS_LABELS[r.status] ?? r.status}
                    tone={statusTone(r.status)}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">No blood requests yet.</p>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Approve volunteers", desc: `${pendingVolunteers.length} waiting`, href: "/admin/volunteers?status=PENDING", icon: UserPlus, tone: "text-brand bg-brand-soft" },
          { label: "New event", desc: "Announce to everyone", href: "/admin/events?new=1", icon: CalendarDays, tone: "text-poly bg-poly-soft" },
          { label: "Post a notice", desc: "Notice board update", href: "/admin/notices?new=1", icon: Megaphone, tone: "text-amber-600 bg-amber-50" },
          { label: "Blood requests", desc: `${pendingRequests.length} pending`, href: "/admin/blood-requests", icon: Droplets, tone: "text-crescent bg-crescent-soft" },
        ].map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="group flex items-center gap-3 rounded-2xl border border-line bg-white p-5 transition-all hover:border-brand/40 hover:shadow-sm"
          >
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${action.tone}`}>
              <action.icon className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-foreground">{action.label}</span>
              <span className="block text-xs text-muted-foreground">{action.desc}</span>
            </span>
            <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        ))}
      </div>
    </div>
  );
}
