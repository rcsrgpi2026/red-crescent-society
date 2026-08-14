import Image from "next/image";
import { Plus, Pencil, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminGetCommunityMembers } from "@/lib/queries";
import { saveCommunityMember, deleteCommunityMember } from "@/lib/admin-actions";
import { AdminFormDialog, FieldError } from "@/components/admin/admin-form-dialog";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { StatusBadge } from "@/components/shared/status-badge";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Reveal } from "@/components/shared/reveal";
import { EmptyState } from "@/components/shared/empty-state";
import { Input, Label, Checkbox } from "@/components/ui";
import {
  COMMUNITY_LEVELS,
  COMMUNITY_LEVEL_LABELS,
  COMMUNITY_POSITIONS,
} from "@/lib/constants";

export default async function AdminCommunityPage() {
  const members = await adminGetCommunityMembers();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Network}
        title="Community"
        description="The incharge teacher and executive members shown as the leadership tree on the Community page. Level 1 is the top of the tree (incharge teacher) down to level 5 (assistant group leaders). Edit names, photos and roles here."
        tone="bg-gradient-to-br from-teal-500 to-cyan-700"
        actions={
          <AdminFormDialog
            trigger={
              <Button>
                <Plus className="mr-1.5 h-4 w-4" aria-hidden />
                Add person
              </Button>
            }
            title="Add community member"
            description="This person appears on the Community page at the chosen level, in display order."
            action={saveCommunityMember}
            submitLabel="Add person"
          >
            <MemberFields />
          </AdminFormDialog>
        }
      />

      {members.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member, index) => (
            <Reveal key={member.id} delay={Math.min(index * 0.05, 0.3)} className="h-full">
            <div className="h-full rounded-2xl border border-line bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md hover:shadow-brand/10">
              <div className="flex items-start gap-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-brand-soft ring-2 ring-brand/40">
                  {member.photo_url ? (
                    <Image src={member.photo_url} alt={member.name} fill sizes="56px" className="object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-xl font-bold text-brand/40">
                      {member.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">{member.name}</p>
                  <p className="text-xs font-medium text-brand">{member.position}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    Level {member.level} · {COMMUNITY_LEVEL_LABELS[member.level] ?? "—"}
                  </p>
                </div>
                {!member.is_active && <StatusBadge label="Hidden" tone="neutral" />}
              </div>
              {member.sub_role && (
                <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {member.sub_role}
                </p>
              )}
              <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                <span className="text-xs text-muted-foreground">Order: {member.display_order}</span>
                <div className="flex items-center gap-1">
                  <AdminFormDialog
                    trigger={
                      <Button variant="ghost" size="sm">
                        <Pencil className="h-3.5 w-3.5" aria-hidden />
                      </Button>
                    }
                    title={`Edit ${member.name}`}
                    action={saveCommunityMember}
                    submitLabel="Save changes"
                  >
                    <MemberFields member={member} />
                  </AdminFormDialog>
                  <ConfirmDelete
                    action={deleteCommunityMember}
                    id={member.id}
                    description={`Remove ${member.name} from the Community page?`}
                  />
                </div>
              </div>
            </div>
            </Reveal>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Network}
          title="No community members added yet"
          description="Add the incharge teacher and executive members shown on the Community page."
        />
      )}
    </div>
  );
}

function MemberFields({
  member,
}: {
  member?: {
    id: string;
    name: string;
    position: string;
    sub_role: string | null;
    photo_url: string | null;
    level: number;
    display_order: number;
    is_active: boolean;
  };
}) {
  return (
    <>
      {member && <input type="hidden" name="id" value={member.id} />}
      <div>
        <Label htmlFor="c-name">Full name</Label>
        <Input id="c-name" name="name" defaultValue={member?.name} placeholder="e.g. Md. Nurul Amin" className="mt-1.5" />
        <FieldError name="name" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="c-level">Level (tree row)</Label>
          <select
            id="c-level"
            name="level"
            defaultValue={member?.level ?? 1}
            className="mt-1.5 h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          >
            {COMMUNITY_LEVELS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.value} — {l.label}
              </option>
            ))}
          </select>
          <FieldError name="level" />
        </div>
        <div>
          <Label htmlFor="c-position">Position / role</Label>
          <Input id="c-position" name="position" defaultValue={member?.position} placeholder="e.g. GROUP LEADER" className="mt-1.5" list="community-positions" />
          <datalist id="community-positions">
            {COMMUNITY_POSITIONS.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
          <FieldError name="position" />
        </div>
      </div>
      <div>
        <Label htmlFor="c-sub-role">Sub-role / group (optional)</Label>
        <Input
          id="c-sub-role"
          name="subRole"
          defaultValue={member?.sub_role ?? ""}
          placeholder="e.g. Administration, Organisation & Recruitment"
          className="mt-1.5"
        />
      </div>
      <ImageUploadField
        name="photoUrl"
        label="Photo"
        defaultValue={member?.photo_url}
        folder="community"
      />
      <div className="grid grid-cols-2 items-center gap-4">
        <div>
          <Label htmlFor="c-order">Display order (within level)</Label>
          <Input id="c-order" name="displayOrder" type="number" defaultValue={member?.display_order ?? 0} className="mt-1.5" />
        </div>
        <label className="flex items-center gap-2 pt-5 text-sm">
          <Checkbox name="isActive" defaultChecked={member ? member.is_active : true} />
          Visible on site
        </label>
      </div>
    </>
  );
}
