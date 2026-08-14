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
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { adminGetTrainings } from "@/lib/queries";
import { saveTraining, deleteTraining } from "@/lib/admin-actions";
import { TRAINING_CATEGORIES, formatDate } from "@/lib/constants";
import { Input, Label, Textarea } from "@/components/ui";

const TRAINING_STATUS = [
  { value: "UPCOMING", label: "Upcoming" },
  { value: "ONGOING", label: "Ongoing" },
  { value: "COMPLETED", label: "Completed" },
];

export default async function AdminTrainingPage() {
  const trainings = await adminGetTrainings();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Training</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage first aid, CPR and disaster training programs.
          </p>
        </div>
        <AdminFormDialog
          trigger={
            <Button>
              <Plus className="mr-1.5 h-4 w-4" aria-hidden />
              New training
            </Button>
          }
          title="Create training program"
          action={saveTraining}
          submitLabel="Create training"
        >
          {(errors) => <TrainingFields errors={errors} />}
        </AdminFormDialog>
      </div>

      {trainings.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-mist/60">
                <TableHead>Program</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Trainer</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trainings.map((training) => (
                <TableRow key={training.id}>
                  <TableCell>
                    <p className="font-medium text-foreground">{training.title}</p>
                    <p className="text-xs text-muted-foreground">{training.category ?? "—"}</p>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(training.date)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{training.trainer ?? "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{training.location ?? "—"}</TableCell>
                  <TableCell>
                    <StatusBadge label={training.status} tone={statusTone(training.status)} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <AdminFormDialog
                        trigger={
                          <Button variant="ghost" size="sm">
                            <Pencil className="h-3.5 w-3.5" aria-hidden />
                          </Button>
                        }
                        title={`Edit ${training.title}`}
                        action={saveTraining}
                        submitLabel="Save changes"
                      >
                        {(errors) => <TrainingFields errors={errors} training={training} />}
                      </AdminFormDialog>
                      <ConfirmDelete
                        action={deleteTraining}
                        id={training.id}
                        description={`Delete "${training.title}"?`}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState title="No training programs yet" description="Schedule the first session." />
      )}
    </div>
  );
}

function TrainingFields({
  errors,
  training,
}: {
  errors?: Record<string, string[]>;
  training?: {
    id: string;
    title: string;
    slug: string;
    date: string | null;
    trainer: string | null;
    location: string | null;
    description: string | null;
    category: string | null;
    status: string;
  };
}) {
  return (
    <>
      {training && <input type="hidden" name="id" value={training.id} />}
      <div>
        <Label htmlFor="tr-title">Title</Label>
        <Input id="tr-title" name="title" defaultValue={training?.title} placeholder="e.g. First Aid & CPR Certification" className="mt-1.5" />
        <FieldError errors={errors} name="title" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="tr-slug">Slug</Label>
          <Input id="tr-slug" name="slug" defaultValue={training?.slug} placeholder="auto" className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="tr-category">Category</Label>
          <select id="tr-category" name="category" defaultValue={training?.category ?? TRAINING_CATEGORIES[0]} className="mt-1.5 h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
            {TRAINING_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="tr-date">Date</Label>
          <Input id="tr-date" name="date" type="date" defaultValue={training?.date ?? ""} className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="tr-status">Status</Label>
          <select id="tr-status" name="status" defaultValue={training?.status ?? "UPCOMING"} className="mt-1.5 h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
            {TRAINING_STATUS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="tr-trainer">Trainer</Label>
          <Input id="tr-trainer" name="trainer" defaultValue={training?.trainer ?? ""} className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="tr-location">Location</Label>
          <Input id="tr-location" name="location" defaultValue={training?.location ?? ""} className="mt-1.5" />
        </div>
      </div>
      <div>
        <Label htmlFor="tr-desc">Description</Label>
        <Textarea id="tr-desc" name="description" defaultValue={training?.description ?? ""} rows={4} className="mt-1.5" />
      </div>
    </>
  );
}
