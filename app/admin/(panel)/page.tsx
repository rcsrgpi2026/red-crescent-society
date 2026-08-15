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
  LayoutDashboard,
} from "lucide-react";
import {
  adminGetTeamMembers,
  adminGetBloodRequests,
  adminGetEvents,
  adminGetMessages,
} from "@/lib/queries";
import { formatDate, formatDateTime, BLOOD_REQUEST_STATUS_LABELS } from "@/lib/constants";
import { StatusBadge, statusTone } from "@/components/shared/status-badge";
import { Reveal } from "@/components/shared/reveal";
import { NumberTicker } from "@/components/ui/number-ticker";

export default async function AdminDashboardPage() {
  const [volunteers, requests, events, messages] = await Promise.all([
    adminGetTeamMembers({ limit: 500 }),
    adminGetBloodRequests(),
    adminGetEvents(),
    adminGetMessages(),
  ]);

  const pendingVolunteers = volunteers.filter((v) => v.status === "PENDING");
  const pendingRequests = requests.filter((r) => r.status === "PENDING");
  const upcomingEvents = events.filter((e) => ["UPCOMING", "ONGOING"].includes(e.status));
  const unreadMessages = messages.filter((m) => m.status === "NEW");

  const stats = [
    { label: "Total team members", value: volunteers.length, icon: Users, href: "/admin/team", tone: "bg-gradient-to-br from-brand to-brand-dark" },
    { label: "Pending registrations", value: pendingVolunteers.length, icon: UserPlus, href: "/admin/team?status=PENDING", tone: "bg-gradient-to-br from-amber-400 to-orange-500" },
    { label: "Open blood requests", value: requests.filter((r) => !["COMPLETED", "CANCELLED"].includes(r.status)).length, icon: HeartPulse, href: "/admin/blood-requests", tone: "bg-gradient-to-br from-crescent to-crescent-dark" },
    { label: "Upcoming events", value: upcomingEvents.length, icon: CalendarDays, href: "/admin/events", tone: "bg-gradient-to-br from-poly to-[#0f4d80]" },
    { label: "Unread messages", value: unreadMessages.length, icon: MessageSquare, href: "/admin/messages", tone: "bg-gradient-to-br from-emerald-400 to-emerald-600" },
  ];

  return (
    <div className="space-y-8">
      <Reveal>
        <div className="flex items-center gap-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-dark text-white shadow-md shadow-brand/20">
            <LayoutDashboard className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Live overview of the society&apos;s activity — everything comes from the real database.
            </p>
          </div>
        </div>
      </Reveal>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat, i) => (
          <Reveal key={stat.label} delay={i * 0.06} className="h-full">
            <Link
              href={stat.href}
              className="group flex h-full flex-col rounded-2xl border border-line bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-lg hover:shadow-brand/10"
            >
              <span
                className={`inline-flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm transition-transform duration-300 group-hover:scale-110 ${stat.tone}`}
              >
                <stat.icon className="h-5 w-5" aria-hidden />
              </span>
              <NumberTicker
                value={stat.value}
                className="mt-3 text-2xl font-bold tabular-nums text-foreground"
              />
              <p className="mt-0.5 text-xs font-medium text-muted-foreground">{stat.label}</p>
            </Link>
          </Reveal>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent team member registrations */}
        <Reveal delay={0.1}>
          <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm shadow-black/[0.02]">
            <div className="flex items-center justify-between border-b border-line bg-gradient-to-r from-brand-soft/70 to-transparent px-5 py-4">
              <h2 className="font-semibold text-foreground">Recent registrations</h2>
              <Link href="/admin/team?status=PENDING" className="flex items-center gap-1 text-xs font-semibold text-brand transition-colors hover:text-brand-dark">
                Review
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
            </div>
            {volunteers.length > 0 ? (
              <ul className="divide-y divide-line">
                {volunteers.slice(0, 6).map((v) => (
                  <li key={v.id} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-mist/70">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-dark text-sm font-bold text-white">
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
              <p className="px-5 py-10 text-center text-sm text-muted-foreground">No team members yet.</p>
            )}
          </div>
        </Reveal>

        {/* Recent blood requests */}
        <Reveal delay={0.16}>
          <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm shadow-black/[0.02]">
            <div className="flex items-center justify-between border-b border-line bg-gradient-to-r from-crescent-soft/70 to-transparent px-5 py-4">
              <h2 className="font-semibold text-foreground">Blood requests</h2>
              <Link href="/admin/blood-requests" className="flex items-center gap-1 text-xs font-semibold text-crescent transition-colors hover:text-crescent-dark">
                Manage
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
            {requests.length > 0 ? (
              <ul className="divide-y divide-line">
                {requests.slice(0, 6).map((r) => (
                  <li key={r.id} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-mist/70">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${r.emergency_level === "EMERGENCY" ? "bg-gradient-to-br from-crescent to-crescent-dark text-white" : "bg-crescent-soft text-crescent"}`}>
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
        </Reveal>
      </div>

      {/* Quick actions */}
      <Reveal delay={0.2}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Approve team members", desc: `${pendingVolunteers.length} waiting`, href: "/admin/team?status=PENDING", icon: UserPlus, tone: "bg-gradient-to-br from-brand to-brand-dark" },
            { label: "New event", desc: "Announce to everyone", href: "/admin/events?new=1", icon: CalendarDays, tone: "bg-gradient-to-br from-poly to-[#0f4d80]" },
            { label: "Post a notice", desc: "Notice board update", href: "/admin/notices?new=1", icon: Megaphone, tone: "bg-gradient-to-br from-amber-400 to-orange-500" },
            { label: "Blood requests", desc: `${pendingRequests.length} pending`, href: "/admin/blood-requests", icon: Droplets, tone: "bg-gradient-to-br from-crescent to-crescent-dark" },
          ].map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="group flex items-center gap-3 rounded-2xl border border-line bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md hover:shadow-brand/10"
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm transition-transform duration-300 group-hover:scale-110 ${action.tone}`}>
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
      </Reveal>
    </div>
  );
}
