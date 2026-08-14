import Image from "next/image";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminGetFounders } from "@/lib/queries";
import { saveFounder, deleteFounder } from "@/lib/admin-actions";
import { AdminFormDialog, FieldError } from "@/components/admin/admin-form-dialog";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { StatusBadge } from "@/components/shared/status-badge";
import { Input, Label, Textarea, Checkbox } from "@/components/ui";
import { FOUNDER_CATEGORIES, FOUNDER_CATEGORY_LABELS } from "@/lib/constants";

export default async function AdminFoundersPage() {
  const founders = await adminGetFounders();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Founders & Principal</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            The founders of the society and the institute principal, shown in the About page
            section. Add the principal with the &ldquo;Principal&rdquo; category to feature
            their photo prominently.
          </p>
        </div>
        <AdminFormDialog
          trigger={
            <Button>
              <Plus className="mr-1.5 h-4 w-4" aria-hidden />
              Add person
            </Button>
          }
          title="Add founder / principal"
          description="This person appears on the About page in display order."
          action={saveFounder}
          submitLabel="Add person"
        >
          {(errors) => (
            <FounderFields errors={errors} />
          )}
        </AdminFormDialog>
      </div>

      {founders.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {founders.map((person) => (
            <div key={person.id} className="rounded-2xl border border-line bg-white p-5">
              <div className="flex items-start gap-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-brand-soft">
                  {person.photo_url ? (
                    <Image src={person.photo_url} alt={person.name} fill sizes="56px" className="object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-xl font-bold text-brand/40">
                      {person.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">{person.name}</p>
                  <p className="text-xs font-medium text-brand">
                    {FOUNDER_CATEGORY_LABELS[person.category] ?? person.category}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {person.title || "—"}
                  </p>
                </div>
                {!person.is_active && <StatusBadge label="Hidden" tone="neutral" />}
              </div>
              {person.bio && (
                <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {person.bio}
                </p>
              )}
              <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                <span className="text-xs text-muted-foreground">Order: {person.display_order}</span>
                <div className="flex items-center gap-1">
                  <AdminFormDialog
                    trigger={
                      <Button variant="ghost" size="sm">
                        <Pencil className="h-3.5 w-3.5" aria-hidden />
                      </Button>
                    }
                    title={`Edit ${person.name}`}
                    action={saveFounder}
                    submitLabel="Save changes"
                  >
                    {(errors) => <FounderFields errors={errors} person={person} />}
                  </AdminFormDialog>
                  <ConfirmDelete
                    action={deleteFounder}
                    id={person.id}
                    description={`Remove ${person.name} from the About page?`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-line bg-mist/50 p-12 text-center">
          <p className="font-medium text-foreground">No founders or principal added yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add the people who founded the society and the principal of the institute.
          </p>
        </div>
      )}
    </div>
  );
}

function FounderFields({
  errors,
  person,
}: {
  errors?: Record<string, string[]>;
  person?: {
    id: string;
    name: string;
    title: string | null;
    bio: string | null;
    photo_url: string | null;
    category: string;
    display_order: number;
    is_active: boolean;
  };
}) {
  return (
    <>
      {person && <input type="hidden" name="id" value={person.id} />}
      <div>
        <Label htmlFor="f-name">Full name</Label>
        <Input id="f-name" name="name" defaultValue={person?.name} placeholder="e.g. Md. Rafiqul Islam" className="mt-1.5" />
        <FieldError errors={errors} name="name" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="f-category">Category</Label>
          <select
            id="f-category"
            name="category"
            defaultValue={person?.category ?? "FOUNDER"}
            className="mt-1.5 h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          >
            {FOUNDER_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <FieldError errors={errors} name="category" />
        </div>
        <div>
          <Label htmlFor="f-title">Title / role</Label>
          <Input id="f-title" name="title" defaultValue={person?.title ?? ""} placeholder="e.g. Principal, RPI" className="mt-1.5" />
        </div>
      </div>
      <ImageUploadField
        name="photoUrl"
        label="Photo"
        defaultValue={person?.photo_url}
        folder="founders"
      />
      <div>
        <Label htmlFor="f-bio">Short bio</Label>
        <Textarea id="f-bio" name="bio" defaultValue={person?.bio ?? ""} rows={3} className="mt-1.5" />
      </div>
      <div className="grid grid-cols-2 items-center gap-4">
        <div>
          <Label htmlFor="f-order">Display order</Label>
          <Input id="f-order" name="displayOrder" type="number" defaultValue={person?.display_order ?? 0} className="mt-1.5" />
        </div>
        <label className="flex items-center gap-2 pt-5 text-sm">
          <Checkbox name="isActive" defaultChecked={person ? person.is_active : true} />
          Visible on site
        </label>
      </div>
    </>
  );
}
