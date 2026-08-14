import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, BadgeCheck, Camera, PhoneCall, UserRound, Sparkles } from "lucide-react";
import { adminGetVolunteer, adminGetPoints } from "@/lib/queries";
import { updateVolunteerStatus, deleteVolunteer, updateVolunteerPhoto } from "@/lib/admin-actions";
import { StatusBadge, statusTone } from "@/components/shared/status-badge";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { AdminFormDialog } from "@/components/admin/admin-form-dialog";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { PointsForm } from "@/components/admin/points-form";
import { formatDateTime } from "@/lib/constants";

export default async function AdminVolunteerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const volunteer = await adminGetVolunteer(id);
  if (!volunteer) notFound();

  const points = await adminGetPoints(id);

  const rows: { label: string; value: string | null }[] = [
    { label: "Member ID", value: volunteer.member_id },
    { label: "Student ID", value: volunteer.student_id },
    { label: "Department", value: volunteer.department },
    { label: "Semester", value: volunteer.semester },
    { label: "Phone", value: volunteer.phone },
    { label: "Email", value: volunteer.email },
    { label: "Blood group", value: volunteer.blood_group },
    { label: "Area", value: volunteer.area },
    { label: "Emergency contact", value: volunteer.emergency_contact_name },
    { label: "Emergency phone", value: volunteer.emergency_contact_phone },
    { label: "Position", value: volunteer.position },
    { label: "Joined", value: volunteer.joined_at ? formatDateTime(volunteer.joined_at) : null },
    { label: "Skills", value: volunteer.skills.length ? volunteer.skills.join(", ") : null },
  ];

  return (
    <div className="space-y-6">
      <Link
        href="/admin/volunteers"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand-dark"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        All volunteers
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-brand-soft">
            {volunteer.photo_url ? (
              <Image src={volunteer.photo_url} alt={volunteer.name} fill sizes="56px" className="object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-brand">
                {volunteer.name.charAt(0)}
              </span>
            )}
            <AdminFormDialog
              trigger={
                <button
                  type="button"
                  className="absolute -bottom-1 -right-1 rounded-full border border-line bg-white p-1 text-muted-foreground shadow-sm transition-colors hover:text-brand"
                  aria-label="Edit photo"
                >
                  <Camera className="h-3.5 w-3.5" aria-hidden />
                </button>
              }
              title="Volunteer photo"
              action={updateVolunteerPhoto}
              submitLabel="Save photo"
            >
              {() => (
                <>
                  <input type="hidden" name="id" value={volunteer.id} />
                  <ImageUploadField
                    name="photoUrl"
                    label="Photo"
                    defaultValue={volunteer.photo_url}
                    folder="volunteers"
                    description="Shown on the public volunteer profile."
                  />
                </>
              )}
            </AdminFormDialog>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">{volunteer.name}</h1>
              <StatusBadge label={volunteer.status} tone={statusTone(volunteer.status)} />
            </div>
            <p className="text-sm text-muted-foreground">
              {volunteer.member_id ?? "No member ID yet"} · {volunteer.position}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {volunteer.status !== "APPROVED" && (
            <form action={async (fd) => { await updateVolunteerStatus(fd); }}>
              <input type="hidden" name="id" value={volunteer.id} />
              <input type="hidden" name="status" value="APPROVED" />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
              >
                <BadgeCheck className="h-4 w-4" aria-hidden />
                Approve
              </button>
            </form>
          )}
          {volunteer.status !== "REJECTED" && volunteer.status !== "PENDING" && null}
          {volunteer.status === "PENDING" && (
            <form action={async (fd) => { await updateVolunteerStatus(fd); }}>
              <input type="hidden" name="id" value={volunteer.id} />
              <input type="hidden" name="status" value="REJECTED" />
              <button
                type="submit"
                className="rounded-full border border-crescent/30 px-4 py-2 text-sm font-semibold text-crescent transition-colors hover:bg-crescent-soft"
              >
                Reject
              </button>
            </form>
          )}
          <ConfirmDelete
            action={deleteVolunteer}
            id={volunteer.id}
            label="Remove"
            description="Delete this volunteer record and all linked data? This cannot be undone."
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Record */}
        <div className="rounded-2xl border border-line bg-white p-6">
          <h2 className="flex items-center gap-2 font-semibold text-foreground">
            <UserRound className="h-4 w-4 text-brand" aria-hidden />
            Full record (private)
          </h2>
          <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {rows.map(
              (row) =>
                row.value && (
                  <div key={row.label} className="border-b border-line pb-2">
                    <dt className="text-xs text-muted-foreground">{row.label}</dt>
                    <dd className="mt-0.5 break-words text-sm font-medium text-foreground">
                      {row.value}
                    </dd>
                  </div>
                )
            )}
          </dl>
          {volunteer.motivation && (
            <div className="mt-5">
              <p className="text-xs text-muted-foreground">Motivation for joining</p>
              <p className="mt-1 rounded-xl bg-mist/60 p-3.5 text-sm leading-relaxed text-foreground/85">
                {volunteer.motivation}
              </p>
            </div>
          )}
          {volunteer.experience && (
            <div className="mt-4">
              <p className="text-xs text-muted-foreground">Previous experience</p>
              <p className="mt-1 text-sm text-foreground/85">{volunteer.experience}</p>
            </div>
          )}
        </div>

        {/* Points */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-line bg-white p-6">
            <h2 className="flex items-center gap-2 font-semibold text-foreground">
              <Sparkles className="h-4 w-4 text-amber-500" aria-hidden />
              Volunteer points
            </h2>
            <p className="mt-1 text-3xl font-bold text-brand-dark">
              {volunteer.points}
              <span className="ml-1 text-sm font-medium text-muted-foreground">total</span>
            </p>
            <div className="mt-5">
              <PointsForm volunteerId={volunteer.id} />
            </div>
            {points.length > 0 && (
              <ul className="mt-5 divide-y divide-line">
                {points.slice(0, 8).map((p) => (
                  <li key={p.id} className="flex items-center justify-between py-2.5 text-sm">
                    <div>
                      <p className="font-medium text-foreground">{p.reason ?? "Points"}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(p.created_at)}</p>
                    </div>
                    <span
                      className={`font-bold ${p.points > 0 ? "text-brand-dark" : "text-crescent"}`}
                    >
                      {p.points > 0 ? "+" : ""}
                      {p.points}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {volunteer.phone && (
            <div className="flex items-start gap-3 rounded-2xl border border-line bg-mist/50 p-5 text-sm text-muted-foreground">
              <PhoneCall className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
              <p>
                Contact this volunteer directly at{" "}
                <span className="font-semibold text-foreground">{volunteer.phone}</span>. Never
                share contact details publicly.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
