import { ClipboardCheck } from "lucide-react";
import { adminGetEvents, adminGetVolunteers, adminGetAttendanceForEvent } from "@/lib/queries";
import { toggleAttendance } from "@/lib/admin-actions";
import { AttendanceSheet } from "@/components/admin/attendance-sheet";
import { EmptyState } from "@/components/shared/empty-state";

export default async function AdminAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const { event: eventId } = await searchParams;
  const [events, volunteers] = await Promise.all([
    adminGetEvents(),
    adminGetVolunteers({ status: "APPROVED" }),
  ]);

  const selectedEvent = eventId ? events.find((e) => e.id === eventId) : events[0];
  const attendance = selectedEvent ? await adminGetAttendanceForEvent(selectedEvent.id) : [];

  const attendanceMap = new Map(attendance.map((a) => [a.volunteer_id, a.status]));
  const presentCount = attendance.filter((a) => a.status === "PRESENT").length;
  const absentCount = attendance.filter((a) => a.status === "ABSENT").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Attendance</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Mark attendance for an event. Duplicates are prevented automatically.
        </p>
      </div>

      {events.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No events yet"
          description="Create an event before marking attendance."
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-white p-4">
            <label htmlFor="att-event" className="text-sm font-medium">
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
              className="h-9 flex-1 rounded-md border border-input bg-transparent px-3 text-sm"
            >
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </select>
            {selectedEvent && (
              <p className="text-sm text-muted-foreground">
                Present: <span className="font-bold text-brand-dark">{presentCount}</span> · Absent:{" "}
                <span className="font-bold text-crescent">{absentCount}</span> · Attendance:{" "}
                <span className="font-bold text-foreground">
                  {volunteers.length > 0
                    ? Math.round((presentCount / volunteers.length) * 100)
                    : 0}
                  %
                </span>
              </p>
            )}
          </div>

          <AttendanceSheet
            volunteers={volunteers}
            attendanceMap={attendanceMap}
            eventId={selectedEvent?.id ?? ""}
            action={toggleAttendance}
          />
        </>
      )}
    </div>
  );
}
