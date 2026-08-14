import Image from "next/image";
import { Plus, Pencil, Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminGetFounders } from "@/lib/queries";
import { saveFounder, deleteFounder } from "@/lib/admin-actions";
import { AdminFormDialog, FieldError } from "@/components/admin/admin-form-dialog";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { StatusBadge } from "@/components/shared/status-badge";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Reveal } from "@/components/shared/reveal";
import { EmptyState } from "@/components/shared/empty-state";
import { Input, Label, Textarea, Checkbox } from "@/components/ui";
import { FOUNDER_CATEGORIES, FOUNDER_CATEGORY_LABELS } from "@/lib/constants";

export default async function AdminFoundersPage() {
  const founders = await adminGetFounders();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Handshake}
        title="Founders & Principal"
        description="The founders of the society and the institute principal, shown in the About page section. Add the principal with the “Principal” category to feature their photo prominently."
        tone="bg-gradient-to-br from-amber-500 to-orange-600"
        actions={
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
            <FounderFields />
          </AdminFormDialog>
        }
      />

      {founders.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {founders.map((person, index) => (
            <Reveal key={person.id} delay={Math.min(index * 0.05, 0.3)} className="h-full">
            <div className="h-full rounded-2xl border border-line bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md hover:shadow-brand/10">
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
                    <FounderFields person={person} />
                  </AdminFormDialog>
                  <ConfirmDelete
                    action={deleteFounder}
                    id={person.id}
                    description={`Remove ${person.name} from the About page?`}
                  />
                </div>
              </div>
            </div>
            </Reveal>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Handshake}
          title="No founders or principal added yet"
          description="Add the people who founded the society and the principal of the institute."
        />
      )}
    </div>
  );
}

function FounderFields({
  person,
}: {
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
        <FieldError name="name" />
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
          <FieldError name="category" />
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
