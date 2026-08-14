import { Award, ExternalLink } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { AdminFormDialog, FieldError } from "@/components/admin/admin-form-dialog";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { adminGetCertificates, adminGetVolunteers } from "@/lib/queries";
import { issueCertificate, deleteCertificate } from "@/lib/admin-actions";
import { formatDate } from "@/lib/constants";
import { Input, Label } from "@/components/ui";

export default async function AdminCertificatesPage() {
  const [certificates, volunteers] = await Promise.all([
    adminGetCertificates(),
    adminGetVolunteers({ status: "APPROVED" }),
  ]);

  const volunteerNames = new Map(volunteers.map((v) => [v.id, v.name]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Certificates</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Issue verifiable certificates to volunteers. Each one gets a unique public
            verification link.
          </p>
        </div>
        <AdminFormDialog
          trigger={
            <Button disabled={volunteers.length === 0}>
              <Award className="mr-1.5 h-4 w-4" aria-hidden />
              Issue certificate
            </Button>
          }
          title="Issue certificate"
          description="The volunteer receives a unique verification URL."
          action={issueCertificate}
          submitLabel="Issue certificate"
        >
          {(errors) => (
            <>
              <div>
                <Label htmlFor="c-volunteer">Volunteer</Label>
                <select
                  id="c-volunteer"
                  name="volunteerId"
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
                <FieldError errors={errors} name="title" />
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
                description="Upload a scan or image of the certificate."
              />
            </>
          )}
        </AdminFormDialog>
      </div>

      {certificates.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-mist/60">
                <TableHead>Volunteer</TableHead>
                <TableHead>Certificate</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead>Verification</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {certificates.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium text-foreground">
                    {volunteerNames.get(c.volunteer_id) ?? "Volunteer"}
                  </TableCell>
                  <TableCell className="text-sm">{c.title}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(c.issued_at)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge label="Verifiable" tone="success" />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button asChild variant="ghost" size="sm">
                        <a href={`/verify/certificate/${c.verify_token}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                        </a>
                      </Button>
                      <ConfirmDelete
                        action={deleteCertificate}
                        id={c.id}
                        description={`Revoke this certificate? The verification link will stop working.`}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          icon={Award}
          title="No certificates issued"
          description="Issue certificates after training or events."
        />
      )}
    </div>
  );
}
