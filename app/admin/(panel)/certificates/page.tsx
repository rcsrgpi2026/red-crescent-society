import { Award, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { AdminFormDialog, FieldError } from "@/components/admin/admin-form-dialog";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { AdminPageHeader } from "@/components/admin/page-header";
import {
  ResponsiveTable,
  type Column,
} from "@/components/admin/responsive-table";
import { adminGetCertificates, adminGetTeamMembers } from "@/lib/queries";
import { issueCertificate, deleteCertificate } from "@/lib/admin-actions";
import { formatDate } from "@/lib/constants";
import { Input, Label } from "@/components/ui";

export default async function AdminCertificatesPage() {
  const [certificates, volunteers] = await Promise.all([
    adminGetCertificates(),
    adminGetTeamMembers({ status: "APPROVED" }),
  ]);

  const volunteerNames = new Map(volunteers.map((v) => [v.id, v.name]));

  const columns: Column<(typeof certificates)[number]>[] = [
    {
      header: "Team Member",
      render: (c) => (
        <span className="font-medium text-foreground">
          {volunteerNames.get(c.volunteer_id) ?? "Team Member"}
        </span>
      ),
    },
    {
      header: "Certificate",
      render: (c) => <span className="text-sm">{c.title}</span>,
    },
    {
      header: "Issued",
      render: (c) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(c.issued_at)}
        </span>
      ),
    },
    {
      header: "Verification",
      render: () => <StatusBadge label="Verifiable" tone="success" />,
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Award}
        title="Certificates"
        description="Issue verifiable certificates to team members. Each one gets a unique public verification link."
        tone="bg-gradient-to-br from-amber-400 to-orange-500"
        actions={
          <AdminFormDialog
            trigger={
              <Button disabled={volunteers.length === 0}>
                <Award className="mr-1.5 h-4 w-4" aria-hidden />
                Issue certificate
              </Button>
            }
            title="Issue certificate"
            description="The team member receives a unique verification URL."
            action={issueCertificate}
            submitLabel="Issue certificate"
          >
            <>
                <div>
                  <Label htmlFor="c-volunteer">Team Member</Label>
                  <select
                    id="c-volunteer"
                    name="teamMemberId"
                    className="mt-1.5 h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                    required
                  >
                    {volunteers.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} {v.member_id ? `(${v.member_id})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="c-title">Certificate title</Label>
                  <Input
                    id="c-title"
                    name="title"
                    placeholder="e.g. First Aid & CPR Training"
                    className="mt-1.5"
                  />
                  <FieldError name="title" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="c-date">Issued on</Label>
                    <Input id="c-date" name="issuedAt" type="date" className="mt-1.5" />
                  </div>
                </div>
                <ImageUploadField
                  name="fileUrl"
                  label="Certificate file (optional)"
                  folder="certificates"
                  crop={false}
                  description="Upload a scan or image of the certificate."
                />
            </>
          </AdminFormDialog>
        }
      />

      <ResponsiveTable
        columns={columns}
        rows={certificates}
        keyFor={(c) => c.id}
        minWidth="min-w-[640px]"
        actions={(c) => (
          <>
            <Button asChild variant="ghost" size="sm" aria-label="Open verification page">
              <a
                href={`/verify/certificate/${c.verify_token}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            </Button>
            <ConfirmDelete
              action={deleteCertificate}
              id={c.id}
              description={`Revoke this certificate? The verification link will stop working.`}
            />
          </>
        )}
        empty={
          <EmptyState
            icon={Award}
            title="No certificates issued"
            description="Issue certificates after training or events."
          />
        }
      />
    </div>
  );
}
