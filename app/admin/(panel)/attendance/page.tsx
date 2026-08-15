import { ClipboardCheck, UserCheck, UserX } from "lucide-react";
import { adminGetEvents, adminGetTeamMembers, adminGetAttendanceForEvent } from "@/lib/queries";
import { toggleAttendance } from "@/lib/admin-actions";
import { AttendanceSheet } from "@/components/admin/attendance-sheet";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Reveal } from "@/components/shared/reveal";
import { EmptyState } from "@/components/shared/empty-state";

export default async function AdminAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const { event: eventId } = await searchParams;
  const [events, volunteers] = await Promise.all([
    adminGetEvents(),
    adminGetTeamMembers({ status: "APPROVED" }),
  ]);

  const selectedEvent = eventId ? events.find((e) => e.id === eventId) : events[0];
  const attendance = selectedEvent ? await adminGetAttendanceForEvent(selectedEvent.id) : [];

  const attendanceMap = new Map(attendance.map((a) => [a.volunteer_id, a.status]));
  const presentCount = attendance.filter((a) => a.status === "PRESENT").length;
  const absentCount = attendance.filter((a) => a.status === "ABSENT").length;
  const pct =
    volunteers.length > 0 ? Math.round((presentCount / volunteers.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={ClipboardCheck}
        title="Attendance"
        description="Mark attendance for an event. Duplicates are prevented automatically."
      />

      {events.length === 0 ? (
        <Reveal>
          <EmptyState
            icon={ClipboardCheck}
            title="No events yet"
            description="Create an event before marking attendance."
          />
        </Reveal>
      ) : (
        <>
          <Reveal>
            <div className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-4 shadow-sm shadow-black/[0.02] sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <label
                  htmlFor="att-event"
                  className="shrink-0 text-sm font-semibold text-foreground"
                >
                  Event:
                </label>
                <select
                  id="att-event"
                  defaultValue={selectedEvent?.id}
                  onChange={(e) => {
                    const url = new URL(window.location.href);
                    if (e.target.value) url.searchParams.set("event", e.target.value);
                    else url.searchParams.delete("event");
                    window.location.href = url.toString();
                  }}
                  className="h-10 w-full flex-1 rounded-lg border border-input bg-white px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring"
                >
                  {events.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.title}
                    </option>
                  ))}
                </select>
              </div>
              {selectedEvent && (
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
                    <UserCheck className="h-3.5 w-3.5" aria-hidden />
                    {presentCount} present
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-crescent-soft px-3 py-1 font-semibold text-crescent">
                    <UserX className="h-3.5 w-3.5" aria-hidden />
                    {absentCount} absent
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 font-semibold text-brand-ink">
                    {pct}% attendance
                  </span>
                </div>
              )}
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <AttendanceSheet
              volunteers={volunteers}
              attendanceMap={attendanceMap}
              eventId={selectedEvent?.id ?? ""}
              action={toggleAttendance}
            />
          </Reveal>
        </>
      )}
    </div>
  );
}
