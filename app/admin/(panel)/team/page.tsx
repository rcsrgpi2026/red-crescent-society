import Image from "next/image";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminGetTeam } from "@/lib/queries";
import { saveTeamMember, deleteTeamMember } from "@/lib/admin-actions";
import { AdminFormDialog, FieldError } from "@/components/admin/admin-form-dialog";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { StatusBadge } from "@/components/shared/status-badge";
import { Input, Label, Textarea, Checkbox } from "@/components/ui";
import { TEAM_POSITIONS, DEPARTMENTS, SEMESTERS } from "@/lib/constants";

export default async function AdminTeamPage() {
  const team = await adminGetTeam();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Team</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Faculty advisors and student leaders shown on the About page.
          </p>
        </div>
        <AdminFormDialog
          trigger={
            <Button>
              <Plus className="mr-1.5 h-4 w-4" aria-hidden />
              Add member
            </Button>
          }
          title="Add team member"
          description="The member appears on the About page in display order."
          action={saveTeamMember}
          submitLabel="Add member"
        >
          {(errors) => (
            <TeamFields errors={errors} />
          )}
        </AdminFormDialog>
      </div>

      {team.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {team.map((member) => (
            <div key={member.id} className="rounded-2xl border border-line bg-white p-5">
              <div className="flex items-start gap-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-brand-soft">
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
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {[member.department, member.semester].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                {!member.is_active && <StatusBadge label="Hidden" tone="neutral" />}
              </div>
              {member.bio && (
                <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {member.bio}
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
                    action={saveTeamMember}
                    submitLabel="Save changes"
                  >
                    {(errors) => <TeamFields errors={errors} member={member} />}
                  </AdminFormDialog>
                  <ConfirmDelete
                    action={deleteTeamMember}
                    id={member.id}
                    description={`Remove ${member.name} from the team?`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-line bg-mist/50 p-12 text-center">
          <p className="font-medium text-foreground">No team members yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add the faculty advisor and student leaders.
          </p>
        </div>
      )}
    </div>
  );
}

function TeamFields({
  errors,
  member,
}: {
  errors?: Record<string, string[]>;
  member?: { id: string; name: string; position: string; department: string | null; semester: string | null; bio: string | null; photo_url: string | null; display_order: number; is_active: boolean };
}) {
  return (
    <>
      {member && <input type="hidden" name="id" value={member.id} />}
      <div>
        <Label htmlFor="t-name">Full name</Label>
        <Input id="t-name" name="name" defaultValue={member?.name} placeholder="e.g. Md. Rafiqul Islam" className="mt-1.5" />
        <FieldError errors={errors} name="name" />
      </div>
      <div>
        <Label htmlFor="t-position">Position</Label>
        <select
          id="t-position"
          name="position"
          defaultValue={member?.position ?? TEAM_POSITIONS[0]}
          className="mt-1.5 h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
        >
          {TEAM_POSITIONS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <FieldError errors={errors} name="position" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="t-department">Department</Label>
          <Input id="t-department" name="department" defaultValue={member?.department ?? ""} className="mt-1.5" list="departments" />
          <datalist id="departments">
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>
        </div>
        <div>
          <Label htmlFor="t-semester">Semester</Label>
          <Input id="t-semester" name="semester" defaultValue={member?.semester ?? ""} className="mt-1.5" list="semesters" />
          <datalist id="semesters">
            {SEMESTERS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
      </div>
      <ImageUploadField
        name="photoUrl"
        label="Photo"
        defaultValue={member?.photo_url}
        folder="team"
      />
      <div>
        <Label htmlFor="t-bio">Short bio</Label>
        <Textarea id="t-bio" name="bio" defaultValue={member?.bio ?? ""} rows={3} className="mt-1.5" />
      </div>
      <div className="grid grid-cols-2 items-center gap-4">
        <div>
          <Label htmlFor="t-order">Display order</Label>
          <Input id="t-order" name="displayOrder" type="number" defaultValue={member?.display_order ?? 0} className="mt-1.5" />
        </div>
        <label className="flex items-center gap-2 pt-5 text-sm">
          <Checkbox name="isActive" defaultChecked={member ? member.is_active : true} />
          Visible on site
        </label>
      </div>
    </>
  );
}
