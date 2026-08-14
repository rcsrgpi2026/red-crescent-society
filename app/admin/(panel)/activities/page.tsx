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
import { EmptyState } from "@/components/shared/empty-state";
import { AdminFormDialog, FieldError } from "@/components/admin/admin-form-dialog";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { ImageListUploadField } from "@/components/admin/image-list-upload-field";
import { adminGetActivities } from "@/lib/queries";
import { saveActivity, deleteActivity } from "@/lib/admin-actions";
import { ACTIVITY_CATEGORIES, formatDate } from "@/lib/constants";
import { Input, Label, Textarea } from "@/components/ui";

export default async function AdminActivitiesPage() {
  const activities = await adminGetActivities();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Activities</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Document campaigns and their impact for the public site.
          </p>
        </div>
        <AdminFormDialog
          trigger={
            <Button>
              <Plus className="mr-1.5 h-4 w-4" aria-hidden />
              New activity
            </Button>
          }
          title="Create activity"
          action={saveActivity}
          submitLabel="Create activity"
        >
          {(errors) => <ActivityFields errors={errors} />}
        </AdminFormDialog>
      </div>

      {activities.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-mist/60">
                <TableHead>Activity</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Participants</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell>
                    <p className="font-medium text-foreground">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">/activities/{activity.slug}</p>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(activity.date)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{activity.category ?? "—"}</TableCell>
                  <TableCell className="text-xs">{activity.participants}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <AdminFormDialog
                        trigger={
                          <Button variant="ghost" size="sm">
                            <Pencil className="h-3.5 w-3.5" aria-hidden />
                          </Button>
                        }
                        title={`Edit ${activity.title}`}
                        action={saveActivity}
                        submitLabel="Save changes"
                      >
                        {(errors) => <ActivityFields errors={errors} activity={activity} />}
                      </AdminFormDialog>
                      <ConfirmDelete
                        action={deleteActivity}
                        id={activity.id}
                        description={`Delete "${activity.title}"?`}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState title="No activities yet" description="Document your first campaign." />
      )}
    </div>
  );
}

function ActivityFields({
  errors,
  activity,
}: {
  errors?: Record<string, string[]>;
  activity?: {
    id: string;
    title: string;
    slug: string;
    date: string | null;
    category: string | null;
    description: string | null;
    images: string[];
    participants: number;
    impact: string | null;
  };
}) {
  return (
    <>
      {activity && <input type="hidden" name="id" value={activity.id} />}
      <div>
        <Label htmlFor="ac-title">Title</Label>
        <Input id="ac-title" name="title" defaultValue={activity?.title} placeholder="e.g. Blood Donation Camp 2026" className="mt-1.5" />
        <FieldError errors={errors} name="title" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="ac-slug">Slug</Label>
          <Input id="ac-slug" name="slug" defaultValue={activity?.slug} placeholder="auto" className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="ac-date">Date</Label>
          <Input id="ac-date" name="date" type="date" defaultValue={activity?.date ?? ""} className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="ac-category">Category</Label>
          <select id="ac-category" name="category" defaultValue={activity?.category ?? ACTIVITY_CATEGORIES[0]} className="mt-1.5 h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
            {ACTIVITY_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <Label htmlFor="ac-desc">Description</Label>
        <Textarea id="ac-desc" name="description" defaultValue={activity?.description ?? ""} rows={4} className="mt-1.5" />
      </div>
      <ImageListUploadField
        name="images"
        label="Images (first one is the cover)"
        defaultValue={activity?.images.join("\n") ?? ""}
        folder="activities"
        uploadLabel="Upload photos"
      />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="ac-participants">Participants</Label>
          <Input id="ac-participants" name="participants" type="number" defaultValue={activity?.participants ?? 0} className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="ac-impact">Impact</Label>
          <Input id="ac-impact" name="impact" defaultValue={activity?.impact ?? ""} placeholder="e.g. 120 bags collected" className="mt-1.5" />
        </div>
      </div>
    </>
  );
}
