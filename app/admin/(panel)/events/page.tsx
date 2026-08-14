import { Plus, Pencil } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge, statusTone } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { AdminFormDialog, FieldError } from "@/components/admin/admin-form-dialog";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { EventRegistrations } from "@/components/admin/event-registrations";
import { adminGetEvents, adminGetEventRegistrations } from "@/lib/queries";
import { saveEvent, deleteEvent } from "@/lib/admin-actions";
import { EVENT_CATEGORIES, EVENT_STATUS_LABELS, formatDate } from "@/lib/constants";
import { Input, Label, Textarea, Checkbox } from "@/components/ui";

export default async function AdminEventsPage() {
  const events = await adminGetEvents();
  const registrationsByEvent = await Promise.all(
    events.map((event) => adminGetEventRegistrations(event.id))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Events</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create, publish and manage events and their registrations.
          </p>
        </div>
        <AdminFormDialog
          trigger={
            <Button>
              <Plus className="mr-1.5 h-4 w-4" aria-hidden />
              New event
            </Button>
          }
          title="Create event"
          action={saveEvent}
          submitLabel="Create event"
        >
          {(errors) => <EventFields errors={errors} />}
        </AdminFormDialog>
      </div>

      {events.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-mist/60">
                <TableHead>Event</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registrations</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event, index) => {
                const registrations = registrationsByEvent[index] ?? [];
                return (
                  <TableRow key={event.id}>
                    <TableCell>
                      <p className="font-medium text-foreground">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {event.category ?? "Uncategorized"} · /events/{event.slug}
                      </p>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(event.date)}
                    </TableCell>
                    <TableCell className="max-w-[10rem] truncate text-xs text-muted-foreground">
                      {event.location ?? "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        label={EVENT_STATUS_LABELS[event.status] ?? event.status}
                        tone={statusTone(event.status)}
                      />
                    </TableCell>
                    <TableCell>
                      <EventRegistrations eventTitle={event.title} registrations={registrations} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <AdminFormDialog
                          trigger={
                            <Button variant="ghost" size="sm">
                              <Pencil className="h-3.5 w-3.5" aria-hidden />
                            </Button>
                          }
                          title={`Edit ${event.title}`}
                          action={saveEvent}
                          submitLabel="Save changes"
                        >
                          {(errors) => <EventFields errors={errors} event={event} />}
                        </AdminFormDialog>
                        <ConfirmDelete
                          action={deleteEvent}
                          id={event.id}
                          description={`Delete "${event.title}" and its registrations?`}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState title="No events yet" description="Create the first event to get started." />
      )}
    </div>
  );
}

function EventFields({
  errors,
  event,
}: {
  errors?: Record<string, string[]>;
  event?: {
    id: string;
    title: string;
    slug: string;
    cover_image: string | null;
    description: string | null;
    date: string | null;
    time: string | null;
    location: string | null;
    category: string | null;
    organizer: string | null;
    registration_enabled: boolean;
    max_participants: number | null;
    status: string;
    report: string | null;
  };
}) {
  return (
    <>
      {event && <input type="hidden" name="id" value={event.id} />}
      <div>
        <Label htmlFor="ev-title">Title</Label>
        <Input id="ev-title" name="title" defaultValue={event?.title} placeholder="e.g. Blood Donation Camp 2026" className="mt-1.5" />
        <FieldError errors={errors} name="title" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="ev-slug">Slug</Label>
          <Input id="ev-slug" name="slug" defaultValue={event?.slug} placeholder="auto-generated" className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="ev-category">Category</Label>
          <select id="ev-category" name="category" defaultValue={event?.category ?? EVENT_CATEGORIES[0]} className="mt-1.5 h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
            {EVENT_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="ev-date">Date</Label>
          <Input id="ev-date" name="date" type="date" defaultValue={event?.date ?? ""} className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="ev-time">Time</Label>
          <Input id="ev-time" name="time" defaultValue={event?.time ?? ""} placeholder="10:00 AM" className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="ev-status">Status</Label>
          <select id="ev-status" name="status" defaultValue={event?.status ?? "UPCOMING"} className="mt-1.5 h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
            {Object.entries(EVENT_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <Label htmlFor="ev-location">Location</Label>
        <Input id="ev-location" name="location" defaultValue={event?.location ?? ""} placeholder="e.g. Main auditorium" className="mt-1.5" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="ev-organizer">Organizer</Label>
          <Input id="ev-organizer" name="organizer" defaultValue={event?.organizer ?? ""} placeholder="e.g. Blood Support Team" className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="ev-max">Max participants</Label>
          <Input id="ev-max" name="maxParticipants" type="number" defaultValue={event?.max_participants ?? ""} placeholder="Unlimited" className="mt-1.5" />
        </div>
      </div>
      <ImageUploadField
        name="coverImage"
        label="Cover image"
        defaultValue={event?.cover_image}
        folder="events"
        description="Shown on the event card and detail page."
      />
      <div>
        <Label htmlFor="ev-desc">Description</Label>
        <Textarea id="ev-desc" name="description" defaultValue={event?.description ?? ""} rows={4} className="mt-1.5" />
      </div>
      <div>
        <Label htmlFor="ev-report">Report (after the event)</Label>
        <Textarea id="ev-report" name="report" defaultValue={event?.report ?? ""} rows={3} className="mt-1.5" />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox name="registrationEnabled" defaultChecked={event?.registration_enabled ?? true} />
        Registration enabled (show form on the event page)
      </label>
    </>
  );
}
