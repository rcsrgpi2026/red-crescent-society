import { Plus, Pencil, HandHeart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { AdminFormDialog, FieldError } from "@/components/admin/admin-form-dialog";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { ImageListUploadField } from "@/components/admin/image-list-upload-field";
import { AdminPageHeader } from "@/components/admin/page-header";
import {
  ResponsiveTable,
  type Column,
} from "@/components/admin/responsive-table";
import { adminGetActivities } from "@/lib/queries";
import { saveActivity, deleteActivity } from "@/lib/admin-actions";
import { ACTIVITY_CATEGORIES, formatDate } from "@/lib/constants";
import { Input, Label, Textarea } from "@/components/ui";

export default async function AdminActivitiesPage() {
  const activities = await adminGetActivities();

  const columns: Column<(typeof activities)[number]>[] = [
    {
      header: "Activity",
      render: (activity) => (
        <div>
          <p className="font-medium text-foreground">{activity.title}</p>
          <p className="text-xs text-muted-foreground">/activities/{activity.slug}</p>
        </div>
      ),
    },
    {
      header: "Date",
      render: (activity) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(activity.date)}
        </span>
      ),
    },
    {
      header: "Category",
      render: (activity) => (
        <span className="inline-flex rounded-full bg-poly-soft px-2.5 py-0.5 text-xs font-semibold text-poly">
          {activity.category ?? "—"}
        </span>
      ),
    },
    {
      header: "Participants",
      render: (activity) => (
        <span className="text-xs font-semibold text-brand-dark">
          {activity.participants}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={HandHeart}
        title="Activities"
        description="Document campaigns and their impact for the public site."
        tone="bg-gradient-to-br from-emerald-500 to-teal-600"
        actions={
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
            <ActivityFields />
          </AdminFormDialog>
        }
      />

      <ResponsiveTable
        columns={columns}
        rows={activities}
        keyFor={(activity) => activity.id}
        minWidth="min-w-[640px]"
        actions={(activity) => (
          <>
            <AdminFormDialog
              trigger={
                <Button variant="ghost" size="sm" aria-label={`Edit ${activity.title}`}>
                  <Pencil className="h-3.5 w-3.5" aria-hidden />
                </Button>
              }
              title={`Edit ${activity.title}`}
              action={saveActivity}
              submitLabel="Save changes"
            >
              <ActivityFields activity={activity} />
            </AdminFormDialog>
            <ConfirmDelete
              action={deleteActivity}
              id={activity.id}
              description={`Delete "${activity.title}"?`}
            />
          </>
        )}
        empty={
          <EmptyState
            icon={HandHeart}
            title="No activities yet"
            description="Document your first campaign."
          />
        }
      />
    </div>
  );
}

function ActivityFields({
  activity,
}: {
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
        <FieldError name="title" />
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
